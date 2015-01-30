var request = require('supertest');
var should = require('should');

delete process.env.DEBUG;
process.env.IS_TESTING = true;
process.env.BLITLINE_APPLICATION_ID = "FAKE";
process.env.S3_BUCKET = "FAKE";

var app = require('../app');

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

  describe("/:viewport/:thumbnail/:key", function() {
    it("TODO: Add more tests here!", function() {

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
