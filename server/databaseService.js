'use strict';
const Fuse = require('fuse.js');
const dataFormatter = require('./dataFormatter.js');
const db = require('./database.js');

class DatabaseService {
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
    dataFormatter.processShopsIds(shops);
  }

  async addCategories(categories, shopName) {
    const [categoriesFormatted, shopId, categoriesAddedTemp] =
      await dataFormatter.formatCategories(categories, shopName);
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

  async getCategoriesIds() {
    const [rows, rowsAll] = await db.getCategoriesIds();
    dataFormatter.cacheCategoriesIds(rowsAll);
    return rows;
  }

  async getProductsByCategory(id) {
    const [products, prices] = await db.getProductsByCategory(id);
    const productsFormatted = dataFormatter.formatProducts(products, prices);
    return productsFormatted;
  }

  async getProductData(id) {
    const [products, prices, features] = await db.getProductData(id);
    if (products.length == 0) return null;
    const productFormatted = await dataFormatter.formatProductData(
      products,
      prices,
      features
    );
    return productFormatted;
  }

  getShops() {
    return dataFormatter.getShops();
  }

  addAuchanProductsToQuery(data, dbId) {
    dataFormatter.addAuchanProductsToQuery(data, dbId);
  }

  addSilpoProductsToQuery(data, dbId) {
    dataFormatter.addSilpoProductsToQuery(data, dbId);
  }

  async #checkProductsForSimilarity(insertProductData, productIds, insertShop) {
    const ids = [];
    const productIdsTaken = [];
    for (const i in insertProductData) {
      const product = insertProductData[i];
      const weight = product[5];
      const brand = product[6];

      const similar = await db.getSimilarProducts([
        brand,
        weight,
        insertShop,
        brand,
        weight,
      ]);

      const fuse = new Fuse(similar, this.#fuseOptions);
      const productsSimilar = fuse.search(product[1]);
      if (productsSimilar.length > 0) {
        for (let j = 0; j < productsSimilar.length; j++) {
          if (!productIdsTaken.includes(productsSimilar[j].item.id)) {
            ids.push({
              id: productIds[i],
              product_id: productsSimilar[j].item.id,
              update_needed: true,
            });
            productIdsTaken.push(productsSimilar[j].item.id);
            break;
          }
        }
      }
    }

    return dataFormatter.pickUpdates(ids);
  }

  async insertProductsData() {
    const [
      categoriesToInsert,
      categoriesObj,
      insertShop,
      categoriesAddedTemp,
      productIds,
    ] = dataFormatter.getCategoriesAdditionalData();
    let { insertPriceData, insertFeatureData, insertProductData } =
      dataFormatter.getInsertProductsData();

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

    const oldIds = await db.checkExistingIds(productIds, insertShop);
    const pricesUpdate1 = dataFormatter.pickUpdates(oldIds).prices;
    let updatedInsertData = dataFormatter.getInsertProductsData();
    insertPriceData = updatedInsertData.insertPriceData;
    insertFeatureData = updatedInsertData.insertFeatureData;
    insertProductData = updatedInsertData.insertProductData;
    const { prices: pricesUpdate2, features: featuresUpdate } =
      await this.#checkProductsForSimilarity(
        insertProductData,
        productIds,
        insertShop
      );

    const pricesUpdate = pricesUpdate1.concat(pricesUpdate2);

    await db.insertProductsData(pricesUpdate, featuresUpdate, {
      insertProductData,
      insertPriceData,
      insertFeatureData,
    });
    dataFormatter.cleanInsertProductData();
  }
}

const ds = new DatabaseService();

module.exports = ds;
