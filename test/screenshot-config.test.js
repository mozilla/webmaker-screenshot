var should = require('should');

var ScreenshotConfig = require('../screenshot-config');

var CONFIG = {
  "viewports": [
    {
      "slug": "desktop",
      "width": 800,
      "height": 600,
      "thumbnails": [
        {
          "slug": "small",
          "width": 320,
          "height": 240
        },
        {
          "slug": "large",
          "width": 512,
          "height": 384
        }
      ]
    }
  ]
};

describe("ScreenshotConfig", function() {
  var config = new ScreenshotConfig(CONFIG);

  it("should have default viewport", function() {
    config.defaultViewport.slug.should.eql("desktop");
  });

  it("viewport() returns viewport if one exists", function() {
    config.viewport('desktop').slug.should.eql('desktop');
  });

  it("viewport() returns falsy if one doesn't exist", function() {
    should.not.exist(config.viewport('blah'));
  });

  describe("Viewport", function() {
    var viewport = config.viewport('desktop');

    it("should have width and height", function() {
      viewport.width.should.eql(800);
      viewport.height.should.eql(600);
    });

    it("should have default thumbnail", function() {
      viewport.defaultThumbnail.slug.should.eql('small');
    });

    it("thumbnail() returns thumbnail if one exists", function() {
      viewport.thumbnail("small").slug.should.eql("small");
    });

    it("thumbnail() returns falsy if one doesn't exist", function() {
      should.not.exist(viewport.thumbnail("teensy"));
    });

    describe("Thumbnail", function() {
      var thumbnail = viewport.thumbnail("small");

      it("should have width and height", function() {
        thumbnail.width.should.eql(320);
        thumbnail.height.should.eql(240);
      });

      it("forMake() returns null for invalid URLs", function() {
        should.not.exist(thumbnail.forMake('http://foo'));
      });

      describe("MakeThumbnail", function() {
        var mt = thumbnail.forMake('https://u.makes.org/blah');

        it("should have valid key", function() {
          mt.key.should.eql('desktop/small/u.makes.org/blah');
        });

        it("should have valid lockKey", function() {
          mt.lockKey.should.eql('desktop/u.makes.org/blah');
        });
      });
    });
  });
});
