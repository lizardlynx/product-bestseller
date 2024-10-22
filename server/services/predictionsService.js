const predictions = require('./predictions');
const mainService = require('./mainService');
const dataFormatter = require('../database/dataFormatter');

class PredictionsService {
  async getPredictionPerProduct(method, id, period, shopId, priceComment) {
    if (!method in this.getMethods()) {
      throw new Error(`Method ${method} does not exist`);
    }
    const prices = await mainService.getPricesData(id);
    const shopPrices = prices[shopId].find((el) => el.name === priceComment);
    if (!shopPrices) {
      throw new Error(`Such a price ${priceComment} does not exist`);
    }
    const pricesFormatted = [];
    for (let i = 0; i < shopPrices.dates.length; i++) {
      pricesFormatted.push(shopPrices.data[i]);
    }
    const result = predictions[method](pricesFormatted, +period);
    const periodMinMax = {min: 3, max: ['sma', 'ema', 'rsi'].includes(method) ? shopPrices.data.length - 1: null};
    return {chart: [dataFormatter.formatMethodResult(result, method), shopPrices], period: periodMinMax};
  }

  getMethods() {
    return {
      sma: 'sma',
      ema: 'ema',
      rsi: 'rsi',
      linearExtrapolation: 'Linear Extrapolation',
      lagrangeInterpolation: 'Lagrange Interpolation',
      newtonsDividedDifferences: "Newton's Divided Differences",
    };
  }
}

const ps = new PredictionsService();
module.exports = ps;
