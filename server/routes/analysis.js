'use strict';
const correlationHeatmap = require('../services/correlationHeatmap.js');
const mainService = require('../services/mainService.js');
const predictionsService = require('../services/predictionsService.js');

const analysis = (fastify, _, done) => {
  //method can only be name of Predictions class method
  fastify.get('/predictions/:method', async function (req, reply) {
    const { method } = req.params;
    const { id, period, shopId, priceComment } = req.query;
    const predictions = await predictionsService.getPredictionPerProduct(
      method,
      id,
      period,
      shopId,
      priceComment
    );
    if (predictions.error)
      return reply.status(predictions.code).send(predictions.error);
    reply.type('text/html').send(JSON.stringify(predictions));
  });

  fastify.get('/predictions/methods', async function (req, reply) {
    const methods = await predictionsService.getMethods();
    if (methods.error) return reply.status(methods.code).send(methods.error);
    reply.type('text/html').send(JSON.stringify(methods));
  });

  fastify.get('/calendar', async function (req, reply) {
    // not done yet
    const changes = await mainService.getCalendarChanges();
    if (methods.error) return reply.status(changes.code).send(changes.error);
    reply.type('text/html').send(JSON.stringify(changes));
  });

  fastify.get('/correlation', async function (req, reply) {
    const { productId, shopId } = req.query;
    const changes = await correlationHeatmap.get(productId, shopId);
    if (changes.error) return reply.status(changes.code).send(changes.error);
    reply.type('text/html').send(JSON.stringify(changes));
  });

  done();
};

module.exports = analysis;
