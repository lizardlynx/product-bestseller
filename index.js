'use strict';

const build = require('./server/app.js');
const ds = require('./server/database/databaseService.js');

const app = build({ logger: true });
const start = async () => {
  await app.listen({ port: process.env.FASTIFY_PORT, host: '0.0.0.0' });
  await app.ready();

  ds.init(app);
};

start();
