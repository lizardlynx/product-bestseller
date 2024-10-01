const predictionService = require('../services/predictions');

describe('predictionService', () => {
  it('should correctly count sma for price range', () => {
    const points = [
      [123, 50],
      [321, 57],
      [1, 58],
      [5, 53],
      [4, 55],
      [0, 49],
      [7, 56],
      [3, 54],
      [6, 63],
      [8, 64],
    ];
    const result = predictionService.sma(points, 5);
    expect(result).toEqual([
      [4, 54.6],
      [0, 54.4],
      [7, 54.2],
      [3, 53.4],
      [6, 55.4],
      [8, 57.2],
    ]);
  });

  it('should correctly count ema for price range', () => {
    const points = [
      [123, 50],
      [321, 57],
      [1, 58],
      [5, 53],
      [4, 55],
      [0, 49],
      [7, 56],
      [3, 54],
      [6, 63],
      [8, 64],
    ];
    const result = predictionService.ema(points, 5);
    expect(result).toEqual([
      [0, 53.58],
      [7, 54.02],
      [3, 54.02],
      [6, 55.65],
      [8, 57.17],
    ]);
  });

  it('should correctly count rsi for price range', () => {
    const points = [
      [123, 50],
      [321, 57],
      [1, 58],
      [5, 53],
      [4, 55],
      [0, 49],
      [7, 56],
      [3, 54],
      [6, 63],
      [8, 64],
    ];
    const result = predictionService.rsi(points, 5);
    expect(result).toEqual([
      [4, 66.67],
      [0, 21.43],
      [7, 45],
      [3, 52.94],
      [6, 66.67],
      [8, 89.47],
    ]);
  });

  it('should correctly count least squares for price range', () => {
    const points = [
      [1, 50],
      [2, 57],
      [3, 58],
      [4, 53],
      [5, 55],
      [6, 49],
      [7, 56],
      [8, 54],
      [9, 63],
      [10, 64],
    ];
    const result = predictionService.leastSquares(points);
    expect(result).toEqual([
      [1, 51.78181818181818],
      [2, 52.696969696969695],
      [3, 53.61212121212121],
      [4, 54.52727272727273],
      [5, 55.442424242424245],
      [6, 56.35757575757576],
      [7, 57.27272727272727],
      [8, 58.18787878787879],
      [9, 59.1030303030303],
      [10, 60.018181818181816],
    ]);
  });

  it('should correctly count linear extrapolation for price range', () => {
    const msInDay = 86400000;
    // todo write tests
    const points = [
      [1 * msInDay, 50],
      [2 * msInDay, 57],
      [3 * msInDay, 58],
      [4 * msInDay, 53],
      [5 * msInDay, 55],
      [6 * msInDay, 49],
      [7 * msInDay, 56],
      [8 * msInDay, 54],
      [9 * msInDay, 63],
      [10 * msInDay, 64],
    ];
    const result = predictionService.linearExtrapolation(points, 3);
    expect(result).toEqual([
      [1 * msInDay, 51.78181818181818],
      [2 * msInDay, 52.696969696969695],
      [3 * msInDay, 53.61212121212121],
      [4 * msInDay, 54.52727272727273],
      [5 * msInDay, 55.442424242424245],
      [6 * msInDay, 56.35757575757576],
      [7 * msInDay, 57.27272727272727],
      [8 * msInDay, 58.18787878787879],
      [9 * msInDay, 59.1030303030303],
      [10 * msInDay, 60.018181818181816],
      [11 * msInDay, 60.93333333333333],
      [12 * msInDay, 61.848484848484844],
      [13 * msInDay, 62.76363636363636],
    ]);
  });

  it('should correctly count lagrange interpolation for price range', () => {
    const msInDay = 86400000;
    // todo write tests
    const points = [
      [1 * msInDay, 50],
      [2 * msInDay, 57],
      [3 * msInDay, 58],
      [4 * msInDay, 53],
      [5 * msInDay, 55],
      [6 * msInDay, 49],
      [7 * msInDay, 56],
      [8 * msInDay, 54],
      [9 * msInDay, 63],
      [10 * msInDay, 64],
    ];
    const result = predictionService.lagrangeInterpolation(points, 3);
    expect(result).toEqual([
      [1 * msInDay, 50],
      [2 * msInDay, 57],
      [3 * msInDay, 58],
      [4 * msInDay, 53],
      [5 * msInDay, 55],
      [6 * msInDay, 49],
      [7 * msInDay, 56],
      [8 * msInDay, 54],
      [9 * msInDay, 63],
      [10 * msInDay, 64],
      [11 * msInDay, -2407],
      [12 * msInDay, -22170],
      [13 * msInDay, -113210],
    ]);
  });
});
