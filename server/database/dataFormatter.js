'use strict';
const {
  datetime,
  firstToUpper,
  resolveWeight,
  resolveCountry,
  resolveBrand,
  resolveFeatureName,
  resolveFeatureValue,
  splitCategories,
  cleanArray,
} = require('../common.js');

class DataFormatter {
  #connection = null;
  #insertFeatureData = [];
  #insertPriceData = [];
  #categoriesAddedTemp = {};
  #insertProductData = [];
  #shopsIds = {};
  #productIds = [];
  #insertShop = null;
  #idProductMatch = {};
  #categoriesObj = {};
  #categoriesToInsert = {};
  #shopConfig = {
    auchan: {
      formatCategories: (param) => this.#formatCategoriesAuchan(param),
    },
    silpo: {
      formatCategories: (param) => this.#formatCategoriesSilpo(param),
    },
  };

  constructor() {}

  processShopsIds(shops) {
    for (let shop of shops) {
      this.#shopConfig[shop.title].dbId = shop.id;
      this.#shopsIds[shop.id] = {
        title: firstToUpper(shop.title),
        product_url: shop.product_url,
      };
    }
  }

  formatCategories(data, shopTitle) {
    const shopFormatFunctions = this.#shopConfig[shopTitle];
    if (shopFormatFunctions) return shopFormatFunctions.formatCategories(data);
    return { success: 0, message: `Shop "${shopTitle}" cannot be processed.` };
  }

  getShops() {
    return this.#shopsIds;
  }

  async #getCategoriesAuchan(currentCategory) {
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

    return [categories, shopId, this.#categoriesAddedTemp];
  }

  #formatCategoriesAuchan(data) {
    const currentCategory = data.category;
    return this.#getCategoriesAuchan(currentCategory);
  }

  async #formatCategoriesSilpo(data) {
    const currentCategories = data.data.tree;
    const shopId = this.#shopConfig.silpo.dbId;
    return [currentCategories, shopId, this.#categoriesAddedTemp];
  }

  formatPricesData(rows) {
    const pricesFormatted = {};
    for (const row of rows) {
      const shopId = row.shop_id;
      const comment = row.comment;
      const date = row.date;
      const price = row.price;
      if (!(shopId in pricesFormatted)) pricesFormatted[shopId] = {};
      if (!(comment in pricesFormatted[shopId]))
        pricesFormatted[shopId][comment] = {
          name: comment,
          dates: [],
          data: [],
        };
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

  cacheCategoriesIds(rowsAll) {
    rowsAll.forEach((category) => {
      if (!(category.shop_id in this.#categoriesObj))
        this.#categoriesObj[+category.shop_id] = {};
      if (!(category.shop_category_id in this.#categoriesObj[category.shop_id]))
        this.#categoriesObj[category.shop_id][+category.shop_category_id] = {};
      this.#categoriesObj[category.shop_id][category.shop_category_id] =
        category.db_id;

      const categoryKeyWords = splitCategories(category.title);
      categoryKeyWords.forEach((key) => {
        if (!(key in this.#categoriesAddedTemp))
          this.#categoriesAddedTemp[key] = [];
        this.#categoriesAddedTemp[key].push(category.db_id);
      });
    });
  }

  formatProductData(products, prices, features) {
    const product = products[0];
    product.prices = {};
    product.features = {};
    for (const price of prices) {
      if (!(price.shop_id in product.prices))
        product.prices[price.shop_id] = [];
      product.prices[price.shop_id].push(price);
    }

    for (const feature of features) {
      if (!(feature.shop_id in product.features))
        product.features[feature.shop_id] = [];
      product.features[feature.shop_id].push(feature);
    }
    return product;
  }

  async formatProducts(products, prices, features) {
    const productsFormatted = {};
    for (const product of products) {
      if (!(product.id in productsFormatted)) {
        productsFormatted[product.id] = product;
        productsFormatted[product.id].features = [];
        productsFormatted[product.id].prices = [];
        productsFormatted[product.id].shops = [];
      }
    }

    for (const price of prices) {
      productsFormatted[price.product_id].prices.push(price);
    }

    for (const feature of features) {
      productsFormatted[feature.product_id].features.push(feature);
      if (
        !productsFormatted[feature.product_id].shops.includes(feature.shop_id)
      )
        productsFormatted[feature.product_id].shops.push(feature.shop_id);
    }
    return productsFormatted;
  }

  addAuchanProductsToQuery(products, dbId) {
    const shopId = this.#shopConfig.auchan.dbId;
    this.#insertShop = shopId;
    for (let product of products.search.products) {
      if (this.#productIds.includes(product.id)) {
        continue;
      }
      let country = null;
      let brand = null;
      let weight = null;
      const priceData = [];
      const currPrice = product.special_price;
      const oldPrice = product.price.regularPrice.amount.value;
      if (!currPrice)
        priceData.push(null, shopId, datetime(), oldPrice, 'price');
      else {
        priceData.push(null, shopId, datetime(), currPrice, 'price');
        priceData.push(null, shopId, datetime(), oldPrice, 'oldPrice');
      }

      this.#insertPriceData.push(priceData);

      const featureData = [];
      featureData.push(
        null,
        shopId,
        'url_key',
        product.url_key,
        null,
        shopId,
        'id',
        product.id
      );
      this.#productIds.push(product.id);
      this.#idProductMatch[product.id] = this.#productIds.length - 1;
      for (let attribute of product.attributes) {
        if (attribute.code == 'country_of_manufacture')
          country = attribute.value;
        else if (attribute.code == 'brand') brand = attribute.value;
        else if (attribute.code == 'weight2') weight = attribute.value;
        else featureData.push(null, shopId, attribute.label, attribute.value);
      }
      this.#insertFeatureData.push(featureData);
      if (!weight) {
        const nameParts = product.name.split(',');
        weight = nameParts[nameParts.length - 1];
      }

      const category = product.categories[product.categories.length - 1];
      const categoryId = category.id;
      const categoryName = category.name;
      const dbCategoryId = this.#categoriesObj[shopId][categoryId];
      if (!dbCategoryId) {
        this.#categoriesToInsert[this.#insertProductData.length] = {
          id: categoryId,
          name: categoryName,
          parentId: dbId,
        };
      }

      this.#insertProductData.push([
        dbCategoryId,
        product.name,
        product.meta_description,
        product.thumbnail.url,
        resolveCountry(country),
        resolveWeight(weight),
        resolveBrand(brand),
      ]);
    }
  }

  addSilpoProductsToQuery(products, dbId) {
    const shopId = this.#shopConfig.silpo.dbId;
    this.#insertShop = shopId;
    for (let product of products.data.items) {
      if (this.#productIds.includes(product.id)) {
        continue;
      }
      let country = null;
      let brand = null;
      let weight = product.unit;
      const priceData = [];
      for (let price of product.prices) {
        let comment = price.Type;
        if (comment == 'specialPrice')
          comment = product.promotions[0].description;
        priceData.push(null, shopId, datetime(), price.Value, comment);
      }
      this.#insertPriceData.push(priceData);

      const featureData = [];
      featureData.push(
        null,
        shopId,
        'url_key',
        product.slug,
        null,
        shopId,
        'id',
        product.id
      );
      this.#productIds.push(product.id);
      this.#idProductMatch[product.id] = this.#productIds.length - 1;
      if (product.parameters) {
        for (let attribute of product.parameters) {
          if (attribute.key == 'country') country = attribute.value;
          else if (attribute.key == 'trademark') brand = attribute.value;
          else if (attribute.name)
            featureData.push(
              null,
              shopId,
              resolveFeatureName(attribute.name),
              resolveFeatureValue(attribute.value)
            );
        }
      }

      const category = product.categories[product.categories.length - 1];
      const categoryId = category.id;
      const categoryName = category.name;
      let dbCategoryId = this.#categoriesObj[shopId][categoryId];

      if (categoryName && !dbCategoryId) {
        this.#categoriesToInsert[this.#insertProductData.length] = {
          id: categoryId,
          name: categoryName,
          parentId: dbId,
        };
      } else if (!categoryName) dbCategoryId = dbId;

      this.#insertFeatureData.push(featureData);
      this.#insertProductData.push([
        dbCategoryId,
        product.name,
        null,
        product.mainImage,
        resolveCountry(country),
        resolveWeight(weight),
        resolveBrand(brand),
      ]);
    }
  }

  pickUpdates(ids) {
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
      if (id.update_needed) {
        for (let j = 0; j < priceUpdate.length; j += priceInsertLen) {
          const chunk = priceUpdate.slice(j, j + priceInsertLen);
          chunk[0] = dbId;
          pricesUpdate.push(chunk);
        }
      }

      for (let j = 0; j < featureUpdate.length; j += featureInsertLen) {
        const chunkF = featureUpdate.slice(j, j + featureInsertLen);
        chunkF[0] = dbId;
        featuresUpdate.push(chunkF);
      }
    }

    cleanArray(this.#insertProductData);
    cleanArray(this.#insertFeatureData);
    cleanArray(this.#insertPriceData);
    return { prices: pricesUpdate, features: featuresUpdate };
  }

  getInsertProductsData() {
    const insertProductData = this.#insertProductData;
    const insertFeatureData = this.#insertFeatureData;
    const insertPriceData = this.#insertPriceData;
    return {
      insertProductData,
      insertFeatureData,
      insertPriceData,
    };
  }

  getCategoriesAdditionalData() {
    return [
      this.#categoriesToInsert,
      this.#categoriesObj,
      this.#insertShop,
      this.#categoriesAddedTemp,
      this.#productIds,
    ];
  }

  cleanInsertProductData() {
    this.#insertFeatureData = [];
    this.#insertProductData = [];
    this.#insertPriceData = [];
    this.#productIds = [];
    this.#idProductMatch = {};
    this.#insertShop = null;
    this.#categoriesToInsert = {};
  }
}

const df = new DataFormatter();

module.exports = df;
