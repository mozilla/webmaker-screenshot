var request = require('supertest');
var should = require('should');

delete process.env.DEBUG;
process.env.IS_TESTING = true;
process.env.BLITLINE_APPLICATION_ID = "FAKE";
process.env.S3_BUCKET = "FAKE";

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
    var verifyIsHtml, blitlineScreenshot;

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
    });

    it("return 404 for nonexistent makes", function(done) {
      verifyIsHtml = function(url, cb) {
        url.should.eql('https://t.makes.org/blah_');
        cb(null, false);
      };

      request(app)
        .get('/desktop/large/t.makes.org/blah')
        .expect(404)
        .end(done);
    });

    it("propagate errors when looking up makes", function(done) {
      verifyIsHtml = function(url, cb) {
        cb(new Error("blah"));
      };

      request(app)
        .get('/desktop/large/t.makes.org/blah')
        .expect(500)
        .expect("blah")
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
