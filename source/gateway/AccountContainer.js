var Pryv = require('pryv');
var _ = require('underscore');
var utils = require('../utils/utils.js');
var UserProvider = require('../provider/UserProvider.js');
var db = new UserProvider();
var mapUtils = require('../utils/mapUtils.js');


var AccountContainer = module.exports = function (pryvAccount, serviceAccount, connection) {
  this.pryvAccount = pryvAccount;
  this.serviceAccount = serviceAccount;
  this.flatMap = {};
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
AccountContainer.prototype.createStreams = function (cb) {
  this.connection.fetchStructure(function (error) {
    if (!error) {
      mapUtils.bfTraversal(this.serviceAccount.mapping, function (node, callback) {
        if (mapUtils.isActiveNode(node)) {
          // prepare stream
          var stream2create = {
            parentId: node.parentId ? node.parentId : null,
            name: node.defaultName,
            id: node.id
          };

          if (node.creationSettings.prefixSidWithParent && !node.id) {
            stream2create.id += node.parentId + '-';
          }
          if (!node.id) {
            stream2create.id += node.defaultName.toLowerCase();
          }
          if (node.creationSettings.postfixSidWithServiceId && !node.id) {
            stream2create.id += '-' + this.serviceAccount.aid;
          }

          if (node.creationSettings.postfixName === 'serviceId' && !node.id) {
            stream2create.name += '-' + this.serviceAccount.aid;
          }

          // Check if it already exists
          var existingWithSameId;
          try {
            existingWithSameId = this.connection.datastore.getStreamById(stream2create.id);
          } catch (e) {
            existingWithSameId = null;
          }

          var existingsParent;
          if (stream2create.parentId) {
            try {
              existingsParent = this.connection.datastore.getStreamById(stream2create.parentId);
            } catch (e) {
              existingsParent = null;
            }
          } else {
            existingsParent = {
              children: this.connection.datastore.getStreams()
            };
          }

          //console.log('stream to create: ', stream2create.name, stream2create.id, stream2create.parentId);

          if (existingWithSameId) {
            //console.log('creation 1', stream2create.id);
            node.id = stream2create.id;
            updateNodesChildsParentId(node, stream2create.id);
            return callback(true);
          } else if (existingsParent) {
            var i = 0;
            var name = null;
            var counter = 0;
            var found = false;
            /** This has to be change a little bit, id is not fixed **/
            if (node.creationSettings.postfixName === 'serviceId') {
              for (; i < existingsParent.children.length; ++i) {
                if (existingsParent.children[i].name === stream2create.name) {

                  for (counter = 0, found = false; !found; ++counter) {
                    name = stream2create.name + ' (' + counter + ')';
                    for (; i < existingsParent.children.length && !found; ++i) {
                      if (existingsParent.children[i].name === name) {
                        found = true;
                      }
                    }
                    if (!found) {
                      stream2create.name = name;
                      found = true;
                    } else {
                      found = false;
                    }
                  }
                  break;
                }
              }
            } else if (node.creationSettings.postfixName === 'increment') {
              for (counter = 0, found = false; !found; ++counter) {
                name = node.defaultName + (counter ? ' ' + counter : '');
                for (; i < existingsParent.children.length && !found; ++i) {
                  if (existingsParent.children[i].name === name) {
                    found = true;
                  }
                }
                if (!found) {
                  stream2create.name = name;
                  found = true;
                } else {
                  found = false;
                }
              }
            } else {
              for (counter = 0, found = false; !found; ++counter) {
                name = node.defaultName + (counter ? ' ' + counter : '');
                for (; i < existingsParent.children.length && !found; ++i) {
                  if (existingsParent.children[i].name === name) {
                    found = true;
                  }
                }
                if (!found) {
                  stream2create.name = name;
                  found = true;
                } else {
                  found = false;
                }
              }
            }
          } else {
            //console.log('creation 3', stream2create.id);
            return callback(false);
          }
          this.connection.streams.create(stream2create, function (error, stream) {
            if (!error) {
              node.id = stream.id;
              updateNodesChildsParentId(node, stream.id);
              //console.log('creation 4', stream2create.id);
              return callback(true);
            } else if (error && error.id === 'API_UNREACHEABLE') {
              //console.log('creation 5', stream2create.id);
              return callback(false);
            } else {
              node.error = error;
              //console.log('creation 6', stream2create.id);
              return callback(false);
            }
          }.bind(this));
        } else {
          //console.log('creation 7', node.uid, node.error);
          return callback(false);
        }
      }.bind(this), function () {
        db.updateServiceAccount(this.pryvAccount.user, this.serviceAccount, function () {
          this.flattenMap();
          cb();
        }.bind(this));
      }.bind(this));
    } else {
      //console.log('here, but why?', error);
      return cb(error, null);
    }
  }.bind(this));
};


var updateNodesChildsParentId = function (node, parentId) {
  for (var i = 0, ln = node.streams.length; i < ln; ++i) {
    if (!node.streams[i].parentId) {
      node.streams[i].parentId = parentId;
    }
  }
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
  db.updateServiceAccount(pryvUser, serviceAccount, function () {
  });
};


AccountContainer.prototype.flattenMap = function () {
  var that = this;
  mapUtils.bfTraversalSync(that.serviceAccount.mapping, function (node) {
    that.flatMap[node.uid] = node;
    return true;
  });
};