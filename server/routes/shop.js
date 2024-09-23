'use strict';
const mainService = require('../services/mainService.js');

const shop = (fastify, _, done) => {
  fastify.get('/shops', async function (req, reply) {
    const shops = mainService.getShops();
    reply.type('text/html').send(JSON.stringify(shops));
  });

  fastify.get('/shops/analysis/full', async function (req, reply) {
    const data = await mainService.getShopPricesByDate();
    reply.type('text/html').send(JSON.stringify(data));
  });

  fastify.get('/shops/analysis/avg', async function (req, reply) {
    const data = await mainService.getShopAvgPricesByDate();
    reply.type('text/html').send(JSON.stringify(data));
  });

  done();
};

module.exports = shop;
