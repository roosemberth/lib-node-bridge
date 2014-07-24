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
      console.log('/api/overview\n', 'ERROR:\t', error, '\nSERVICE:\t', accounts);
      if (error) {
        return res.redirect(401, '/');
      } else {
        var service = {
          name: config.get('service:name'),
          accounts: []
        };
        for (var key in accounts) {
          if (accounts.hasOwnProperty(key)) {
            service.accounts.push(accounts[key]);
          }
        }
        return res.send(service);
      }
    });
  }
});

/**
 * Returns the data for a specific account configuration
 */
router.get('/settings/config/:account', function (req, res) {
  var account = req.params.account;
  if (!req.session.pryv || (req.session.pryv && !req.session.pryv.user)) {
    res.send(401);
  } else if (!account) {
    res.send(400);
  } else {
    up.getServices(req.session.pryv.user, function (error, service) {
      if (error) {
        res.send(401);
      } else if (!service[account]) {
        res.send(404);
      } else {
        res.send(service[account]);
      }
    });
  }
});

/**
 * Sets the data for a specific account configuration
 */
router.post('/settings/config/:account', function (req, res) {
  var account = req.params.account;
  if (!req.session.pryv || (req.session.pryv && !req.session.pryv.user)) {
    res.send(401);
  } else if (!account) {
    res.send(400);
  } else {
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


/**
 * Accepts an authorization from Pryv and register in DB
 */
router.post('/login/pryv', function (req, res) {
  console.log('/login/pryv', req.session);


  var token = req.param('token');
  var username = req.param('username');

  ip.verifyPryv(username, token, function (success) {
    if (success) {
      req.session.pryv = {
        user: username,
        token: token
      };
      up.getUser(username, function (error, user) {
        if (error) {
          up.insertUser(username, {user: username, token: token}, null, null, function (error, user) {
            if (error) {
              res.send(500);
            } else {
              res.send(200);
            }
          });
        } else {
          res.send(200);
        }
      });
    } else {
      res.redirect(401, '/');
    }
  });
});

module.exports = router;