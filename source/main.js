/**
 * Created by marzell on 7/10/14.
 */

var server = require('./server.js');
var app = require('./app.js');
var config = require('./utils/config.js');
//var passport = require('passport');

var PryvBridge = function (name) {
  this.config = config;

  config.set('service:name', name);

  this.db = require('./provider/UserProvider.js');
};

PryvBridge.prototype.start = function () {
  server();
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
  //passport.use(passportStrategy);
  //app.use(passport.initialize());
  //app.use(passport.session());
};

PryvBridge.prototype.addServiceAuthRoutes = function (authRoutes) {
  app.use('/', authRoutes);
};



module.exports = PryvBridge;