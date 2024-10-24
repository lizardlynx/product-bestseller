const db = require('../database/database');
const correlationHeatmap = require('../services/correlationHeatmap');
const predictionsService = require('../services/predictionsService');

describe('CorrelationHeatmap class', () => {
  it('get', async () => {
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

    jest
      .spyOn(db, 'getByApi')
      .mockResolvedValueOnce([
        { id: 1, api_id: 1, date: '2024-10-12T14:17:04', value: 41.2072 },
        { id: 2, api_id: 1, date: '2024-10-13T14:17:04', value: 41.2072 },
        { id: 3, api_id: 1, date: '2024-10-14T14:17:04', value: 41.1891 },
        { id: 4, api_id: 1, date: '2024-10-15T14:17:04', value: 41.1963 },
        { id: 5, api_id: 1, date: '2024-10-16T14:17:04', value: 41.2139 },
        { id: 6, api_id: 1, date: '2024-10-17T14:17:04', value: 41.2256 },
        { id: 7, api_id: 1, date: '2024-10-18T14:17:04', value: 41.2351 },
        { id: 8, api_id: 1, date: '2024-10-19T14:17:04', value: 41.2351 },
        { id: 9, api_id: 1, date: '2024-10-20T14:17:04', value: 41.2351 },
        { id: 10, api_id: 1, date: '2024-10-21T14:17:04', value: 41.2308 },
        { id: 11, api_id: 1, date: '2024-10-22T14:17:04', value: 41.2833 },
        { id: 12, api_id: 1, date: '2024-10-23T13:16:02', value: 41.3313 },
      ])
      .mockResolvedValueOnce([
        { id: 13, api_id: 2, date: '2024-10-12T14:17:04', value: 45.0477 },
        { id: 14, api_id: 2, date: '2024-10-13T14:17:04', value: 45.0477 },
        { id: 15, api_id: 2, date: '2024-10-14T14:17:04', value: 45.0238 },
        { id: 16, api_id: 2, date: '2024-10-15T14:17:04', value: 44.9575 },
        { id: 17, api_id: 2, date: '2024-10-16T14:17:04', value: 44.9232 },
        { id: 18, api_id: 2, date: '2024-10-17T14:17:04', value: 44.9132 },
        { id: 19, api_id: 2, date: '2024-10-18T14:17:04', value: 44.7937 },
        { id: 20, api_id: 2, date: '2024-10-19T14:17:04', value: 44.7937 },
        { id: 21, api_id: 2, date: '2024-10-20T14:17:04', value: 44.7937 },
        { id: 22, api_id: 2, date: '2024-10-21T14:17:04', value: 44.7272 },
        { id: 23, api_id: 2, date: '2024-10-22T14:17:04', value: 44.813 },
        { id: 24, api_id: 2, date: '2024-10-23T10:17:46', value: 44.7081 },
      ]);

    const result = await correlationHeatmap.get(2, 'all');
    expect(result).toEqual({
      elements: ['usd', 'eur', 'product'],
      matrix: [
        [1, -0.9310694909129471, -0.8206984327127805],
        [-0.9310694909129471, 1, 0.8454442151080692],
        [-0.8206984327127805, 0.8454442151080692, 1],
      ],
    });
  });
});
