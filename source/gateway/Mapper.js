var _ = require('underscore');

/**
 * All callback in here are of the form function(result, error)
 * if error is set, the subsequent hook-function chain is broken eg.
 * execution is stopped.
 * @type {exports}
 */

var pryv = require('pryv');
var utils = require('../utils/utils.js');
var AccountContainer = require('./AccountContainer.js');
var async = require('async');


// error then result. !!!
// use context


/**
 * Constructor of the mapper, pass and instance of UserProvider to it.
 * Extend it to use the hooks.
 * @param database and instance of UserProvider
 * @constructor
 */
var Mapper = module.exports = function (database) {
  this.database = database;
};

/**
 *
 * @param constructor
 * @param members
 */
Mapper.implement = function (constructor, members) {
  var newImplementation = constructor;

  if (typeof Object.create === 'undefined') {
    Object.create = function (prototype) {
      function C() { }
      C.prototype = prototype;
      return new C();
    };
  }
  newImplementation.prototype = Object.create(this.prototype);
  _.extend(newImplementation.prototype, members);
  newImplementation.implement = this.implement;
  return newImplementation;
};

/**
 * Called exactly once when the cron is activated
 * @param generalContext empty object
 * @param callback function(error, result)
 */
Mapper.prototype.preMapGeneral = function (generalContext, callback) {
  console.warn('Mapper.prototype.preMapGeneral');
  callback(null, null);
};

/**
 * Called for each Pryv account before the map function is called on the Pryv/Service account pairs.
 * @param pryvContext contains an instance of Pryv.Connection
 * @param generalContexts the result returned by preMapGeneral()
 * @param callback function(error, result)
 */
Mapper.prototype.preMapPryv = function (generalContext, pryvContext, callback) {
  console.warn('Mapper.prototype.preMapPryv');
  callback(null, null);
};

/**
 * Called once before each Pryv/Service account pairs stream creation function is called
 * @param accountContainer instance of AccountContainer
 * @param pryvContext the result returned by preMapPryv()
 * @param generalContext the result returned by preMapGeneral()
 * @param callback function(error, result)
 */
Mapper.prototype.preStreamCreation =
  function (generalContext, pryvContext, accountContainer, callback) {
    console.warn('Mapper.prototype.preStreamCreation');
    callback(null, null);
};

/**
 * Called once before each Pryv/Service account pairs map function is called
 * @param accountContainer instance of AccountContainer
 * @param pryvResult the result returned by preMapPryv()
 * @param generalResult the result returned by preMapGeneral()
 * @param callback function(error, result)
 */
Mapper.prototype.preMapService =
  function (generalContext, pryvContext, accountContainer, callback) {
    console.warn('Mapper.prototype.preMapService');
    callback(null, null);
};

/**
 * Is called for each Pryv/Service account pair, should be the mapper function
 * @param accountContainer instance of AccountContainer
 * @param pryvResult the result returned by preMapPryv()
 * @param generalResult the result returned by preMapGeneral()
 * @param callback function(error, result)
 */
Mapper.prototype.map = function (generalContext, pryvContext, accountContainer, callback) {
  throw new Error('Unimplemented method: Mapper.map()');
};

/**
 * Is called just after the map function was called.
 * @param accountContainer instance of AccountContainer
 * @param pryvResult the result returned by preMapPryv()
 * @param generalResult the result returned by preMapGeneral()
 * @param callback function(error, result)
 */
Mapper.prototype.postMapService =
  function (generalContext, pryvContext, accountContainer, callback) {
    console.warn('Mapper.prototype.postMapService');
    callback(null, null);
};

/**
 * Called after all map functions for a Pryv account have been called
 * @param pryvConnection an instance of Pryv.Connection
 * @param pryvResult the result returned by preMapPryv()
 * @param generalResult the result returned by preMapGeneral()
 * @param callback function(error, result)
 */
Mapper.prototype.postMapPryv = function (generalContext, pryvContext, callback) {
  console.warn('Mapper.prototype.postMapPryv');
  callback(null, null);
};

/**
 * Called at the very end, when all map functions have been called.
 * @param generalResult the result returned by preMapGeneral()
 * @param callback function(error, result)
 */
Mapper.prototype.postMapGeneral = function (generalContext, callback) {
  console.warn('Mapper.prototype.postMapGeneral');
  callback(null, null);
};


/**
 * This is the cronjob.
 */
Mapper.prototype.executeCron = function () {
  console.warn('Mapper.prototype.executeCron');

  var that = this;
  var generalContext = {};
  that.preMapGeneral(generalContext, function (error, generalResult) {
    if (error) {
      return;
    }
    generalContext.generalResult = generalResult;
    var accountCounter = 0;
    that.database.forEachAccount(function (account) {

      var pryvContext = {
        account: account.pryv,
        connection: new pryv.Connection({
          username: account.pryv.user,
          auth: account.pryv.token,
          staging: utils.isStaging()
        })
      };

      that.preMapPryv(generalContext, pryvContext, function (error, pryvResult) {
        if (error) {
          return;
        }
        accountCounter++;
        var service = account.service;
        var mappers = [];
        pryvContext.pryvResult = pryvResult;

        for (var i = 0; i < service.accounts.length; ++i) {
          console.warn('launching for', pryvContext.account.user, service.accounts[i].aid);
          var currentAccount = new AccountContainer(
            pryvContext.account, service.accounts[i], pryvContext.connection);
          var fn = createPreStreamCreationFunctions(
            that, generalContext, pryvContext, currentAccount);
          mappers.push(fn);
        }

        async.parallel(mappers, function () {
          accountCounter--;
          that.postMapPryv(generalContext, pryvContext, function () {
            console.log('Mapped all accounts of', pryvContext.account.user);
            if (accountCounter === 0) {
              that.postMapGeneral(generalContext, function () {
                console.log('Cronjob done.');
              });
            }
          });
        });
      });
    });
  });
};

var createPreStreamCreationFunctions =
  function (that, generalContext, pryvContext, currentAccount) {
  return function (done) {
    that.preStreamCreation(generalContext, pryvContext, currentAccount,
      function (error, result) {
        currentAccount.preStreamCreationResult = result;
        if (error) {
          return done();
        }
        currentAccount.createStreams(function (err) {
          that.preMapService(generalContext, pryvContext, currentAccount,
            function (error, result) {
              currentAccount.preMapServiceResult = result;
              if (error) {
                return done();
              }
              that.map(generalContext, pryvContext, currentAccount, function (error, result) {
                currentAccount.mapResult = result;
                that.postMapService(generalContext, pryvContext, currentAccount,
                  function (error, result) {
                    currentAccount.postMapServiceResult = result;
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