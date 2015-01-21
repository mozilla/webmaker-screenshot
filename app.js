var request = require('request');
var express = require('express');
var bodyParser = require('body-parser');

var RedisCache = require('./redis-cache');
var keys = require('./keys');
var makes = require('./makes');
var blitline = require('./blitline');

var DEFAULT_WAIT = 0;
var EXTENDED_WAIT = 10000;
var PORT = process.env.PORT || 3000;
var BLITLINE_APPLICATION_ID = process.env.BLITLINE_APPLICATION_ID;
var S3_BUCKET = process.env.S3_BUCKET;
var S3_WEBSITE = process.env.S3_WEBSITE ||
                 ('https://s3.amazonaws.com/' + S3_BUCKET + '/');

if (!BLITLINE_APPLICATION_ID)
  throw new Error('BLITLINE_APPLICATION_ID must be defined');
if (!S3_BUCKET)
  throw new Error('S3_BUCKET must be defined');

var redisCache = new RedisCache(process.env.REDIS_URL ||
                                process.env.REDISTOGO_URL);
var app = express();

function cacheScreenshot(wait, key, cb) {
  var makeUrl = keys.toMakeUrl(key);

  makes.verifyIsHtml(makeUrl, function(err, isHtml) {
    if (err) return cb(err);
    if (!isHtml) return cb(null, {
      status: 404,
      reason: 'URL is not HTML'
    });

    blitline.screenshot({
      appId: BLITLINE_APPLICATION_ID,
      url: makeUrl,
      wait: wait,
      s3: {
        bucket: S3_BUCKET,
        key: key
      }
    }, function(err) {
      if (err) return cb(err);
      return cb(null, {status: 302, url: S3_WEBSITE + key});
    });
  });
}

redisCache.client.on('error', function(err) {
  // Hopefully we've just temporarily lost connection to the
  // server.
  console.log(err);
});

app.use(bodyParser.json());

app.post('/', function(req, res, next) {
  var url = makes.validateAndNormalizeUrl(req.body.url);
  var wait = req.body.wait ? EXTENDED_WAIT : DEFAULT_WAIT;
  var cacheFunc = cacheScreenshot.bind(null, wait);
  var key;

  if (!url)
    return res.send(400, {error: 'URL must be a Webmaker make.'});

  key = keys.fromMakeUrl(url);

  redisCache.lockAndSet(key, cacheFunc, function done(err, info) {
    if (err) return next(err);
    if (info.status != 302)
      return res.send(400, {error: info.reason});
    return res.send({screenshot: info.url});
  });
});

app.use(function(req, res, next) {
  var key = req.url.slice(1);
  if (!(req.method == 'GET' && keys.isWellFormed(key)))
    return next();

  redisCache.get(key, function cache(key, cb) {
    var s3url = S3_WEBSITE + key;

    request.head(s3url, function(err, s3res) {
      if (err) return cb(err);
      if (s3res.statusCode == 200)
        return cb(null, {status: 302, url: s3url});

      cacheScreenshot(DEFAULT_WAIT, key, cb);
    });
  }, function done(err, info) {
    if (err) return next(err);
    if (info.status == 404) return next();
    if (info.status == 302)
      return res.redirect(info.url);
    return next(new Error("invalid status: " + info.status));
  });
});

app.use(express.static(__dirname + '/static'));

app.listen(PORT, function() {
  console.log('listening on port ' + PORT);
});
