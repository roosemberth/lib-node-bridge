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
      console.error('[ERROR]', new Date(), 'Mapper ErrorResolver', 'invalid-request-structure');
      return 'timeout';
    }
    case 'invalid-parameters-format': {
      console.error('[ERROR]', new Date(), 'Mapper ErrorResolver', 'invalid-parameters-format');
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
      console.warn('[WARN]', new Date(), 'Mapper ErrorResolver unreachable', error.message);
      return 'timeout';
    }
    default: {
      console.error('[ERROR]', new Date(), 'Mapper ErrorResolver default', error);
      return 'timeout';
    }
  }
};
