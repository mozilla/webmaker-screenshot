var request = require('request');
var express = require('express');
var browserify = require('browserify');
var bodyParser = require('body-parser');

var RedisCache = require('./redis-cache');
var ScreenshotConfig = require('./screenshot-config');
var keys = require('./keys');
var makes = require('./makes');
var blitline = require('./blitline');

var DEBUG = 'DEBUG' in process.env;
var DEFAULT_WAIT = 0;
var EXTENDED_WAIT = 10000;
var PORT = process.env.PORT || 3000;
var BLITLINE_APPLICATION_ID = process.env.BLITLINE_APPLICATION_ID;
var S3_BUCKET = process.env.S3_BUCKET;
var S3_WEBSITE = process.env.S3_WEBSITE ||
                 ('https://s3.amazonaws.com/' + S3_BUCKET + '/');
var VIEWPORT_WIDTH = 800;
var VIEWPORT_HEIGHT = 600;
var THUMBNAIL_WIDTH = 320;
var THUMBNAIL_HEIGHT = Math.floor(VIEWPORT_HEIGHT * THUMBNAIL_WIDTH /
                                  VIEWPORT_WIDTH);

if (!BLITLINE_APPLICATION_ID)
  throw new Error('BLITLINE_APPLICATION_ID must be defined');
if (!S3_BUCKET)
  throw new Error('S3_BUCKET must be defined');

var bundlejs;
var screenshotConfig = new ScreenshotConfig();
var redisCache = new RedisCache(process.env.REDIS_URL ||
                                process.env.REDISTOGO_URL);
var app = express();

function cacheScreenshot(options, cb) {
  var wait = options.wait;
  var mt = options.makeThumbnail;
  var allThumbnails = mt.thumbnail.viewport.thumbnails;

  makes.verifyIsHtml(mt.url, function(err, isHtml) {
    if (err) return cb(err);
    if (!isHtml) return cb(null, {
      status: 404,
      reason: 'URL is not HTML'
    });

    blitline.screenshot({
      appId: BLITLINE_APPLICATION_ID,
      s3bucket: S3_BUCKET,
      url: mt.url,
      wait: wait,
      viewport: {
        width: mt.thumbnail.viewport.width,
        height: mt.thumbnail.viewport.height
      },
      thumbnails: allThumbnails.map(function(thumbnail) {
        return {
          width: thumbnail.width,
          height: thumbnail.height,
          s3key: thumbnail.forMake(mt.url).key
        };
      })
    }, function(err) {
      if (err) return cb(err);
      return cb(null, {status: 302, url: S3_WEBSITE + mt.key});
    });
  });
}

function lazyGetScreenshot(mt, req, res, next) {
  redisCache.get({
    key: mt.key,
    lockKey: mt.lockKey,
    cache: function(_, cb) {
      var s3url = S3_WEBSITE + mt.key;

      request.head(s3url, function(err, s3res) {
        if (err) return cb(err);
        if (s3res.statusCode == 200)
          return cb(null, {status: 302, url: s3url});

        cacheScreenshot({
          wait: DEFAULT_WAIT,
          makeThumbnail: mt
        }, cb);
      });
    },
    done: function(err, info) {
      if (err) return next(err);
      if (info.status == 404) return next();
      if (info.status == 302)
        return res.redirect(info.url);
      return next(new Error("invalid status: " + info.status));
    }
  });
}

function regenerateScreenshot(mt, req, res, next) {
  var wait = req.body.wait ? EXTENDED_WAIT : DEFAULT_WAIT;

  redisCache.lockAndSet({
    key: mt.key,
    lockKey: mt.lockKey,
    cache: function(_, cb) {
      cacheScreenshot({
        wait: wait,
        makeThumbnail: mt
      }, cb);
    },
    done: function(err, info) {
      if (err) return next(err);
      if (info.status != 302)
        return res.send(400, {error: info.reason});
      return res.send({screenshot: info.url});
    }
  });
}

redisCache.client.on('error', function(err) {
  // Hopefully we've just temporarily lost connection to the
  // server.
  console.log(err);
});

app.use(bodyParser.json());

app.get('/js/bundle.js', function(req, res, next) {
  if (!bundlejs || DEBUG) {
    var b = browserify();
    b.ignore('request');
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
  var mt = screenshotConfig.makeThumbnailFromPath(req.url);

  if (!mt) return next();

  if (req.method == 'GET') {
    return lazyGetScreenshot(mt, req, res, next);
  } else if (req.method == 'POST') {
    return regenerateScreenshot(mt, req, res, next);
  }

  next();
});

app.use(express.static(__dirname + '/static'));

app.listen(PORT, function() {
  console.log('listening on port ' + PORT);
});
