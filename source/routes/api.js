/**
 * Serve JSON to our AngularJS client
 * @module routes/api
 */

var express = require('express');
var router = express.Router();

var config = require('../utils/config.js');
var utils = require('../utils/utils.js');

var ip = require('../provider/IdentityProvider.js');
var UserProvider = require('../provider/UserProvider.js');
var up = new UserProvider();


module.exports = function (mapper, reqPerm) {

  router.get('/api/domain', function (req, res) {
    return res.send({
      pryvDomain: utils.getPryvDomain(),
      pryvStaging: utils.isStaging(),
      appId: config.get('service:appId'),
      appName: config.get('service:appName'),
      permissions: reqPerm
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
          for (var i = 0, l = accounts.length; i < l; ++i) {
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


// Clear cookie at logout

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
            up.insertUser(username, {user: username, token: token}, null, null, function (error) {
              if (error) {
                res.send(500);
              } else {
                res.send(200);
              }
            });
          }
          else {
            up.updateUserCreds(username, {user: username, token: token}, function (error) {
              if (error) {
                res.send(500);
              } else {
                res.send(200);
              }
            });
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
    var account = req.params.account ? req.params.account.toString() : null;
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
    var account = req.params.account ? req.params.account.toString() : null;
    if (!req.session.pryv || (req.session.pryv && !req.session.pryv.user)) {
      return res.send(401);
    } else if (!req.body || !account) {
      return res.send(400);
    } else {
      var data = req.body;
      var pryvUsername = req.session.pryv.user;

      up.getServiceAccount(pryvUsername, account, function (error, account) {
        if (!error) {
          mergeSelectedValues(account.mapping, data.mapping);
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


  /**
   * Removes a service account associated to pryvUsername
   */
  router.delete('/api/config/:account', function (req, res) {
    var account = req.params.account ? req.params.account.toString() : null;
    if (!req.session.pryv || (req.session.pryv && !req.session.pryv.user)) {
      return res.send(401);
    } else if (!req.body || !account) {
      return res.send(400);
    } else {
      var pryvUsername = req.session.pryv.user;
      up.removeServiceAccount(pryvUsername, account, function (error) {
        if (error) {
          res.statusCode = 400;
          return res.json(error);
        } else {
          return res.send(200);
        }
      });
    }
  });


  router.get('/api/refresh/:secret', function (req, res) {
    process.nextTick(function () {
      if (config.get('refresh')) {
        var secret = req.params.secret;
        if (secret === config.get('refresh')) {
          console.warn('[SUCCESS] Manual trigger of cron execution.');
          mapper.executeCron();
        }
      }
    });
    return res.send(404, 'Cannot GET /api/refresh/' + req.params.secret);
  });


  var mergeSelectedValues = function (accOrigin, accRcv) {
    if (accOrigin && accOrigin.length !== 0 && accRcv && accRcv.length !== 0) {
      for (var ir = 0, lr = accRcv.length; ir < lr; ++ir) {
        var curRcv = accRcv[ir];
        for (var io = 0, lo = accOrigin.length; io < lo; ++io) {
          var curOrig = accOrigin[io];
          if (curRcv.uid === accOrigin[io].uid) {
            curOrig.name = curRcv.name;
            curOrig.active = curRcv.active;
            curOrig.error = curRcv.error;
            curOrig.events = curRcv.events;
            mergeSelectedValues(curOrig.streams, curRcv.streams);
          }
        }
      }
    }
  };


  return router;
};