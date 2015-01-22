var should = require('should');
var nock = require('nock');

var blitline = require('../blitline');

describe("blitline", function() {
  describe("screenshot()", function() {
    var MIN_OPTIONS = {s3: {}};
    var api;
    var screenshot = blitline.screenshot;

    afterEach(function() {
      api.done();
    });

    it("reports blitline errors", function(done) {
      api = nock('http://api.blitline.com')
        .post('/job')
        .reply(500, {
          results: {
            error: 'oof'
          }
        });
      screenshot(MIN_OPTIONS, function(err) {
        err.message.should.eql('Blitline error: oof');
        done();
      });
    });

    it("reports http errors", function(done) {
      api = nock('http://api.blitline.com')
        .post('/job')
        .reply(500);
      screenshot(MIN_OPTIONS, function(err) {
        err.message.should.eql('HTTP 500');
        done();
      });
    });

    describe("successful job submissions", function() {
      var JOB_REPLY = {
        results: {
          job_id: 50,
          images: [{
            s3_url: 'http://example.org/thingy'
          }]
        }
      };

      afterEach(function() {
        cache.done();
      });

      it("return after successful long polling", function(done) {
        api = nock('http://api.blitline.com')
          .post('/job')
          .reply(200, JOB_REPLY);
        cache = nock('http://cache.blitline.com')
          .get('/listen/50')
          .reply(200);
        screenshot(MIN_OPTIONS, function(err, info) {
          if (err) return done(err);
          info.should.eql({
            url: 'http://example.org/thingy',
            width: 320,
            height: 240
          });
          done();
        });
      });

      it("report long polling errors", function(done) {
        api = nock('http://api.blitline.com')
          .post('/job')
          .reply(200, JOB_REPLY);
        cache = nock('http://cache.blitline.com')
          .get('/listen/50')
          .reply(500, 'ack');
        screenshot(MIN_OPTIONS, function(err, info) {
          err.message.should.eql('HTTP 500: ack');
          done();
        });
      });
    });
  });
});
