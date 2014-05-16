var urlParse = require('url').parse;

var WELL_FORMED_RE = /^[A-Za-z0-9_\-]+\.makes\.org\/.+$/;

function fromMakeUrl(url) {
  var parsed = urlParse(url);
  var key = parsed.hostname + parsed.pathname.slice(0, -1);

  return key;
}

function toMakeUrl(key) {
  return 'https://' + key + '_';
}

function isWellFormed(key) {
  return WELL_FORMED_RE.test(key);
}

exports.fromMakeUrl = fromMakeUrl;
exports.toMakeUrl = toMakeUrl;
exports.isWellFormed = isWellFormed;
