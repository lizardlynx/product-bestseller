'use strict';
const BaseApi = require('./baseApi.js').BaseApi;
const gqlQueries = require('./gqlQueries.js');
const { delay } = require('../common.js');
const { GraphQLClient } = require('graphql-request');

class AuchanApi extends BaseApi {
  #processAuchanRequest;
  #getProductByCategoryTotalPages = null;
  #getProductByCategoryVariables = {
    currentPage: 1,
    pageSize: 24,
    category: null,
    filter: [],
    priceSet: false,
    searchQuery: '',
    sort: {
      discount_amount: 'DESC',
    },
  };

  constructor() {
    const client = new GraphQLClient('https://auchan.ua/graphql/', {
      method: 'GET',
      headers: {
        store: 'ua',
      },
      jsonSerializer: {
        parse: JSON.parse,
        stringify: JSON.stringify,
      },
      errorPolicy: 'all',
    });

    super(client, 'request');
    this.#processAuchanRequest = super.getProcessRequest();
  }

  async loadProductsByCategory(id) {
    if (id.length == 0) return;
    this.#getProductByCategoryVariables.category = id;

    console.log(
      this.#getProductByCategoryVariables.currentPage,
      this.#getProductByCategoryTotalPages
    );
    const res = await this.#processAuchanRequest(
      gqlQueries.getProductsByCategory,
      this.#getProductByCategoryVariables
    );
    if (res.error) return res;
    await delay(500);
    if (res.data.search)
      this.#getProductByCategoryTotalPages =
        res.data.search.page_info.total_pages;
    this.#getProductByCategoryVariables.currentPage++;
    if (
      this.#getProductByCategoryVariables.currentPage >
      this.#getProductByCategoryTotalPages
    ) {
      this.#getProductByCategoryTotalPages = null;
      this.#getProductByCategoryVariables.currentPage = 1;
      this.#getProductByCategoryVariables.category = null;
      res.finished = true;
    }

    return res;
  }

  async loadCategories() {
    const variables = {
      id: 5335, //first category
      onServer: true,
      category: [],
      filter: [],
      priceSet: false,
      searchQuery: '',
      sort: { discount_amount: 'DESC' },
    };
    return await this.#processAuchanRequest(
      gqlQueries.getCategories,
      variables
    );
  }
}

module.exports = AuchanApi;
