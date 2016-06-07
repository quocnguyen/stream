'use strict';

const level = require('level');
const sublevel = require('sublevel');
const path = require('path');

const dbpath = path.resolve(__dirname, '..', process.env.DB || './db');
module.exports = sublevel(level(dbpath, {
  valueEncoding: 'json'
}));
