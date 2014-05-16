var https = require('https');

var MAKES_URL_RE = /^https:\/\/[A-Za-z0-9_\-]+\.makes\.org\//;
var ENDS_WITH_UNDERSCORE_RE = /_$/;

function validateAndNormalizeUrl(url) {
  if (!MAKES_URL_RE.test(url)) return null;

  if (!ENDS_WITH_UNDERSCORE_RE.test(url))
    url += '_';

  return url;
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
exports.verifyIsHtml = verifyIsHtml;
