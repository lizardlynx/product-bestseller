'use strict';
const axios = require('axios');
const BaseApi = require('./baseApi.js').BaseApi;
const { delay } = require('../common.js');

class SilpoApi extends BaseApi {
  #silpoApiLink = 'https://api.catalog.ecom.silpo.ua/api/2.0/exec/EcomCatalogGlobal';
  #processSilpoRequest;
  #getProductByCategoryItemsCount = null;
  #getProductByCategoryVariables = { 
    method: 'GetSimpleCatalogItems',
    data: {
      merchantId: 1,
      basketGuid: '',
      deliveryType: 2,
      filialId: 2043,
      From: 1,
      businessId: 1,
      To: 32,
      ingredients: false,
      categoryId: null,
      sortBy: 'popular-asc',
      RangeFilters: {},
      MultiFilters: {},
      UniversalFilters: [],
      CategoryFilter: [],
      Promos: [] 
    }
  };

  constructor() {
    const client = axios;
    super(client, 'post');
    this.#processSilpoRequest = super.getProcessRequest();
  }

  async loadProductsByCategory(id) {
    this.#getProductByCategoryVariables.data.categoryId = id;
    const pageSize = 32;

    console.log(id, this.#getProductByCategoryItemsCount, this.#getProductByCategoryVariables.data.From, this.#getProductByCategoryVariables.data.To);
    const res = await this.#processSilpoRequest(this.#silpoApiLink, this.#getProductByCategoryVariables);
    if (res.error) return res;
    await delay(3000);
    this.#getProductByCategoryItemsCount = res.data.data.itemsCount;
    this.#getProductByCategoryVariables.data.From += pageSize;
    this.#getProductByCategoryVariables.data.To += pageSize;
    if (this.#getProductByCategoryVariables.data.To > this.#getProductByCategoryItemsCount) {
      this.#getProductByCategoryItemsCount = null;
      this.#getProductByCategoryVariables.data.From = 1;
      this.#getProductByCategoryVariables.data.To = pageSize;
      this.#getProductByCategoryVariables.data.categoryId = null;
      res.finished = true;
    }

    return res;
  }

  async loadCategories() {
    const variables = {
      method: 'GetCategories',
      data: {
        merchantId: 1,
        basketGuid: '',
        deliveryType: 2,
        filialId: 2043
      }
    };

    return await this.#processSilpoRequest(this.#silpoApiLink, variables);
  }
}

module.exports = { SilpoApi };
