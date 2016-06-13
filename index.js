'use strict';

// load env
require('dotenv').config({silent: true});
const server = require('./lib/server');

// kick off
server.listen(process.env.PORT || 3000);
