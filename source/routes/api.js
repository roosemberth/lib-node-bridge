/**
 * Serve JSON to our AngularJS client
 * @module routes/api
 */

var express = require('express');
var router = express.Router();

var config = require('../utils/config.js');
var utils = require('../utils/utils.js');

var ip = require('../provider/IdentityProvider.js');
var up = require('../provider/UserProvider.js')();


router.get('/api/domain', function (req, res) {
  return res.send({
    pryvDomain: utils.getPryvDomain(),
    pryvStaging: utils.isStaging(),
    appId: config.get('service:name')
  });
});


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
      res.redirect('/signin-pryv', 401);
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
  if (!req.session.pryv || (req.session.pryv && !req.session.pryv.user)) {
    return res.send(401);
  } else if (!req.body) {
    return res.send(400);
  } else {
    var data = req.body;
    var pryvUsername = req.session.pryv.user;

    up.getServiceAccount(pryvUsername, data.aid, function (error, account) {
      if (!error) {
        account.mapping = data.mapping;
        account.settings.enabled = data.enabled;
        up.updateServiceAccount(pryvUsername, account, function (error) {
          if (!error) {
            return res.send(200);
          }
        });
      } else {
        return res.send(401);
      }
    });
  }
});

module.exports = router;