
var app = require('./app.js');
var https = require('https');
var fs = require('fs');
var config = require('./utils/config.js');


module.exports = function () {

  var BASE_PATH = config.get('http:certsPathAndKey') + '-';

  var sslOptions = {
    key: fs.readFileSync(BASE_PATH + 'key.pem').toString(),
    cert: fs.readFileSync(BASE_PATH + 'cert.crt').toString(),
    ca: fs.readFileSync(BASE_PATH + 'ca.pem').toString()
  };

  var server = https.createServer(sslOptions, app).listen(app.get('port'), function() {
  console.log('mongodb://' + config.get('database:host') + ':' +
    config.get('database:port') + '/' + config.get('database:name') +
    '/' + config.get('database:pryvSessionCollection'));
    var address = server.address();
    var protocol = server.key ? 'https' : 'http';
    console.log('Server running on ' + protocol + '://' +  config.get('pryvdomain') + ':' +
      address.port + ' with cert: ' + BASE_PATH);

  });
};
