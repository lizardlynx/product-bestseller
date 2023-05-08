'use strict';
const countries = require('i18n-iso-countries');


//sleep for some time
const delay = (ms = 1000) => new Promise(resolve => setTimeout(resolve, ms));

const processError = (error, reply) => {
  console.log(error);
  reply.status(500).send('Server Error');
};

const datetime = () => {
  let date;
  date = new Date();
  date = date.getUTCFullYear() + '-' +
    ('00' + (date.getUTCMonth()+1)).slice(-2) + '-' +
    ('00' + date.getUTCDate()).slice(-2) + ' ' + 
    ('00' + date.getUTCHours()).slice(-2) + ':' + 
    ('00' + date.getUTCMinutes()).slice(-2) + ':' + 
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

const slugify = text =>
  text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '');
// .replace(/--+/g, '-');

function firstToUpper(string) {
  return string.charAt(0).toUpperCase() + string.toLowerCase().slice(1);
}

function resolveWeight(weight) {
  if (!weight) return null;
  const lettersToG = {
    'кг': 1000,
    'л': 1000,
    'мл': 1,
    'г': 1
  };
  const numsMatch = /[0-9\.\,]+/g;
  const lettersMatch = /[а-яА-Я]+/g;
  const letters = weight.match(lettersMatch)[0].toLowerCase();
  const digitsArr = weight.match(numsMatch);
  let digits = null;
  if (digitsArr) {
    digits = +(digitsArr[0]);
  } else return null;
  const mult = lettersToG[letters];
  if (!mult) return null;
  const res =  digits*mult;
  if (!res) return null;
  else return res;
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
    'Соединенные Штаты': 'США'
  };
  if (country in countryMatches) country = countryMatches[country];
  const code = countries.getAlpha2Code(country, 'ru');
  if (!code) return country;
  return countries.getName(code, 'uk', {select: 'official'});
}
module.exports = { delay, processError, datetime, logChunks, slugify, firstToUpper, resolveWeight, onlyUnique, resolveCountry, resolveBrand, resolveFeatureName, resolveFeatureValue};
