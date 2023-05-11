'use strict';
const queries = require('./queries.js');
const { splitCategories } = require('./common.js');

class Database {
  #connection;
  #fastify;

  async #createConnection() {
    this.#connection = await this.#fastify.mysql.getConnection();
  }

  async getShopsIds(fastify) {
    this.#fastify = fastify;
    await this.#createConnection();
    const [shops, shopsFields] = await this.#connection.query(queries.getShops);
    this.#connection.release();
    return shops;
  }

  async recreateDatabase() {
    const queriesArr = queries.recreateDbQuery.split(';');
    await this.#createConnection();
    for (let query of queriesArr) {
      if (query.trim().length > 0) {
        await this.#connection.query(query);
      }
    }
    this.#connection.release();
  }

  async getAllCategories() {
    await this.#createConnection();
    const [rows, fields] = await this.#connection.query(queries.getCategories);
    this.#connection.release();
    return rows;
  }

  async getPricesData(id) {
    await this.#createConnection();
    const [rows, fields] = await this.#connection.query(queries.getPricesData, [
      id,
    ]);
    this.#connection.release();
    return rows;
  }

  async getCategoriesIds() {
    await this.#createConnection();
    const [rowsAll, fieldsAll] = await this.#connection.query(
      queries.getAllCategoriesIds
    );
    const [rows, fields] = await this.#connection.query(
      queries.getCategoriesIds
    );
    this.#connection.release();
    return [rows, rowsAll];
  }

  async getProductsByCategory(id) {
    await this.#createConnection();
    const [products, productsFields] = await this.#connection.query(
      queries.getProductsByCategory,
      [id]
    );
    const [prices, pricesFields] = await this.#connection.query(
      queries.getPricesOfProducts,
      [id]
    );

    this.#connection.release();
    return [products, prices];
  }

  async getProductData(id) {
    await this.#createConnection();
    const [products, productsFields] = await this.#connection.query(
      queries.getProduct,
      [id]
    );
    const [prices, pricesFields] = await this.#connection.query(
      queries.getPricesByProduct,
      [id]
    );
    const [features, featuresFields] = await this.#connection.query(
      queries.getFeaturesByProduct,
      [id]
    );

    this.#connection.release();
    return [products, prices, features];
  }

  async insertCategory(
    currentCategory,
    shopId,
    categoriesAddedTemp,
    parentTranslated = false
  ) {
    const category = currentCategory.name;
    const currentId = currentCategory.id;
    const parentId = currentCategory.parentId;

    const categoryKeyWords = splitCategories(category);
    let categoryExistsId = null;
    if (shopId != 2) {
      for (let item of categoryKeyWords) {
        let res = categoriesAddedTemp[item];
        if (!res) continue;
        res = res.filter((item) => item != undefined);
        if (res.length > 0) {
          categoryExistsId = res[0];
          break;
        }
      }
    }

    if (category == 'Продукти харчування' && shopId == 1) {
      categoryExistsId = 1;
    }

    let insertId = null;
    if (!categoryExistsId) {
      let parentDbId = 1;

      if (!parentTranslated) {
        const [parentRows, parentFields] = await this.#connection.query(
          queries.getParentDbId,
          [shopId, parentId]
        );
        if (parentRows.length > 0) {
          parentDbId = parentRows[0].db_id;
        }
      } else parentDbId = parentId;
      const [res, err] = await this.#connection.query(queries.insertCategory, [
        category,
        parentDbId,
      ]);
      insertId = res.insertId;
      categoryKeyWords.forEach((key) => {
        if (!(key in categoriesAddedTemp)) categoriesAddedTemp[key] = [];
        categoriesAddedTemp[key].push(insertId);
      });
    } else insertId = categoryExistsId;

    await this.#connection.query(queries.insertCategoryMatch, [
      shopId,
      insertId,
      currentId,
    ]);
    return insertId;
  }

  async insertCategories(categories, shopId, categoriesAddedTemp) {
    for (let category of categories) {
      await this.insertCategory(category, shopId, categoriesAddedTemp);
    }
  }

  async checkExistingIds(productIds, shopId) {
    const questionMarksIds = new Array(productIds.length).fill('?').join(', ');
    const [oldIds, fieldsIds] = await this.#connection.query(
      queries.checkExistingProductIds +
        ' (' +
        questionMarksIds +
        ')' +
        queries.checkExistingProductIdsGroupBy,
      [shopId, ...productIds]
    );

    return oldIds;
  }

  async getSimilarProducts(options) {
    const [similar, simFields] = await this.#connection.query(
      queries.selectSimilarProducts,
      options
    );
    return similar;
  }

  async insertProductsData(pricesUpdate, featuresUpdate, insertData) {
    const { insertPriceData, insertFeatureData, insertProductData } =
      insertData;

    await this.#createConnection();

    const readyDataSetPriceUpdate = new Array(pricesUpdate.length)
      .fill('(?, ?, ?, ?, ?)')
      .join(', ');
    const readyDataSetFeatureUpdate = new Array(featuresUpdate.length)
      .fill('(?, ?, ?, ?)')
      .join(', ');

    const promiseArr = [];
    if (pricesUpdate.length > 0)
      promiseArr.push(
        this.#connection.query(
          queries.insertPrice + ' ' + readyDataSetPriceUpdate,
          pricesUpdate.flat(1)
        )
      );
    if (featuresUpdate.length > 0)
      promiseArr.push(
        this.#connection.query(
          queries.insertFeatures + ' ' + readyDataSetFeatureUpdate,
          featuresUpdate.flat(1)
        )
      );

    if (insertFeatureData.length > 0) {
      const priceInsertLen = 5;
      const featureInsertLen = 4;
      const productInsertLen = 7;

      const neededSpacesPrice = insertPriceData.flat(1).length / priceInsertLen;
      const neededSpacesFeature =
        insertFeatureData.flat(1).length / featureInsertLen;
      const neededSpacesProduct =
        insertProductData.flat(1).length / productInsertLen;
      const readyDataSetPrice = new Array(neededSpacesPrice)
        .fill('(?, ?, ?, ?, ?)')
        .join(', ');
      const readyDataSetFeature = new Array(neededSpacesFeature)
        .fill('(?, ?, ?, ?)')
        .join(', ');
      const readyDataSetProduct = new Array(neededSpacesProduct)
        .fill('(?, ?, ?, ?, ?, ?, ?)')
        .join(', ');

      const [rows, fields] = await this.#connection.query(
        queries.insertProduct + ' ' + readyDataSetProduct,
        insertProductData.flat(1)
      );

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

      promiseArr.push(
        this.#connection.query(
          queries.insertPrice + ' ' + readyDataSetPrice,
          insertPriceData.flat(1)
        ),
        this.#connection.query(
          queries.insertFeatures + ' ' + readyDataSetFeature,
          insertFeatureData.flat(1)
        )
      );
    }

    await Promise.all(promiseArr);
    this.#connection.release();
  }
}

const db = new Database();
module.exports = db;
