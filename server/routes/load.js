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

  //done
  fastify.post('/categories/all', async function (req, reply) {
    await databaseService.recreateDatabase();
    const silpoRes = await silpoApi.loadCategories();
    if (silpoRes.error) return processError(silpoRes.error, reply);

    const auchanRes = await auchanApi.loadCategories();
    if (auchanRes.error) return processError(auchanRes.error, reply);

    await databaseService.addCategories(silpoRes.data, 'silpo');
    await databaseService.addCategories(auchanRes.data, 'auchan');
    reply.status(204).send();
  });

  //
  fastify.post('/products/all', async function (req, reply) {
    const shopIds = await databaseService.getCategoriesIds();

    // const idsAuchan = [];
    // const idsSilpo = [];
    // for (const sId of shopIds.data) {
    //   if (sId.db_id == 1) continue;
    //   if (sId.shop_id == 1) idsAuchan.push([sId.shop_category_id, sId.db_id]);
    //   else idsSilpo.push([sId.shop_category_id, sId.db_id]);
    // }

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
    let data = {};
    for (const ids of idsAuchan) {
      data = {};
      console.log(ids);
      const [initialId, dbId] = ids; //[5346, 12];//ids;
      if (initialId == 5335) continue;
      while (!('finished' in data)) {
        data = await auchanApi.loadProductsByCategory([initialId]);
        if (data.error) return processError(data.error, reply);
        databaseService.addAuchanProductsToQuery(data.data, dbId);
      }
      await databaseService.insertProductsData();
      // break;
    }

    console.log(idsSilpo);
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

    // do something with res
    reply.status(204).send();
  });

  done();
};

module.exports = load;
