
var config = require('../utils/config.js');
var path = require('path');

/**
 * Defines default routes
 * @module routes/index
 */

var express = require('express');
var router = express.Router();
var index = path.join(__dirname, '../public/index.html');

var signinFilePath = path.join(config.get('ui:pathprefix'), config.get('ui:views:signin'));
var coufigureFilePath = path.join(config.get('ui:pathprefix'), config.get('ui:views:configure'));


router.get('/signin-pryv', function(req, res) {
  console.log('session', req.session);
  res.sendfile(index);
});

router.get('/signin-service', function(req, res) {
  console.log('session', req.session);
  res.sendfile(index);
});

router.get('/views/signin-service.html', function(req, res) {
  console.log('GET /views/signin-service.html', signinFilePath, req.session);
  res.sendfile(signinFilePath);
});

router.get('/configure', function(req, res) {
  console.log('session', req.session);
  res.sendfile(index);
});

router.get('/views/configure.html', function(req, res) {
  console.log('GET /views/signin-service.html', signinFilePath, req.session);
  res.sendfile(coufigureFilePath);
});

router.get('/overview', function(req, res) {
  console.log('session', req.session);
  res.sendfile(index);
});

module.exports = router;