'use strict';
const {fastify, pageSize} = require('./config.js');
const queries = require('./queries.js');
const Fuse = require('fuse.js');
const {datetime, firstToUpper, resolveWeight, resolveCountry, resolveBrand, resolveFeatureName, resolveFeatureValue} = require('./common.js');

class DataFormatter {
  #shopConfig = {};
  #connection = null;
  #insertFeatureData = [];
  #insertPriceData = [];
  #insertProductData = [];
  #shopsIds = {};
  #productIds = [];
  #insertShop = null;
  #idProductMatch = {};
  #categoriesAddedTemp = {};

  constructor() {
    this.#shopConfig = {
      auchan: {
        formatCategories: param => this.#formatCategoriesAuchan(param),
      },
      silpo: {
        formatCategories: param => this.#formatCategoriesSilpo(param),
      }
    };

    fastify.ready(() => {
      this.#getShopsIds();
    });
  }

  async #getShopsIds() {
    this.#connection = await fastify.mysql.getConnection();
    const [shops, shopsFields] = await this.#connection.query(queries.getShops);
    for (let shop of shops) {
      this.#shopConfig[shop.title].dbId = shop.id;
      this.#shopsIds[shop.id] = {title: firstToUpper(shop.title), product_url: shop.product_url};
    }
    this.#connection.release();
  }

  getShops() {
    return this.#shopsIds; 
  }

  formatCategories(data, shopTitle) {
    const shopFormatFunctions = this.#shopConfig[shopTitle];
    if (shopFormatFunctions) return shopFormatFunctions.formatCategories(data);
    return {success: 0, message: `Shop "${shopTitle}" cannot be processed.`};
  }

  #splitCategories(category) {
    const separator = /,| та | і | й | и /;
    // //якщо існує слово "для" потім ще одне слово, потім "і" або "та" - не розділяти
    if (!category.match(/для/g)) //[ ]+[а-яА-Я]+([ ]+(та|і|й|и)|,)[ ]+/g))
      return category.split(separator).map(item => item.trim().toLowerCase());
    return [ category ];

  }

  async #getCategoriesAuchan(currentCategory) {
    this.#connection = await fastify.mysql.getConnection();
    const shopId = this.#shopConfig.auchan.dbId;
    const stack = [];
    const categories = [];
    let category = currentCategory;
    let parentId = null;

    category.parentId = parentId;
    stack.push(category);
    categories.push(category);
    while (stack.length != 0) {
      category = stack.pop();
      if (!('visited' in category)) {
        const path = category.path.split('/');
        parentId = path[path.length - 2];
        category.visited = true;
        category.parentId = parentId;
        categories.push(category);
        if (category.children_count == 0) continue;
        for (let child of category.children) {
          stack.push(child);
        }
      }
    }
    categories[0].parentId = null;

    for (let currentCategory of categories) {
      // currentCategory.slug = slugify(currentCategory.name);
      // console.log(currentCategory);
      // break;
      await this.insertCategory(currentCategory, shopId);
    }

    this.#connection.release();
    return {success: 1, message: `Shop "${'auchan'}" processed successfully.`};
  }

  #formatCategoriesAuchan(data) {
    const currentCategory = data.category;
    return this.#getCategoriesAuchan(currentCategory);
  }

  async insertCategory(currentCategory, shopId) {
    const category = currentCategory.name;
    const currentId = currentCategory.id;
    // const slug = currentCategory.slug;
    const parentId = currentCategory.parentId;
    const [rows, fields] = await this.#connection.query(queries.checkMatchesTable, [shopId, currentId]);

    const categoryKeyWords = this.#splitCategories(category);
    let categoryExistsId = null;
    if (shopId != 2) {
      for (let item of categoryKeyWords) {
        let res = this.#categoriesAddedTemp[item];
        if (!res) continue;
        res = res.filter(item => item != undefined);
        if (res.length > 0) {
          categoryExistsId = res[0];
          break;
        }
      }
    }
    
    let insertId = null;
    if (!categoryExistsId) {
      const [parentRows, parentFields] = await this.#connection.query(queries.getParentDbId, [shopId, parentId]);
      let parentDbId = 1;
      if (parentRows.length > 0) {
        parentDbId = parentRows[0].db_id;
      }
      const [ res, err] = await this.#connection.query(queries.insertCategory, [category, parentDbId]);
      insertId = res.insertId;
      categoryKeyWords.forEach(key => {
        if (!(key in this.#categoriesAddedTemp)) this.#categoriesAddedTemp[key] = [];
        this.#categoriesAddedTemp[key].push(insertId);
      });
    } else insertId = categoryExistsId;
    
    await this.#connection.query(queries.insertCategoryMatch, [shopId, insertId, currentId]);
  }

  async #formatCategoriesSilpo(data) {
    const currentCategories = data.data.tree;
    this.#connection = await fastify.mysql.getConnection();
    const shopId = this.#shopConfig.silpo.dbId;
    //якщо останній рівень - поділити
    // const categories = this.#splitCategories(currentCategory.name);
    for (let currentCategory of currentCategories) {
      // console.log(currentCategory);
      // currentCategory.slug = slugify(currentCategory.name);
      await this.insertCategory(currentCategory, shopId);
    }
    this.#connection.release();
    return {success: 1, message: `Shop "${'silpo'}" processed successfully.`};
  }

  async getAllCategories() {
    this.#connection = await fastify.mysql.getConnection();
    const [rows, fields] = await this.#connection.query(queries.getCategories);
    this.#connection.release();
    return {success: 1, message: 'Categories processed successfully.', data: rows};
  }

  async getPricesData(id) {
    this.#connection = await fastify.mysql.getConnection();
    const [rows, fields] = await this.#connection.query(queries.getPricesData, [id]);
    this.#connection.release();
    const pricesFormatted = {};
    for (const row of rows) {
      const shopId = row.shop_id;
      const comment = row.comment;
      const date = row.date;
      const price = row.price;
      if (!(shopId in pricesFormatted)) pricesFormatted[shopId] = {};
      if (!(comment in pricesFormatted[shopId])) pricesFormatted[shopId][comment] = {name: comment, dates: [], data: []};
      pricesFormatted[shopId][comment].dates.push(date);
      pricesFormatted[shopId][comment].data.push([Date.parse(date), +price]);
    }
    for (const shop of Object.keys(pricesFormatted)) {
      const data = [];
      for (const item of Object.values(pricesFormatted[shop])) {
        data.push(item);
      }
      pricesFormatted[shop] = data;
    }
    return pricesFormatted;
  }

  async getCategoryIds(id) {
    this.#connection = await fastify.mysql.getConnection();
    const [rows, fields] = await this.#connection.query(queries.getCategoryIds, [id]);
    this.#connection.release();
    return {success: 1, message: 'Categories processed successfully.', data: rows};
  }


  // async #selectBrands() {
  //   this.#connection = await fastify.mysql.getConnection();
  //   const [brands, fields] = await this.#connection.query(queries.getBrands);
  //   for (const brand of brands)
  //   this.#connection.release();
  //   return {success: 1, message: 'Categories processed successfully.', data: rows};
  // }

  async getCategoriesIds() {
    this.#connection = await fastify.mysql.getConnection();
    const [rows, fields] = await this.#connection.query(queries.getCategoriesIds);
    this.#connection.release();
    return {success: 1, message: 'Categories processed successfully.', data: rows};
  }

  async getProductData(id) {
    this.#connection = await fastify.mysql.getConnection();
    const [products, productsFields] = await this.#connection.query(queries.getProduct, [id]);
    const [prices, pricesFields] = await this.#connection.query(queries.getPricesByProduct, [id]);
    const [features, featuresFields] = await this.#connection.query(queries.getFeaturesByProduct, [id]);
    const product = products[0];
    product.prices = {};
    product.features = {};
    for (const price of prices) {
      if (!(price.shop_id in product.prices)) product.prices[price.shop_id] = [];
      product.prices[price.shop_id].push(price);
    }

    for (const feature of features) {
      if (!(feature.shop_id in product.features)) product.features[feature.shop_id] = [];
      product.features[feature.shop_id].push(feature);
    }

    this.#connection.release();
    return product;
  }

  async getProductsByCategory(id) {
    this.#connection = await fastify.mysql.getConnection();
    const [products, productsFields] = await this.#connection.query(queries.getProductsByCategory, [id]);
    const [prices, pricesFields] = await this.#connection.query(queries.getPricesOfProducts, [id]);
    const productsFormatted = {};
    for (const product of products) {
      if (!(product.id in productsFormatted)) {
        productsFormatted[product.id] = product;
        productsFormatted[product.id].features = [];
        productsFormatted[product.id].prices = [];
        delete productsFormatted[product.id].feature;
        delete productsFormatted[product.id].value;
        delete productsFormatted[product.id].shop_id;
      }
      productsFormatted[product.id].features.push([product.feature, product.value, product.shop_id]);
    }

    for (const price of prices) {
      productsFormatted[price.product_id].prices.push(price);
    }
    this.#connection.release();
    return productsFormatted;
  }

  async addAuchanProductsToQuery(products, dbId) {
    const shopId = this.#shopConfig.auchan.dbId;
    this.#insertShop = shopId;
    for (let product of products.search.products) {
      let country = null;
      let brand = null;
      let weight = null;
      const priceData = [];
      const currPrice = product.special_price;
      const oldPrice = product.price.regularPrice.amount.value;
      if (!currPrice) priceData.push(null, shopId, datetime(),oldPrice,  'price');
      else {
        priceData.push(null, shopId, datetime(), currPrice,  'price');
        priceData.push(null, shopId, datetime(),currPrice, 'price');
      }
      
      this.#insertPriceData.push(priceData);

      const featureData = [];
      featureData.push(null, shopId, 'url_key', product.url_key, null, shopId, 'id', product.id);
      this.#productIds.push(product.id);
      this.#idProductMatch[product.id] = this.#productIds.length - 1;
      for (let attribute of product.attributes) {
        if (attribute.code == 'country_of_manufacture') country = attribute.value;
        else if (attribute.code == 'brand') brand = attribute.value;
        else if (attribute.code == 'weight2') weight = attribute.value;
        else featureData.push(null, shopId, attribute.label, attribute.value);
      }
      this.#insertFeatureData.push(featureData);

      this.#insertProductData.push([dbId, product.name, product.meta_description, product.thumbnail.url, resolveCountry(country), resolveWeight(weight), resolveBrand(brand)]);
    }
  }

  async addSilpoProductsToQuery(products, dbId) {
    const shopId = this.#shopConfig.silpo.dbId;
    this.#insertShop = shopId;
    for (let product of products.data.items) {
      let country = null;
      let brand = null;
      let weight = product.unit;
      const priceData = [];
      for (let price of product.prices) {
        let comment = price.Type;
        if (comment == 'specialPrice') comment = product.promotions[0].description;
        priceData.push(null, shopId, datetime(), price.Value, price.Type);
      } 
      this.#insertPriceData.push(priceData);

      const featureData = [];
      featureData.push(null, shopId, 'url_key', product.slug, null, shopId, 'id', product.id);
      this.#productIds.push(product.id);
      this.#idProductMatch[product.id] = this.#productIds.length - 1;
      for (let attribute of product.parameters) {
        if (attribute.key == 'country') country = attribute.value;
        else if (attribute.key == 'trademark') brand = attribute.value;
        else if (attribute.name) featureData.push(null, shopId, resolveFeatureName(attribute.name), resolveFeatureValue(attribute.value));
      }
      this.#insertFeatureData.push(featureData);
      this.#insertProductData.push([dbId, product.name, null, product.mainImage, resolveCountry(country), resolveWeight(weight), resolveBrand(brand)]);
    }
  }

  #pickUpdates(ids) {
    const featureInsertLen = 4;
    const priceInsertLen = 5;
    const pricesUpdate = [];
    const featuresUpdate = [];
    for (const id of ids) {
      const shopId = id.id;
      const dbId = id.product_id;
      const i = this.#idProductMatch[shopId].toString();
      this.#insertProductData[i] = null;
      const featureUpdate = this.#insertFeatureData[i].slice();
      this.#insertFeatureData[i] = null;
      const priceUpdate = this.#insertPriceData[i].slice();
      this.#insertPriceData[i] = null;
      for (let i = 0; i < priceUpdate.length; i += priceInsertLen) {
        const chunk = priceUpdate.slice(i, i + priceInsertLen);
        chunk[0] = dbId;
        pricesUpdate.push(chunk);
      }

      for (let i = 0; i < featureUpdate.length; i += featureInsertLen) {
        const chunkF = featureUpdate.slice(i, i + featureInsertLen);
        chunkF[0] = dbId;
        featuresUpdate.push(chunkF);
      }
    }

    this.#insertProductData = this.#insertProductData.filter(e => e !== null);
    this.#insertFeatureData = this.#insertFeatureData.filter(e => e !== null);
    this.#insertPriceData = this.#insertPriceData.filter(e => e !== null);
    return { prices: pricesUpdate, features: featuresUpdate };
  }

  async #checkExistingIds() {
    const questionMarksIds = new Array(this.#productIds.length).fill('?').join(', ');
    const [oldIds, fieldsIds] = await this.#connection.query(queries.checkExistingIds + ' (' +questionMarksIds + ')', [this.#insertShop, ...this.#productIds]);

    const res = this.#pickUpdates(oldIds);

    return res.prices;
  }

  async #checkProductsForSimilarity() {
    const ids = [];
    const productIdsTaken = [];
    for (const i in this.#insertProductData) {
      const product = this.#insertProductData[i];
      // const country = product[4];
      const weight = product[5];
      const brand = product[6];
      const [similar, simFields] = await this.#connection.query(queries.selectSimilarProducts, [brand, weight, this.#insertShop]);
      const options = {
        includeScore: true,
        threshold: 0.3,
        ignoreLocation: true,
        keys: [
          'title',
        ]
      };

      const fuse = new Fuse(similar, options);
      const productsSimilar = fuse.search(product[1]);
      if (productsSimilar.length > 0) {
        for (let j = 0; j < productsSimilar.length; j++) {
          if (!productIdsTaken.includes(productsSimilar[j].item.id)) {
            ids.push({id: this.#productIds[i], product_id: productsSimilar[j].item.id});
            productIdsTaken.push(productsSimilar[j].item.id);
            break;
          }
        }
        //new Id = product[0], db id = productsSimilar[0].id
      }
    }

    return this.#pickUpdates(ids);
  }

  //auchan
  async insertProductsData() {
    this.#connection = await fastify.mysql.getConnection();
    const connection = this.#connection;

    const pricesUpdate1 = await this.#checkExistingIds();

    const res = await this.#checkProductsForSimilarity();
    const pricesUpdate2 = res.prices;
    const featuresUpdate = res.features;
    const pricesUpdate = pricesUpdate1.concat(pricesUpdate2);

    const readyDataSetPriceUpdate = new Array(pricesUpdate.length).fill('(?, ?, ?, ?, ?)').join(', ');
    const readyDataSetFeatureUpdate = new Array(featuresUpdate.length).fill('(?, ?, ?, ?)').join(', ');

    const promiseArr = [];
    const rees = featuresUpdate.flat(1);
    if (pricesUpdate.length>0) promiseArr.push(connection.query(queries.insertPrice + ' ' + readyDataSetPriceUpdate, pricesUpdate.flat(1)));
    if (featuresUpdate.length>0) promiseArr.push(connection.query(queries.insertFeatures + ' ' + readyDataSetFeatureUpdate, featuresUpdate.flat(1)));

    if (this.#insertFeatureData.length > 0) {
      const insertPriceData = this.#insertPriceData;
      const insertFeatureData = this.#insertFeatureData;
      const insertProductData = this.#insertProductData;
      const priceInsertLen = 5;
      const featureInsertLen = 4;
      const productInsertLen = 7;
      
      const neededSpacesPrice = insertPriceData.flat(1).length/priceInsertLen;
      const neededSpacesFeature = insertFeatureData.flat(1).length/featureInsertLen;
      const neededSpacesProduct = insertProductData.flat(1).length/productInsertLen;
      const readyDataSetPrice = new Array(neededSpacesPrice).fill('(?, ?, ?, ?, ?)').join(', ');
      const readyDataSetFeature = new Array(neededSpacesFeature).fill('(?, ?, ?, ?)').join(', ');
      const readyDataSetProduct = new Array(neededSpacesProduct).fill('(?, ?, ?, ?, ?, ?, ?)').join(', ');


      // //insert countries and brands
      // const checkCountries = this.#productEssentialData.country.filter(onlyUnique);
      // const checkBrands = this.#productEssentialData.brand.filter(onlyUnique);
      // const countriesMatches = this.#getCountriesObj(checkCountries);

      const [rows, fields] = await this.#connection.query(queries.insertProduct + ' ' + readyDataSetProduct, insertProductData.flat(1));

      let productId = rows.insertId;
      for (let i = 0; i < insertPriceData.length; i++) {
        const productPrice = insertPriceData[i];
        const productFeature = insertFeatureData[i];
        for (let j = 0; j < productPrice.length; j += priceInsertLen) {
          insertPriceData[i][j] = productId;
        }
        for (let j = 0; j < productFeature.length; j += featureInsertLen) {
          insertFeatureData[i][j] = productId;
        }
        productId++;
      }

      promiseArr.push(connection.query(queries.insertPrice + ' ' + readyDataSetPrice, insertPriceData.flat(1)));
      promiseArr.push(connection.query(queries.insertFeatures + ' ' + readyDataSetFeature, insertFeatureData.flat(1)));
    }

    
    await Promise.all(promiseArr);

    this.#insertFeatureData = [];
    this.#insertPriceData = [];
    this.#insertProductData = [];
    this.#productIds = [];
    this.#idProductMatch = {};
    this.#insertShop = null;
    
    this.#connection.release();
    return {success: 1, message: 'Categories processed successfully.', data: null};
  }

  async recreateDatabase() {
    const queries = queries.recreateDbQuery.split(';');
    this.#connection = await fastify.mysql.getConnection();
    for (let query of queries) {
      if (query.trim().length > 0) {
        await this.#connection.query(query);
      }
    }
    this.#connection.release();
    return {success: 1, message: 'Database recreated successfully.'};
  }
}

module.exports = { DataFormatter };
