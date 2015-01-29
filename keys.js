var makes = require('./makes');

function fromMakeUrl(url) {
  return makes.fromUrl(url).hostnameAndPath;
}

function toMakeUrl(key) {
  return makes.fromHostnameAndPath(key).contentUrl;
}

function isWellFormed(key) {
  return !!makes.fromHostnameAndPath(key);
}

exports.fromMakeUrl = fromMakeUrl;
exports.toMakeUrl = toMakeUrl;
exports.isWellFormed = isWellFormed;
