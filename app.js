var request = require('request');
var express = require('express');
var bodyParser = require('body-parser');
var redis = require('redis');

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

var redisCache = new RedisCache(redis.createClient());
var app = express();

app.use(bodyParser.json());

app.post('/', function(req, res, next) {
  var url = makes.validateAndNormalizeUrl(req.body.url);
  var wait = req.body.wait ? EXTENDED_WAIT : DEFAULT_WAIT;

  if (!url)
    return res.send(400, {error: 'URL must be a Webmaker make.'});

  makes.verifyIsHtml(url, function(err, isHtml) {
    var key = keys.fromMakeUrl(url);

    if (err) return next(err);
    if (!isHtml)
      return res.send(400, {error: 'URL is not an HTML page.'});
    blitline.screenshot({
      appId: BLITLINE_APPLICATION_ID,
      url: url,
      wait: wait,
      s3: {
        bucket: S3_BUCKET,
        key: key
      }
    }, function(err) {
      if (err) return next(err);
      var url = S3_WEBSITE + key;
      redisCache.set(key, {status: 302, url: url}, function(err) {
        if (err) return next(err);
        return res.send({screenshot: url});
      });
    });
  });
});

app.use(function(req, res, next) {
  var key = req.url.slice(1);
  if (!(req.method == 'GET' && keys.isWellFormed(key)))
    return next();

  redisCache.get(key, function cache(cb) {
    var s3url = S3_WEBSITE + key;

    request.head(s3url, function(err, s3res) {
      if (err) return cb(err);
      if (s3res.statusCode == 200)
        return cb(null, {status: 302, url: s3url});

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
          wait: DEFAULT_WAIT,
          s3: {
            bucket: S3_BUCKET,
            key: key
          }
        }, function(err) {
          if (err) return cb(err);
          return cb(null, {status: 302, url: s3url});
        });
      });
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
