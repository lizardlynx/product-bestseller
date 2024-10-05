const { MS_IN_DAY } = require('../constants');
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
    const MS_IN_DAY = 86400000;
    // todo write tests
    const points = [
      [1 * MS_IN_DAY, 50],
      [2 * MS_IN_DAY, 57],
      [3 * MS_IN_DAY, 58],
      [4 * MS_IN_DAY, 53],
      [5 * MS_IN_DAY, 55],
      [6 * MS_IN_DAY, 49],
      [7 * MS_IN_DAY, 56],
      [8 * MS_IN_DAY, 54],
      [9 * MS_IN_DAY, 63],
      [10 * MS_IN_DAY, 64],
    ];
    const result = predictionService.linearExtrapolation(points, 3);
    expect(result).toEqual([
      [1 * MS_IN_DAY, 51.78181818181818],
      [2 * MS_IN_DAY, 52.696969696969695],
      [3 * MS_IN_DAY, 53.61212121212121],
      [4 * MS_IN_DAY, 54.52727272727273],
      [5 * MS_IN_DAY, 55.442424242424245],
      [6 * MS_IN_DAY, 56.35757575757576],
      [7 * MS_IN_DAY, 57.27272727272727],
      [8 * MS_IN_DAY, 58.18787878787879],
      [9 * MS_IN_DAY, 59.1030303030303],
      [10 * MS_IN_DAY, 60.018181818181816],
      [11 * MS_IN_DAY, 60.93333333333333],
      [12 * MS_IN_DAY, 61.848484848484844],
      [13 * MS_IN_DAY, 62.76363636363636],
    ]);
  });

  it('should correctly count lagrange interpolation for price range', () => {
    const points = [
      [1 * MS_IN_DAY, 50],
      [2 * MS_IN_DAY, 57],
      [3 * MS_IN_DAY, 58],
      [4 * MS_IN_DAY, 53],
      [5 * MS_IN_DAY, 55],
      [6 * MS_IN_DAY, 49],
      [7 * MS_IN_DAY, 56],
      [8 * MS_IN_DAY, 54],
      [9 * MS_IN_DAY, 63],
      [10 * MS_IN_DAY, 64],
    ];
    const result = predictionService.lagrangeInterpolation(points, 3);
    expect(result).toEqual([
      [1 * MS_IN_DAY, 50],
      [2 * MS_IN_DAY, 57],
      [3 * MS_IN_DAY, 58],
      [4 * MS_IN_DAY, 53],
      [5 * MS_IN_DAY, 55],
      [6 * MS_IN_DAY, 49],
      [7 * MS_IN_DAY, 56],
      [8 * MS_IN_DAY, 54],
      [9 * MS_IN_DAY, 63],
      [10 * MS_IN_DAY, 64],
      [11 * MS_IN_DAY, -2407],
      [12 * MS_IN_DAY, -22170],
      [13 * MS_IN_DAY, -113210],
    ]);
  });

  it('should calculate correct values for newton\'s divided differences', () => {
    const points = [[5*MS_IN_DAY, 12], [6*MS_IN_DAY,13], [9*MS_IN_DAY, 14], [11*MS_IN_DAY, 16]];

    const res = predictionService.newtonsDividedDifferences(points, 1);
    expect(res).toEqual(
      [[5 * MS_IN_DAY, 12],
      [6 * MS_IN_DAY, 13],
      [9 * MS_IN_DAY, 14],
      [11 * MS_IN_DAY, 16],
      [12 * MS_IN_DAY, 18.3],]
    );
  })
});
