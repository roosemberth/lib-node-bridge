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
          if (node.active && (!node.error || (node.error && !node.error.id))) {
            if (!node.id) {
              var stream2create = _.pick(node, 'name', 'parentId');
              this.connection.streams.create(stream2create, function (error, stream) {
                if (error && error.id === 'item-already-exists') {
                  var streams = this.connection.datastore.getStreams();
                  var parentId = typeof(node.parentId) === 'undefined' ? null : node.parentId;
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
              if (events[i].duration && ev[i].duration &&
                events[i].duration === ev[i].duration) {
                if (events[i].content && ev[i].content &&
                  events[i].content === ev[i].content) {
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
          this.connection.events.batchWithData(notFound, function (error, events) {
            // manage errors


          });
        }
      } else {
        this.serviceAccount.map[0].error = error;
      }
      // update map in db
      db.updateServiceAccount(this.pryvAccount.user, this.serviceAccount, function (a, b) {
        callback();
      });
    }.bind(this));
  };

};