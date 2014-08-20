module.exports = {
  Bridge: require('./Bridge.js'),
  Database: require('./provider/UserProvider.js'),
  Mapper: require('./gateway/Mapper.js'),
  config: require('./utils/config.js'),
  mapUtils: require('./utils/mapUtils.js')
};