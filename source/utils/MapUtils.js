/**
 *
 * @param tree
 * @param fn function (node, callback = function (success))
 * @param callback
 */
var bfExecutor = function (tree, fn, callback) {
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


var syncBfExecutor = function (tree, fn) {

  var bfs = function (node) {
    if (node) {
      if(fn(node)) {
        for (var i = 0; i < l; ++i) {
          bfs(tree[i]);
        }
      }
    }
  };

  if (tree instanceof Array) {
    for (var i = 0, l = tree.length; i < l; ++i) {
      bfs(tree[i]);
    }
  } else {
    bfs(tree);
  }
};


/**
 * Returns true is the node is active and error-free
 * @param node from mapping
 * @returns {boolean}
 */
var isActiveNode  = function (node) {
  return node.active && (!node.error || (node.error && !node.error.id));
};


var clearAllErrors = function (map, callback) {
  bfExecutor(map, function (node, callback) {
    delete node.error;
    callback(true);
  }, callback);
};

var updateUpdateTimestamp = function (map, callback) {
  bfExecutor(map, function (node, callback) {
    if (isActiveNode(node)) {
      if (node.updateCurrent) {
        if (!(!node.updateLast || (!!node.updateLast && node.updateLast > node.updateCurrent))) {
          node.updateLast = node.updateCurrent;
        }
      }
      return callback(true);
    } else {
      return callback(false);
    }
  }, callback);
};


var validateStream = function (stream) {
  var error = null;
  var valid = true;

  valid = valid && stream.hasOwnProperty('name');
  valid = valid && stream.hasOwnProperty('id');
  valid = valid && stream.hasOwnProperty('uid');
  valid = valid && stream.hasOwnProperty('active');
  valid = valid && stream.hasOwnProperty('error');
  valid = valid && stream.hasOwnProperty('view');
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
  valid = valid && event.hasOwnProperty('service');

  if (!valid) {
    error = event;
  }
  return {
    valid: valid,
    error: error
  };
};

var validateMap = function (map) {
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

module.exports = {
  bfExecutor: bfExecutor,
  syncBfExecutor: syncBfExecutor,
  isActiveNode: isActiveNode,
  clearAllErrors: clearAllErrors,
  updateUpdateTimestamp: updateUpdateTimestamp,
  validateMap: validateMap
};