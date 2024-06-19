'use strict';

const toISBN10 = (ISBN13) => {
  const base = ISBN13.slice(3, -1);

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += (i + 1) * Number(base[i]);
  }

  let checkDigit = sum % 11;
  if (checkDigit === 10) {
    checkDigit = 'X';
  }

  return base + checkDigit;
}

module.exports = {
  toISBN10,
}