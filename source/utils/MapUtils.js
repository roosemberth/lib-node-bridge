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
        node.updateLast = node.updateCurrent;
      }
      return callback(true);
    } else {
      return callback(false);
    }
  }, callback);
};


module.exports = {
  bfExecutor: bfExecutor,
  isActiveNode: isActiveNode,
  clearAllErrors: clearAllErrors,
  updateUpdateTimestamp: updateUpdateTimestamp
};