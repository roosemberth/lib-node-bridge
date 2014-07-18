var mongo = require('mongodb');

var config = require('../utils/config.js');

var Server = mongo.Server,
  Db = mongo.Db,
  BSON = mongo.BSONPure;

var server = new Server(config.get('mongo:host'), config.get('mongo:port'), {auto_reconnect: true, safe: true});
var userDb = new Db(config.get('mongo:database'), server);


var UserProvider = function () {
  if( !(this instanceof UserProvider)) {
    return new UserProvider();
  }
  userDb.open(function(err, db) {
    if(!err) {
      console.log('Connected to \"' + config.get('mongo:database') + '\" database');
      db.collection(config.get('mongo:userDb'), {strict:true}, function() {});
    }
  });
  return this;
};


UserProvider.prototype.initUser = function(pryvUsername, pryvToken, callback) {
  userDb.collection(config.get('mongo:userDb'), function (error, collection) {
    collection.insert({
      username: pryvUsername,
      pryv: {
        username: pryvUsername,
        token: pryvToken
      },
      service: {
        accounts: []
      }
    }, function (error, records) {
      return callback(error, records);
    });
  });
};

UserProvider.prototype.getServices = function(username, callback) {
  userDb.collection(config.get('mongo:userDb'), function (error, collection) {
    if (error) {
      return callback(error, null);
    }
    collection.findOne({username: username}, function (error, record) {
      if (!error && record && record.service) {
        return callback(record.service, null);
      }
      return callback(error, null);
    });
  });
};



UserProvider.prototype.getUserOrInit = function(pryvUsername, pryvToken, callback) {
  //console.log('getUserOrInit', pryvUsername, pryvToken);
  userDb.collection(config.get('mongo:userDb'), function (error, collection) {
    //console.log('getUserOrInit.collection', error);
    if (error) {
      return callback(error, null);
    }
    collection.findOne({username: pryvUsername}, function (error, record) {
      //console.log('getUserOrInit.findOne', error, record);
      if(!error && !record) {
        collection.insert({
          username: pryvUsername,
          pryv: {
            username: pryvUsername,
            token: pryvToken
          },
          service: {
            accounts: {}
          }
        }, function (error, records) {
          return callback(error, records);
        });
      } else {
        return callback(error, record);
      }
    });
  });
};

UserProvider.prototype.getByUsername = function (username, callback) {
  userDb.collection(config.get('mongo:userDb'), function(err, collection) {
    collection.findOne({username: username}, callback);
  });
};

UserProvider.prototype.getByPryvToken = function (pryvToken, callback) {
  userDb.collection(config.get('mongo:userDb'), function(err, collection) {
    collection.findOne({pryvToken: pryvToken}, callback);
  });
};

UserProvider.prototype.getServices = function (username, callback) {
  userDb.collection(config.get('mongo:userDb'), function(err, collection) {
    collection.findOne({username: username}, function (error, record) {
      if (error) {
        callback(error, null);
      } else {
        callback(null, record.service);
      }
    });
  });
};

UserProvider.prototype.updateOrAddAccount = function (username, data, callback) {
  //console.log('getUserOrInit', pryvUsername, pryvToken);
  userDb.collection(config.get('mongo:userDb'), function (error, collection) {
    //console.log('getUserOrInit.collection', error);
    if (error) {
      return callback(error, null);
    }

    collection.findOne({username: username}, function (error, record) {
      var updatedField = record.service;
      updatedField.accounts[data.aid] = data;
      collection.update({username: username}, {$set:{service:updatedField} }, function () {});
    });
  });
};


module.exports = UserProvider;