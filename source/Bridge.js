var server = require('./server.js');
var app = require('./app.js');
var config = require('./utils/config.js');
var CronJob = require('cron').CronJob;
var MapUtils = require('./utils/MapUtils.js');

var instance = null;

var Bridge = function (appId) {
  if (instance) {
    return instance;
  }

  if (this instanceof Bridge) {
    instance = this;
  } else {
    return new Bridge(appId);
  }

  if (appId && appId.length !== 0) {
    config.set('service:name', appId);
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
  server();
  setTimeout(function () {
    this.job.start();
  }.bind(this), 10000);
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
 * Function to manage and verify map
 */
Bridge.prototype.setPryvMap = function (map) {
  var validation = MapUtils.validateMap(map);
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
Bridge.prototype.setMapper = function (schedule, mapper) {
  this.schedule = schedule;
  this.mapper = mapper;
  this.job = new CronJob({
    cronTime: this.schedule,
    onTick: this.mapper.executeCron,
    start: false,
    context: this
  });
};

module.exports = Bridge;