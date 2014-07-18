var config = require('../utils/config.js');
var path = require('path');
var express = require('express');
var router = express.Router();

//var controllerPath = path.join(__dirname, config.get('ui:js:controller'));
var controllerPath = config.get('ui:js:controller');

console.log('controller path', controllerPath);

router.get('/js/client/module.js', function(req, res) {
  res.sendfile(controllerPath);
});

module.exports = router;