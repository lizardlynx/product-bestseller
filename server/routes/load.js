'use strict';
const auchanApi = require('../apiClasses/auchanApi.js');
const silpoApi = require('../apiClasses/silpoApi.js');
const databaseService = require('../database/databaseService.js');
const { processError } = require('../common.js');

const load = (fastify, _, done) => {
  //done
  fastify.post('/categories/auchan', async function (req, reply) {
    await databaseService.recreateDatabase();
    const data = await auchanApi.loadCategories();
    if (data.error) return processError(data.error, reply);
    await databaseService.addCategories(data.data, 'auchan');
    reply.status(204).send();
  });

  //done
  fastify.post('/categories/silpo', async function (req, reply) {
    await databaseService.recreateDatabase();
    const data = await silpoApi.loadCategories();
    if (data.error) return processError(data.error, reply);
    await databaseService.addCategories(data.data, 'silpo');
    reply.status(204).send();
  });

  fastify.post('/categories/all', async function (req, reply) {
    await databaseService.recreateDatabase();

    let startTime = Date.now();
    const silpoRes = await silpoApi.loadCategories();
    if (silpoRes.error) return processError(silpoRes.error, reply);
    let endTime = Date.now();
    console.log(`Execution time SilpoApi: ${endTime - startTime} ms`);

    startTime = Date.now();
    const auchanRes = await auchanApi.loadCategories();
    if (auchanRes.error) return processError(auchanRes.error, reply);
    endTime = Date.now();
    console.log(`Execution time AuchanApi: ${endTime - startTime} ms`);

    startTime = Date.now();
    await databaseService.addCategories(silpoRes.data, 'silpo');
    endTime = Date.now();
    console.log(
      `Execution time add categories Silpo: ${endTime - startTime} ms`
    );

    startTime = Date.now();
    await databaseService.addCategories(auchanRes.data, 'auchan');
    endTime = Date.now();
    console.log(
      `Execution time add categories Auchan: ${endTime - startTime} ms`
    );
    reply.status(204).send();
  });

  fastify.post('/products/all', async function (req, reply) {
    const shopIds = await databaseService.getCategoriesIds();

    const { idsSilpo, idsAuchan } = shopIds.reduce(
      (acc, shopData) => {
        if (!shopData.db_id == 1) return acc;
        const shop = shopData.shop_id == 1 ? 'idsAuchan' : 'idsSilpo';
        acc[shop].push([shopData.shop_category_id, shopData.db_id]);
        return acc;
      },
      { idsSilpo: [], idsAuchan: [] }
    );

    // need to load in chunks
    console.log(idsAuchan);
    let data = {};
    let startA = Date.now();
    for (const ids of idsAuchan) {
      data = {};
      console.log(ids);
      const [initialId, dbId] = ids; //[5346, 12];//ids;
      // if (initialId != 5346) continue;
      while (!('finished' in data)) {
        data = await auchanApi.loadProductsByCategory([initialId]);
        if (data.error) return processError(data.error, reply);
        if (!data.data.search) {
          console.log('here search was null');
          continue;
        }
        databaseService.addAuchanProductsToQuery(data.data, dbId);
      }
      await databaseService.insertProductsData();
    }
    let endA = Date.now();
    console.log(
      `Execution time full download products Auchan: ${endA - startA} ms`
    );

    console.log(idsSilpo);
    startA = Date.now();
    for (const ids of idsSilpo) {
      data = {};
      const [initialId, dbId] = ids;
      while (!('finished' in data)) {
        data = await silpoApi.loadProductsByCategory(initialId);
        if (data.error) return processError(data.error, reply);
        databaseService.addSilpoProductsToQuery(data.data, dbId);
      }
      await databaseService.insertProductsData();
    }
    endA = Date.now();
    console.log(
      `Execution time full download products Silpo: ${endA - startA} ms`
    );

    reply.status(204).send();
  });

  done();
};

module.exports = load;
