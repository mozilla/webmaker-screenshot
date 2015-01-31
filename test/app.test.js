var request = require('supertest');
var should = require('should');
var nock = require('nock');

delete process.env.DEBUG;
process.env.IS_TESTING = true;
process.env.BLITLINE_APPLICATION_ID = "FAKE";
process.env.S3_BUCKET = "FAKES3";

var app = require('../app');
var screenshot = require('../screenshot');

describe("app", function() {
  beforeEach(function(done) {
    app.redisCache.client.keys('TESTING_*', function(err, keys) {
      if (err) return done(err);
      keys.length ? app.redisCache.client.del(keys, done) : done();
    });
  });

  it("should respond to /", function(done) {
    request(app)
      .get('/')
      .expect(200)
      .end(done);    
  });

  it("should respond to /404", function(done) {
    request(app)
      .get('/404')
      .expect(404)
      .end(done);    
  });

  it("should respond to /healthcheck", function(done) {
    request(app)
      .get('/healthcheck')
      .expect(200)
      .expect({redis: true})
      .end(done);    
  });

  describe("thumbnail endpoints", function() {
    var verifyIsHtml, blitlineScreenshot, s3;

    screenshot.configureForTesting({
      makes: {verifyIsHtml: function(url, cb) {
        process.nextTick(verifyIsHtml.bind(null, url, cb));
      }},
      blitline: {screenshot: function(options, cb) {
        process.nextTick(blitlineScreenshot.bind(null, options, cb));
      }}
    });

    beforeEach(function() {
      verifyIsHtml = null;
      blitlineScreenshot = null;
      s3 = null;
    });

    afterEach(function() {
      if (s3) s3.done();
    });

    it("return 404 for nonexistent makes", function(done) {
      verifyIsHtml = function(url, cb) {
        url.should.eql('https://t.makes.org/blah_');
        cb(null, false);
      };

      s3 = nock('https://s3.amazonaws.com')
        .head('/FAKES3/desktop/large/t.makes.org/blah')
        .reply(404);

      request(app)
        .get('/desktop/large/t.makes.org/blah')
        .expect(404)
        .end(done);
    });

    it("propagate errors when looking up makes", function(done) {
      verifyIsHtml = function(url, cb) {
        cb(new Error("blah"));
      };

      s3 = nock('https://s3.amazonaws.com')
        .head('/FAKES3/desktop/large/t.makes.org/blah')
        .reply(404);

      request(app)
        .get('/desktop/large/t.makes.org/blah')
        .expect(500)
        .expect("blah")
        .end(done);
    });

    it("return 200 for existing thumbnails on S3", function(done) {
      verifyIsHtml = function(url, cb) {
        cb(null, true);
      };

      s3 = nock('https://s3.amazonaws.com')
        .head('/FAKES3/desktop/large/t.makes.org/blah')
        .reply(200);

      request(app)
        .get('/desktop/large/t.makes.org/blah')
        .expect('Location', 'https://s3.amazonaws.com' +
                            '/FAKES3/desktop/large/t.makes.org/blah')
        .expect(302)
        .end(done);
    });

    it("uses blitline for nonexistent thumbnails", function(done) {
      verifyIsHtml = function(url, cb) {
        cb(null, true);
      };

      blitlineScreenshot = function(options, cb) {
        options.should.eql({
          "appId": "FAKE",
          "s3bucket": "FAKES3",
          "url": "https://t.makes.org/blah_",
          "thumbnails": [{
            "height": 240,
            "s3key": "desktop/small/t.makes.org/blah",
            "width": 320
          }, {
            "height": 384,
            "s3key": "desktop/large/t.makes.org/blah",
            "width": 512
          }],
          "viewport": {
            "height": 600,
            "width": 800
          },
          "wait": 3000
        });
        cb(null);
      };

      s3 = nock('https://s3.amazonaws.com')
        .head('/FAKES3/desktop/large/t.makes.org/blah')
        .reply(404);

      request(app)
        .get('/desktop/large/t.makes.org/blah')
        .expect('Location', 'https://s3.amazonaws.com' +
                            '/FAKES3/desktop/large/t.makes.org/blah')
        .expect(302)
        .end(done);
    });

    it("propagates blitline errors", function(done) {
      verifyIsHtml = function(url, cb) {
        cb(null, true);
      };

      blitlineScreenshot = function(options, cb) {
        cb(new Error("darn"));
      };

      s3 = nock('https://s3.amazonaws.com')
        .head('/FAKES3/desktop/large/t.makes.org/blah')
        .reply(404);

      request(app)
        .get('/desktop/large/t.makes.org/blah')
        .expect(500)
        .expect("darn")
        .end(done);
    });
  });

  it("should generate /js/bundle.js", function(done) {
    request(app)
      .get('/js/bundle.js')
      .expect('Content-Type', 'text/javascript; charset=utf-8')
      .expect(200)
      .end(done);
  });
});
