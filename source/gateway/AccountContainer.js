var Pryv = require('pryv');
var _ = require('underscore');
var utils = require('../utils/utils.js');
var UserProvider = require('../provider/UserProvider.js');
var db = new UserProvider();
var mapUtils = require('../utils/mapUtils.js');


var AccountContainer = module.exports = function (pryvAccount, serviceAccount, connection) {
  this.pryvAccount = pryvAccount;
  this.serviceAccount = serviceAccount;
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
 * Creates the streams recursively if active and not having an error
 * @param {function} callback called when done
 */
AccountContainer.prototype.createStreams = function (callback) {
  this.connection.fetchStructure(function (error) {
    if (!error) {
      mapUtils.bfTraversal(this.serviceAccount.mapping, function (node, callback) {
        if (mapUtils.isActiveNode(node)) {
          if (!node.id) {
            var stream2create = _.pick(node, 'name', 'parentId');
            if (node.baseStreamIdOnServiceId) {
              stream2create.name = node.name;
              stream2create.id = node.name.toLowerCase() + '-' + this.serviceAccount.aid;

              try {
                var res = this.connection.datastore.getStreamById(stream2create.id);
                node.id = res.id;
                for (var j = 0, ln = node.streams.length; j < ln; ++j) {
                  node.streams[j].parentId = node.id;
                  return callback(true);
                }
              } catch (e) {}
            }

            this.connection.streams.create(stream2create, function (error, stream) {
              if (error && error.id === 'item-already-exists') {
                var parentId = typeof(node.parentId) === 'undefined' ? null : node.parentId;
                var streams = null;

                if (parentId) {
                  streams = this.connection.datastore.getStreamById(parentId).children;
                } else {
                  streams = this.connection.datastore.getStreams();
                }
                for (var i = 0, l = streams.length; i < l; ++i) {
                  if (streams[i].name === node.name &&
                    streams[i].parentId === parentId) {
                    stream = streams[i];
                    error = null;
                    break;
                  }
                }
              }

              if (!error) {
                node.id = stream.id;
                for (var j = 0, ln = node.streams.length; j < ln; ++j) {
                  node.streams[j].parentId = node.id;
                }
                return callback(true);
              } else if (error && error.id === 'API_UNREACHEABLE') {
                return callback(false);
              } else {
                node.error = error;

                return callback(false);
              }
            }.bind(this));
          } else {
            for (var j = 0, ln = node.streams.length; j < ln; ++j) {
              if (!node.streams[j].parentId) {
                node.streams[j].parentId = node.id;
              }
            }
            return callback(true);
          }
        } else {
          return callback(false);
        }
      }.bind(this), function () {
        db.updateServiceAccount(this.pryvAccount.user, this.serviceAccount, function () {
          callback();
        });
      }.bind(this));
    } else {
      return callback(error, null);
    }
  }.bind(this));
};


/**
 * Pushes the event-likes to this associated Pryv account and signals
 * the error in the mapping tree.
 * @param {Array} events of Pryv's event-like
 * @param {function} callback called when done
 */
AccountContainer.prototype.batchCreateEvents = function (events, callback) {

  if (typeof(callback) !== 'function') {
    callback = function () {
    };
  }

  if (!events || (events && events.length === 0)) {
    mapUtils.updateUpdateTimestamp(this.serviceAccount.mapping);
    db.updateServiceAccount(this.pryvAccount.user, this.serviceAccount);
    console.log('batchCreateEvents 1');
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
    console.log(error);
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

      console.log('ev.length', ev.length);
      console.log('events.length', events.length);
      console.log('notFound.length', notFound.length);

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
            mapUtils.updateUpdateTimestamp(this.serviceAccount.mapping);
            return db.updateServiceAccount(this.pryvAccount.user, this.serviceAccount,
              function () {
                return callback();
              });
          } else {
            //if (error.id === 'API_UNREACHEABLE') {
            //  error = null;
            //}
            // In this case we failed to push the events and
            // set error and reset last update on the node.
            setFailedStreams(this.serviceAccount.mapping, this.pryvAccount.user,
              this.serviceAccount, streams, error);
            return callback();
          }
        }.bind(this));
      } else {
        mapUtils.updateUpdateTimestamp(this.serviceAccount.mapping);
        return callback();
      }
    } else {
      //if (error.id === 'API_UNREACHEABLE') {
      //  error = null;
      //}
      // In this case we failed to fetch the events and
      // set error and reset last update on the node.
      setFailedStreams(this.serviceAccount.mapping, this.pryvAccount.user,
        this.serviceAccount, streams, error);
      return callback();
    }

  }.bind(this));
};


var setFailedStreams = function (map, pryvUser, serviceAccount, streams, error) {
  mapUtils.bfTraversalSync(map, function (node) {
    if (mapUtils.isActiveNode(node)) {
      if (streams instanceof Array) {
        if (_.indexOf(streams, node.id) !== -1) {
          delete node.updateCurrent;
          node.error = error;
        }
      } else if (!!streams[node.id]) {
        delete node.updateCurrent;
        node.error = streams[node.id];
      }
      return true;
    } else {
      return false;
    }
  });
  db.updateServiceAccount(pryvUser, serviceAccount, function () {});
};