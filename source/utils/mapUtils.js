/**
 *
 * @param tree
 * @param fn function (node, callback = function (success))
 * @param callback
 */
var  mapUtils = module.exports = {};

mapUtils.bfTraversal = function (tree, fn, callback) {
  var instanceCounter = 0;

  var bfs = function (node) {
    if (node) {
      fn (node, function (success) {
        if (success) {
          var l = node.streams.length || 0;
          instanceCounter += l;
          for (var i = 0; i < l; ++i) {
            bfs(node.streams[i]);
          }
        }

        if (!(--instanceCounter)) {
          return callback();
        }
      });
    } else if (!(--instanceCounter)) {
      return callback();
    }
  };

  if (tree instanceof Array) {
    var l = tree.length;
    instanceCounter += l;
    for (var i = 0; i < l; ++i) {
      bfs(tree[i]);
    }
  } else {
    instanceCounter = 1;
    bfs(tree);
  }
};


mapUtils.bfTraversalSync = function (tree, fn) {

  var bfs = function (node) {
    if (node) {
      if(fn(node)) {
        if (node.streams && node.streams.length) {
          for (var i = 0, l = node.streams.length; i < l; ++i) {
            bfs(node.streams[i]);
          }
        }
      }
    }
  };

  if (tree instanceof Array) {
    for (var i = 0, l = tree.length; i < l; ++i) {
      bfs(tree[i]);
    }
  } else {
    return bfs(tree);
  }
};


/**
 * Returns true is the node is active and error-free
 * @param node from mapping
 * @returns {boolean}
 */
mapUtils.isActiveNode  = function (node) {
  return node.active && (!node.error || (node.error &&
    (!node.error.id || node.error.id === 'API_UNREACHEABLE' ||
      node.error.id === 'unknown-referenced-resource')));
};


mapUtils.clearAllErrors = function (map, callback) {
  mapUtils.bfTraversal(map, function (node, callback) {
    delete node.error;
    callback(true);
  }, callback);
};

mapUtils.updateUpdateTimestamp = function (map) {
  mapUtils.bfTraversalSync(map, function (node) {
    if (mapUtils.isActiveNode(node)) {
      if (node.updateCurrent) {
        if (!node.updateLast) {
          node.updateLast = node.updateCurrent;
        } else {
          if (node.updateCurrent >= node.updateLast) {
            node.updateLast = node.updateCurrent;
          }
        }
      }
      return true;
    } else {
      return false;
    }
  });
};


mapUtils.validateMap = function (map) {
  if (!map || map.length === 0) {
    return false;
  }
  for (var i = 0, l = map.length; i < l; ++i) {
    var res = validateStream(map[i]);
    if (!res.valid) {
      return res;
    }
  }
  return {
    valid: true,
    error: null
  };
};


var validateStream = function (stream) {
  var error = null;
  var valid = true;

  valid = valid && stream.hasOwnProperty('defaultName');
  valid = valid && stream.hasOwnProperty('id');
  valid = valid && stream.hasOwnProperty('uid');
  valid = valid && stream.hasOwnProperty('active');
  valid = valid && stream.hasOwnProperty('creationSettings');
  valid = valid && stream.hasOwnProperty('error');
  valid = valid && stream.hasOwnProperty('service');

  if (stream.streams && stream.streams.length !== 0) {
    for (var i = 0, ls = stream.streams.length; i < ls; ++i) {
      var res_s = validateStream(stream.streams[i]);
      if (!res_s.valid) {
        return res_s;
      }
    }
  }

  if (stream.events && stream.events.length !== 0) {
    for (var j = 0, le = stream.events.length; j < le; ++j) {
      var res_e = validateEvent(stream.events[j]);
      if (!res_e.valid) {
        return res_e;
      }
    }
  }


  if (!valid) {
    error = stream;
  }
  return {
    valid: valid,
    error: error
  };
};


var validateEvent = function (event) {
  var error = null;
  var valid = true;

  valid = valid && event.hasOwnProperty('streamId');
  valid = valid && event.hasOwnProperty('uid');
  valid = valid && event.hasOwnProperty('active');
  valid = valid && event.hasOwnProperty('type');

  if (!valid) {
    error = event;
  }
  return {
    valid: valid,
    error: error
  };
};