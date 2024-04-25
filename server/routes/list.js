'use strict';
const fs = require('fs');
const { logChunks } = require('../common.js');
const databaseService = require('../database/databaseService.js');
const path = require('path');

const list = (fastify, _, done) => {
  fastify.get('/lists/:id', async function (req, reply) {
    const stream = fs.createReadStream(
      path.join(process.env.ROOT, 'frontend', 'views', 'list.html'),
      { encoding: 'utf8' }
    );
    const res = await logChunks(stream);
    reply.type('text/html').send(res);
  });

  fastify.get('/lists', async function (req, reply) {
    const res = await databaseService.getAllLists();
    reply.type('application/json').send(res);
  });

  fastify.get('/lists/:id/data', async function (req, reply) {
    const { id } = req.params;
    const res = await databaseService.getListById(id);
    reply.type('application/json').send(res);
  });
  
  fastify.post('/lists/add', async function (req, reply) {
    const data = JSON.parse(req.body);
    const res = await databaseService.createList(data);
    reply.type('application/json').send(res);
  });

  done();
};

module.exports = list;
