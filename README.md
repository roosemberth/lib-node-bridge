# Pryv Bridge SDK

This library is a collection of functions to facilitate the development of bridges to Pryv.

## The mapping call flow
Each time the cron ticks the following functions in this exact order. The only mandatory
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
   
    var MyMapper = module.exports = SdkBridge.Mapper.implement(
     function (database) {
       SdkBridge.Mapper.call(this, database);
     }, {
       map: require('./myServiceMapper.js')
     }
    );


### Define the map
The map defines the stream/event structure used at Pryv to store the data from your integrated service.

A streams is defined by:

    {
      name:                    String   The name of the stream to create/use
      id:                      String   Its associated stream Id
      uid:                     String   A unique identifier for the node
      active:                  Boolean  If node and subtree is active
      baseStreamIdOnServiceId: Boolean  true: the parent stream will be named based on the service account id
      error:    Error {                 Error message: such as stream removed,...
        id: String,
        message: String}
      updateCurrent
      updateLast
      view:     { display: Boolean }    If it should be displayed on the configuration interface
      service:  { description: String } For what is this stream used?
      streams: []                       The children streams
      events: []                        The children events
    }

A event is defined by:

    {
      uid:      String          A unique identifier for the node 
      name:     String          Some given name
      streamId: String          The id of the stream containing these events
      active:   Boolean         If this event is activated/receives data
      type:     String,         The event type
      availableTypes: [type]    An array containing the possible values for type, the mapper should do the transformations
      service:  {               The description of this event and other private stuff
        description: String } 
    }

### Setup the Authentication
The must be at least one route to initiate the login procedure

    router.get('/auth/service', pryvBridge.passport.authenticate('service') ,function() {});


### server.js

    /*
     * AUTHENTICATION CONFIGURATION: Passport
     */
    
    // We add the authentication strategy
    pryvBridge.addServiceAuthStrategy(new ServiceStrategy({
        clientID: config.get('service:consumerKey'),
        clientSecret: config.get('service:consumerSecret'),
        callbackURL: config.get('service:callbackBaseURL') + '/auth/service/callback',
        scope: 'position'
      },
      function(accessToken, refreshToken, profile, done) {
        process.nextTick(function () {
    
          console.log(profile);
    
          profile.accessToken = accessToken;
          profile.refreshToken = refreshToken;
    
          pryvDb.setServiceUser(profile.id, profile, function (error, record) {
            if (error) {
              return done(error, null);
            }
            return done(null, profile);
          });
        });
      }));
    
    // Passport serialization function
    pryvBridge.passport.serializeUser(function(user, done) {
      pryvDb.setServiceUser(user.id, user, function (error, record) {
        return done(error, record.id);
      });
    });
    
    // Passport deserialization function
    pryvBridge.passport.deserializeUser(function(uid, done) {
      pryvDb.getServiceUser(uid, function (error, record) {
        return done(error, record);
      });
    });
    
    // Now we add the authentication routes for passport
    pryvBridge.addServiceAuthRoutes(require('./routes/auth-routes.js'));
    
    /*
     * CONFIGURE SCHEDULING
     */
    var schedule = require('./gateway/scheduler.js');
    var mapper = new (require('./gateway/Mapper.js'))(pryvDb);
    var map = require('./gateway/map.js');
    pryvBridge.setMapper(schedule, mapper, map);
    
    /*
     * START
     */
    pryvBridge.start();

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
    

## Summary of the functions exposed by the SDK

  * Bridge:       The main bridge functions
  * Database:     Database access functions
  * Mapper:       The Mapper that has to be extended
  * config:       The exposition of nconf
  * mapUtils:     Utils functions such as DFS,...


## Running the bridge
Runs like a typical express app:

    node source/server.js --config config.json

## License

[Revised BSD license](https://github.com/pryv/documents/blob/master/license-bsd-revised.md)