'use strict';
const countries = require('i18n-iso-countries');

//sleep for some time
const delay = (ms = 1000) => new Promise((resolve) => setTimeout(resolve, ms));

const processError = (error, reply) => {
  console.log(error);
  reply.status(500).send('Server Error');
};

const datetime = (dateProvided = undefined) => {
  let date;
  date = dateProvided ?? new Date();
  date =
    date.getUTCFullYear() +
    '-' +
    ('00' + (date.getUTCMonth() + 1)).slice(-2) +
    '-' +
    ('00' + date.getUTCDate()).slice(-2) +
    ' ' +
    ('00' + date.getUTCHours()).slice(-2) +
    ':' +
    ('00' + date.getUTCMinutes()).slice(-2) +
    ':' +
    ('00' + date.getUTCSeconds()).slice(-2);
  return date;
};

async function logChunks(readable) {
  let chunks = '';
  for await (const chunk of readable) {
    chunks += chunk;
  }
  return chunks;
}

function firstToUpper(string) {
  return string.charAt(0).toUpperCase() + string.toLowerCase().slice(1);
}

function resolveWeight(weight) {
  if (!weight) return null;
  const lettersToG = {
    кг: 1000,
    л: 1000,
    мл: 1,
    г: 1,
  };
  weight = weight.replaceAll(' ', '');

  const numsMatch = /[0-9\.\,]+/g;
  const lettersMatch = /[а-яА-Я]+/g;

  let letters = weight.match(lettersMatch);
  let digits = weight.match(numsMatch);
  if (!letters || !digits) return null;

  digits = +digits[0].replaceAll(',', '.');
  letters = letters[0].toLowerCase();
  const mult = lettersToG[letters];
  if (mult) return digits * mult;
  return null;
}

function resolveBrand(brand) {
  if (!brand) return null;
  if (brand.length > 100) {
    brand = brand.slice(0, 100);
  }
  return brand.toLowerCase();
}

function resolveFeatureName(name) {
  if (name.length > 100) {
    name = name.slice(0, 100);
  }
  return name;
}

function resolveFeatureValue(value) {
  if (value.length > 700) {
    value = value.slice(0, 700);
  }
  return value;
}

function onlyUnique(value, index, array) {
  return array.indexOf(value) === index;
}

function resolveCountry(country) {
  const countryMatches = {
    'Соединенные Штаты': 'США',
  };
  if (country in countryMatches) country = countryMatches[country];
  const code = countries.getAlpha2Code(country, 'ru');
  if (!code) return country;
  return countries.getName(code, 'uk', { select: 'official' });
}

function splitCategories(category) {
  const separator = /,| та | і | й | и /;
  if (!category.match(/для/g))
    return category.split(separator).map((item) => item.trim().toLowerCase());
  return [category];
}

function cleanArray(arr) {
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    if (!item) {
      arr.splice(i, 1);
      i--;
    }
  }
}

function addDays(date, days) {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

module.exports = {
  delay,
  processError,
  datetime,
  logChunks,
  firstToUpper,
  resolveWeight,
  onlyUnique,
  resolveCountry,
  resolveBrand,
  resolveFeatureName,
  resolveFeatureValue,
  splitCategories,
  cleanArray,
  addDays,
};
