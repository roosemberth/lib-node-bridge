var _ = require('underscore');
var async = require('async');

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
      function C() {
      }

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
  callback(null, null);
};

/**
 * Called for each Pryv account before the map function is called on the Pryv/Service account pairs.
 * @param pryvContext contains an instance of Pryv.Connection
 * @param generalContexts the result returned by preMapGeneral()
 * @param callback function(error, result)
 */
Mapper.prototype.preMapPryv = function (generalContext, pryvContext, callback) {
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
  console.error('[ERROR]', (new Date()).valueOf(), 'Unimplemented method: Mapper.map()');
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
  callback(null, null);
};

/**
 * Called at the very end, when all map functions have been called.
 * @param generalResult the result returned by preMapGeneral()
 * @param callback function(error, result)
 */
Mapper.prototype.postMapGeneral = function (generalContext, callback) {
  callback(null, null);
};


/**
 * Helper function for executeCron
 */
var fnService = function (that, gc, pc, ac, callback) {
  async.series([
    // preStreamCreation
    function (done) {
      console.log('[INFO]', (new Date()).valueOf(), 'START: preStreamCreation',
        pc.account.user, ac.serviceAccount.aid);
      ac.streamFlattenMap();
      ac.eventFlattenMap();
      that.preStreamCreation(gc, pc, ac, function (err, res) {
        console.log('[INFO]', (new Date()).valueOf(), 'DONE: preStreamCreation',
          pc.account.user, ac.serviceAccount.aid);
        if (err) {
          return done(err);
        } else {
          ac.preStreamCreationResult = res;
          ac.streamFlattenMap();
          ac.eventFlattenMap();
          return done();
        }
      });
    },
    // streamCreation
    function (done) {
      console.log('[INFO]', (new Date()).valueOf(), 'START: streamCreation',
        pc.account.user, ac.serviceAccount.aid);
      ac.createStreams(function (error) {
        console.log('[INFO]', (new Date()).valueOf(), 'DONE: streamCreation',
          pc.account.user, ac.serviceAccount.aid);
        ac.streamFlattenMap();
        ac.eventFlattenMap();

        if (error) {
          return done(error);
        } else {
          return done();
        }

      });
    },
    // preMapService
    function (done) {
      console.log('[INFO]', (new Date()).valueOf(), 'START: preMapService',
        pc.account.user, ac.serviceAccount.aid);
      that.preMapService(gc, pc, ac, function (err, res) {
        console.log('[INFO]', (new Date()).valueOf(), 'DONE: preMapService',
          pc.account.user, ac.serviceAccount.aid);
        if (err) {
          return done(err);
        } else {
          ac.preMapServiceResult = res;
          return done();
        }
      });
    },
    // map
    function (done) {
      console.log('[INFO]', (new Date()).valueOf(), 'START: map',
        pc.account.user, ac.serviceAccount.aid);
      that.map(gc, pc, ac, function (err, res) {
        console.log('[INFO]', (new Date()).valueOf(), 'DONE: map',
          pc.account.user, ac.serviceAccount.aid);
        if (err) {
          return done(err);
        } else {
          ac.mapResult = res;
          return done();
        }
      });
    },
    // postMapService
    function (done) {
      console.log('[INFO]', (new Date()).valueOf(), 'START: postMapService',
        pc.account.user, ac.serviceAccount.aid);
      that.postMapService(gc, pc, ac, function (err, res) {
        console.log('[INFO]', (new Date()).valueOf(), 'DONE: postMapService',
          pc.account.user, ac.serviceAccount.aid);
        if (err) {
          return done(err);
        } else {
          ac.postMapServiceResult = res;
          return done();
        }
      });
    }
  ], function () {
    callback();
  });
};

/**
 * Helper function for executeCron
 */
var createFnService = function (that, gc, pc, ac) {
  return function (done) {
    // here we have to get the lock
    that.database.lockAccount(pc.account.user, ac.serviceAccount.aid,
      function (success, account) {
        if (success) {
          ac.serviceAccount = account;
          console.log('[INFO]', 'Could lock ', pc.account.user, ac.serviceAccount.aid, account.lock);
          fnService(that, gc, pc, ac, function () {
            that.database.unlockAccount(pc.account.user, ac.serviceAccount.aid,
              function (result, account) {
                console.log('[INFO]', 'Released lock ', pc.account.user, ac.serviceAccount.aid, account.lock);
                return done();
              }
            );
          });
        } else {
          console.log('[INFO]', 'Could not acquire lock for', pc.account.user, ac.serviceAccount.aid);
          return done();
        }
      }
    );
  };
};

/**
 * Helper function for executeCron
 */
var createFnAccount = function (that, gc, pc, callback) {
  return function () {
    var serviceFunctions = [];
    for (var i = 0; i < pc.service.accounts.length; ++i) {
      var sAcc = pc.service.accounts[i];
      var ac = new AccountContainer(pc.account, sAcc, pc.connection);
      serviceFunctions.push(createFnService(that, gc, pc, ac));
    }
    async.parallel(serviceFunctions, function () {
      return callback();
    });
  };
};



var createFnPryv = function (that, gc, pc) {
return function (done) {
  async.series([
    // preMapPryv
    function (stepDone) {
      console.log('[INFO]', (new Date()).valueOf(), 'START: preMapPryv', pc.account.user);
      that.preMapPryv(gc, pc, function (err, pr) {
        console.log('[INFO]', (new Date()).valueOf(), 'DONE: preMapPryv', pc.account.user);
        pc.preMapPryvResult = pr;
        if (err) {
          stepDone(err);
        } else {
          var doEveryAccount = createFnAccount(that, gc, pc, stepDone);
          process.nextTick(doEveryAccount);
        }
      });
    },
    // postMapPrv
    function (stepDone) {
      console.log('[INFO]', (new Date()).valueOf(), 'START: postMapPryv', pc.account.user);
      that.postMapPryv(gc, pc, function () {
        console.log('[INFO]', (new Date()).valueOf(), 'DONE: postMapPryv', pc.account.user);
        stepDone();
      });
    }
  ], function () {
    return done();
  });
};
};


/**
 * Executes the cron for every account in the database
 */
Mapper.prototype.executeCron = function () {
  var that = this;
  var gc = {};
  async.series([
    function (done) {
      console.log('[INFO]', (new Date()).valueOf(), 'START: preMapGeneral');
      that.preMapGeneral(gc, function (err, gr) {
        console.log('[INFO]', (new Date()).valueOf(), 'DONE: preMapGeneral');
        gc.preMapGeneralResult = gr;
        if (err) {
          return done();
        }
        var fns = [];
        that.database.forEachAccount(function (account) {
          var pc = {
            account: account.pryv,
            service: account.service,
            connection: new pryv.Connection({
              username: account.pryv.user,
              auth: account.pryv.token,
              staging: utils.isStaging()
            })
          };
          fns.push(createFnPryv(that, gc, pc));
        }, function () {
          async.parallel(fns, function () {
            return done();
          });
        });
      });
    },
    function (done) {
      console.log('[INFO]', (new Date()).valueOf(), 'START: postMapGeneral');
      that.postMapGeneral(gc, function () {
        console.log('[INFO]', (new Date()).valueOf(), 'DONE: postMapGeneral');
        return done();
      });
    }
  ], function () {
    console.log('[INFO]', (new Date()).valueOf(), 'CroneJob Done');
  });
};