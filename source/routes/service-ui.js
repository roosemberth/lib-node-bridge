var config = require('../utils/config.js');
var path = require('path');
var express = require('express');
var router = express.Router();

router.get('/js/client/module.js', function (req, res) {
  res.sendfile(path.join(config.get('ui:pathprefix'), config.get('ui:js:controller')));
});

module.exports = router;