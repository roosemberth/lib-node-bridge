
var request = require('request');
var utils = require('../utils/utils.js');

var IdentityProvider = {};

IdentityProvider.verifyPryv = function (username, token, callback) {
  request.get(utils.getPryvUrl(username) + 'accesses?auth=' + token,
    function (error, response, body) {
    body = body ? JSON.parse(body) : body;
    if (response && response.statusCode === 200 && body && body.accesses) {
      return callback(true);
    }
    return callback(false);
  });
};

IdentityProvider.verifyService = null;

module.exports = IdentityProvider;