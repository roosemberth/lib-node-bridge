/**
 * Created by marzell on 7/10/14.
 */

var server = require('./server.js');
var app = require('./app.js');
var config = require('./utils/config.js');
var CronJob = require('cron').CronJob;
var validateMap = require('./utils/map-validation.js');
var AccountContainer = require('./gateway/pryv.js');

var instance = null;

var PryvBridge = function (appId) {
  if (instance) {
    return instance;
  }

  if (this instanceof PryvBridge) {
    instance = this;
  } else {
    return new PryvBridge(appId);
  }

  this.passport = require('passport');
  this.config = config;
  this.utils = require('./utils/utils.js');

  this.map = null;



  config.set('service:name', appId);

  this.db = require('./provider/UserProvider.js')();
};

PryvBridge.prototype.start = function () {
  server();
  setTimeout(function () {
    this.job.start();
  }.bind(this), 10000);
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


/**
 * Auth routes and strategy
 * @param passportStrategy
 */
PryvBridge.prototype.addServiceAuthStrategy = function (passportStrategy) {
  this.passport.use(passportStrategy);
  app.use(this.passport.initialize());
  app.use(this.passport.session());
};

PryvBridge.prototype.addServiceAuthRoutes = function (authRoutes) {
  app.use('/', authRoutes);
};


/**
 * Set base paths for includes
 */
PryvBridge.prototype.setBasePath = function (basePath) {
  config.set('ui:pathprefix', basePath);
};

PryvBridge.prototype.setViewSigninPath = function (signinPath) {
  config.set('ui:views:signin', signinPath);
};

PryvBridge.prototype.setViewConfigurePath = function (confPath) {
  config.set('ui:views:configure', confPath);
};

PryvBridge.prototype.setViewJsControlerPath = function (ctrlPath) {
  config.set('ui:js:controller', ctrlPath);
};


/**
 * Function to manage and verify map
 */
PryvBridge.prototype.setPryvMap = function (map) {
  var validation = validateMap(map);
  if (validation.valid) {
    this.map = map;
    return true;
  } else {
    console.log(validation.error);
    throw new Error(validation.error);
  }
};


/**
 * Mapper function setting with its scheduling
 * @param schedule  A cron schedule
 * @param mapper    A mapping function (pryvAccount, serviceAccount)
 */
PryvBridge.prototype.setMapper = function (schedule, mapper) {
  var doStuff = function () {

    var mapFn = function (pryvAcc, serviceAcc) {
      var accCtnr = new AccountContainer(pryvAcc, serviceAcc);
      console.log('MAP', accCtnr.serviceAccount.mapping[0].streams[0]);
      console.log('MAP', accCtnr.serviceAccount.mapping[0].streams[1]);
      mapper(accCtnr);
    };

    this.db.forEachUser(mapFn);
  };
  this.job = new CronJob({
    cronTime: schedule,
    onTick: doStuff,
    start: false,
    context: this
  });
};


module.exports = PryvBridge;