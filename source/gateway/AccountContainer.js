var Pryv = require('pryv');
var _ = require('underscore');
var utils = require('../utils/utils.js');
var UserProvider = require('../provider/UserProvider.js');
var db = new UserProvider();
var mapUtils = require('../utils/mapUtils.js');
var createStream = require('./createStream.js');
var async = require('async');


var AccountContainer = module.exports = function (pryvAccount, serviceAccount, connection) {
  this.pryvAccount = pryvAccount;
  this.serviceAccount = serviceAccount;
  this.flatMap = {};
  this.eventFlatMap = {};
  if (connection) {
    this.connection = connection;
  } else {
    this.connection = new Pryv.Connection({
      username: pryvAccount.user,
      auth: pryvAccount.token,
      staging: utils.isStaging()
    });
  }
};
/**
 * Streams are created when asking the permissions,
 * this function just moves them around to the right place
 * @param {function} callback called when done
 */
AccountContainer.prototype.createStreams = function (cb) {
  var that = this;
  that.connection.fetchStructure(function (error) {
    if (error) {
      console.log('[INFO]', (new Date()).valueOf(), 'Failed to fetch structure for',
        that.pryvAccount.user);
      return cb(error, null);
    } else {
      console.log('[INFO]', (new Date()).valueOf(), 'Fetch stream successful for',
        that.pryvAccount.user);
      mapUtils.bfTraversal(that.serviceAccount.mapping, function (node, callback) {
          createStream(that, node, callback);
      }, function () {
        db.updateServiceAccount(that.pryvAccount.user, that.serviceAccount, function () {
          cb();
        });
      });
    }
  });
};

/**
 * Pushes the event-likes to this associated Pryv account and signals
 * the error in the mapping tree.
 * @param {Array} events of Pryv's event-like
 * @param {function} callback called when done
 */

AccountContainer.prototype.batchCreateEvents = function (events, callback) {
  var s = JSON.stringify(events);
  if (s.length > 1024 * 512) {
    var avgEventSize = 4 * s.length / events.length;
    var batchSize = Math.floor(1024 * 1024 / avgEventSize);
    var batches = [];
    for (var i = 0; i < events.length; i += batchSize) {
      var end = i + batchSize > events.length ? events.length : i + batchSize;
      var slice = events.slice(i, end);
      batches.push(createBatchFunction(this, slice));
    }
    return async.parallel(batches, callback);
  } else {
    return this.batchPartCreateEvents(events, callback);
  }
};

var createBatchFunction = function (that, events) {
  return function (done) {
    return that.batchPartCreateEvents(events, done);
  };
};

AccountContainer.prototype.batchPartCreateEvents = function (events, callback) {

  if (typeof(callback) !== 'function') {
    callback = function () {
    };
  }

  if (!events || (events && events.length === 0)) {
    mapUtils.updateTimestamps(this.serviceAccount.mapping);
    db.updateServiceAccount(this.pryvAccount.user, this.serviceAccount);
    //console.log('batchCreateEvents 1');
    return callback();
  }

  // Extract concerned streams and timeframe
  var streams = [];
  var oldest = Infinity;
  var youngest = -Infinity;
  for (var i = 0, l = events.length; i < l; ++i) {
    streams = _.union(streams, [events[i].streamId]);
    oldest = oldest > events[i].time ? events[i].time : oldest;
    youngest = youngest < events[i].time ? events[i].time : youngest;
  }

  // Fetch the events in the same range to avoid duplicates.
  this.connection.events.get({
    fromTime: oldest,
    toTime: youngest + 1,
    streams: streams,
    sortAscending: false
  }, function (error, ev) {

    if (!error) {
      var notFound = [];
      for (var i = 0, l = events.length; i < l; ++i) {
        var found = false;
        for (var j = 0, le = ev.length; j < le; ++j) {
          if (events[i].time === ev[j].time &&
            events[i].streamId === ev[j].streamId &&
            events[i].type === ev[j].type) {
            if (events[i].duration && ev[j].duration) {
              if (events[i].duration === ev[j].duration) {
                found = true;
                break;
              }
            } else {
              found = true;
              break;
            }
          }
        }
        if (!found) {
          notFound.push(events[i]);
        }
      }

      /*
      console.log('ev.length', ev.length);
      console.log('events.length', events.length);
      console.log('notFound.length', notFound.length);
*/

      if (notFound.length !== 0) {
        return this.connection.events.batchWithData(notFound, function (error, results) {
          // Manage all the errors
          if (!error) {
            // We should traverse results, detect the error and set the map
            // error.
            streams = {};
            for (var i = 0, l = results.length; i < l; ++i) {
              if (results[i].error) {
                streams[notFound[i].streamId] = results[i].error;
              }
            }
            // In this case we failed to push some the events and
            // will set error and reset last update on the node.
            setFailedStreams(this.serviceAccount.mapping, this.pryvAccount.user,
              this.serviceAccount, streams, error);
            mapUtils.updateTimestamps(this.serviceAccount.mapping);
            return db.updateServiceAccount(this.pryvAccount.user, this.serviceAccount,
              function () {
                return callback();
              });
          } else {
            setFailedStreams(this.serviceAccount.mapping, this.pryvAccount.user,
              this.serviceAccount, streams, error);
            return callback();
          }
        }.bind(this));
      } else {
        mapUtils.updateTimestamps(this.serviceAccount.mapping);
        return callback();
      }
    } else {
      console.error('[ERROR]', 'While fetching data', error);
      setFailedStreams(this.serviceAccount.mapping, this.pryvAccount.user,
        this.serviceAccount, streams, error);
      return callback();
    }

  }.bind(this));
};


var setFailedStreams = function (map, pryvUser, serviceAccount, streams, error) {
  mapUtils.bfTraversalSync(map, function (node) {
    if (streams instanceof Array) {
      if (_.indexOf(streams, node.id) !== -1) {
        delete node.updateCurrent;
        node.error = error;
        node.error.id = utils.errorResolver(error);
      }
    } else if (!!streams[node.id]) {
      delete node.updateCurrent;
      node.error = streams[node.id];
      node.error.id = utils.errorResolver(error);
    }
    return true;
  });
  db.updateServiceAccount(pryvUser, serviceAccount, function () {
  });
};

/**
 * Creates a flat version of the stream-nodes of the map
 */
AccountContainer.prototype.streamFlattenMap = function () {
  var that = this;
  mapUtils.bfTraversalSync(that.serviceAccount.mapping, function (node) {
    that.flatMap[node.uid] = node;
    return true;
  });
};

/**
 * Creates a flat version of the event-nodes of the map
 */
AccountContainer.prototype.eventFlattenMap = function () {
  var that = this;
  mapUtils.bfTraversalSync(that.serviceAccount.mapping, function (node) {
    for (var i = 0, l = node.events.length; i < l; ++i) {
      that.eventFlatMap[ node.events[i].uid] = node.events[i];
    }
    return true;
  });
};
