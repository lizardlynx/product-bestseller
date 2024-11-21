'use strict';
const db = require('../database/database.js');
const { BankGovUaApi } = require('../apiClasses/bankGovUaApi.js');
const { addDays, datetime, toISODate } = require('../common.js');
const { HolidayApi } = require('../apiClasses/holidayApi.js');

function dateFormatFunc(date) {
  return date.toLocaleDateString().split('/').reverse().join('');
}

class ApiService {
  async insert(currency) {
    const apiName = `Курс по валюті ${currency}`;
    return await this.#baseInsert(
      apiName,
      currency,
      async (currValues, apiId) => {
        const insertData = [];
        const bankDates = currValues.map(({ date }) => dateFormatFunc(date));

        const [{ date: startDate }] = await db.getStartDate();
        let currDate = new Date(startDate);
        const endDate = new Date().toLocaleDateString();

        while (currDate.toLocaleDateString() != endDate) {
          const dateFormat = dateFormatFunc(currDate);

          if (!bankDates.includes(dateFormat)) {
            const data = await new BankGovUaApi().load(currency, dateFormat);
            insertData.push([apiId, datetime(currDate), data.rate]);
          }
          currDate = addDays(currDate, 1);
        }

        return insertData;
      }
    );
  }

  async #baseInsert(apiName, shortened, callback) {
    const api = await db.getApiIdByApiName(apiName);
    let apiId = api[0]?.id;
    if (!apiId) {
      await db.createApi(apiName, shortened);
      const api = await db.getApiIdByApiName(apiName);
      apiId = api[0].id;
    }

    const currValues = await db.getValuesByApiName(apiName);
    const insertData = await callback(currValues, apiId);

    if (insertData.length === 0) return;
    await db.insertApiValues(insertData);
  }

  async insertHolidays() {
    const apiName = `Свята`;
    return await this.#baseInsert(
      apiName,
      apiName,
      async (currValues, apiId) => {
        const insertData = [];
        console.log(currValues);
        if (currValues.length === 0) {
          const data = await new HolidayApi().load();
          for (const el of data) {
            insertData.push([apiId, datetime(new Date(el.date)), el.name]);
          }
        }
        return insertData;
      }
    );
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
