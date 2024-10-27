'use strict';

const build = require('./server/app.js');
const mainService = require('./server/services/mainService.js');

const start = async () => {
  const app = await build({ logger: true });
  await app.listen({ port: process.env.FASTIFY_PORT, host: '0.0.0.0' });
  await app.ready();

  mainService.init(app);
};

start();
