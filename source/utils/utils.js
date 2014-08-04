var config = require('../utils/config.js');

module.exports = {
  getPryvDomain: function () {
    if (config.get('pryvdomain') === 'pryv.io') {
      return 'pryv.io';
    } else {
      return 'pryv.in';
    }
  },
  getPryvUrl: function (username) {
    return 'https://' + username + '.' + this.getPryvDomain() +'/accesses';
  }
};