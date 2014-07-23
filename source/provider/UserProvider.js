var mongo = require('mongodb');
var config = require('../utils/config.js');

var Server = mongo.Server;
var Db = mongo.Db;

var server = new Server(config.get('mongo:host'), config.get('mongo:port'), {
  auto_reconnect: true,
  safe: true
});
var userDb = new Db(config.get('mongo:database'), server);
var dbClientInstance = null;

/**
 * Database Singleton, initializes DB stuff on first call.
 * @returns {*} the instance
 * @constructor
 */
var UserProvider = function () {
  if (dbClientInstance) {
    return dbClientInstance;
  }
  if (this instanceof UserProvider) {
    dbClientInstance = this;
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
  return dbClientInstance;
};




// -----------------------------------------------
// ------------- FULL USER MANAGEMENT ------------
// -----------------------------------------------

/**
 * Inserts a new user into the database
 * @param pryvUsername
 * @param pryvData
 * @param serviceData
 * @param callback function(error, record)
 */
UserProvider.prototype.insertUser = function(pryvUsername, pryvData, serviceAccounts, callback) {
  userDb.collection(config.get('mongo:userDb'), function(error, collection) {
    if (!pryvUsername) {
      if (typeof(callback) === 'function') {
        callback('No username supplied', null);
      }
      return;
    }
    serviceAccounts = serviceAccounts ? serviceAccounts : [];
    pryvData = pryvData ? pryvData : {
      username: pryvUsername,
      token: ''
    };
    collection.insert({
        username: pryvUsername,
        pryv: pryvData,
        service: {
          accounts: serviceAccounts
        }
      }, {w:1},
      function (error) {
        if (error && typeof(callback) === 'function') {
          return callback(error, null);
        } else if (typeof(callback) === 'function') {
          collection.findOne({username: pryvUsername}, function (error, item) {
            return callback(error, item);
          });
        }
      }
    );
  });
};

/**
 * Removes an user
 * @param pryvUsername
 */
UserProvider.prototype.removeUser = function(pryvUsername, callback) {
  if (!pryvUsername) {
    if (typeof(callback) === 'function') {
      callback('No username supplied', null);
    }
    return;
  }
  userDb.collection(config.get('mongo:userDb'), function(err, collection) {
    collection.remove({username: pryvUsername}, function (error) {
      if (typeof(callback) === 'function') {
        return callback(error, null);
      }
    });
  });
};

/**
 * Retrieve an user from the database by pryvUsername
 * @param pryvUsername
 * @param callback
 */
UserProvider.prototype.getUser = function (pryvUsername, callback) {
  if (!pryvUsername) {
    if (typeof(callback) === 'function') {
      callback('No username supplied', null);
    }
    return;
  }
  userDb.collection(config.get('mongo:userDb'), function(err, collection) {
    collection.findOne({username: pryvUsername}, function (error, user) {
      if (typeof(callback) === 'function') {
        return callback(error, user);
      }
    });
  });
};


// -----------------------------------------------
// ----- FULL USER SERVICE MANAGEMENT ----
// -----------------------------------------------

UserProvider.prototype.getService = function(pryvUsername, callback) {
  if (!pryvUsername) {
    if (typeof(callback) === 'function') {
      callback('No username supplied', null);
    }
    return;
  }
  userDb.collection(config.get('mongo:userDb'), function(err, collection) {
    collection.findOne({username: pryvUsername}, function (error, record) {
      if (error) {
        return callback(error, null);
      } else if (record) {
        return callback(null, record.service);
      } else {
        return callback('Internal Error', null);
      }
    });
  });
};

UserProvider.prototype.setService = function(pryvUsername, service, callback) {
  var that = this;
  if (!pryvUsername) {
    if (typeof(callback) === 'function') {
      callback('No username supplied', null);
    }
    return;
  }
   if (!service) {
    service = {accounts: []};
  }
  userDb.collection(config.get('mongo:userDb'), function(err, collection) {
    collection.update({username: pryvUsername}, {$set:{service: service}}, function (error, item) {
      if (typeof(callback) === 'function') {
        if (error) {
          callback(error, null);
        } else {
          that.getService(pryvUsername, callback);
        }
      }
    });
  });
};

// -----------------------------------------------
// ----- FULL USER SERVICE-ACCOUNT MANAGEMENT ----
// -----------------------------------------------
/*
 Each service account must have an unique id per pryvUser: aid
 */

/**
 *
 * @param pryvUsername
 * @param callback
 */
UserProvider.prototype.getServiceAccounts = function(pryvUsername, callback) {
  if (!pryvUsername) {
    if (typeof(callback) === 'function') {
      callback('No username supplied', null);
    }
    return;
  }
  userDb.collection(config.get('mongo:userDb'), function(err, collection) {
    collection.findOne({username: pryvUsername}, function (error, record) {
      if (error) {
        return callback(error, null);
      } else if (record && record.service) {
        return callback(null, record.service.accounts);
      }
    });
  });
};

UserProvider.prototype.getServiceAccount = function(pryvUsername, accountId, callback) {

};

UserProvider.prototype.addServiceAccounts = function(pryvUsername, account, callback) {

};

UserProvider.prototype.updateServiceAccounts = function(pryvUsername, account, callback) {

};

UserProvider.prototype.removeServiceAccounts = function(pryvUsername, accountId, callback) {

};

/**
 * Updates a user record with a service account.
 * @param pryvUsername the pryv user
 * @param serviceAccount the service account, must contain a field aid
 * @param callback

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
 */


// -----------------------------------------------
// --------- PASSPORT USER SERIALIZATION ---------
// -----------------------------------------------

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





// -----------------------------------------------
// -------------- UTILITY FUNCTIONS --------------
// -----------------------------------------------

/**
 * Iterates over all documents and execute fn for each tuple
 * (pryvAccount, serviceAccount)
 * @param fn the execute function (pryvAccount, serviceAcount)
 */
UserProvider.prototype.forEachUser = function (fn) {
  userDb.collection(config.get('mongo:userDb'), function (error, collection) {
    var cursor = collection.find();
    cursor.each(function(err, item) {
      if(item !== null) {
        var pryv = item.pryv;
        var service = item.service;
        for (var i = 0; i < service.accounts.length; ++i) {
          fn(pryv, service.accounts[i]);
        }
      }
    });
  });
};


module.exports = UserProvider;