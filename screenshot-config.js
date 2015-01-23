var _ = require('underscore');

var makes = require('./makes');
var keys = require('./keys');

// requirements
//
// * use :viewport/:makepath as the redis lock key
// * iterate through all viewport and thumbnail URLs for a
//   given makepath.

function ScreenshotConfig(options) {
  if (!options.viewports.length)
    throw new Error("Configs must have at least one viewport");
  this.viewports = options.viewports.map(function(viewport) {
    return new Viewport(this, viewport);
  }, this);
  this.defaultViewport = this.viewports[0];
}

ScreenshotConfig.prototype = {
  fromPath: function(path) {
    // * given a URL path, parse it into /:viewport/:thumbnail/:makepath
    //   (and validate it)
    // * also parse just /:makepath, using default viewport and thumbnail.
    // * also parse just /:viewport/:makepath, using default thumbnail.
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
  this.key = thumbnail.viewport.slug + '/' +
             thumbnail.slug + '/' +
             keys.fromMakeUrl(url);
  this.lockKey = thumbnail.viewport.slug + '/' +
                 keys.fromMakeUrl(url);
}

module.exports = ScreenshotConfig;
