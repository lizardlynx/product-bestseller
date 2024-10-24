const { BankGovUaApi } = require('../../apiClasses/bankGovUaApi');

const bankGovUaApi = new BankGovUaApi();
describe('BankGovUaApi', () => {
  describe('load', () => {
    it("should load today's value", async () => {
      const res = await bankGovUaApi.load('EUR');
      expect(res).toMatchObject({
        cc: 'EUR',
        exchangedate: expect.any(String),
        rate: expect.any(Number),
        txt: 'Євро',
      });
    });

    it("should load specified day's value", async () => {
      const res = await bankGovUaApi.load('usd', '20200302');
      expect(res).toMatchObject({
        cc: 'USD',
        exchangedate: '02.03.2020',
        rate: expect.any(Number),
        txt: 'Долар США',
      });
    });
  });
});
