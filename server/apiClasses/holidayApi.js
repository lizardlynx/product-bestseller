const { default: axios } = require('axios');
const { BaseApi } = require('./baseApi');
require('dotenv').config({ path: __dirname + '/../../.env' });

class HolidayApi extends BaseApi {
  #link =
    'https://holidayapi.com/v1/holidays?pretty&country=UA&year=2023&key=' +
    process.env.HOLIDAY_API_KEY;
  #processRequest;

  constructor() {
    const client = axios;
    super(client, 'get');
    this.#processRequest = super.getProcessRequest();
  }

  async load() {
    const {
      data: {
        data: { holidays },
      },
    } = await this.#processRequest(this.#link, {});
    return holidays;
  }
}

module.exports = { HolidayApi };
