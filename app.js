var express = require('express');
var morgan = require('morgan');
var browserify = require('browserify');
var bodyParser = require('body-parser');

var RedisCache = require('./redis-cache');
var ScreenshotConfig = require('./screenshot-config');
var screenshot = require('./screenshot');

var DEBUG = 'DEBUG' in process.env;
var PORT = process.env.PORT || 3000;

var bundlejs;
var screenshotConfig = new ScreenshotConfig();
var redisCache = new RedisCache(process.env.REDIS_URL ||
                                process.env.REDISTOGO_URL);
var app = express();

redisCache.client.on('error', function(err) {
  // Hopefully we've just temporarily lost connection to the
  // server.
  console.log(err);
});

if (DEBUG) app.use(morgan('dev'));

app.use(bodyParser.json());

app.get('/healthcheck', function(req, res, next) {
  if (!redisCache.client.connected)
    return res.status(500).send({
      redis: false
    });
  return res.send({
    redis: true
  });
});

app.get('/js/bundle.js', function(req, res, next) {
  if (!bundlejs || DEBUG) {
    var b = browserify();
    b.ignore('request');
    b.require('./screenshot-config');
    b.require('./keys');
    b.require('./makes');
    b.bundle(function(err, buf) {
      if (err) return next(err);
      bundlejs = buf;
      next();
    });
  } else next();
}, function(req, res) {
  res.type('text/javascript').send(bundlejs);
});

app.use(function(req, res, next) {
  var mt = screenshotConfig.makeThumbnailFromPath(req.path);

  if (!mt) return next();

  if (req.method == 'GET') {
    return screenshot.lazyGet(redisCache, mt, req, res, next);
  } else if (req.method == 'POST') {
    return screenshot.regenerate(redisCache, mt, req, res, next);
  }

  next();
});

app.use(express.static(__dirname + '/static'));

app.listen(PORT, function() {
  console.log('listening on port ' + PORT);
});
