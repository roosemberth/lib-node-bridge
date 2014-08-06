var Pryv = require('pryv');
var _ = require('underscore');
var utils = require('../utils/utils.js');
var db = require('../provider/UserProvider.js')();


module.exports = function (pryvAccount, serviceAccount) {
  this.creationCounter = 0;
  this.pryvAccount = pryvAccount;
  this.serviceAccount = serviceAccount;
  this.connection = new Pryv.Connection({
    username: pryvAccount.user,
    auth: pryvAccount.token,
    staging: utils.isStaging()
  });


  /**
   * This function creates if needed the streams.
   * @param callback called when finished
   */
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


  /**
   * This function takes a single argument
   * @param callback
   */
  this._createStreams = function (subTree, callback) {
    if (subTree instanceof Array) {
      for (var k = 0; k < subTree.length; ++k) {
        this.creationCounter++;
        this._createStreams(subTree[k], callback);
      }
    } else if (subTree.active && (!subTree.error || (subTree.error && !subTree.error.id))) {
      if (!subTree.id) {

        console.warn('is NOT array', this.creationCounter);

        var stream = _.pick(subTree, 'name', 'parentId');

        this.connection.streams.create(stream, function (error, stream) {

          if (!error) {
            subTree.id = stream.id;
            for (var i = 0, l = subTree.streams.length; i < l; ++i) {
              subTree.streams[i].parentId = stream.id;
              this.creationCounter++;
              console.warn('this.creationCounter++', this.creationCounter);
              this._createStreams(subTree.streams[i], callback);
            }
          }
          if (error && error.id === 'item-already-exists') {
            var streams = this.connection.datastore.getStreams();
            for (var j = 0, ls = streams.length; j < ls; ++j) {
              if (streams[j].name === subTree.name) {
                subTree.id = streams[j].id;
                break;
              }
            }
          } else {
            subTree.error = error;
          }
          this.creationCounter--;
          console.warn('this.creationCounter--', this.creationCounter);

          if (this.creationCounter === 0) {
            console.warn('this.creationCounter zero', this.creationCounter);
            callback();
          }
        }.bind(this));
      } else { // has an id, but maybe not the childs
        for (var i = 0, l = subTree.streams.length; i < l; ++i) {
          subTree.streams[i].parentId = subTree.streams[i].parentId ?
            subTree.streams[i].parentId : subTree.id;
          this.creationCounter++;
          console.warn('this.creationCounter++', this.creationCounter);
          this._createStreams(subTree.streams[i], callback);
        }
      }
    }

    // Own exit notif
    this.creationCounter--;
    console.warn('this.creationCounter--', this.creationCounter);
    if (this.creationCounter === 0) {
      console.warn('this.creationCounter zero', this.creationCounter);
      callback();
    }
  };




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