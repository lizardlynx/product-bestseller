'use strict';
const fs = require('fs');
const { logChunks } = require('../common.js');
const databaseService = require('../database/databaseService.js');
const path = require('path');

const product = (fastify, _, done) => {
  fastify.get('/products/:id', async function (req, reply) {
    const stream = fs.createReadStream(
      path.join(process.env.ROOT, 'frontend', 'views', 'product.html'),
      { encoding: 'utf8' }
    );
    const res = await logChunks(stream);
    reply.type('text/html').send(res);
  });

  fastify.get('/products/:id/data', async function (req, reply) {
    const { id } = req.params;
    const productFormatted = await databaseService.getProductData(id);
    if (!productFormatted) return reply.status(404).send('Product not found');
    reply.type('text/html').send(JSON.stringify(productFormatted));
  });

  fastify.get('/products/:id/prices', async function (req, reply) {
    const { id } = req.params;
    const prices = await databaseService.getPricesData(id);
    reply.type('text/html').send(JSON.stringify(prices));
  });

  done();
};

module.exports = product;
