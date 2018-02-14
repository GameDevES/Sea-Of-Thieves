const SOT = require('./lib/src/client');
const config = require('./config');

new SOT({}).login(config.token);