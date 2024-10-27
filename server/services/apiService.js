'use strict';
const db = require('../database/database.js');
const { BankGovUaApi } = require('../apiClasses/bankGovUaApi.js');
const { addDays, datetime, toISODate } = require('../common.js');

class ApiService {
  async insert(currency) {
    const apiName = `Курс по валюті ${currency}`;
    const api = await db.getApiIdByApiName(apiName);
    let apiId = api[0]?.id;
    if (!apiId) {
      await db.createApi(apiName, currency);
      const api = await db.getApiIdByApiName(apiName);
      apiId = api[0].id;
    }

    const currValues = await db.getValuesByApiName(apiName);
    const insertData = [];
    if (currValues.length === 0) {
      const [{ date: startDate }] = await db.getStartDate();
      let currDate = new Date(startDate);
      const endDate = new Date().toLocaleDateString();
      do {
        const dateFormat = currDate
          .toLocaleDateString()
          .split('/')
          .reverse()
          .join('');
        const data = await new BankGovUaApi().load(currency, dateFormat);
        insertData.push([apiId, datetime(currDate), data.rate]);
        currDate = addDays(currDate, 1);
      } while (currDate.toLocaleDateString() != endDate);
    }

    const data = await new BankGovUaApi().load(currency);
    insertData.push([apiId, datetime(), data.rate]);

    await db.insertApiValues(insertData);
  }

  async getByApi(apiName) {
    const rows = await db.getByApi(apiName);
    return rows.reduce((acc, { date, value }) => {
      const dateStr = toISODate(date).split('T')[0];
      acc[dateStr] = value;
      return acc;
    }, {});
  }
}

module.exports = new ApiService();
