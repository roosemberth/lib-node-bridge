/**
 * Module dependencies
 */

var bodyParser = require('body-parser'),
  config = require('./utils/config.js'),
  cookieParser = require('cookie-parser'),
  express = require('express'),
  morgan  = require('morgan'),
  path = require('path'),
  session = require('express-session'),
  uuid = require('node-uuid');
var MongoStore = require('connect-mongo')(session);
var app = module.exports = express();

app.disable('x-powered-by');

/**
 * Configuration
 */
// Session
var sessionConfig = {
  store: new MongoStore({
    url: 'mongodb://' + config.get('database:host') + ':' +
      config.get('database:port') + '/' + config.get('database:name') +
      '/' + config.get('database:pryvSessionCollection')
  }),
  secret: config.get('cookieSecret'),
  genid: function() {
    return uuid.v4(); // use UUIDs for session IDs
  },
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000
  }
};

// Cookie Parser
app.use(cookieParser(config.get('cookieSecret')));

// Body Parser
requestMaxSize = config.get('request-limit');
if (requestMaxSize){
    app.use(bodyParser.urlencoded({limit: requestMaxSize, extended: true }));
    app.use(bodyParser.json({limit: requestMaxSize}));
} else {
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());
}

// Server
app.set('port', config.get('http:port'));
app.use(express.static(path.join(__dirname, 'public')));


// Setup dev and prod differences
if (config.get('environment') === 'staging') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('short'));
  app.set('trust proxy', 1);
  sessionConfig.cookie.secure = true;
}

app.use(session(sessionConfig));


/**
 * Routes
 */
app.use('/', require('./routes/index.js'));
app.use('/', require('./routes/service-ui.js'));
