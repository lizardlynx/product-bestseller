'use strict';
const fs = require('fs');
const { logChunks } = require('../common.js');
const mainService = require('../services/mainService.js');
const path = require('path');

const list = (fastify, _, done) => {
  fastify.get('/lists/:id', async function (req, reply) {
    const stream = fs.createReadStream(
      path.join(process.cwd(), 'frontend', 'views', 'list.html'),
      { encoding: 'utf8' }
    );
    const res = await logChunks(stream);
    reply.type('text/html').send(res);
  });

  fastify.get('/lists', async function (req, reply) {
    const res = await mainService.getAllLists();
    reply.type('application/json').send(res);
  });

  fastify.get('/lists/:id/data', async function (req, reply) {
    const { id } = req.params;
    const res = await mainService.getListById(id);
    reply.type('application/json').send(res);
  });
  
  fastify.post('/lists/add', async function (req, reply) {
    const data = JSON.parse(req.body);
    const res = await mainService.createList(data);
    reply.type('application/json').send(res);
  });

  done();
};

module.exports = list;
