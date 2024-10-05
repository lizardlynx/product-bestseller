'use strict';
const auchanApi = require('../apiClasses/auchanApi.js');
const silpoApi = require('../apiClasses/silpoApi.js');
const mainService = require('../services/mainService.js');
const { processError } = require('../common.js');
const SilpoApi = require('../apiClasses/silpoApi.js');
const AuchanApi = require('../apiClasses/auchanApi.js');

async function promiseAllSettledRecordTimings(promises) {
  const startTime = new Date().getTime();
  const timings = [];
  promises.forEach((prom, ix) => {
    prom.then(() => {
      timings[ix] = new Date().getTime() - startTime;
    });
  });
  const result = await Promise.allSettled(promises);
  return { result, timings };
}

const load = (fastify, _, done) => {
  fastify.post('/categories/auchan', async function (req, reply) {
    await mainService.recreateDatabase();
    const data = await new AuchanApi().loadCategories();
    if (data.error) return processError(data.error, reply);
    await mainService.addCategories(data.data, 'auchan');
    reply.status(204).send();
  });

  fastify.post('/categories/silpo', async function (req, reply) {
    await mainService.recreateDatabase();
    const data = await new SilpoApi().loadCategories();
    if (data.error) return processError(data.error, reply);
    await mainService.addCategories(data.data, 'silpo');
    reply.status(204).send();
  });

  fastify.post('/categories/all', async function (req, reply) {
    await mainService.recreateDatabase();

    const {
      timings,
      result: [{ value: silpoRes }, { value: auchanRes }],
    } = await promiseAllSettledRecordTimings([
      new SilpoApi().loadCategories(),
      new AuchanApi().loadCategories(),
    ]);
    console.log(
      `Execution time full download categories: Auchan: ${timings[0]} ms; Silpo: ${timings[1]} ms`
    );

    if (auchanRes.error) return processError(auchanRes.error, reply);
    if (silpoRes.error) return processError(silpoRes.error, reply);

    const { timings: timings0 } = await promiseAllSettledRecordTimings([
      mainService.addCategories(auchanRes.data, 'auchan'),
    ]);
    const { timings: timings1 } = await promiseAllSettledRecordTimings([
      mainService.addCategories(silpoRes.data.data, 'silpo'),
    ]);

    console.log(
      `Execution time add categories to db: Auchan: ${timings0[0]} ms; Silpo: ${timings1[0]} ms`
    );
    reply.status(204).send();
  });

  fastify.get('/products/silpo', async function (req, reply) {
    const shopIds = await mainService.getCategoriesIds();

    (async () => {
      const { idsSilpo, idsAuchan } = shopIds.reduce(
        (acc, shopData) => {
          if (!shopData.db_id == 1) return acc;
          const shop = shopData.shop_id == 1 ? 'idsAuchan' : 'idsSilpo';
          acc[shop].push([shopData.shop_category_id, shopData.db_id]);
          return acc;
        },
        { idsSilpo: [], idsAuchan: [] }
      );

      const silpoPromises = idsSilpo.map(async (ids) => {
        let data = {};
        const insertProductsFormatter = mainService.getInsertProductsFormatter();
        const [initialId, dbId] = ids;
        const silpoApi = new SilpoApi()
        while (!('finished' in data)) {
          console.log('loop');
          data = await silpoApi.loadProductsByCategory(initialId);
          if (data.error) return processError(data.error, reply);
          mainService.addSilpoProductsToQuery(data.data, dbId, insertProductsFormatter);
        }
        console.log('silpo inserting...');
        await mainService.insertProductsData(insertProductsFormatter);
        console.log('silpo inserted');
      });

      console.log('idsSilpo', idsSilpo);

      const { timings } = await promiseAllSettledRecordTimings([
        Promise.allSettled(silpoPromises),
      ]);
      console.log(
        `Execution time full download products: Silpo: ${timings[0]} ms`
      );
    })();

    reply.status(204).send();
  });

  fastify.get('/products/auchan', async function (req, reply) {
    const shopIds = await mainService.getCategoriesIds();

    (async () => {
      const { idsSilpo, idsAuchan } = shopIds.reduce(
        (acc, shopData) => {
          if (!shopData.db_id == 1) return acc;
          const shop = shopData.shop_id == 1 ? 'idsAuchan' : 'idsSilpo';
          acc[shop].push([shopData.shop_category_id, shopData.db_id]);
          return acc;
        },
        { idsSilpo: [], idsAuchan: [] }
      );

      const auchanPromises = idsAuchan.map(async (ids) => {
        let data = {};
        const insertProductsFormatter = mainService.getInsertProductsFormatter();
        const [initialId, dbId] = ids; //[5346, 12];//ids;
        // if (initialId != 5346) continue;
        const auchanApi = new AuchanApi()
        while (!('finished' in data)) {
          data = await auchanApi.loadProductsByCategory([initialId]);
          if (data.error) return processError(data.error, reply);
          if (!data.data.search) {
            console.log('here search was null');
            continue;
          }
          mainService.addAuchanProductsToQuery(data.data, dbId, insertProductsFormatter);
        }
        console.log('auchan inserting...');
        await mainService.insertProductsData(insertProductsFormatter);
        console.log('auchan inserted');
      });

      console.log('idsAuchan', idsAuchan);

      const { timings } = await promiseAllSettledRecordTimings([
        Promise.allSettled(auchanPromises)
      ]);
      console.log(
        `Execution time full download products: Auchan: ${timings[0]} ms`
      );
    })();

    reply.status(204).send();
  });

  done();
};

module.exports = load;
