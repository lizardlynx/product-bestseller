const db = require('../database/database');
const predictionsService = require('../services/predictionsService');

describe('predictionsService class', () => {
  it('getPredictionPerProduct', async () => {
    const prices = [
      {
        shop_id: 1,
        date: '2024-10-12T00:00:00.000Z',
        price: '74.90',
        comment: 'price',
      },
      {
        shop_id: 1,
        date: '2024-10-12T00:00:00.000Z',
        price: '95.20',
        comment: 'oldPrice',
      },
      {
        shop_id: 2,
        date: '2024-10-12T00:00:00.000Z',
        price: '98.99',
        comment: 'price',
      },
      {
        shop_id: 2,
        date: '2024-10-12T00:00:00.000Z',
        price: '99.00',
        comment: 'priceOpt',
      },
      {
        shop_id: 1,
        date: '2024-10-13T00:00:00.000Z',
        price: '74.90',
        comment: 'price',
      },
      {
        shop_id: 1,
        date: '2024-10-13T00:00:00.000Z',
        price: '95.20',
        comment: 'oldPrice',
      },
      {
        shop_id: 2,
        date: '2024-10-13T00:00:00.000Z',
        price: '98.99',
        comment: 'price',
      },
      {
        shop_id: 2,
        date: '2024-10-13T00:00:00.000Z',
        price: '99.00',
        comment: 'priceOpt',
      },
      {
        shop_id: 1,
        date: '2024-10-14T00:00:00.000Z',
        price: '74.90',
        comment: 'price',
      },
      {
        shop_id: 1,
        date: '2024-10-14T00:00:00.000Z',
        price: '95.20',
        comment: 'oldPrice',
      },
      {
        shop_id: 1,
        date: '2024-10-15T00:00:00.000Z',
        price: '74.90',
        comment: 'price',
      },
      {
        shop_id: 1,
        date: '2024-10-15T00:00:00.000Z',
        price: '95.20',
        comment: 'oldPrice',
      },
      {
        shop_id: 1,
        date: '2024-10-16T00:00:00.000Z',
        price: '74.90',
        comment: 'price',
      },
      {
        shop_id: 1,
        date: '2024-10-16T00:00:00.000Z',
        price: '95.20',
        comment: 'oldPrice',
      },
      {
        shop_id: 2,
        date: '2024-10-16T00:00:00.000Z',
        price: '109.00',
        comment: 'oldPrice',
      },
      {
        shop_id: 2,
        date: '2024-10-16T00:00:00.000Z',
        price: '82.99',
        comment: 'price',
      },
      {
        shop_id: 2,
        date: '2024-10-16T00:00:00.000Z',
        price: '99.00',
        comment: 'priceOpt',
      },
      {
        shop_id: 2,
        date: '2024-10-17T00:00:00.000Z',
        price: '109.00',
        comment: 'oldPrice',
      },
      {
        shop_id: 2,
        date: '2024-10-17T00:00:00.000Z',
        price: '82.99',
        comment: 'price',
      },
      {
        shop_id: 2,
        date: '2024-10-17T00:00:00.000Z',
        price: '99.00',
        comment: 'priceOpt',
      },
      {
        shop_id: 1,
        date: '2024-10-17T00:00:00.000Z',
        price: '74.90',
        comment: 'price',
      },
      {
        shop_id: 1,
        date: '2024-10-17T00:00:00.000Z',
        price: '95.20',
        comment: 'oldPrice',
      },
      {
        shop_id: 2,
        date: '2024-10-18T00:00:00.000Z',
        price: '109.00',
        comment: 'oldPrice',
      },
      {
        shop_id: 2,
        date: '2024-10-18T00:00:00.000Z',
        price: '82.99',
        comment: 'price',
      },
      {
        shop_id: 2,
        date: '2024-10-18T00:00:00.000Z',
        price: '99.00',
        comment: 'priceOpt',
      },
      {
        shop_id: 1,
        date: '2024-10-18T00:00:00.000Z',
        price: '74.90',
        comment: 'price',
      },
      {
        shop_id: 1,
        date: '2024-10-18T00:00:00.000Z',
        price: '105.50',
        comment: 'oldPrice',
      },
      {
        shop_id: 2,
        date: '2024-10-19T00:00:00.000Z',
        price: '109.00',
        comment: 'oldPrice',
      },
      {
        shop_id: 2,
        date: '2024-10-19T00:00:00.000Z',
        price: '82.99',
        comment: 'price',
      },
      {
        shop_id: 2,
        date: '2024-10-19T00:00:00.000Z',
        price: '99.00',
        comment: 'priceOpt',
      },
      {
        shop_id: 1,
        date: '2024-10-19T00:00:00.000Z',
        price: '74.90',
        comment: 'price',
      },
      {
        shop_id: 1,
        date: '2024-10-19T00:00:00.000Z',
        price: '105.50',
        comment: 'oldPrice',
      },
      {
        shop_id: 2,
        date: '2024-10-20T00:00:00.000Z',
        price: '109.00',
        comment: 'oldPrice',
      },
      {
        shop_id: 2,
        date: '2024-10-20T00:00:00.000Z',
        price: '82.99',
        comment: 'price',
      },
      {
        shop_id: 2,
        date: '2024-10-20T00:00:00.000Z',
        price: '99.00',
        comment: 'priceOpt',
      },
      {
        shop_id: 1,
        date: '2024-10-20T00:00:00.000Z',
        price: '74.90',
        comment: 'price',
      },
      {
        shop_id: 1,
        date: '2024-10-20T00:00:00.000Z',
        price: '105.50',
        comment: 'oldPrice',
      },
      {
        shop_id: 2,
        date: '2024-10-21T00:00:00.000Z',
        price: '109.00',
        comment: 'oldPrice',
      },
      {
        shop_id: 2,
        date: '2024-10-21T00:00:00.000Z',
        price: '82.99',
        comment: 'price',
      },
      {
        shop_id: 2,
        date: '2024-10-21T00:00:00.000Z',
        price: '99.00',
        comment: 'priceOpt',
      },
      {
        shop_id: 1,
        date: '2024-10-21T00:00:00.000Z',
        price: '74.90',
        comment: 'price',
      },
      {
        shop_id: 1,
        date: '2024-10-21T00:00:00.000Z',
        price: '105.50',
        comment: 'oldPrice',
      },
    ];
    jest.spyOn(db, 'getPricesData').mockResolvedValueOnce(prices);

    const result = await predictionsService.getPredictionPerProduct(
      'sma',
      343,
      5,
      '2',
      'price'
    );
    console.dir(result, { depth: null });

    expect(result.chart[0].data).toEqual([
      [1729209600000, 89.39],
      [1729296000000, 86.19],
      [1729382400000, 82.99],
      [1729468800000, 82.99],
    ]);
  });
});
