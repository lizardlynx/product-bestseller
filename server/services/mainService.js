'use strict';
const Fuse = require('fuse.js');
const db = require('../database/database.js');
const shopsFormatter = require('../dataFormatters/shopsFormatter.js');
const dataFormatter = require('../database/dataFormatter.js');
const InsertProductsFormatter = require('../dataFormatters/insertProductsFormatter.js');
const openAiApi = require('./openAiApi.js');

class MainService {
  #fuseOptions = {
    includeScore: true,
    threshold: 0.3,
    ignoreLocation: true,
    keys: ['title'],
  };

  init(fastify) {
    this.#getShopsIds(fastify);
  }

  async recreateDatabase() {
    await db.recreateDatabase();
  }

  async #getShopsIds(fastify) {
    const shops = await db.getShopsIds(fastify);
    shopsFormatter.processShopsIds(shops);
  }

  async addCategories(categories, shopName) {
    await this.getCategoriesIds();
    const [categoriesFormatted, shopId, categoriesAddedTemp] =
      await shopsFormatter.formatCategories(categories, shopName);
    await db.insertCategories(categoriesFormatted, shopId, categoriesAddedTemp);
  }

  async getAllCategories() {
    return await db.getAllCategories();
  }

  async getPricesData(product) {
    const data = await db.getPricesData(product);
    const formattedData = dataFormatter.formatPricesData(data);
    return formattedData;
  }

  async getPricesDataByDates(product, dates = {}) {
    const data = await db.getPricesDataByDates(product, dates);
    const formattedData = dataFormatter.formatPricesData(data);
    return formattedData;
  }

  async getCategoriesIds() {
    const [rows, rowsAll] = await db.getCategoriesIds();
    shopsFormatter.cacheCategoriesIds(rowsAll);
    return rows;
  }

  async getProductsByCategory(id, pageNumber, itemsOnPage) {
    const categories = await db.getChildCategories(id);
    if (categories.length == 0)
      return { error: 'No such category found', code: 404 };
    const breadcrumbs = await db.getCategoryHierarchy(id);
    const categoriesArr = categories.map((cat) => cat.id);
    const [products, prices, features, count] = await db.getProductsByCategory(
      categoriesArr,
      +pageNumber,
      +itemsOnPage
    );
    const productsFormatted = await dataFormatter.formatProducts(
      products,
      prices,
      features
    );
    return {
      products: productsFormatted,
      breadcrumbs,
      count: Math.ceil(count[0].count / itemsOnPage),
    };
  }

  async getProductData(id) {
    const [products, prices, features] = await db.getProductData(id);
    if (products.length == 0) return null;
    const breadcrumbs = await db.getCategoryHierarchy(products[0].category_id);
    const productFormatted = await dataFormatter.formatProductData(
      products,
      prices,
      features
    );
    return { product: productFormatted, breadcrumbs };
  }

  getShops() {
    return shopsFormatter.getShops();
  }

  getInsertProductsFormatter() {
    return new InsertProductsFormatter();
  }

  addAuchanProductsToQuery(data, dbId, insertProductsFormatter) {
    insertProductsFormatter.addAuchanProductsToQuery(data, dbId);
  }

  addSilpoProductsToQuery(data, dbId, insertProductsFormatter) {
    insertProductsFormatter.addSilpoProductsToQuery(data, dbId);
  }

  async #checkProductsForSimilarity(
    insertProductData,
    productIds,
    insertShop,
    insertProductsFormatter
  ) {
    const ids = [];
    const productIdsDbExisting = [];
    const productIdsTaken = [];
    const productsForOpenAiApiShop1 = [];
    const productsForOpenAiApiShop2 = [];
    for (const i in insertProductData) {
      const product = insertProductData[i];
      const weight = product[5];
      const brand = product[6];

      console.log('searching');
      const similar = await db.getSimilarProducts([insertShop, weight]).catch(err => console.log(err));

      console.log('fuse');
      const fuse = new Fuse(similar, this.#fuseOptions);
      let productsSimilar = fuse.search(product[1]);
      console.log('fuse end');
      
      if (productsSimilar.length === 0) continue;

      const openAiProducts = productsSimilar.map(
        ({item: product}) => ({
          id: product.id + '',
          productName:
            product.title + (product.brand
              ? `, Brand: ${product.brand}`
              : '') + (product.weight_g
              ? `, Weight: ${product.weight_g}`
              : ''),
        })
      );
      productIdsDbExisting.push(productsSimilar.map(({id}) => id));
      const additionalData = ((brand
        ? `, Brand: ${brand}`
        : '') + (weight
        ? `, Weight: ${weight}`
        : ''));

      productsForOpenAiApiShop1.push(...openAiProducts)
      productsForOpenAiApiShop2.push({name: product[1], additionalData, i: ''+productIds[i]});
    }

    if (productsForOpenAiApiShop2.length > 0) {
      console.log('ai calling', productsForOpenAiApiShop1, productsForOpenAiApiShop2);
      const results = await openAiApi.getCompletionChat(
        productsForOpenAiApiShop1, productsForOpenAiApiShop2
      );
      console.log('a', results.result);
  
      for (const item of results.result) {
        console.log('b', item);
        if (item.id !== '' && !productIdsTaken.includes(item.id) && productIds.includes(Number(item.i)) && productIdsDbExisting.includes(Number(item.id))) {
          console.log('c');
          ids.push({
            id: item.i,
            product_id: item.id,
            update_needed: true,
          });
          productIdsTaken.push(item.id);
        }
      }
    }

    return insertProductsFormatter.pickUpdates(ids);
  }

  async insertProductsData(insertProductsFormatter) {
    console.log('insertProductsData');
    const [
      categoriesToInsert,
      categoriesObj,
      insertShop,
      categoriesAddedTemp,
      productIds,
    ] = insertProductsFormatter.getCategoriesAdditionalData();
    let { insertPriceData, insertFeatureData, insertProductData } =
      insertProductsFormatter.getInsertProductsData();

    console.log('insertProductsData 1');
    for (const productArrayPlace of Object.keys(categoriesToInsert)) {
      const category = categoriesToInsert[productArrayPlace];
      let dbCategoryId = categoriesObj[insertShop][category.categoryId];
      if (dbCategoryId === undefined) {
        dbCategoryId = await db.insertCategory(
          category,
          insertShop,
          categoriesAddedTemp,
          true
        );
      }
      insertProductData[productArrayPlace][0] = dbCategoryId;
    }
    console.log('insertProductsData 2');

    const oldIds = await db.checkExistingIds(productIds, insertShop);
    console.log('insertProductsData 3');
    const pricesUpdate1 = insertProductsFormatter.pickUpdates(oldIds).prices;
    console.log(insertProductData.length, 'insertProductsData length 4');

    const { prices: pricesUpdate2, features: featuresUpdate } =
      await this.#checkProductsForSimilarity(
        insertProductData,
        productIds,
        insertShop,
        insertProductsFormatter
      );

    console.log(pricesUpdate2, 'pricesUpdate2');

    const pricesUpdate = pricesUpdate1.concat(pricesUpdate2);
    console.log('db.insertProductsData');

    await db.insertProductsData(pricesUpdate, featuresUpdate, {
      insertProductData,
      insertPriceData,
      insertFeatureData,
    });
  }

  async getProductsByName(name) {
    const data = await db.getProductsByName(name);
    const formattedData = dataFormatter.formatSearchData(data);
    return formattedData;
  }

  async getAllLists() {
    return await db.getAllLists();
  }

  async getListById(id) {
    const res = await db.getListById(id);
    const { dataFormatted, productsIdsPrices } =
      dataFormatter.formatListData(res);
    const [prices, byShop] = await db.getListPrices(
      productsIdsPrices,
      Object.keys(dataFormatted.products)
    );
    const pricesFormatted = dataFormatter.formatListPrices(prices);
    const pricesByShopFormatted = dataFormatter.formatListPricesByShop(byShop);
    return {
      list: dataFormatted,
      prices: pricesFormatted,
      byShop: pricesByShopFormatted,
    };
  }

  async createList(data) {
    let listId = await db.selectFreeListId();
    if (listId === null) {
      listId = 1;
    }
    console.log('data', data);
    const formattedData = dataFormatter.formatListToInsert(data, listId);
    await db.insertNewList(formattedData);
  }

  async getShopPricesByDate() {
    const shopPricesByDate = await db.getShopPricesByDate();
    const formattedData =
      dataFormatter.formatShopPricesByDate(shopPricesByDate);
    return formattedData;
  }

  async getShopAvgPricesByDate() {
    const averageDifferenceByDate = await db.getShopAvgPricesByDate();
    const formattedAvgDiff = dataFormatter.formatAvgDiff(
      averageDifferenceByDate
    );
    return formattedAvgDiff;
  }
}

module.exports = new MainService();
