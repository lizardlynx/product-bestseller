'use strict';
const { toISODate } = require('../common.js');
const shopsFormatter = require('../dataFormatters/shopsFormatter.js');

class DataFormatter {
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
        productsFormatted[product.id].price = null;
        productsFormatted[product.id].shops = [];
      }
    }

    for (const price of prices) {
      productsFormatted[price.product_id].price = price.price;
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

  formatListData(data) {
    const dataFormatted = { products: {}, list: null };
    const productsIdsPrices = [];
    for (const row of data) {
      const id = row.id;
      const shopName =
        shopsFormatter.getShopsIds()[row.shop_id.toString()].title;
      if (!(id in dataFormatted.products)) {
        dataFormatted.products[id] = {
          title: row.title,
          shops: {},
          tableShopIgnore: true,
        };
      }
      dataFormatted.products[id].shops[shopName] = {
        price: row.price,
        date: row.date,
      };
    }

    for (const [id, product] of Object.entries(dataFormatted.products)) {
      if (
        Object.keys(product.shops).length ==
        Object.keys(shopsFormatter.getShopsIds()).length
      ) {
        product.tableShopIgnore = false;
        productsIdsPrices.push(id);
      }
    }
    if (data.length > 0) dataFormatted.list = data[0].list;
    return { dataFormatted, productsIdsPrices };
  }

  formatListPrices(data) {
    const pricesFormatted = {};
    const shopKeys = [];
    for (const row of data) {
      const shop = row.shop_id;
      const shopName = shopsFormatter.getShopsIds()[shop.toString()].title;
      if (!(shopName in pricesFormatted))
        pricesFormatted[shopName] = { name: shopName, dates: [], data: [] };
      pricesFormatted[shopName].dates.push(row.d);
      pricesFormatted[shopName].data.push([Date.parse(row.d), +row.price]);
      if (!shopKeys.includes(shop)) shopKeys.push(shop);
    }
    return { data: Object.values(pricesFormatted), keys: shopKeys };
  }

  formatListPricesByShop(data) {
    const pricesByShop = {};
    for (const row of data) {
      if (!(row.shop_id in pricesByShop)) pricesByShop[row.shop_id] = {};
      if (!(row.product_id in pricesByShop[row.shop_id]))
        pricesByShop[row.shop_id][row.product_id] = {
          name: row.title,
          dates: [],
          data: [],
        };
      pricesByShop[row.shop_id][row.product_id].dates.push(row.date);
      pricesByShop[row.shop_id][row.product_id].data.push([
        Date.parse(row.date),
        +row.price,
      ]);
    }
    return pricesByShop;
  }

  formatApiData(obj, datesUnformatted) {
    const chart = [];
    const dates = datesUnformatted.map((date) => toISODate(date));

    for (const i in Object.entries(obj)) {
      const [name, values] = Object.entries(obj)[i];
      const data = values.map((val, j) => [datesUnformatted[j], val]);
      chart.push({ name, dates, data });
    }
    return chart;
  }

  formatSearchData(search) {
    const { data, shopIds } = search;
    const formattedData = {};
    data.forEach((row) => {
      formattedData[row.id] = row;
      row.shops = [];
    });
    shopIds.forEach((row) =>
      formattedData[row.product_id].shops.push(row.shop_id)
    );
    return Object.values(formattedData);
  }

  formatListToInsert(data, listId) {
    const res = [];
    console.log(listId);
    data.products.forEach((id) => res.push(listId, id, data.title));
    return res;
  }

  formatShopPricesByDate(data) {
    const formattedData = {
      name: 'Різниця ціни Сільпо і Ашану',
      dates: [],
      data: [],
    };
    let diff = null;
    for (const row of data) {
      if (diff == null) {
        diff = +row.sum;
        continue;
      }
      diff -= +row.sum;
      formattedData.dates.push(row.sumdate);
      formattedData.data.push([Date.parse(row.sumdate), diff]);
      diff = null;
    }
    return formattedData;
  }

  formatAvgDiff(data) {
    const formattedData = {
      name: 'Різниця ціни Сільпо і Ашану',
      dates: [],
      data: [],
    };
    for (const row of data) {
      formattedData.dates.push(row.date);
      formattedData.data.push([Date.parse(row.date), +row.diff]);
    }
    return formattedData;
  }

  formatMethodResult(data, method) {
    const formattedData = {
      name: method,
      dates: [],
      data: [],
    };
    for (const row of data) {
      formattedData.dates.push(new Date(row[0]));
      formattedData.data.push(row);
    }
    return formattedData;
  }
}

module.exports = new DataFormatter();
