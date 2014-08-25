var server = require('./server.js');
var app = require('./app.js');
var config = require('./utils/config.js');
var CronJob = require('cron').CronJob;
var mapUtils = require('./utils/mapUtils.js');
var apiRoute = require('./routes/api.js');

var instance = null;

var Bridge = module.exports = function (appName, appId) {
  if (instance) {
    return instance;
  }

  if (this instanceof Bridge) {
    instance = this;
  } else {
    return new Bridge(appName, appId);
  }

  if (appId && appId.length !== 0 && appName && appName.length !== 0) {
    config.set('service:name', appName);
    config.set('service:appId', appId);
  }

  this.passport = require('passport');
  this.config = config;
  this.utils = require('./utils/utils.js');
  this.map = null;
  this.mapper = null;
  this.schedule = null;
  this.job = null;
};

Bridge.prototype.start = function () {
  app.use('/', apiRoute(this.mapper));
  server();
  setTimeout(function () {
    this.job.start();
  }.bind(this), 1000);
};


Bridge.prototype.addServiceEndpoints = function (endpoints) {
  app.use('/', endpoints);
};


/**
 * Auth routes and strategy
 * @param passportStrategy
 */
Bridge.prototype.addServiceAuthStrategy = function (passportStrategy) {
  this.passport.use(passportStrategy);
  app.use(this.passport.initialize());
  app.use(this.passport.session());
};

Bridge.prototype.addServiceAuthRoutes = function (authRoutes) {
  app.use('/', authRoutes);
};



/**
 * Mapper function setting with its scheduling
 * @param schedule  A cron schedule
 * @param mapper    A mapping function (pryvAccount, serviceAccount)
 * @param map       Datastruct
 */
Bridge.prototype.setMapper = function (schedule, mapper, map) {
  var validation = mapUtils.validateMap(map);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  this.map = map;
  this.schedule = schedule;
  this.mapper = mapper;
  this.job = new CronJob({
    cronTime: this.schedule,
    onTick: this.mapper.executeCron,
    start: false,
    context: this.mapper
  });
  return true;
};
