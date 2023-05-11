"use strict";

class BaseApi {
  #client;
  #processRequest;
  constructor(client, callMethod) {
    this.#client = this.#clientWrapper(client, callMethod);
    this.#processRequest = this.#createProcessRequest(this.#client);
  }

  getProcessRequest() {
    return this.#processRequest;
  }

  //process request and give back customized response
  #createProcessRequest(client) {
    return async function (query, variables) {
      try {
        const func = client.call;
        const res = await func(query, variables);
        return { data: res, error: null };
      } catch (error) {
        console.log(error);
        return { data: null, error };
      }
    };
  }

  #clientWrapper(client, method) {
    return {
      async call(...params) {
        return client[method](...params);
      },
    };
  }
}

module.exports = { BaseApi };
