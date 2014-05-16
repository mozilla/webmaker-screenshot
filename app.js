var request = require('request');
var express = require('express');
var bodyParser = require('body-parser');

var keys = require('./keys');
var makes = require('./makes');
var blitline = require('./blitline');

var PORT = process.env.PORT || 3000;
var BLITLINE_APPLICATION_ID = process.env.BLITLINE_APPLICATION_ID;
var S3_BUCKET = process.env.S3_BUCKET;
var S3_WEBSITE = process.env.S3_WEBSITE ||
                 ('https://s3.amazonaws.com/' + S3_BUCKET + '/');

if (!BLITLINE_APPLICATION_ID)
  throw new Error('BLITLINE_APPLICATION_ID must be defined');
if (!S3_BUCKET)
  throw new Error('S3_BUCKET must be defined');

var app = express();

app.use(bodyParser.json());

app.post('/', function(req, res, next) {
  var url = makes.validateAndNormalizeUrl(req.body.url);

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
      s3: {
        bucket: S3_BUCKET,
        key: key
      }
    }, function(err) {
      if (err) return next(err);
      return res.send({screenshot: S3_WEBSITE + key});
    });
  });
});

app.use(function(req, res, next) {
  var key = req.url.slice(1);
  if (!(req.method == 'GET' && keys.isWellFormed(key)))
    return next();

  var s3url = S3_WEBSITE + key;

  request.head(s3url, function(err, s3res) {
    if (err) return next(err);
    if (s3res.statusCode == 200)
      return res.redirect(s3url);

    var makeUrl = 'https://' + key;

    makes.verifyIsHtml(makeUrl, function(err, isHtml) {
      if (err) return next(err);
      if (!isHtml) return next();

      blitline.screenshot({
        appId: BLITLINE_APPLICATION_ID,
        url: makeUrl,
        s3: {
          bucket: S3_BUCKET,
          key: key
        }
      }, function(err) {
        if (err) return next(err);
        return res.redirect(s3url);
      });
    });
  });
});

app.use(express.static(__dirname + '/static'));

app.listen(PORT, function() {
  console.log('listening on port ' + PORT);
});
