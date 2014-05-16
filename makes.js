var https = require('https');
var urlParse = require('url').parse;

var MAKES_URL_RE = /^https:\/\/[A-Za-z0-9_\-]+\.makes\.org\//;
var ENDS_WITH_UNDERSCORE_RE = /_$/;

function validateAndNormalizeUrl(url) {
  if (!MAKES_URL_RE.test(url)) return null;

  if (!ENDS_WITH_UNDERSCORE_RE.test(url))
    url += '_';

  return url;
}

function keyForUrl(url) {
  var parsed = urlParse(url);
  var key = parsed.hostname + parsed.pathname.slice(0, -1) + '.jpg';

  return key;
}

// TODO: Consider using a HEAD request instead.
function verifyIsHtml(url, cb) {
  https.get(url, function(res) {
    if (res.statusCode != 200)
      return cb(null, false);
    if (!/^text\/html/.test(res.headers['content-type']))
      return cb(null, false);
    res.socket.destroy();
    cb(null, true);
  }).on('error', cb);
}

exports.validateAndNormalizeUrl = validateAndNormalizeUrl;
exports.keyForUrl = keyForUrl;
exports.verifyIsHtml = verifyIsHtml;
