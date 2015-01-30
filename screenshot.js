var urlParse = require('url').parse;
var request = require('request');

var makes = require('./makes');
var blitline = require('./blitline');

var DEFAULT_WAIT = 3000;
var EXTENDED_WAIT = 10000;
var BLITLINE_APPLICATION_ID = process.env.BLITLINE_APPLICATION_ID;
var S3_BUCKET = process.env.S3_BUCKET;
var S3_WEBSITE = process.env.S3_WEBSITE ||
                 ('https://s3.amazonaws.com/' + S3_BUCKET + '/');

if (!BLITLINE_APPLICATION_ID)
  throw new Error('BLITLINE_APPLICATION_ID must be defined');
if (!S3_BUCKET)
  throw new Error('S3_BUCKET must be defined');

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

exports.lazyGet = function(redisCache, mt, req, res, next) {
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
      var maybeCacheBust = urlParse(req.originalUrl).search || '';

      if (err) return next(err);
      if (info.status == 404) return next();
      if (info.status == 302)
        return res.redirect(info.url + maybeCacheBust);
      return next(new Error("invalid status: " + info.status));
    }
  });
};

exports.regenerate = function(redisCache, mt, req, res, next) {
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
};

exports.configureForTesting = function(options) {
  makes = options.makes;
  blitline = options.blitline;
};
