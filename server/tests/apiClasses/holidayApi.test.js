const { HolidayApi } = require('../../apiClasses/holidayApi');

const holidayApi = new HolidayApi();
describe('HolidayApi', () => {
  describe('load', () => {
    it("should load today's value", async () => {
      const res = await holidayApi.load();
      expect(res).toEqual(0);
    });
  });
});
