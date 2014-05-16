var https = require('https');
var urlParse = require('url').parse;
var express = require('express');
var bodyParser = require('body-parser');

var blitline = require('./blitline');

var MAKES_URL_RE = /^https:\/\/[A-Za-z0-9_\-]+\.makes\.org\//;
var ENDS_WITH_UNDERSCORE_RE = /_$/;
var PORT = process.env.PORT || 3000;
var BLITLINE_APPLICATION_ID = process.env.BLITLINE_APPLICATION_ID;
var S3_BUCKET = process.env.S3_BUCKET;

if (!BLITLINE_APPLICATION_ID)
  throw new Error('BLITLINE_APPLICATION_ID must be defined');
if (!S3_BUCKET)
  throw new Error('S3_BUCKET must be defined');

var app = express();

app.use(bodyParser.json());

app.post('/', function(req, res) {
  var url = req.body.url;

  if (!url)
    return res.send(400, {error: 'URL must be provided.'});
  if (!MAKES_URL_RE.test(url))
    return res.send(400, {error: 'URL must be hosted by Webmaker.'});

  if (!ENDS_WITH_UNDERSCORE_RE.test(url))
    url += '_';

  var parsed = urlParse(url);

  // TODO: Consider using a HEAD request instead.
  https.get(url, function(makeRes) {
    if (makeRes.statusCode != 200)
      return res.send(400, {error: 'URL does not exist.'});
    if (!/^text\/html/.test(makeRes.headers['content-type']))
      return res.send(400, {error: 'URL is not an HTML page.'});
    makeRes.socket.destroy();
    blitline.screenshot({
      appId: BLITLINE_APPLICATION_ID,
      url: url,
      s3: {
        bucket: S3_BUCKET,
        key: parsed.hostname + parsed.pathname.slice(0, -1) + '.jpg'
      }
    }, function(err, info) {
      if (err) return next(err);
      return res.send({screenshot: info});
    });
  }).on('error', function(err) {
    return res.send(400, {error: 'URL cannot be reached.'});
  });
});

app.use(express.static(__dirname + '/static'));

app.listen(PORT, function() {
  console.log('listening on port ' + PORT);
});
