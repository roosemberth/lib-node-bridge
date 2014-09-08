var mongo = require('mongodb');
var config = require('../utils/config.js');

var Server = mongo.Server;
var Db = mongo.Db;

var server = new Server(config.get('database:host'), config.get('database:port'), {
  auto_reconnect: true,
  safe: true
});
var userDb = new Db(config.get('database:name'), server);
var dbClientInstance = null;

/**
 * Database Singleton, initializes DB stuff on first call.
 * @returns {*} the instance
 * @constructor
 */
var UserProvider = module.exports = function () {
  if (dbClientInstance) {
    return dbClientInstance;
  }
  if (this instanceof UserProvider) {
    dbClientInstance = this;
    this.startTime = (new Date()).valueOf();
    userDb.open(function (err, db) {
      if (!err) {
        console.log('Connected to \"' + config.get('database:name') + '\" database');
        db.collection(config.get('database:userCollection'), {strict: true}, function () {
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
 * @param serviceSettings
 * @param serviceAccounts
 * @param callback function(error, record)
 */
UserProvider.prototype.insertUser = function (
  pryvUsername, pryvData, serviceSettings, serviceAccounts, callback) {
  userDb.collection(config.get('database:userCollection'), function (error, collection) {
    if (!pryvUsername) {
      if (typeof(callback) === 'function') {
        callback('No username supplied', null);
      }
      return;
    }
    serviceSettings = serviceSettings ? serviceSettings : {};
    serviceAccounts = serviceAccounts ? serviceAccounts : [];
    pryvData = pryvData ? pryvData : {
      username: pryvUsername,
      token: ''
    };
    collection.insert({
        username: pryvUsername,
        pryv: pryvData,
        service: {
          settings: serviceSettings,
          accounts: serviceAccounts
        }
      }, {w: 1},
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
 * @param callback
 */
UserProvider.prototype.removeUser = function (pryvUsername, callback) {
  if (!pryvUsername) {
    if (typeof(callback) === 'function') {
      callback('No username supplied', null);
    }
    return;
  }
  userDb.collection(config.get('database:userCollection'), function (err, collection) {
    collection.remove({username: pryvUsername}, function (error) {
      if (typeof(callback) === 'function') {
        return callback(error, null);
      }
    });
  });
};

/**
 * Removes an user
 * @param pryvUsername
 * @param callback
 */
UserProvider.prototype.updateUserCreds = function (pryvUsername, service, callback) {
  console.log('updateUserCreds', pryvUsername, service);
  if (!pryvUsername) {
    if (typeof(callback) === 'function') {
      callback('No username supplied', null);
    }
    return;
  }
  userDb.collection(config.get('database:userCollection'), function (err, collection) {
    collection.update({username: pryvUsername}, {$set: {pryv: service}}, function (error) {
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
  userDb.collection(config.get('database:userCollection'), function (err, collection) {
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

/**
 * Returns the complete Service entry of an user
 * @param pryvUsername
 * @param callback function(error, service)
 */
UserProvider.prototype.getService = function (pryvUsername, callback) {
  if (!pryvUsername) {
    if (typeof(callback) === 'function') {
      return callback('No username supplied', null);
    }
    return;
  }
  userDb.collection(config.get('database:userCollection'), function (err, collection) {
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

/**
 * Returns the complete Service entry of an user
 * @param pryvUsername
 * @param callback function(error, service)
 */
UserProvider.prototype.getServiceSettings = function (pryvUsername, callback) {
  if (!pryvUsername) {
    if (typeof(callback) === 'function') {
      return callback('No username supplied', null);
    }
    return;
  }
  this.getService(pryvUsername, function (error, item) {
    if (typeof(callback) === 'function') {
      return callback(error, item ? item.settings : null);
    }
  });
};

/**
 * Replaces the old service by the new one.
 * @param pryvUsername
 * @param service the new service object
 * @param callback function(error, service)
 */
UserProvider.prototype.setService = function (pryvUsername, service, callback) {
  var that = this;
  if (!pryvUsername) {
    if (typeof(callback) === 'function') {
      return callback('No username supplied', null);
    }
    return;
  }
  if (!service) {
    service = {accounts: []};
  }
  userDb.collection(config.get('database:userCollection'), function (err, collection) {
    collection.update({username: pryvUsername}, {$set: {service: service}}, function (error) {
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

/**
 * Replaces the old service settings by the new one and return the new service settings
 * @param pryvUsername
 * @param serviceSettings the new service object
 * @param callback function(error, serviceSettings)
 */
UserProvider.prototype.setServiceSettings = function (pryvUsername, serviceSettings, callback) {
  var that = this;
  if (!pryvUsername) {
    if (typeof(callback) === 'function') {
      callback('No username supplied', null);
    }
    return;
  }
  serviceSettings = serviceSettings ? serviceSettings : {};
  that.getService(pryvUsername, function (err, service) {
    service.settings = serviceSettings;
    that.setService(pryvUsername, service, function (error, item) {
      if (typeof(callback) === 'function') {
        callback(error, item ? item.settings : null);
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
UserProvider.prototype.getServiceAccounts = function (pryvUsername, callback) {
  if (typeof(callback) !== 'function') {
    return;
  }
  if (!pryvUsername) {
    return callback('No username supplied', null);
  }
  userDb.collection(config.get('database:userCollection'), function (err, collection) {
    collection.findOne({username: pryvUsername}, function (error, record) {
      if (error) {
        return callback(error, null);
      } else if (record && record.service) {
        return callback(null, record.service.accounts);
      } else {
        return callback(null, []);
      }
    });
  });
};

UserProvider.prototype.getServiceAccount = function (pryvUsername, accountId, callback) {
  if (typeof(callback) !== 'function') {
    return;
  }
  if (!pryvUsername || !accountId) {
    return callback('No pryvUsername or accountId supplied', null);
  }
  this.getServiceAccounts(pryvUsername, function (error, accounts) {
    for( var i = 0; i < accounts.length; ++i) {
      if (accounts[i].aid.toString() === accountId.toString()) {
        return callback(null, accounts[i]);
      }
    }
    return callback('Item not found', null);
  });
};

UserProvider.prototype.addServiceAccount = function (pryvUsername, account, callback) {
  var that = this;
  if (!pryvUsername || !account || !account.aid) {
    if (typeof(callback) === 'function') {
      return callback('No pryvUsername or account supplied', null);
    }
    return;
  }
  that.getService(pryvUsername, function (err, service) {
    if (err) {
      return callback(err, null);
    } else {
      for (var i = 0; i < service.accounts.length; ++i) {
        if (service.accounts[i].aid.toString() === account.aid.toString()) {
          return callback('Service Account already exists', null);
        }
      }
      service.accounts.push(account);
      that.setService(pryvUsername, service, function (err, service) {
        if (err) {
          return callback(err, null);
        } else {
          for (var i = 0; i < service.accounts.length; ++i) {
            if (service.accounts[i].aid.toString() === account.aid.toString()) {
              return callback(null, service.accounts[i]);
            }
          }
          return callback('Internal error', null);
        }
      });
    }
  });
};

UserProvider.prototype.updateServiceAccount = function (pryvUsername, account, callback) {
  var that = this;
  if (typeof(callback) !== 'function') {
    callback = function () {};
  }
  if (!pryvUsername || !account || !account.aid) {
    return callback('No pryvUsername or account supplied', null);
  }
  that.getService(pryvUsername, function (err, service) {
    if (err) {
      return callback(err, null);
    } else {
      var fn = function (err, service) {
        if (err) {
          return callback(err, null);
        } else {
          for (var i = 0; i < service.accounts.length; ++i) {
            if (service.accounts[i].aid.toString() === account.aid.toString()) {
              return callback(null, service.accounts[i]);
            }
          }
          return callback('Internal error', null);
        }
      };
      for (var i = 0; i < service.accounts.length; ++i) {
        if (service.accounts[i].aid.toString() === account.aid.toString()) {
          service.accounts[i] = account;
          return that.setService(pryvUsername, service, fn);
        }
      }
      return callback('Account to update not found', null);
    }
  });
};

UserProvider.prototype.removeServiceAccount = function (pryvUsername, accountId, callback) {
  var that = this;
  if (!pryvUsername || !accountId) {
    if (typeof(callback) === 'function') {
      return callback('No pryvUsername or accountId supplied', null);
    }
    return;
  }

  that.getService(pryvUsername, function (err, service) {
    if (err) {
      return callback(err, null);
    } else {
      var foundId = -1;
      var accounts = [];
      for (var i = 0; i < service.accounts.length; ++i) {
        if (service.accounts[i].aid.toString() !== accountId.toString()) {
          accounts.push(service.accounts[i]);
        } else {
          console.log(service.accounts[i].aid);
          foundId = i;
        }
      }
      if (foundId >= 0 &&
        service.accounts[foundId].aid.toString() === accountId.toString()) {
        service.accounts = accounts;
      } else {
        return callback('Account to remove not found', null);
      }
      return that.setService(pryvUsername, service, function (err) {
        if (err) {
          return callback('Internal error', null);
        } else {
          return callback(null, null);
        }
      });
    }
  });
};



// -----------------------------------------------
// --------- PASSPORT USER SERIALIZATION ---------
// -----------------------------------------------

/**
 * This function gets a service user from the Service User Table.
 * @param serviceUserId the service user id
 * @param callback
 */
UserProvider.prototype.getServiceUser = function (serviceUserId, callback) {
  userDb.collection(config.get('database:serviceSessionCollection'), function (error, collection) {
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
 * @param serviceUserId the service user id
 * @param user the user details and tokens
 * @param callback
 */
UserProvider.prototype.setServiceUser = function (serviceUserId, user, callback) {
  userDb.collection(config.get('database:serviceSessionCollection'), function (error, collection) {
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
UserProvider.prototype.forEachUser = function (fn, finalCb) {
  userDb.collection(config.get('database:userCollection'), function (error, collection) {
    collection.find().toArray(
      function (err, docs) {
        if (err) {
          return finalCb();
        }
        for (var i = 0, l = docs.length; i < l; ++i) {
          var item = docs[i];
          var pryv = item.pryv;
          var service = item.service;
          for (var j = 0; j < service.accounts.length; ++j) {
            fn(pryv, service.accounts[j]);
          }
        }
        return finalCb();
      }
    );
  });
};

/**
 * Iterates over all documents and execute fn for each tuple
 * (pryvAccount, serviceAccount)
 * @param fn the execute function (account)
 */
UserProvider.prototype.forEachAccount = function (fn, finalCb) {
  userDb.collection(config.get('database:userCollection'), function (error, collection) {
    collection.find().toArray(
      function (err, docs) {
        if (err) {
          return finalCb();
        }
        for (var i = 0, l = docs.length; i < l; ++i) {
          fn(docs[i]);
        }
        return finalCb();
      }
    );
  });
};


/* account locking function */

UserProvider.prototype.lockAccount = function (username, serviceId, callback) {
  var that = this;
  this.getServiceAccount(username, serviceId, function (error, account) {
    if (error || !account) {
      return callback(false, account);
    } else {
      var currentDate = (new Date()).valueOf();
      if (account.lock) {
        if (account.lock.status) { // locked
          if (!account.lock.time || (currentDate - account.lock.time) > 3600000 ||
            account.lock.time < (that.startTime - 900000)) {
            account.lock.status = true;
            account.lock.time = currentDate;
          } else {
            return callback(false, account);
          }
        } else {
          if (currentDate - account.lock.time > 900000) {
            account.lock.status = true;
            account.lock.time = currentDate;
          } else {
            return callback(false, account);
          }
        }
      } else {
        account.lock = {
          status: true,
          time: currentDate
          };
      }
      that.updateServiceAccount(username, account, function (error, result) {
        if (!error) {
          return callback(true, result);
        } else {
          return callback(false, result);
        }
      });
    }
  });
};

UserProvider.prototype.unlockAccount = function (username, serviceId, callback) {
  var that = this;
  this.getServiceAccount(username, serviceId, function (error, account) {
    if (error || !account) {
      return callback(false, account);
    } else {
      var currentDate = (new Date()).valueOf();
      account.lock = {
        status: false,
        time: currentDate
      };
      that.updateServiceAccount(username, account, function (error, result) {
        if (!error) {
          return callback(true, result);
        } else {
          return callback(false, result);
        }
      });
    }
  });
};