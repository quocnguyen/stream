'use strict';

// load test env
const path = require('path');
require('dotenv').config({
  silent: true,
  path: path.resolve(__dirname, '..', '.env-test'),
});

const test = require('tape');
const request = require('supertest');
const server = require('../lib/server.js');

test('load homepage', t => {
  request(server).get('/').end((err, res) => {
    t.equal(err, null, 'err null');
    t.equal(res.statusCode, 200, 'statusCode 200');
    t.end();
  });
});

test('add video', t => {
  request(server)
    .post('/')
    .type('form')
    .send({
      'domain': 'http://localhost:3000',
      'link': 'https://www.youtube.com/watch?v=Ufy_a3TEUwI'
    })
    .end((err, res) => {
      t.equal(err, null, 'err null');
      t.equal(res.statusCode, 200, 'statusCode 200');
      t.end();
    });
});

test('play video', t => {
  request(server)
    .get('/latest')
    .end((err, res) => {
      t.equal(err, null, 'err null');
      play(res.body, t.end);
    });

    function play(id, cb) {
      request(server)
        .get(`/${id}`)
        .set('Referer', 'http://localhost:3000')
        .set('Range', 'bytes=0-1')
        .end((err, res) => {
          t.equal(err, null, 'err null');
          t.equal(res.statusCode, 206, 'statusCode 206');
          cb();
        });
    }
});