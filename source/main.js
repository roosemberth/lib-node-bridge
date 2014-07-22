/**
 * Created by marzell on 7/10/14.
 */

var server = require('./server.js');
var app = require('./app.js');
var config = require('./utils/config.js');
var CronJob = require('cron').CronJob;

var instance = null;

var PryvBridge = function (name) {
  if (instance) {
    return instance;
  }

  if (this instanceof PryvBridge) {
    instance = this;
  } else {
    return new PryvBridge(name);
  }

  this.passport = require('passport');

  this.config = config;

  config.set('service:name', name);

  this.db = require('./provider/UserProvider.js')();
};

PryvBridge.prototype.start = function () {
  server();
  //this.job.start();
};


// Authentication for Pryv
PryvBridge.prototype.authPryv = function () {
};

// Authentication for Service
PryvBridge.prototype.addService = function () {
};

PryvBridge.prototype.addServiceRoutes = function (path, callback) {
};



// use as var e = require('myEndpoint.js'); pb.addServiceEndpoints(e);
PryvBridge.prototype.addServiceEndpoints = function (endpoints) {
  app.use('/', endpoints);
};

// User management
PryvBridge.prototype.getUser = function (token) {
};

PryvBridge.prototype.addServiceAuthStrategy = function (passportStrategy) {
  this.passport.use(passportStrategy);
  app.use(this.passport.initialize());
  app.use(this.passport.session());
};

PryvBridge.prototype.addServiceAuthRoutes = function (authRoutes) {
  app.use('/', authRoutes);
};


/**
 * Mapper function setting with its scheduling
 * @param schedule  A cron schedule
 * @param mapper    A mapping function (pryvAccount, serviceAccount)
 */
PryvBridge.prototype.setMapper = function (schedule, mapper) {
  var doStuff = function () {
    this.db.forEachUser(mapper);
  };
  this.job = new CronJob({
    cronTime: schedule,
    onTick: doStuff,
    start: false,
    context: this
  });
};


module.exports = PryvBridge;