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
  'http': {
    'port': '3000',
    'certsPathAndKey': 'source/cert/rec.la', // set to false for http mode
    'ip': '0.0.0.0' // interface to bind,
  },
  'http2': {  // mainly used for /access to be on "rec.la" domain to retrieve SessionCookies
    'port': '2443',
    'certsPathAndKey': 'source/cert/rec.la',  // set to false for http mode
    'ip': '0.0.0.0' // interface to bind
  },
  'browserBootstrap': {
    'domain': 'pryv.me',
    'fields': {
      'browser-source': 'https://d3gblc8a9weyfb.cloudfront.net:443/browser'
      //'browser-source': 'https://l.rec.la:2443/browser'
    }
  },
  'redirect': {
    'port': '80',  // 0 to turn off
    'toPort': '443',
    'ip': '0.0.0.0'
  },
  'caching_duration': 31557600000, // only in production
  'support_cors': true, // cross-origin support, if set to false the javascript behaviour
  // and page generation are modified
  // !!! MUST BE ADJUSTED IN register://index.html configuration under pryvConfig.SUPPORT_CORS
  'newrelic': {
    'app_name' : 'Brige ' + os.hostname(),
    'license_key' : 'asdf'
  }
});

if (process.env.NODE_ENV === 'test') {
  nconf.set('http:certsPathAndKey', __dirname + '/../cert/rec.la');
  nconf.set('http:port', '3000');
  nconf.set('http2:certsPathAndKey', __dirname + '/../cert/rec.la');
  nconf.set('http2:port', '10443');
  nconf.set('redirect:port', '9080');
  nconf.set('redirect:toPort', nconf.get('http:port'));
}
