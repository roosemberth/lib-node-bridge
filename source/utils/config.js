// Dependencies

var logger = require('winston');
var fs = require('fs');
var os = require('os');
var nconf = require('nconf');

// Exports

module.exports = nconf;


//Setup nconf to use (in-order): 
//1. Command-line arguments
//2. Environment variables

nconf.argv().env();

var  configFile = null;

/// /3. A file located at ..
if (typeof(nconf.get('config')) !== 'undefined') {
  configFile = nconf.get('config');
}


if (fs.existsSync(configFile)) {
  configFile = fs.realpathSync(configFile);
  logger.info('using custom config file: ' + configFile);
} else {
  logger.error('Cannot find custom config file: ' + configFile);
}

if (configFile) {
  nconf.file({ file: configFile});
}

// Set default values
nconf.defaults({
  'database' : {
    'host': 'localhost',
    'port': 27017,
    'name': 'bridge',
    'userCollection': 'users',
    'serviceSessionCollection': 'session-service',
    'pryvSessionCollection': 'session-pryv'
  },
  'service': {
    'name': 'bridge'
  },
  'cookieSecret': 'pryv',
  'pryvdomain': 'rec.la',
  'pryvStaging': true,
  'http': {
    'port': 3000,
    'certsPathAndKey': __dirname + '/../cert/rec.la'
  }
});

if (process.env.NODE_ENV === 'test') {
  nconf.set('http:certsPathAndKey', __dirname + '/../cert/rec.la');
  nconf.set('http:port', '3000');
}