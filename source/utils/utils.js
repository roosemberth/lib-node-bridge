var conf = require('../utils/config.js');

module.exports = {
  getPryvDomain: function () {
    if (conf.get('pryvStaging')) {
      return '.pryv.in';
    } else {
      return '.pryv.io';
    }
  },
  getPryvUrl: function (username) {
    return 'https://' + username + this.getPryvDomain() +'/accesses';
  }
};