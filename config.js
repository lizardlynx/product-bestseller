'use strict';

const fastify = require('fastify')({logger: true});
require('dotenv').config();
const path = require('path');
const fastifyStatic = require('@fastify/static');
const pageSize = 32;
fastify.register(fastifyStatic, {
  root: path.join(__dirname, 'public')
});

fastify.register(require('@fastify/mysql'), {
  promise: true,
  connectionString: `mysql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_NAME}`
});

module.exports = { fastify, pageSize };
