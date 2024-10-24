const { API_NAME_USD, API_NAME_EUR } = require('../constants');
const db = require('../database/database');
const apiService = require('./apiService');
const correlations = require('./correlations');
const mainService = require('./mainService');

class CorrelationHeatmap {
  async get(productId, shopId = 'all') {
    const usd = await apiService.getByApi(API_NAME_USD);
    const eur = await apiService.getByApi(API_NAME_EUR);
    let shopPrice;
    let name;
    if (productId === 'daily-diff') {
      shopPrice = (
        await db.selectDailyDiff(shopId === 'all' ? [1, 2] : shopId)
      ).map(({ date, difference }) => [date, +difference]);
      name = 'Щоденна різниця';
    } else {
      [shopPrice, name] = await this.#getShopPrices(productId, shopId);
    }

    const dates = [];
    const values = {
      usd: [],
      eur: [],
      [name]: [],
    };
    for (const [date, val] of shopPrice) {
      const dateDay = new Date(date).toISOString().split('T')[0];
      const usdToday = +usd[dateDay];
      const eurToday = +eur[dateDay];
      if (!usdToday || !eurToday) continue;

      values['usd'].push(usdToday);
      values['eur'].push(eurToday);
      values[name].push(val);

      dates.push(date);
    }

    const matrix = [];
    const elements = [];
    for (const i1 in Object.entries(values)) {
      const [key1, value1] = Object.entries(values)[i1];
      elements.push(key1);
      for (const i2 in Object.entries(values)) {
        const [key2, value2] = Object.entries(values)[i2];
        matrix.push([
          +i1,
          +i2,
          Number(correlations.pearsonCoefficient(value1, value2).toFixed(2)),
        ]);
      }
    }
    return { matrix, elements };
  }

  async #getShopPrices(productId, shopId) {
    let name;
    const priceData = await mainService.getPricesData(productId);
    ({
      product: { title: name },
    } = await mainService.getProductData(productId));

    if (Object.entries(priceData).length === 0) {
      throw new Error(`Such product: ${productId} does not exist`);
    }
    const shopPrice1 = priceData['1']?.find((el) => el.name === 'price');
    const shopPrice2 = priceData['2']?.find((el) => el.name === 'price');

    let shopPrice = [];
    if (shopId === 'all') {
      if (shopPrice1 && shopPrice2) {
        const shop2DataTime = shopPrice2.data.map(([time, val]) => time);
        for (const i in shopPrice1.data) {
          const i2 = shop2DataTime.indexOf(shopPrice1.data[i][0]);
          if (i2 > -1) {
            shopPrice.push([
              shopPrice1.data[i][0],
              (shopPrice1.data[i][1] + shopPrice2.data[i2][1]) / 2,
            ]);
          }
        }
      } else if (shopPrice1) {
        shopPrice.push(...shopPrice1.data);
      } else {
        shopPrice.push(...shopPrice2.data);
      }
    } else {
      const shop = priceData[shopId];
      if (!shop) {
        throw new Error('Price does not exist for this shop');
      }

      shopPrice.push(...(+shopId === 1 ? shopPrice1 : shopPrice2).data);
    }
    return [shopPrice, name];
  }
}

module.exports = new CorrelationHeatmap();
