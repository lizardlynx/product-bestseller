const { default: axios } = require('axios');
const { BaseApi } = require('./baseApi');

class BankGovUaApi extends BaseApi {
  #link = 'https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json&';
  #processRequest;

  constructor() {
    const client = axios;
    super(client, 'get');
    this.#processRequest = super.getProcessRequest();
  }

  async load(currency, day = undefined) {
    let queryParams = `valcode=${currency}`;
    if (day) {
      queryParams += `&date=${day}`;
    }
    const {
      data: {
        data: [data],
      },
    } = await this.#processRequest(this.#link + queryParams, {});
    return data;
  }
}

module.exports = { BankGovUaApi };
