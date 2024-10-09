'use strict';
const queries = require('./queries.js');
const { splitCategories } = require('../common.js');

class Database {
  #connection;
  #fastify;

  async #createConnection() {
    console.log('waiting for connection');
    this.#connection = await this.#fastify.mysql.pool.getConnection();
    console.log('this.#connection received');
  }

  async getShopsIds(fastify) {
    this.#fastify = fastify;
    await this.#createConnection();
    const [shops, shopsFields] = await this.#connection.query(queries.getShops);
    // this.#releaseConnection();
    return shops;
  }

  async #releaseConnection() {
    console.log('release connection');
    this.#connection.release();
  }

  async recreateDatabase() {
    const queriesArr = queries.recreateDbQuery.split(';');
    await this.#createConnection();
    for (let query of queriesArr) {
      if (query.trim().length > 0) {
        await this.#connection.query(query);
      }
    }
    this.#releaseConnection();
  }

  async getAllCategories() {
    await this.#createConnection();
    const [rows, fields] = await this.#connection.query(queries.getCategories);
    this.#releaseConnection();
    return rows;
  }

  async getPricesData(id) {
    await this.#createConnection();
    const [rows, fields] = await this.#connection.query(queries.getPricesData, [
      id,
    ]);
    this.#releaseConnection();
    return rows;
  }

  async getPricesDataByDates(id) {
    await this.#createConnection();
    const [rows, fields] = await this.#connection.query(queries.getPricesDataByDates, [
      id,
    ]);
    this.#releaseConnection(); // cannot use just one connection!!!
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
    this.#releaseConnection();
    return [rows, rowsAll];
  }

  async getChildCategories(id) {
    await this.#createConnection();
    const [categories, productsFields] = await this.#connection.query(
      queries.getChildCategories,
      [id]
    );

    this.#releaseConnection();
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
    this.#releaseConnection();
    return categories;
  }

  async getProductsByCategory(id, pageNumber, itemsOnPage) {
    await this.#createConnection();
    const offset = itemsOnPage * (pageNumber - 1);
    const questionMarkString = this.#createQuestionMarkString(id);
    const [productCount, productCountField] = await this.#connection.query(
      queries.countProductsByCategory + questionMarkString,
      [...id]
    );
    const [products, productsFields] = await this.#connection.query(
      queries.getProductsByCategory +
        questionMarkString +
        queries.getProductsByCategoryGroupBy +
        ' limit ' +
        itemsOnPage +
        ' offset ' +
        offset,
      [...id]
    );
    if (products.length == 0) return [[], [], [], productCount];
    const productIds = products.map((product) => product.id);
    const questionMarkStringProducts =
      this.#createQuestionMarkString(productIds);
    const [prices, pricesFields] = await this.#connection.query(
      queries.getPricesOfProducts +
        questionMarkStringProducts +
        queries.getPricesOfProductsGroupBy,
      [...productIds]
    );
    const [features, featuresFields] = await this.#connection.query(
      queries.getFeaturesByProducts + questionMarkStringProducts,
      [...productIds]
    );

    this.#releaseConnection();
    return [products, prices, features, productCount];
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

    this.#releaseConnection();
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
    // if (shopId != 2) {
      for (let item of categoryKeyWords) {
        let res = categoriesAddedTemp[item];
        if (!res) continue;
        res = res.filter((item) => item != undefined);
        if (res.length > 0) {
          categoryExistsId = res[0];
          break;
        }
      }
    // }

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
    console.log(queries.selectSimilarProducts,
      options);
    return similar;
  }

  #createQuestionMarkSet(matrix, insertLen = null) {
    console.log(matrix);
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
    this.#releaseConnection();
  }

  async getProductsByName(name) {
    this.#createConnection();
    const [data, field] = await this.#connection.query(
      queries.getProductsByName,
      ['%' + name + '%']
    );
    if (data.length == 0) return {data, shopIds: []};
    const ids = [];
    data.forEach(row => ids.push(row.id));
    const [shopIds, fields] = await this.#connection.query(
      queries.getShopIdsByProduct + this.#createQuestionMarkString(ids),
      ids
    );
    this.#releaseConnection();
    return {data, shopIds};
  }

  async getAllLists() {
    this.#createConnection();
    const [data, field] = await this.#connection.query(
      queries.getAllLists
    );
    this.#releaseConnection();
    return data;
  }

  async getListById(id) {
    this.#createConnection();
    const [data, field] = await this.#connection.query(
      queries.getListById, [id]
    );
    this.#releaseConnection();
    return data;
  }

  async getListPrices(ids, allIds) {
    this.#createConnection();
    const [data, field] = await this.#connection.query(
      queries.getListPrices + this.#createQuestionMarkString(ids) + queries.getListPricesGroupBy, ids
    );
    const [dataByShop, field2] = await this.#connection.query(
      queries.getListPricesByShop + this.#createQuestionMarkString(allIds), allIds
    );
    this.#releaseConnection();
    return [data, dataByShop];
  }

  async selectFreeListId() {
    this.#createConnection();
    const [data, field] = await this.#connection.query(
      queries.selectFreeListId,
    );
    this.#releaseConnection();
    return data[0].id;
  }

  async insertNewList(list) {
    this.#createConnection();
    const [data, field] = await this.#connection.query(
      queries.insertNewList + this.#createQuestionMarkSet(list, 3), list
    );
    this.#releaseConnection();
    return data.id;
  }

  async getShopPricesByDate() {
    this.#createConnection();
    const [shopPricesByDate, field] = await this.#connection.query(
      queries.getShopPricesByDate
    );
    this.#releaseConnection();
    return shopPricesByDate;
  }

  async getShopAvgPricesByDate() {
    this.#createConnection();
    const [averageDifferenceByDate, field2] = await this.#connection.query(
      queries.selectAvgDiffByShopDate
    );
    this.#releaseConnection();
    return averageDifferenceByDate;
  }
}

const db = new Database();
module.exports = db;
