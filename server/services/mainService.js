'use strict';
const Fuse = require('fuse.js');
const db = require('../database/database.js');
const shopsFormatter = require('../dataFormatters/shopsFormatter.js');
const dataFormatter = require('../database/dataFormatter.js');
const InsertProductsFormatter = require('../dataFormatters/insertProductsFormatter.js');
const openAiApi = require('./openAiApi.js');

const { encoding_for_model } = require('tiktoken');
const {
  MAX_INPUT_TOKENS,
  MAX_OUTPUT_TOKENS,
  OPENAI_MODEL,
  OPENAI_ASSISTANT_SYSTEM_PROMPT,
} = require('../constants.js');
const predictions = require('./predictions.js');
const { toISODate, getDate, deleteExtraCache } = require('../common.js');

class MainService {
  #fuseOptions = {
    includeScore: true,
    threshold: 0.3,
    ignoreLocation: true,
    keys: ['title'],
  };
  #cacheSelectProductsByMaxNum = {};

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
    const productsForOpenAiApiShop1 = [[]];
    const productsForOpenAiApiShop2 = [[]];
    let k = 0;
    const gpt4Enc = encoding_for_model(OPENAI_MODEL);
    const initialSystemTokens = gpt4Enc.encode(
      OPENAI_ASSISTANT_SYSTEM_PROMPT
    ).length;
    let sum = initialSystemTokens;
    let aprxOutputTokens = 0;

    console.log('insertProductData', insertProductData);
    for (const i in insertProductData) {
      const product = insertProductData[i];
      const weight = product[5];
      const brand = product[6];

      const similar = await db.getSimilarProducts([insertShop, weight]);

      if (similar.length === 0) continue;
      const fuse = new Fuse(similar, this.#fuseOptions);
      let productsSimilar = fuse.search(product[1]);

      if (productsSimilar.length === 0) continue;

      const openAiProducts = productsSimilar.map(({ item: product }) => ({
        id: product.id + '',
        productName:
          product.title +
          (product.brand ? `, Brand: ${product.brand}` : '') +
          (product.weight_g ? `, Weight: ${product.weight_g}` : ''),
      }));
      productIdsDbExisting.push(
        ...productsSimilar.map(({ item: { id } }) => id)
      );

      const additionalData =
        (brand ? `, Brand: ${brand}` : '') +
        (weight ? `, Weight: ${weight}` : '');

      const productShop2 = {
        name: product[1],
        additionalData,
        i: '' + productIds[i],
      };
      let str1 = JSON.stringify(openAiProducts);
      let str2 = JSON.stringify(productShop2);
      const tokens1 = gpt4Enc.encode(str1).length;
      const tokens2 = gpt4Enc.encode(str2).length;
      const tokens = tokens1 + tokens2;
      sum += tokens;
      aprxOutputTokens += tokens2;

      if (sum >= MAX_INPUT_TOKENS || aprxOutputTokens >= MAX_OUTPUT_TOKENS) {
        k++;
        sum = initialSystemTokens + tokens;
        aprxOutputTokens = tokens2;
      }

      productsForOpenAiApiShop1[k].push(...openAiProducts);
      productsForOpenAiApiShop2[k].push(productShop2);
    }
    gpt4Enc.free();

    for (const i in productsForOpenAiApiShop2) {
      if (productsForOpenAiApiShop2[i].length > 0) {
        console.log(
          'ai calling',
          productsForOpenAiApiShop1[i],
          productsForOpenAiApiShop2[i]
        );
        const results = await openAiApi.getCompletionChat(
          productsForOpenAiApiShop1[i],
          productsForOpenAiApiShop2[i]
        );
        console.log('a', results.result);
        console.log(productIdsTaken, productIds, productIdsDbExisting);

        for (const item of results.result) {
          console.log('b', item);
          console.log(
            item.id !== '',
            !productIdsTaken.includes(item.id),
            productIds.includes(Number(item.i)),
            productIdsDbExisting.includes(Number(item.id))
          );
          if (
            item.id !== '' &&
            !productIdsTaken.includes(item.id) &&
            productIds.includes(Number(item.i)) &&
            productIdsDbExisting.includes(Number(item.id))
          ) {
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
    const { prices: pricesUpdate1, features: featuresUpdate1 } =
      insertProductsFormatter.pickUpdates(oldIds);
    console.log(insertProductData.length, 'insertProductsData length 4');

    let pricesUpdate2 = [];
    let featuresUpdate = [];
    if (insertShop !== 1) {
      try {
        ({ prices: pricesUpdate2, features: featuresUpdate } =
          await this.#checkProductsForSimilarity(
            insertProductData,
            productIds,
            insertShop,
            insertProductsFormatter
          ));
      } catch (err) {
        console.log(err);
      }
    }

    const pricesUpdate = pricesUpdate1.concat(pricesUpdate2);

    try {
      await db.insertProductsData(pricesUpdate, featuresUpdate, {
        insertProductData,
        insertPriceData,
        insertFeatureData,
      });
    } catch (err) {
      console.log(err);
    }

    // process.exit(0)
  }

  async getProductsByName(name) {
    const data = await db.getProductsByName(name);
    const formattedData = dataFormatter.formatSearchData(data);
    return formattedData;
  }

  async getProductById(id) {
    const data = await db.getProductById(id);
    return data;
  }

  async selectProductsByMaxNum(shopId) {
    const prefix = getDate();
    const key = [prefix, ...shopId].join(' | ');
    deleteExtraCache(prefix, this.#cacheSelectProductsByMaxNum);
    let result = this.#cacheSelectProductsByMaxNum[key];
    if (result) return result;

    const [{ date: endDate }] = await db.getEndDate();
    const [{ date: startDate }] = await db.getStartDate();
    const startTimestamp = new Date(startDate).getTime();
    const endTimestamp = new Date(endDate).getTime();

    const products = await db.selectProductsByMaxNum(shopId);
    const productData = {};

    for (const { product_id, price, date, title } of products) {
      if (!productData.hasOwnProperty(product_id))
        productData[product_id] = { price: [], title };
      productData[product_id].price.push([new Date(date).getTime(), +price]);
    }

    for (const [product_id, data] of Object.entries(productData)) {
      console.log(product_id);

      // choose interpolation here
      // do not use interpolation at all? as it is faulty
      productData[product_id].price = [
        ...predictions.lagrangeInterpolation(data.price, 0, {
          startTimestamp,
          endTimestamp,
        }),
      ];
      console.log('dataprice', productData[product_id].price);
    }
    // this.#cacheSelectProductsByMaxNum[key] = productData;
    return productData;
  }

  async #getDiffs(shopId) {
    const products = await this.selectProductsByMaxNum(shopId);

    const values = Object.values(products).map(({ price }) => price);
    const bigPriceChange = {};

    const matrix = Object.entries(products).map(([key, arr]) =>
      arr.price.flatMap((el, index) => {
        const priceCurr = +el[1];
        if (index > 0) {
          const elPrev = arr.price[index - 1];
          const pricePrev = +elPrev[1];
          const changePercent =
            pricePrev === 0 ? 100 : ((priceCurr - pricePrev) * 100) / pricePrev;
          if (Math.abs(changePercent) > 25) {
            const date = toISODate(el[0]).split('T')[0];
            if (!bigPriceChange.hasOwnProperty(date)) {
              bigPriceChange[date] = [];
            }
            bigPriceChange[date].push({
              product_id: key,
              changePercent,
              title: arr.title,
            });
          }
        }
        return +el[1];
      })
    );
    let dates = values[0].map(([date, value]) => date);

    const diffs = [];
    for (let i = 0; i < matrix[0].length; i++) {
      diffs[i] = 0;
      for (let j = 0; j < matrix.length; j++) {
        diffs[i] += matrix[j][i];
      }
    }
    return { dates, diffs, bigPriceChange, values };
  }

  async selectAvgDay(shopId) {
    const { dates, diffs, bigPriceChange, values } = await this.#getDiffs(
      shopId
    );
    const rows = [];
    for (let i = 0; i < diffs.length; i++) {
      const diff = diffs[i] / values.length;
      rows.push([dates[i], diff]);
    }

    return { rows, productsNum: values.length, bigPriceChange };
  }

  async selectFirstDayDiff(shopId) {
    const { dates, diffs, bigPriceChange, values } = await this.#getDiffs(
      shopId
    );
    const rows = [];
    for (let i = 1; i < diffs.length; i++) {
      const diff = diffs[i] - diffs[0];
      rows.push([dates[i], diff]);
    }

    return { rows, productsNum: values.length, bigPriceChange };
  }

  async selectDailyDiff(shopId) {
    const { dates, diffs, bigPriceChange, values } = await this.#getDiffs(
      shopId
    );
    const rows = [];
    for (let i = 1; i < diffs.length; i++) {
      const diff = diffs[i] - diffs[i - 1];
      rows.push([dates[i], diff]);
    }

    return { rows, productsNum: values.length, bigPriceChange };
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
    console.log(shopPricesByDate);
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

  async disconnectProducts(productId) {
    const product = await db.getProductData(productId);
    console.log(product);

    // await db.disconnectProducts(productId);
  }

  async connectProducts(productId, productId2) {
    const [product] = await db.getProductById(productId);
    const [product2] = await db.getProductById(productId2);

    console.log(product, product2);

    if (product.id === product2.id) {
      console.log('Products must be different', {
        product: product.id,
        product2: product2.id,
        productId,
        productId2,
      });
      return; // throw error
    }
    const prices2 = await db.getPricesById(productId2);
    const features2 = await db.getFeaturesById(productId2);
    const features1 = await db.getFeaturesById(productId);

    console.log(prices2, features2);

    const shops2 = [
      ...new Set(features2.map((feature) => feature.shop_id)),
    ].sort();
    const shops1 = [
      ...new Set(features1.map((feature) => feature.shop_id)),
    ].sort();
    // on new shop import change logic
    if (shops2.length === 2 || shops1.length === 2) {
      console.log('Product must exist only in one shop');
      return; // throw error
    }
    if (shops2.join(',') === shops1.join(',')) {
      console.log('Shops in which product exist must be different');
      return; // throw error
    }

    const delta = [
      product2.description
        ? product.description ?? '' + product2.description
        : product.description,
      product2.weight_g
        ? product.weight_g ?? '' + product2.weight_g
        : product.weight_g,
    ];

    await db.insertPriceData(
      prices2.map(({ shop_id, date, price, comment }) => [
        shop_id,
        date,
        price,
        comment,
        productId,
      ])
    );
    await db.insertFeatureData(
      features2.map(({ shop_id, title, value }) => [
        shop_id,
        title,
        value,
        productId,
      ])
    );
    await db.updateProduct(productId, ...delta);
    await db.deleteProductData(productId2);
  }
}

module.exports = new MainService();
