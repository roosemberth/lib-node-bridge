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

  this.createStreams = function (callback) {
    MapUtils.bfExecutor(this.serviceAccount.mapping, function (node, callback) {
      if (node.active && (!node.error || (node.error && !node.error.id))) {
        if (!node.id) {
          var stream2create = _.pick(node, 'name', 'parentId');
          this.connection.streams.create(stream2create, function (error, stream) {
            if (!error || (error && error.id === 'item-already-exists')) {
                console.log(stream);
            }
          });
        } else {
          return callback(true);
        }
      } else {
        return callback(false);
      }

    }, callback);
  };


  /**
   * This function creates if needed the streams.
   * @param callback called when finished

  this.createStreams = function (callback) {
    console.warn('calling createStreams');
    this.connection.fetchStructure(function () {
      this.creationCounter = 1;
      console.warn('this.creationCounter', this.creationCounter);
      this._createStreams(this.serviceAccount.mapping, function () {
        db.updateServiceAccount(this.pryvAccount.user, this.serviceAccount, function () {
          callback();
        });

      }.bind(this));
    }.bind(this));
  };
  */


  /**
   * This function takes a single argument
   * @param callback

  this._createStreams = function (subTree, callback) {
    if (subTree instanceof Array) {
      this.creationCounter += subTree.length;
      console.warn('Created childs, since arrray, now at', this.creationCounter);
      for (var k = 0; k < subTree.length; ++k) {
        this._createStreams(subTree[k], callback);
      }
    } else if (subTree.active && (!subTree.error || (subTree.error && !subTree.error.id))) {
      console.log('current', subTree.uid, subTree.error);

      // The stream was not created
      if (!subTree.id) {
        var stream = _.pick(subTree, 'name', 'parentId');

        this.creationCounter++;
        console.warn('Created dispatch create', this.creationCounter);
        this.connection.streams.create(stream, function (error, stream) {
          console.log('error, stream', error, stream);
          if (!error) {
            subTree.id = stream.id;
            this.creationCounter += subTree.streams.length;
            console.warn('Created childs, now at', this.creationCounter);
            for (var i = 0, l = subTree.streams.length; i < l; ++i) {
              subTree.streams[i].parentId = subTree.id;
              this._createStreams(subTree.streams[i], callback);
            }
          } else if (error && error.id === 'item-already-exists') {
            var streams = this.connection.datastore.getStreams();
            for (var j = 0, ls = streams.length; j < ls; ++j) {
              if (streams[j].name === subTree.name &&
                streams[j].parentId === subTree.parentId) {
                subTree.id = streams[j].id;
                this.creationCounter += subTree.streams.length;
                console.warn('Created childs, now at', this.creationCounter);
                for (var f = 0, m = subTree.streams.length; f < m; ++f) {
                  subTree.streams[f].parentId = subTree.id;
                  this._createStreams(subTree.streams[f], callback);
                }
                break;
              }
            }
          } else {
            if (error.id !== 'API_UNREACHEABLE') {
              subTree.error = error;
            }
          }
          console.warn('// I leave -> decrement, then check if I was the last one.',
            this.creationCounter);
          if (!(--this.creationCounter) && this.creationCounter === 0) {
            console.warn('this.creationCounter zero', this.creationCounter);
            return callback();
          }
        }.bind(this));

      } else { // The stream has already been created.
        this.creationCounter += subTree.streams.length;
        console.warn('Created childs, now at', this.creationCounter);
        for (var i = 0, l = subTree.streams.length; i < l; ++i) {
          subTree.streams[i].parentId = subTree.streams[i].parentId ?
            subTree.streams[i].parentId : subTree.id;
          this._createStreams(subTree.streams[i], callback);
        }
      }
    } else {
      console.log('current', subTree.uid, subTree.error);
    }

    // I leave -> decrement, then check if I was the last one.
    console.warn('// I leave -> decrement, then check if I was the last one.',
      this.creationCounter);
    if (!(--this.creationCounter) && this.creationCounter === 0) {
      console.warn('this.creationCounter zero', this.creationCounter);
      return callback();
    }
  };
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