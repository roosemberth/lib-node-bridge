/**
 * All callback in here are of the form function(result, error)
 * if error is set, the subsequent hook-function chain is broken eg.
 * execution is stopped.
 * @type {exports}
 */

var Pryv = require('pryv');
var utils = require('../utils/utils.js');
var AccountContainer = require('./AccountContainer.js');
var async = require('async');


/**
 * Constructor of the mapper, pass and instance of UserProvider to it.
 * Extend it to use the hooks.
 * @param database and instance of UserProvider
 * @constructor
 */
var Mapper = function (database) {
  this.database = database;
};

/**
 * Called exactly once when the cron is activated
 * @param callback function(result, error)
 */
Mapper.prototype.preMapGeneral = function (callback) {
  callback(null, null);
};

/**
 * Called for each Pryv account before the map function is called on the Pryv/Service account pairs.
 * @param pryvConnection instance of Pryv.Connection
 * @param generalResult the result returned by preMapGeneral()
 * @param callback function(result, error)
 */
Mapper.prototype.preMapPryv = function (pryvConnection, generalResult, callback) {
  callback(null, null);
};

/**
 * Called once before each Pryv/Service account pairs stream creation function is called
 * @param accountContainer instance of AccountContainer
 * @param pryvResult the result returned by preMapPryv()
 * @param generalResult the result returned by preMapGeneral()
 * @param callback function(result, error)
 */
Mapper.prototype.preStreamCreation =
  function (accountContainer, pryvResult, generalResult, callback) {
    callback(null, null);
  };

/**
 * Called once before each Pryv/Service account pairs map function is called
 * @param accountContainer instance of AccountContainer
 * @param pryvResult the result returned by preMapPryv()
 * @param generalResult the result returned by preMapGeneral()
 * @param callback function(result, error)
 */
Mapper.prototype.preMapService = function (accountContainer, pryvResult, generalResult, callback) {
  callback(null, null);
};

/**
 * Is called for each Pryv/Service account pair, should be the mapper function
 * @param accountContainer instance of AccountContainer
 * @param pryvResult the result returned by preMapPryv()
 * @param generalResult the result returned by preMapGeneral()
 * @param callback function(result, error)
 */
Mapper.prototype.map = function (accountContainer, pryvResult, generalResult, callback) {
  throw new Error('Unimplemented method: Mapper.map()');
};

/**
 * Is called just after the map function was called.
 * @param accountContainer instance of AccountContainer
 * @param pryvResult the result returned by preMapPryv()
 * @param generalResult the result returned by preMapGeneral()
 * @param callback function(result, error)
 */
Mapper.prototype.postMapService = function (accountContainer, pryvResult, generalResult, callback) {
  callback(null, null);
};

/**
 * Called after all map functions for a Pryv account have been called
 * @param pryvConnection an instance of Pryv.Connection
 * @param pryvResult the result returned by preMapPryv()
 * @param generalResult the result returned by preMapGeneral()
 * @param callback function(result, error)
 */
Mapper.prototype.postMapPryv = function (pryvConnection, pryvResult, generalResult, callback) {
  callback(null, null);
};

/**
 * Called at the very end, when all map functions have been called.
 * @param generalResult the result returned by preMapGeneral()
 * @param callback function(result, error)
 */
Mapper.prototype.postMapGeneral = function (generalResult, callback) {
  callback(null, null);
};


/**
 * This is the cronjob.
 */
Mapper.prototype.executeCron = function () {
  var that = this;
  that.preMapGeneral(function (generalResult, error) {
    if (error) {
      return;
    }
    var accountCounter = 0;
    that.database.forEachAccount(function (account) {

      var pryvAccount = account.pryv;
      var connection = new Pryv.Connection({
        username: pryvAccount.user,
        auth: pryvAccount.token,
        staging: utils.isStaging()
      });

      that.preMapPryv(connection, generalResult, function (pryvResult, error) {
        if (error) {
          return;
        }
        accountCounter++;
        var service = account.service;

        var mappers = [];

        for (var i = 0; i < service.accounts.length; ++i) {
          console.warn('launching for', pryvAccount.user, service.accounts[i].aid);
          var currentAccount = new AccountContainer(pryvAccount, service.accounts[i], connection);
          var fn = createPreStreamCreationFunctions(that,
            connection, currentAccount, pryvResult, generalResult);
          mappers.push(fn);
        }

        async.parallel(mappers, function () {
          accountCounter--;
          that.postMapPryv(connection, pryvResult, generalResult, function () {
            console.log('Mapped all accounts of', pryvAccount.user);
            if (accountCounter === 0) {
              that.postMapGeneral(generalResult, function () {
                console.log('Cronjob done.');
              });
            }
          });
        });
      });
    });
  });
};

var createPreStreamCreationFunctions = function (that, connection,
  currentAccount, pryvResult, generalResult) {
  return function (done) {
    that.preStreamCreation(currentAccount, pryvResult, generalResult,
      function (result, error) {
        if (error) {
          return done();
        }

        currentAccount.createStreams(function () {
          that.preMapService(currentAccount, pryvResult, generalResult,
            function (result, error) {
              if (error) {
                return done();
              }
              that.map(currentAccount, pryvResult, generalResult, function () {
                that.postMapService(currentAccount, pryvResult, generalResult, function () {
                  return done();
                });
              });
            }
          );
        });
      }
    );
  };
};


module.exports = Mapper;