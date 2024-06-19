const utils = require('./utils');

test("toISBN10 のユニットテスト", () => {
  expect(utils.toISBN10('9784105090111')).toBe('4105090119');
});

