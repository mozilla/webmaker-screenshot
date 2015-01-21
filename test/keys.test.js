var should = require('should');

var keys = require('../keys');

describe("keys", function() {
  describe("isWellFormed()", function() {
    it("should return true for foo.makes.org/blah", function() {
      keys.isWellFormed('foo.makes.org/blah').should.be.true;
    });
    it("should return false for $#%.makes.org/blah", function() {
      keys.isWellFormed('$#%.makes.org/blah').should.be.false;
    });
    it("should return false for example.org/blah", function() {
      keys.isWellFormed('example.org/blah').should.be.false;
    });
  });

  it("fromMakeUrl() should work", function() {
    keys.fromMakeUrl('https://foo.makes.org/blah_')
      .should.eql('foo.makes.org/blah');
  });

  it("toMakeUrl() should work", function() {
    keys.toMakeUrl('foo.makes.org/blah')
      .should.eql('https://foo.makes.org/blah_');
  });
});
