var urlParse = require('url').parse;

var WELL_FORMED_RE = /^[A-Za-z0-9_\-]+\.makes\.org\/.+\.jpg$/;

function fromMakeUrl(url) {
  var parsed = urlParse(url);
  var key = parsed.hostname + parsed.pathname.slice(0, -1) + '.jpg';

  return key;
}

function isWellFormed(key) {
  return WELL_FORMED_RE.test(key);
}

exports.fromMakeUrl = fromMakeUrl;
exports.isWellFormed = isWellFormed;