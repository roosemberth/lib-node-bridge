# Pryv Bridge SDK

This library is a collection of functions to facilitate the development of bridges to Pryv

## The mapping call flow
Each time the cron calls the following functions in this exact order. The only mandatory
function to implement is map.

    preMapGeneral(generalContext, callback)
    preMapPryv(generalContext, pryvContext, callback)
    preStreamCreation(generalContext, pryvContext, accountContainer, callback)
    preMapService(generalContext, pryvContext, accountContainer, callback)
    map(generalContext, pryvContext, accountContainer, callback)
    postMapService(generalContext, pryvContext, accountContainer, callback)
    postMapPryv(generalContext, pryvContext, callback)
    postMapGeneral(generalContext, callback)

### Extend the mapper
You have to extend SdkBridge.Mapper implement some functions and pass set it in the bridge

    var SdkBridge = require('pryv-sdk-bridge');
    var SdkMapper = new SdkBridge.Mapper;
    var Mapper = function (database) {
      SdkMapper.call(this, database);
    };
    Mapper.prototype = Object.create(SdkMapper.prototype);
    Mapper.prototype.preMapGeneral = function (callback) {
        // Do something
    };
    Mapper.prototype.map = require('./myMapper.js');
    module.exports = Mapper;

## The config file

    {
      "database" : {
        "host": "localhost",
        "port": 27017,
        "name": "my-bridge",
        "userCollection": "users",
        "serviceSessionCollection": "session-service",
        "pryvSessionCollection": "session-pryv"
      },
      "service": {
        "name": "my-bridge"
      },
      "cookie": {
        "secret": "my-cookie-secret"
      },
      "pryvdomain": "example.com",
      "pryvStaging": true,
      "http": {
        "port": 3000,
        "certsPathAndKey": "/home/user/certs/example.com"
      },
      "refresh": "my-manual-refresh-password"
    }

## Running the bridge
Runs like a typical express app:

    node source/server.js --config config.json

## License

[Revised BSD license](https://github.com/pryv/documents/blob/master/license-bsd-revised.md)