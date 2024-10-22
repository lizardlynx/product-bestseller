'use strict';
const predictionsService = require('../services/predictionsService.js');

const analysis = (fastify, _, done) => {
  //method can only be name of Predictions class method
  fastify.get('/predictions/:method', async function (req, reply) {
    const { method } = req.params;
    const { id, period, shopId, priceComment } = req.query; // for now per product , next per shop?
    const predictions = await predictionsService.getPredictionPerProduct(method, id, period, shopId, priceComment);
    if (predictions.error) return reply.status(predictions.code).send(predictions.error);
    reply.type('text/html').send(JSON.stringify(predictions));
  });

  fastify.get('/predictions/methods', async function (req, reply) {
    const methods = await predictionsService.getMethods();
    if (methods.error) return reply.status(methods.code).send(methods.error);
    reply.type('text/html').send(JSON.stringify(methods));
  });
  done();
};

module.exports = analysis;
