var makes = require('./makes');

// TODO: Get rid of this, just have clients use
// makes.fromUrl() directly.
function fromMakeUrl(url) {
  return makes.fromUrl(url).hostnameAndPath;
}

// TODO: Get rid of this, just have clients use
// makes.fromHostnameAndPath() directly.
function toMakeUrl(key) {
  return makes.fromHostnameAndPath(key).contentUrl;
}

// TODO: Get rid of this, just have clients use
// makes.fromHostnameAndPath() directly.
function isWellFormed(key) {
  return !!makes.fromHostnameAndPath(key);
}

exports.fromMakeUrl = fromMakeUrl;
exports.toMakeUrl = toMakeUrl;
exports.isWellFormed = isWellFormed;
