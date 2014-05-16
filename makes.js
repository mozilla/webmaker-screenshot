var request = require('request');

var MAKES_URL_RE = /^https:\/\/[A-Za-z0-9_\-]+\.makes\.org\//;
var ENDS_WITH_UNDERSCORE_RE = /_$/;

function validateAndNormalizeUrl(url) {
  if (!MAKES_URL_RE.test(url)) return null;

  if (!ENDS_WITH_UNDERSCORE_RE.test(url))
    url += '_';

  return url;
}

function verifyIsHtml(url, cb) {
  request.head(url, function(err, res) {
    if (err) return cb(err);
    if (res.statusCode != 200)
      return cb(null, false);
    if (!/^text\/html/.test(res.headers['content-type']))
      return cb(null, false);
    cb(null, true);
  });
}

exports.validateAndNormalizeUrl = validateAndNormalizeUrl;
exports.verifyIsHtml = verifyIsHtml;
