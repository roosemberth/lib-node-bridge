/**
 * Created by marzell on 7/10/14.
 */

var express = require('express');
var router = express.Router();
var server = require('./server.js');
var app = require('./app.js');
var config = require('./utils/config.js');
var CronJob = require('cron').CronJob;
var validateMap = require('./utils/map-validation.js');
var AccountContainer = require('./gateway/AccountContainer.js');

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

  config.set('service:name', appId);

  this.passport = require('passport');
  this.config = config;
  this.utils = require('./utils/utils.js');
  this.db = require('./provider/UserProvider.js')();
  this.map = null;
  this.mapper = null;
  this.schedule = null;
  this.job = null;

};

PryvBridge.prototype.start = function () {
  server();
  setTimeout(function () {
    this.job.start();
  }.bind(this), 10000);
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
  this.schedule = schedule;
  this.mapper = mapper;
  this.job = new CronJob({
    cronTime: this.schedule,
    onTick: this.mapper.executeCron,
    start: false,
    context: this
  });
};


module.exports = {
  PryvBridge: PryvBridge,
  MapUtils: require('./utils/MapUtils.js'),
  Database: require('./provider/UserProvider.js'),
  Config: require('./utils/config.js'),
  Mapper: require('./gateway/Mapper.js')
};