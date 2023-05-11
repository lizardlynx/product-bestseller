'use strict';
const databaseService = require('../databaseService.js');

const shop = (fastify, _, done) => {
  //
  fastify.get('/shops', async function (req, reply) {
    const shops = databaseService.getShops();
    reply.type('text/html').send(JSON.stringify(shops));
  });

  done();
};

module.exports = shop;
