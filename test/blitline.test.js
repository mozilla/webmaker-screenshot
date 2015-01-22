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

    it("passes expected data to blitline", function(done) {
      api = nock('http://api.blitline.com')
        .post('/job')
        .reply(500, function(uri, requestBody) {
          JSON.parse(requestBody).should.eql({
            json: {
              v: 1.20,
              application_id: 'appId',
              src: 'http://example.org/foo',
              src_type: "screen_shot_url",
              src_data: {
                viewport: "800x600",
                delay: 15
              },
              functions: [{
                name: "crop",
                params: {
                  x: 0,
                  y: 0,
                  width: 800,
                  height: 600
                },
                functions: [{
                  name: "resize_to_fit",
                  params: {
                    width: 320
                  },
                  save: {
                    quality: 90,
                    image_identifier: 'screenshot:key',
                    s3_destination: {
                      bucket: 'bucket',
                      key: 'key'
                    }
                  }
                }]
              }]
            }            
          });
          return {results: {error: 'ignore this'}};
        });

      screenshot({
        s3: {
          bucket: 'bucket',
          key: 'key'
        },
        wait: 15,
        appId: 'appId',
        url: 'http://example.org/foo'
      }, function() {
        done();
      });
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
