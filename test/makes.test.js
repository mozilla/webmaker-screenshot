var should = require('should');

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
});
