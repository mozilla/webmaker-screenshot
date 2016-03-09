var request = require('request');
var urlParse = require('url').parse;

var MOFODEV_URL_RE = /^https?:\/\/[A-Za-z0-9_\-]+\.mofodev\.net\//;
var HTTPS_MAKES_URL_RE = /^https:\/\/[A-Za-z0-9_\-]+\.makes\.org\//;
var GOGGLES_URL_RE = /^http:\/\/[A-Za-z0-9_\-]+\.makes\.org\/goggles\//;
var WEBMAKER_DESKTOP_RE = /^https:\/\/(webmaker-desktop-staging\.herokuapp\.com|beta\.webmaker\.org|webmaker\.org)\//;
var ENDS_WITH_UNDERSCORE_RE = /_$/;

function hostnameAndPath(url) {
  var parsed;
  if (WEBMAKER_DESKTOP_RE.test(url)) {
    return 'webmaker-desktop/' + new Buffer(url).toString('base64');
  }
  parsed = urlParse(url);
  return parsed.hostname + parsed.pathname;
}

function fromUrl(url) {
  var contentUrl = null;

  if (HTTPS_MAKES_URL_RE.test(url)) {
    contentUrl = url;

    if (ENDS_WITH_UNDERSCORE_RE.test(url)) {
      url = url.slice(0, -1);
    } else {
      contentUrl += '_';
    }
  } else if (GOGGLES_URL_RE.test(url)) {
    contentUrl = url;
  } else if (MOFODEV_URL_RE.test(url)) {
    contentUrl = url;
  } else if (WEBMAKER_DESKTOP_RE.test(url)) {
    contentUrl = url;
  }

  if (!contentUrl) return null;

  return {
    url: url,
    contentUrl: contentUrl,
    hostnameAndPath: hostnameAndPath(url)
  };
}

function fromHostnameAndPath(str) {
  var base64Match = str.match(/^webmaker-desktop\/(.+)$/);
  if (base64Match) {
    // It doesn't seem like Buffer throws an exception if the input is
    // invalid base64--it just returns an empty string or a unicode '?'--so
    // we don't need to catch anything.
    return fromUrl(new Buffer(base64Match[1], 'base64').toString('utf-8'));
  }
  return fromUrl('http://' + str) || fromUrl('https://' + str);
}

// TODO: Get rid of this, just have clients use
// makes.fromUrl() directly.
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
