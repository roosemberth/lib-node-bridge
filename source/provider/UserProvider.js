var mongo = require('mongodb');

var config = require('../utils/config.js');

var Server = mongo.Server,
  Db = mongo.Db,
  BSON = mongo.BSONPure;

var server = new Server(config.get('mongo:host'), config.get('mongo:port'), {auto_reconnect: true, safe: true});
var userDb = new Db(config.get('mongo:database'), server);

var instance = null;

var UserProvider = function () {
  if (instance) {
    return instance;
  }
  if (this instanceof UserProvider) {
    instance = this;
    userDb.open(function(err, db) {
      if (!err) {
        console.log('Connected to \"' + config.get('mongo:database') + '\" database');
        db.collection(config.get('mongo:userDb'), {strict: true}, function () {
        });
      }
    });
  } else {
    return new UserProvider();
  }
  return instance;
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
        accounts: {}
      }
    }, function (error, records) {
      return callback(error, records);
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




// -----------------------------------------------
// -----------------------------------------------
// -----------------------------------------------


/**
 * Updates a user record with a service account.
 * @param pryvUsername the pryv user
 * @param serviceAccount the service account, must contain a field aid
 * @param callback
 */
UserProvider.prototype.updateOrAddServiceAccount = function (pryvUsername, serviceAccount, callback) {
  if (!serviceAccount.aid) {
    return callback('updateOrAddAccount, missing field aid');
  }

  userDb.collection(config.get('mongo:userDb'), function (error, collection) {
    if (error) {
      return callback(error, null);
    }
    collection.findOne({username: pryvUsername}, function (error, record) {
      var updatedField = record.service;
      updatedField.accounts[serviceAccount.aid] = serviceAccount;
      collection.update({username: pryvUsername}, {$set:{service: updatedField} },
        function (error) {
          return callback(error, serviceAccount);
      });
    });
  });
};

/**
 * Gets all service accounts for an user.
 * @param username
 * @param callback
 */
UserProvider.prototype.getServiceAccounts = function(pryvUsername, callback) {
  userDb.collection(config.get('mongo:userDb'), function(err, collection) {
    collection.findOne({username: pryvUsername}, function (error, record) {
      if (error) {
        return callback(error, null);
      } else {
        return callback(null, record.service);
      }
    });
  });
};


/**
 * This function stores a service user account in a the Service User Table.
 * @param id the service user id
 * @param user the user details and tokens
 * @param callback
 */
UserProvider.prototype.setServiceUser = function (serviceUserId, user, callback) {
  userDb.collection(config.get('mongo:serviceUserDb'), function (error, collection) {
    collection.insert({
      uid: serviceUserId,
      user: user
    }, function (error) {
      return callback(error, user);
    });
  });
};

/**
 * This function gets a service user from the Service User Table.
 * @param serviceUserId the service user id
 * @param callback
 */
UserProvider.prototype.getServiceUser = function (serviceUserId, callback) {
  userDb.collection(config.get('mongo:serviceUserDb'), function (error, collection) {
    collection.findOne({uid: serviceUserId}, function (error, record) {
      if (record) {
        record = record.user;
      }
      return callback(error, record);
    });
  });
};


module.exports = UserProvider;