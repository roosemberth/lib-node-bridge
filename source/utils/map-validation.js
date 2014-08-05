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


module.exports = function (map) {
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