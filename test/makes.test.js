var should = require('should');
var nock = require('nock');

var makes = require('../makes');

describe("makes", function() {
  describe("fromHostnameAndPath()", function() {
    var from = makes.fromHostnameAndPath;

    it("should return null if string is invalid", function() {
      should.not.exist(from('$#%.makes.org/blah'));
      should.not.exist(from('webmaker-desktop/b'));
    });

    it("should return object if string is valid", function() {
      from('foo.makes.org/blah').should.eql({
        contentUrl: 'https://foo.makes.org/blah_',
        hostnameAndPath: 'foo.makes.org/blah',
        url: 'https://foo.makes.org/blah'
      });
    });

    it("should work for goggles makes", function() {
      from('foo.makes.org/goggles/blah').should.eql({
        contentUrl: 'http://foo.makes.org/goggles/blah',
        hostnameAndPath: 'foo.makes.org/goggles/blah',
        url: 'http://foo.makes.org/goggles/blah'
      });
    });

    it("should work for mofodev.net makes", function() {
      from('apps.mofodev.net/p/kate/-JfUuVxKSD-qGpACfz2Z/').should.eql({
        contentUrl: 'http://apps.mofodev.net/p/kate/-JfUuVxKSD-qGpACfz2Z/',
        hostnameAndPath: 'apps.mofodev.net/p/kate/-JfUuVxKSD-qGpACfz2Z/',
        url: 'http://apps.mofodev.net/p/kate/-JfUuVxKSD-qGpACfz2Z/'
      });
    });

    it("should work for webmaker desktop makes", function() {
      from('webmaker-desktop/aHR0cHM6Ly93ZWJtYWtlci1kZXNrdG9wLXN0YWdpbmcuaGVyb2t1YXBwLmNvbS8jL3RodW1ibmFpbD91c2VyPTEmcHJvamVjdD0xJnBhZ2U9MQ==')
        .should.eql({
          contentUrl: 'https://webmaker-desktop-staging.herokuapp.com/#/thumbnail?user=1&project=1&page=1',
          hostnameAndPath: 'webmaker-desktop/aHR0cHM6Ly93ZWJtYWtlci1kZXNrdG9wLXN0YWdpbmcuaGVyb2t1YXBwLmNvbS8jL3RodW1ibmFpbD91c2VyPTEmcHJvamVjdD0xJnBhZ2U9MQ==',
          url: 'https://webmaker-desktop-staging.herokuapp.com/#/thumbnail?user=1&project=1&page=1'
        })
    });
  });

  describe("fromUrl()", function() {
    var fromUrl = makes.fromUrl;

    it("should return null if URL is invalid", function() {
      should.not.exist(fromUrl('http://foo.makes.org/'));
      should.not.exist(fromUrl('http://example.org/'));
      should.not.exist(fromUrl('https://foo$.makes.org/'));
    });

    it("should remove ending underscore if needed", function() {
      fromUrl('https://foo.makes.org/_').should.eql({
        url: 'https://foo.makes.org/',
        contentUrl: 'https://foo.makes.org/_',
        hostnameAndPath: 'foo.makes.org/'
      });
    });

    it("should add ending underscore if needed", function() {
      fromUrl('https://foo.makes.org/').should.eql({
        url: 'https://foo.makes.org/',
        contentUrl: 'https://foo.makes.org/_',
        hostnameAndPath: 'foo.makes.org/'
      });
    });

    it("should accept goggles makes", function() {
      fromUrl('http://foo.makes.org/goggles/blah').should.eql({
        contentUrl: 'http://foo.makes.org/goggles/blah',
        hostnameAndPath: 'foo.makes.org/goggles/blah',
        url: 'http://foo.makes.org/goggles/blah'
      });
    });

    it("should accept http-based mofodev.net makes", function() {
      fromUrl('http://apps.mofodev.net/p/kate/-JfUuVxKSD-qGpACfz2Z/').should.eql({
        contentUrl: 'http://apps.mofodev.net/p/kate/-JfUuVxKSD-qGpACfz2Z/',
        hostnameAndPath: 'apps.mofodev.net/p/kate/-JfUuVxKSD-qGpACfz2Z/',
        url: 'http://apps.mofodev.net/p/kate/-JfUuVxKSD-qGpACfz2Z/'
      });
    });

    it("should accept https-based mofodev.net makes", function() {
      fromUrl('https://apps.mofodev.net/p/kate/-JfUuVxKSD-qGpACfz2Z/').should.eql({
        contentUrl: 'https://apps.mofodev.net/p/kate/-JfUuVxKSD-qGpACfz2Z/',
        hostnameAndPath: 'apps.mofodev.net/p/kate/-JfUuVxKSD-qGpACfz2Z/',
        url: 'https://apps.mofodev.net/p/kate/-JfUuVxKSD-qGpACfz2Z/'
      });
    });

    it("should accept webmaker desktop makes", function() {
      fromUrl('https://webmaker-desktop-staging.herokuapp.com/#/thumbnail?user=1&project=1&page=1')
        .should.eql({
          contentUrl: 'https://webmaker-desktop-staging.herokuapp.com/#/thumbnail?user=1&project=1&page=1',
          hostnameAndPath: 'webmaker-desktop/aHR0cHM6Ly93ZWJtYWtlci1kZXNrdG9wLXN0YWdpbmcuaGVyb2t1YXBwLmNvbS8jL3RodW1ibmFpbD91c2VyPTEmcHJvamVjdD0xJnBhZ2U9MQ==',
          url: 'https://webmaker-desktop-staging.herokuapp.com/#/thumbnail?user=1&project=1&page=1'
        })
    });
  });

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
