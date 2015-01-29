var request = require('request');
var urlParse = require('url').parse;

var MAKES_URL_RE = /^https:\/\/[A-Za-z0-9_\-]+\.makes\.org\//;
var ENDS_WITH_UNDERSCORE_RE = /_$/;

function hostnameAndPath(url) {
  var parsed = urlParse(url);
  return parsed.hostname + parsed.pathname;
}

function fromUrl(url) {
  if (!MAKES_URL_RE.test(url)) return null;    

  var contentUrl = url;

  if (ENDS_WITH_UNDERSCORE_RE.test(url)) {
    url = url.slice(0, -1);
  } else {
    contentUrl += '_';
  }

  return {
    url: url,
    contentUrl: contentUrl,
    hostnameAndPath: hostnameAndPath(url)
  };
}

function fromHostnameAndPath(str) {
  return fromUrl('https://' + str);
}

function validateAndNormalizeUrl(url) {
  var make = fromUrl(url);

  return make && make.contentUrl;
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

exports.fromUrl = fromUrl;
exports.fromHostnameAndPath = fromHostnameAndPath;
exports.validateAndNormalizeUrl = validateAndNormalizeUrl;
exports.verifyIsHtml = verifyIsHtml;
