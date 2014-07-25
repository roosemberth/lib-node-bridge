/**
 * Serve JSON to our AngularJS client
 * @module routes/api
 */

var express = require('express');
var router = express.Router();

var config = require('../utils/config.js');

var ip = require('../provider/IdentityProvider.js');
var up = require('../provider/UserProvider.js')();


/**
 * Returns the data for the status overview
 */
router.get('/api/overview', function (req, res) {
  if (!req.session.pryv || (req.session.pryv && !req.session.pryv.user)) {
    return res.send(401);
  } else {
    up.getServiceAccounts(req.session.pryv.user, function (error, accounts) {
      if (error) {
        return res.redirect(401, '/');
      } else {
        var service = {
          name: config.get('service:name'),
          accounts: []
        };
        for( var i = 0, l = accounts.length; i < l; ++i) {
          service.accounts.push({
            aid: accounts[i].aid,
            enabled: accounts[i].settings.enabled,
            critical: accounts[i].settings.critical,
            message: accounts[i].settings.message,
            profile: accounts[i].settings.profile
          });
        }
        return res.send(service);
      }
    });
  }
});


/**
 * Accepts an authorization from Pryv and register in DB
 */
router.post('/login/pryv', function (req, res) {
  var token = req.param('token');
  var username = req.param('username');

  ip.verifyPryv(username, token, function (success) {
    if (success) {
      req.session.pryv = {
        user: username,
        token: token
      };

      up.getUser(username, function (error, user) {
        if (error || !user) { // might be dangerous, creating a second account
          up.insertUser(username, {user: username, token: token}, null, null, function (error, user) {
            if (error) {
              res.send(500);
            } else {
              res.send(200);
            }
          });
        } else {
          // update tokens?
          res.send(200);
        }
      });
    } else {
      res.redirect(401);
    }
  });
});

/**
 * Returns the data for a specific account configuration
 */
router.get('/api/config/:account', function (req, res) {
  var account = req.params.account;
  if (!req.session.pryv || (req.session.pryv && !req.session.pryv.user)) {
    res.send(401);
  } else if (!account) {
    res.send(400);
  } else {
    up.getServiceAccount(req.session.pryv.user, account, function (error, account) {
      if (error) {
        res.send(401);
      } else if (!account) {
        res.send(404);
      } else {
        var data = {
          aid: account.aid,
          mapping: account.mapping,
          enabled: account.settings.enabled,
          critical: account.settings.critical,
          message: account.settings.message,
          profile: account.settings.profile
        };
        res.send(data);
      }
    });
  }
});

/**
 * Sets the data for a specific account configuration
 */
router.post('/api/config/:account', function (req, res) {
  var account = req.params.account;
  if (!req.session.pryv || (req.session.pryv && !req.session.pryv.user)) {
    res.send(401);
  } else if (!account) {
    res.send(400);
  } else {


    // check account already exists


    var data = {};
    var remoteData = req.body;
    data.aid = account;
    data.pryv = remoteData.pryv ? remoteData.pryv : [];
    data.service = remoteData.service ? remoteData.service : [];
    data.map = remoteData.map ? remoteData.map : {};
    data.settings = remoteData.settings ? remoteData.settings : {};
    up.updateOrAddAccount(req.session.pryv.user, data, function (error, service) {
      if (error) {
        res.send(401);
      } else if (!service[account]) {
        res.send(404);
      } else {
        res.send(200);
      }
    });
  }
});

module.exports = router;