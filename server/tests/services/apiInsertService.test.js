const { BankGovUaApi } = require('../../apiClasses/bankGovUaApi');
const apiService = require('../../services/apiService');

// need to start up service for test to run
describe.skip('ApiService', () => {
  describe('insert', () => {
    it("should load today's value", async () => {
      const res = await apiService.insert('EUR');
      expect(res).toEqual(0);
    });
  });
});
