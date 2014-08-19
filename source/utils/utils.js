var config = require('../utils/config.js');

module.exports = {
  getPryvDomain: function () {
    if (config.get('pryvdomain') === 'pryv.in') {
      return 'pryv.in';
    } else if (config.get('pryvdomain') === 'rec.la') {
      return 'pryv.in';
    } else {
      return 'pryv.io';
    }
  },
  getPryvUrl: function (username) {
    return 'https://' + username + '.' + this.getPryvDomain() +'/';
  },
  isStaging: function () {
    return (config.get('pryvdomain') === 'pryv.in' || config.get('pryvdomain') === 'rec.la');
  }
};