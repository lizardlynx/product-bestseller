'use strict';
require('dotenv').config();

const fastify = require('fastify');
const fastifyStatic = require('@fastify/static');
const fastifyMysql = require('@fastify/mysql');
const fs = require('fs');

const product = require('./routes/product.js');
const category = require('./routes/category.js');
const load = require('./routes/load.js');
const shop = require('./routes/shop.js');
const list = require('./routes/list.js');
const { log } = require('console');
const analysis = require('./routes/analysis.js');

const build = async (opts = {}) => {
  const app = fastify(opts);

  app.register(fastifyStatic, {
    root: process.cwd() + '/frontend/public',
  });

  app.register(fastifyMysql, {
    promise: true,
    connectionLimit: 100,
    waitForConnections: true,
    connectionString: `mysql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  });
  // await app.register(fastifyRedis, { host: '0.0.0.0', port: 6379 });
  app.register(product);
  app.register(category);
  app.register(load);
  app.register(shop);
  app.register(list);
  app.register(analysis);

  app.setErrorHandler(function (error, request, reply) {
    this.log.error(error);
    reply.status(500).send('Internal Server Error');
  });

  app.get('/', (req, reply) => {
    const stream = fs.createReadStream(
      process.cwd() + '/frontend/views/index.html'
    );
    reply.type('text/html').send(stream);
  });

  return app;
};

module.exports = build;
