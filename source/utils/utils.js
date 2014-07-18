var conf = require('../utils/config.js');

module.exports = {
  getPryvDomain: function () {
    if (conf.get('env') === 'DEV') {
      return '.pryv.io';
    } else {
      return '.pryv.io';
    }
  },
  getPryvUrl: function (username) {
    return 'https://' + username + this.getPryvDomain() +'/accesses';
  }
};