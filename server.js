'use strict';
const fastify = require('./config.js').fastify;
const path = require('path');
const fs = require('fs');
const { delay, processError, logChunks } = require('./common.js');
const AuchanApi = require('./apiClasses/auchanApi.js').AuchanApi;
const SilpoApi = require('./apiClasses/silpoApi.js').SilpoApi;
const DataFormatter = require('./dataFormatter.js').DataFormatter;
const ServerManager = require('./serverManager.js').ServerManager;
const PORT = 6000;
const auchanApi = new AuchanApi();
const silpoApi = new SilpoApi();
const dataFormatter = new DataFormatter();
const serverManager = new ServerManager();

fastify.get('/', (req, reply) => {
  const stream = fs.createReadStream(path.join(__dirname, 'views', 'index.html'));
  reply.type('text/html').send(stream);
});

fastify.get('/loadAuchan', async function(req, reply) {
  await dataFormatter.recreateDatabase();
  const data  = await auchanApi.loadCategories();
  if (data.error) return processError(data.error, reply);
  
  await dataFormatter.formatCategories(data.data, 'auchan');
  //may be some statistics
  reply.status(204).send();
});

fastify.get('/loadSilpo', async function(req, reply) {
  await dataFormatter.recreateDatabase();
  const data = await silpoApi.loadCategories();
  if (data.error) return processError(data.error, reply);
  
  await dataFormatter.formatCategories(data.data, 'silpo');
  reply.status(204).send();
});

fastify.get('/loadBoth', async function(req, reply) {
  await dataFormatter.recreateDatabase();
  const data1 = await silpoApi.loadCategories();
  if (data1.error) return processError(data1.error, reply);

  const data2 = await auchanApi.loadCategories();
  if (data2.error) return processError(data2.error, reply);
  
  await dataFormatter.formatCategories(data1.data, 'silpo');
  await dataFormatter.formatCategories(data2.data, 'auchan');
  reply.status(204).send();
});

fastify.get('/loadProducts', async function (req, reply) {
  const shopIds = await dataFormatter.getCategoriesIds();

  const idsAuchan = [];
  const idsSilpo = [];
  for (const sId of shopIds.data) {
    if (sId.db_id == 1) continue;
    if (sId.shop_id == 1) idsAuchan.push([sId.shop_category_id, sId.db_id]);
    else idsSilpo.push([sId.shop_category_id, sId.db_id]);
  }

  // need to throttle and load in chunks

  let data = {};
  for (const ids of idsAuchan) {
    data = {};
    const [ initialId, dbId] = ids;
    while (!('finished' in data)) {
      data = await auchanApi.loadProductsByCategory([initialId]);
      if (data.error) return processError(data.error, reply);
      dataFormatter.addAuchanProductsToQuery(data.data, dbId);
    }
    await dataFormatter.insertProductsData();
  }

  let i = false;
  console.log(idsSilpo);
  for (const ids of idsSilpo) {
    data = {};
    const [ initialId, dbId] = ids;
    // if (initialId != 28 && i == false) continue;
    // i = true;
    while (!('finished' in data)) {
      data = await silpoApi.loadProductsByCategory(initialId);
      if (data.error) return processError(data.error, reply);
      dataFormatter.addSilpoProductsToQuery(data.data, dbId);
    }
    await dataFormatter.insertProductsData();
  }

  // do something with res
  reply.status(204).send();
});


fastify.get('/categories', async function (req, reply) {
  const res = await dataFormatter.getAllCategories();
  reply.type('application/json').send(res);
});

fastify.get('/category/:id', async function (req, reply) {
  // const shopIds = await dataFormatter.getProductsByCategory(id);
  // console.log(shopIds.data);
  // const res = await auchanApi.loadProductsByCategory(idsAuchan);
  const stream = fs.createReadStream(path.join(__dirname, 'views', 'category.html'), {encoding: 'utf8'});
  const res = await logChunks(stream);
  reply.type('text/html').send(res);
});

fastify.get('/products', async function (req, reply) {
  const { category } = req.query;
  const products = await dataFormatter.getProductsByCategory(category);
  // console.log(shopIds.data);
  // const res = await auchanApi.loadProductsByCategory(idsAuchan);
  // const stream = fs.createReadStream(path.join(__dirname, 'views', 'category.html'), {encoding: 'utf8'});
  // const res = await logChunks(stream);
  // console.log(res);
  reply.type('text/html').send(JSON.stringify(products));
});

fastify.get('/product/:id', async function (req, reply) {
  const stream = fs.createReadStream(path.join(__dirname, 'views', 'product.html'), {encoding: 'utf8'});
  const res = await logChunks(stream);
  reply.type('text/html').send(res);
});

fastify.get('/item', async function (req, reply) {
  const { product } = req.query;
  const productFormatted = await dataFormatter.getProductData(product);
  reply.type('text/html').send(JSON.stringify(productFormatted));
});

fastify.get('/prices', async function (req, reply) {
  const { product } = req.query;
  const pricesFormatted = await dataFormatter.getPricesData(product);
  reply.type('text/html').send(JSON.stringify(pricesFormatted));
});

fastify.get('/shops', async function (req, reply) {
  const shops = dataFormatter.getShops();
  reply.type('text/html').send(JSON.stringify(shops));
});

fastify.setErrorHandler(function (error, request, reply) {
  this.log.error(error);
  reply.status(500).send({ error: 'Internal Server Error' });
});


const start = async() => {
  try {
    fastify.listen({port: PORT});
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);      
  }
};

start();
