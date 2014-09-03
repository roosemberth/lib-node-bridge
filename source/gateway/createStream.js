var utils = require('../utils/utils.js');
var mapUtils = require('../utils/mapUtils.js');

module.exports = function (that, node, callback) {

  var stream;
  var streamId = mapUtils.generateStreamIdFromConfig(that, node);
  node.id = streamId;
  var parentStream;
  var parentStreamId = node.parentId;

  try {
    stream = that.connection.datastore.getStreamById(streamId);
  } catch (e) {
    stream = null;
  }

  try {
    parentStream = that.connection.datastore.getStreamById(parentStreamId);
  } catch (e) {
    parentStream = null;
  }

  console.log(streamId, parentStreamId);
  console.log('[DEBUG]', 'here', 1);
  // Doest it exist?
  var changed = false;
  if (stream) {
    if (node.parentId && stream.parentId === null) {
      if (!parentStream) {
        console.log('[DEBUG]', 'here', 2);
        // Critical Error, parent does not exist...
        console.log('that s critical...');
      } else {
        console.log('[DEBUG]', 'here', 3);
        var name = findUsableChildName(parentStream, node.defaultName);
        stream.parentId = node.parentId;
        stream.name = name;
        changed = true;
      }
      console.log('[DEBUG]', 'here', 4);
    } // right place, maybe set defaultClientData
    console.log('[DEBUG]', 'here', 5);
    changed = setDefaultClientData(node, stream) || changed;
    setChildrensParentId(node, stream.id);

    // MOVE IT, if changes
    if (changed) {
      console.log('[DEBUG]', 'here', 6);
      return that.connection.streams.update(stream, function (error) {
        if (error) {
          console.log('[DEBUG]', 'here', 7);
          node.error = error;
          node.error.id = utils.errorResolver(error);
          console.error('[ERROR]', (new Date()).valueOf(), 'User', that.connection.username,
            'Stream', stream.id, 'moving failed', node.error.id);
          return callback(false);
        } else {
          console.log('[DEBUG]', 'here', 8);
          node.error = {};
          node.active = true;
          return callback(true);
        }
      });
    } else {
      console.log('[DEBUG]', 'here', 9);
      node.error = {};
      node.active = true;
      return callback(true);
    }


  } else {
    console.log('[DEBUG]', 'here', 10);
    stream = {
      id: streamId,
      parentId: parentStreamId
    };
    setDefaultClientData(node, stream);
    console.log('[DEBUG]', 'here', 11, stream);
    // It might exist try to create it, or die
    return nameIncrementalCreation(that, node, stream, callback);
  }
};


/**
 * Tries stream creation by incrementing the name
 * @param node
 * @param stream
 * @param done
 */
var nameIncrementalCreation = function (that, node, stream, done) {

  var incrCreate = function (counter) {
    stream.name = counter ? node.defaultName + ' (' + counter + ')' : node.defaultName;

    console.log('nameIncrementalCreation', stream.name);

    if (counter > 10) {
      console.error('[ERROR]', (new Date()).valueOf(), 'User', that.connection.username,
        'Stream creation failed, existing stream with same name (0-10)');
      node.error = {
        id: 'item-already-exists',
        message: 'Stream creation failed, existing stream with same name (0-10)'
      };
      node.active = false;
      return done(false);
    }

    that.connection.streams.create(stream, function (error) {
      if (error) {
        var stdErr = utils.errorResolver(error);
        if (error.id === 'item-already-exists') {
          if (error.data.name) {
            return incrCreate(++counter);
          } else  {
            console.error('[ERROR]', (new Date()).valueOf(), 'User', that.connection.username,
              'Stream creation failed, due to already existing stream',
              'Should: parentId:', stream.parentId, 'id', stream.id,
              'name', stream.name, '\n', error);
            node.error = error;
            node.active = false;
            return done(false);
          }
        } else if (stdErr === 'timeout') {
          node.error = error;
          error.id = stdErr;
          return done(false); // failed due to timeout, retry later.
        } else {
          console.error('[ERROR]', (new Date()).valueOf(), 'User', that.connection.username,
            'Creation of stream', stream.id,'failed', '\n', error);
          node.error = error;
          return done(false);
        }
      }
      setChildrensParentId(node, stream.id);
      node.error = {};
      node.active = true;
      return done(true);
    });
  };
  incrCreate(0);
};

var findUsableChildName = function (parentStream, defaultName) {
  var streamName = '';
  if (parentStream.children) {
    for (var k = 0, found = false; !found; ++k) {
      streamName = k ? defaultName + ' (' + k + ')' : defaultName;
      console.log(streamName, found);
      for (var i = 0, l = parentStream.children.length; i < l && !found; ++i) {
        if (parentStream.children[i].name === streamName) {
          found = true;
        }
      }
      if (!found) {
        break;
      } else {
        found = false;
      }
    }
  }
  return streamName;
};


var setChildrensParentId = function (node, parentId) {
  if (node.streams) {
    for (var i = 0, l = node.streams.length; i < l; ++i) {
      node.streams[i].parentId = parentId;
    }
  }
};


var setDefaultClientData = function (node, stream) {
  var changed = false;
  if (!stream.clientData) {
    stream.clientData = {};
  }
  if (node.defaultClientData) {
    for(var cd in node.defaultClientData) {
      if (node.defaultClientData.hasOwnProperty(cd) && !stream.clientData[cd]) {
        stream.clientData[cd] = node.defaultClientData[cd];
        changed = true;
      }
    }
  }
  return changed;
};