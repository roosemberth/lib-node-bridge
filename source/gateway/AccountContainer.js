var Pryv = require('pryv');
var _ = require('underscore');
var utils = require('../utils/utils.js');
var db = require('../provider/UserProvider.js')();
var MapUtils = require('../utils/MapUtils.js');


module.exports = function (pryvAccount, serviceAccount) {
  this.pryvAccount = pryvAccount;
  this.serviceAccount = serviceAccount;
  this.connection = new Pryv.Connection({
    username: pryvAccount.user,
    auth: pryvAccount.token,
    staging: utils.isStaging()
  });

  /**
   * Creates the streams recursively if active and not having an error
   * @param {function} callback called when done
   */
  this.createStreams = function (callback) {
    this.connection.fetchStructure(function (error) {
      if (!error) {
        MapUtils.bfExecutor(this.serviceAccount.mapping, function (node, callback) {
          if (MapUtils.isActiveNode(node)) {
            if (!node.id) {
              var stream2create = _.pick(node, 'name', 'parentId');
              this.connection.streams.create(stream2create, function (error, stream) {
                //console.log(error);
                if (error && error.id === 'item-already-exists') {

                  var parentId = typeof(node.parentId) === 'undefined' ? null : node.parentId;
                  var streams = null;

                  if (parentId) {
                    streams = this.connection.datastore.getStreamById(parentId).children;
                  } else {
                    streams = this.connection.datastore.getStreams();
                  }

                  //console.log('to find\t', node.name, parentId);
                  for (var i = 0, l = streams.length; i < l; ++i) {
                    //console.log('current\t', streams[i].name, streams[i].parentId);
                    if (streams[i].name === node.name &&
                      streams[i].parentId === parentId) {
                      stream = streams[i];
                      error = null;
                      break;
                    }
                  }
                }
                //console.log(error, stream);

                if (!error) {
                  node.id = stream.id;
                  //console.log(node.error, node.id);
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
      }
    }.bind(this));
  };


  /**
   * Pushes the event-likes to this associated Pryv account and signals
   * the error in the mapping tree.
   * @param {Array} events of Pryv's event-like
   * @param {function} callback called when done
   */
  this.batchCreateEvents = function (events, callback) {

    if (typeof(callback) !== 'function') {
      callback = function () {};
    }

    if (!events || (events && events.length === 0)) {
      MapUtils.updateUpdateTimestamp(this.serviceAccount.mapping);
      db.updateServiceAccount(this.pryvAccount.user, this.serviceAccount);
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
      toTime: youngest,
      streams: streams,
      sortAscending: true
    }, function (error, ev) {
      if (!error) {

        var notFound = [];
        for (var i = 0, l = events.length; i < l; ++i) {
          var found = false;
          for (var j = 0, le = ev.length; j < le; ++j) {
            if (events[i].time === ev[j].time &&
              events[i].streamId === ev[j].streamId &&
              events[i].type === ev[j].type) {
              if (events[i].duration && ev[j].duration &&
                events[i].duration === ev[j].duration) {
                if (events[i].content && ev[j].content &&
                  events[i].content === ev[j].content) {
                  found = true;
                  break;
                }
              }
            }
          }
          if (!found) {
            notFound.push(events[i]);
          }
        }

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
              MapUtils.updateUpdateTimestamp(this.serviceAccount.mapping);
              return db.updateServiceAccount(this.pryvAccount.user, this.serviceAccount,
                function () {
                  return callback();
              });

            } else {
              if (error.id === 'API_UNREACHEABLE') {
                error = null;
              }
              // In this case we failed to push the events and
              // set error and reset last update on the node.
              setFailedStreams(this.serviceAccount.mapping, this.pryvAccount.user,
                this.serviceAccount, streams, error);
              return callback();
            }
          }.bind(this));
        } else {
          MapUtils.updateUpdateTimestamp(this.serviceAccount.mapping);
        }
      } else {
        if (error.id === 'API_UNREACHEABLE') {
          error = null;
        }
        // In this case we failed to fetch the events and
        // set error and reset last update on the node.
        setFailedStreams(this.serviceAccount.mapping, this.pryvAccount.user,
          this.serviceAccount, streams, error);
        return callback();
      }

    }.bind(this));
  };
};


var setFailedStreams = function (map, pryvUser, serviceAccount, streams, error) {
  MapUtils.syncBfExecutor(map, function (node) {
    if (MapUtils.isActiveNode(node)) {
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