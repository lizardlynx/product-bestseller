'use strict';

const build = require('./server/app.js');
const ds = require('./server/database/databaseService.js');

const app = build({ logger: true });
const start = async () => {
  await app.listen({ port: process.env.DB_PORT });

  await app.ready();

  ds.init(app);
};

start();
