/**
 *
 * @param tree
 * @param fn function (node, callback = function (success))
 * @param callback
 */
module.exports.bfExecutor = function (tree, fn, callback) {
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