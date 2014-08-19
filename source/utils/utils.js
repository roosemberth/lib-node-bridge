var config = require('../utils/config.js');

var utils = module.exports = {};

utils.getPryvDomain = function () {
  if (config.get('pryvdomain') === 'pryv.in') {
    return 'pryv.in';
  } else if (config.get('pryvdomain') === 'rec.la') {
    return 'pryv.in';
  } else {
    return 'pryv.io';
  }
};

utils.getPryvUrl = function (username) {
  return 'https://' + username + '.' + this.getPryvDomain() + '/';
};

utils.isStaging = function () {
  return (config.get('pryvdomain') === 'pryv.in' || config.get('pryvdomain') === 'rec.la');
};