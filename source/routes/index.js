
var config = require('../utils/config.js');
var path = require('path');

/**
 * Defines default routes
 * @module routes/index
 */

var express = require('express');
var router = express.Router();
var index = path.join(__dirname, '../public/index.html');

router.get('/signin-pryv', function(req, res) {
  console.log('session', req.session);
  res.sendfile(index);
});

router.get('/signin-service', function(req, res) {
  console.log('session', req.session);
  res.sendfile(index);
});

router.get('/views/signin-service.html', function(req, res) {
  console.log('views/signin-service.html:session', req.session, config.get('ui:views:signin'));
  console.log(config.get('ui:views:signin'));
  res.sendfile(config.get('ui:views:signin'));
});

router.get('/configure', function(req, res) {
  console.log('session', req.session);
  res.sendfile(index);
});

router.get('/views/configure.html', function(req, res) {
  console.log('/views/configure.html:session', req.session, config.get('ui:views:signin'));
  console.log(config.get('ui:views:configure'));
  res.sendfile(config.get('ui:views:configure'));
});

router.get('/overview', function(req, res) {
  console.log('session', req.session);
  res.sendfile(index);
});

module.exports = router;