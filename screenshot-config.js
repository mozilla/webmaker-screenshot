var _ = require('underscore');

var makes = require('./makes');
var keys = require('./keys');

var DEFAULT_OPTIONS = require('./screenshot-config.json');

function splitAtFirstSlash(str) {
  var index = str.indexOf('/');
  if (index == -1) return ['', str];
  return [str.slice(0, index), str.slice(index + 1)];
}

function ScreenshotConfig(options) {
  options = options || DEFAULT_OPTIONS;
  if (!options.viewports.length)
    throw new Error("Configs must have at least one viewport");
  this.viewports = options.viewports.map(function(viewport) {
    return new Viewport(this, viewport);
  }, this);
  this.defaultViewport = this.viewports[0];
}

ScreenshotConfig.prototype = {
  makeThumbnailFromPath: function(path) {
    path = path.slice(1);

    var parts = splitAtFirstSlash(path);
    var viewport = this.viewport(parts[0]);
    var thumbnail;

    if (viewport) {
      path = parts[1];
      parts = splitAtFirstSlash(path);
      thumbnail = viewport.thumbnail(parts[0]);
      if (thumbnail)
        path = parts[1];
    }

    if (!viewport)
      viewport = this.defaultViewport;
    if (!thumbnail)
      thumbnail = viewport.defaultThumbnail;

    if (keys.isWellFormed(path))
      return thumbnail.forMake(makes.fromHostnameAndPath(path).url);

    return null;
  },
  viewport: function(slug) {
    return _.findWhere(this.viewports, {slug: slug});
  }
};

function Viewport(config, options) {
  if (!options.thumbnails.length)
    throw new Error("Viewports must have at least one thumbnail");

  this.config = config;
  this.slug = options.slug;
  this.width = options.width;
  this.height = options.height;
  this.crop = options.crop || null;
  this.thumbnails = options.thumbnails.map(function(thumbnail) {
    return new Thumbnail(this, thumbnail);
  }, this);
  this.defaultThumbnail = this.thumbnails[0];
}

Viewport.prototype = {
  thumbnail: function(slug) {
    return _.findWhere(this.thumbnails, {slug: slug});
  }
};

function Thumbnail(viewport, options) {
  this.viewport = viewport;
  this.slug = options.slug;
  this.width = options.width;
  this.height = options.height;
};

Thumbnail.prototype = {
  forMake: function(url) {
    url = makes.validateAndNormalizeUrl(url);
    if (!url) return null;
    return new MakeThumbnail(this, url);
  }
};

function MakeThumbnail(thumbnail, url) {
  this.thumbnail = thumbnail;
  this.url = url;
  this.key = thumbnail.viewport.slug + '/' +
             thumbnail.slug + '/' +
             keys.fromMakeUrl(url);
  this.lockKey = thumbnail.viewport.slug + '/' +
                 keys.fromMakeUrl(url);
}

module.exports = ScreenshotConfig;
