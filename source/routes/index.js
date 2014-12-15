var config = require('../utils/config.js');
var path = require('path');

/**
 * Defines default routes
 * @module routes/index
 */

var express = require('express');
var router = express.Router();
var index = path.join(__dirname, '../public/index.html');

router.get('/signin-pryv', function (req, res) {
  res.sendfile(index);
});

router.get('/signin-service', function (req, res) {
  res.send(301, '/auth/service');
});

router.get('/views/signin-service.html', function (req, res) {
  res.send(301, '/auth/service');
});

router.get('/configure', function (req, res) {
  res.sendfile(index);
});

router.get('/configure/:aid', function (req, res) {
  res.sendfile(index);
});

router.get('/views/configure.html', function (req, res) {
  res.sendfile(path.join(config.get('ui:pathprefix'), config.get('ui:views:configure')));
});

router.get('/overview', function (req, res) {
  res.sendfile(index);
});

module.exports = router;