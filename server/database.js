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

  async getChildCategories(id) {
    await this.#createConnection();
    const [categories, productsFields] = await this.#connection.query(
      queries.getChildCategories,
      [id]
    );

    this.#connection.release();
    return categories;
  }

  #createQuestionMarkString(arr) {
    return '( ' + new Array(arr.length).fill('?').join(',') + ')';
  }

  async getCategoryHierarchy(id) {
    await this.#createConnection();
    const [categories, productsFields] = await this.#connection.query(
      queries.getCategoryHierarchy,
      [id]
    );
    this.#connection.release();
    return categories;
  }

  async getProductsByCategory(id) {
    await this.#createConnection();
    const questionMarkString = this.#createQuestionMarkString(id);
    const [products, productsFields] = await this.#connection.query(
      queries.getProductsByCategory + questionMarkString + ' limit 0, 20',
      [...id]
    );
    if (products.length == 0) return [null, null, null];
    const productIds = products.map(product => product.id);
    const questionMarkStringProducts = this.#createQuestionMarkString(productIds);
    const [prices, pricesFields] = await this.#connection.query(
      queries.getPricesOfProducts + questionMarkStringProducts + queries.getPricesOfProductsGroupBy,
      [...productIds]
    );
    const [features, featuresFields] = await this.#connection.query(
      queries.getFeaturesByProducts + questionMarkStringProducts,
      [...productIds]
    );

    this.#connection.release();
    return [products, prices, features];
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

  #createQuestionMarkSet(matrix, insertLen = null) {
    const length = matrix.length;
    if (length == 0) return null;
    const elementLength = insertLen ? insertLen : matrix[0].length;
    const questionMarks =
      '(' + new Array(elementLength).fill('?').join(', ') + ')';
    const questionMarksSets = new Array(
      insertLen ? matrix.flat(1).length / insertLen : matrix.length
    )
      .fill(questionMarks)
      .join(', ');
    return questionMarksSets;
  }

  #addQueryInsertData(matrix, query, promiseArr, insertLen = null) {
    const questionMarkSet = this.#createQuestionMarkSet(matrix, insertLen);
    if (!questionMarkSet) return;
    const request = this.#connection.query(
      query + ' ' + questionMarkSet,
      matrix.flat(1)
    );
    promiseArr.push(request);
  }

  async insertProductsData(pricesUpdate, featuresUpdate, insertData) {
    const { insertPriceData, insertFeatureData, insertProductData } =
      insertData;
    const insertPriceLen = 5;
    const insertFeatureLen = 4;
    const promiseArr = [];

    await this.#createConnection();
    this.#addQueryInsertData(pricesUpdate, queries.insertPrice, promiseArr);
    this.#addQueryInsertData(
      featuresUpdate,
      queries.insertFeatures,
      promiseArr
    );

    if (insertFeatureData.length > 0) {
      const readyDataSetProduct =
        this.#createQuestionMarkSet(insertProductData);

      const [rows, fields] = await this.#connection.query(
        queries.insertProduct + ' ' + readyDataSetProduct,
        insertProductData.flat(1)
      );

      let productId = rows.insertId;
      for (let i = 0; i < insertPriceData.length; i++) {
        const productPrice = insertPriceData[i];
        const productFeature = insertFeatureData[i];
        for (let j = 0; j < productPrice.length; j += insertPriceLen) {
          insertPriceData[i][j] = productId;
        }
        for (let j = 0; j < productFeature.length; j += insertFeatureLen) {
          insertFeatureData[i][j] = productId;
        }
        productId++;
      }

      this.#addQueryInsertData(
        insertPriceData,
        queries.insertPrice,
        promiseArr,
        insertPriceLen
      );
      this.#addQueryInsertData(
        insertFeatureData,
        queries.insertFeatures,
        promiseArr,
        insertFeatureLen
      );
    }

    await Promise.all(promiseArr);
    this.#connection.release();
  }
}

const db = new Database();
module.exports = db;
