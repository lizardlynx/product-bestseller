'use strict';
const fs = require('fs');
const databaseService = require('../database/databaseService.js');
const { logChunks } = require('../common.js');
const path = require('path');

const category = (fastify, _, done) => {
  fastify.get('/categories/:id', async function (req, reply) {
    const stream = fs.createReadStream(
      path.join(process.env.ROOT, 'frontend', 'views', 'category.html'),
      { encoding: 'utf8' }
    );
    const res = await logChunks(stream);
    reply.type('text/html').send(res);
  });

  fastify.get('/categories', async function (req, reply) {
    const res = await databaseService.getAllCategories();
    reply.type('application/json').send(res);
  });

  fastify.get('/categories/:id/products', async function (req, reply) {
    const { id } = req.params;
    const { page: pageNumber, items: itemsCount } = req.query;
    const products = await databaseService.getProductsByCategory(id, pageNumber, itemsCount);
    if (products.error) return reply.status(products.code).send(products.error);
    reply.type('text/html').send(JSON.stringify(products));
  });
  done();
};

module.exports = category;
