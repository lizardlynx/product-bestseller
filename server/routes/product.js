'use strict';
const fs = require('fs');
const { logChunks } = require('../common.js');
const mainService = require('../services/mainService.js');
const predictionService = require('../services/predictions.js');
const path = require('path');

const product = (fastify, _, done) => {
  fastify.get('/products/:id', async function (req, reply) {
    const stream = fs.createReadStream(
      path.join(process.cwd(), 'frontend', 'views', 'product.html'),
      { encoding: 'utf8' }
    );
    const res = await logChunks(stream);
    reply.type('text/html').send(res);
  });

  fastify.get('/products/:id/data', async function (req, reply) {
    const { id } = req.params;
    const productFormatted = await mainService.getProductData(id);
    if (!productFormatted) return reply.status(404).send('Product not found');
    reply.type('text/html').send(JSON.stringify(productFormatted));
  });

  fastify.get('/products/:id/prices', async function (req, reply) {
    const { id } = req.params;
    const prices = await mainService.getPricesData(id);
    reply.type('text/html').send(JSON.stringify(prices));
  });

  fastify.get('/products', async function (req, reply) {
    const { name } = req.query;
    const products = await mainService.getProductsByName(name);
    reply.type('text/html').send(JSON.stringify(products));
  });

  fastify.get('/product/:id', async function (req, reply) {
    const { id } = req.params;
    const products = await mainService.getProductById(id);
    reply.type('text/html').send(JSON.stringify(products));
  });

  fastify.get('/products/:id/sma', async function (req, reply) {
    const { id } = req.params;
    const { dateStart, dateEnd } = req.query;
    const prices = await mainService.getPricesData(id, { dateStart, dateEnd });
    const result = await predictionService.sma(prices);
    reply.type('text/html').send(JSON.stringify(result));
  });

  fastify.post('/products/:id/disconnect', async function (req, reply) {
    const { id } = req.params;
    await mainService.disconnectProducts(id);
    reply.type('text/html').send();
  });

  fastify.post('/products/connect', async function (req, reply) {
    const { productId, productId2 } = JSON.parse(req.body);
    await mainService.connectProducts(+productId, +productId2);
    reply.type('text/html').send();
  });

  done();
};

module.exports = product;
