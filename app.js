'use strict';

const http = require('http');
const server = http.createServer();
const Router = require('router');
const finalhandler = require('finalhandler');
const path = require('path');
const qs = require('querystring');
const ytdl = require('ytdl-core');
const v = require('consolidate');
const db = require('./lib/db');
const shortid = require('shortid');
const url = require('url');
require('dotenv').config({silent: true});

const app = new Router();

// no favicon
app.get('/favicon.ico', (req, res) => {
  res.end();
});

app.use((req, res, next) => {
  res.render = (filename, params) => {
    let file = path.resolve('./views', filename);
    v.mustache(file, params || {}, (err, html) => {
      if (err) { return next(err); }
      res.setHeader('Content-Type', 'text/html');
      res.end(html);
    });
  };

  next();
});

app.use((req, res, next) => {
  if (req.method !== 'POST') { return next(); }
  let body = '';
  req.on('data',  (buf) => {
    body += buf.toString();
  });
  req.on('end', () => {
    req.body = qs.parse(body);
    next();
  });
});
app.get('/:id', (req, res) => {
  db.get(req.params.id, (err, data) => {
    if (err) { return res.end(err.toString()); }
    if ( ! req.headers.referer) {
      res.statusCode = 403;
      return res.end();
    }

    let referer = url.parse(req.headers.referer);
    let allowed = url.parse(data.domain);
    if (allowed.host !== referer.host) {
      res.statusCode = 403;
      return res.end();
    }

    res.statusCode = 200;
    res.setHeader('Access-Control-Allow-Origin', data.domain);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Type', 'video/mp4');
    let pos, range = false;
    if (req.headers.range) {
      pos = req.headers.range.replace('bytes=', '').split('-');
      range = `${Number(pos[0])}-`;
      res.statusCode = 206;
    }

    let s = download(data, range);

    s.on('response', (response) => {
      if ( ! pos) return;
      let total = Number(response.headers['content-length']);
      let start = Number(pos[0]);
      let end = pos[1] ? Number(pos[1]) : start + total -1;
      res.setHeader('Content-Range', `bytes ${start}-${end}/${start+total}`);
      res.setHeader('Content-Length', total);

    });
    s.pipe(res);
  });

  function download(data, range) {
    let opt = {
      filter: format => format.container === 'mp4',
    };

    if (range) {
      opt.range = range;
    }

    return ytdl(data.link, opt);
  }
});

app.get('/', (req, res) => {
  res.render('home.html');
});

app.post('/', (req, res) => {
  var key = shortid.generate();
  db.put(key, req.body, () => {
    let url = 'http://' + process.env.VIRTUAL_HOST + '/'+key;
    res.setHeader('Content-Type', 'text/html');
    res.render('home.html', {
      msg: 'Your video: ' + url
    });
  });
});

server.on('request', (req, res) => {
  app(req, res, finalhandler(req, res));
});

server.listen(process.env.PORT || 3000);