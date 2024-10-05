const correlationsService = require('../services/correlations');

describe('correlations class', () => {
  it('pearsonCoefficient', () => {
    const arr1 = [1, 2, 3, 4, 5];
    const arr2 = [5, 4, 3, 2, 7];
    const result = correlationsService.pearsonCoefficient(arr1, arr2);
    expect(result.toFixed(2)).toEqual('0.16');
  })
});
