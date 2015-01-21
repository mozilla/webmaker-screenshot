var should = require('should');
var nock = require('nock');

var makes = require('../makes');

describe("makes", function() {
  describe("validateAndNormalizeUrl()", function() {
    var validate = makes.validateAndNormalizeUrl;

    it("should return null if URL is invalid", function() {
      should.not.exist(validate('http://foo.makes.org/'));
      should.not.exist(validate('http://example.org/'));
      should.not.exist(validate('https://foo$.makes.org/'));
    });

    it("should always end w/ underscore", function() {
      validate('https://foo.makes.org/')
        .should.eql('https://foo.makes.org/_');
      validate('https://foo.makes.org/_')
        .should.eql('https://foo.makes.org/_');
    });
  });

  describe("verifyIsHtml()", function() {
    var scope;
    var verify = makes.verifyIsHtml;

    afterEach(function() {
      scope.done();
    });

    it("returns true", function(done) {
      scope = nock('http://example.org')
        .head('/foo')
        .reply(200, 'hi', {
          'Content-Type': 'text/html; charset=utf-8'
        });
      verify('http://example.org/foo', function(err, isHtml) {
        if (err) return done(err);
        isHtml.should.be.true;
        done();
      });
    });

    it("returns false when status isn't 200", function(done) {
      scope = nock('http://example.org')
        .head('/404')
        .reply(404, 'not found', {
          'Content-Type': 'text/html; charset=utf-8'
        });
      verify('http://example.org/404', function(err, isHtml) {
        if (err) return done(err);
        isHtml.should.be.false;
        done();
      });
    });

    it("returns false when content-type isn't html", function(done) {
      scope = nock('http://example.org')
        .head('/png')
        .reply(200, 'png data in here!', {
          'Content-Type': 'image/png'
        });
      verify('http://example.org/png', function(err, isHtml) {
        if (err) return done(err);
        isHtml.should.be.false;
        done();
      });
    });
  });
});
