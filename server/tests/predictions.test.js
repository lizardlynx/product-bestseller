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
      [8, 57.2]]);
  });
});
