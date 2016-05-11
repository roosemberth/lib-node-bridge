var config = require('../utils/config.js');

var utils = module.exports = {};

var pryvDomain = config.get('pryvdomain');
if (pryvDomain === 'rec.la') {
  pryvDomain = 'pryv.in';
}

utils.getPryvDomain = function () {
  return pryvDomain;
};

utils.getPryvUrl = function (username) {
  return 'https://' + username + '.' + this.getPryvDomain() + '/';
};



/**
 * Return the following errors, where
 *    timeout: wait
 *    resource-inaccessible: no right on stream -> deleted or moved
 *    auth-required: tokens invalid -> stop all
 *    user-intervention: something else invalid -> stop all
 *
 * @param error
 * @returns {string}
 */
utils.errorResolver = function (error) {
  switch (error.id) {
    case 'invalid-request-structure': {
      return 'timeout';
    }
    case 'invalid-parameters-format': {
      return 'timeout';
    }
    case 'unknown-referenced-resource': {   // Stream was delete
      return 'resource-inaccessible';
    }
    case 'invalid-access-token': {
      return 'auth-required';
    }
    case 'forbidden': {
      return 'auth-required';
    }
    case 'auth-required': {
      return 'auth-required';
    }
    case 'unknown-resource': {
      return 'resource-inaccessible';
    }
    case 'user-account-relocated': {
      return 'timeout';
    }
    case 'user-intervention-required': {
      return 'auth-required';
    }
    case 'API_UNREACHEABLE': {
      return 'timeout';
    }
    default: {
      return 'timeout';
    }
  }
};
