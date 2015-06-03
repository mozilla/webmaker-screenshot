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

  it("fromMakeUrl() should work w/ webmaker desktop URLs", function() {
    keys.fromMakeUrl('https://webmaker-desktop-staging.herokuapp.com/#/thumbnail?user=1&project=1&page=1')
      .should.eql('webmaker-desktop/aHR0cHM6Ly93ZWJtYWtlci1kZXNrdG9wLXN0YWdpbmcuaGVyb2t1YXBwLmNvbS8jL3RodW1ibmFpbD91c2VyPTEmcHJvamVjdD0xJnBhZ2U9MQ==');
  });

  it("toMakeUrl() should work", function() {
    keys.toMakeUrl('foo.makes.org/blah')
      .should.eql('https://foo.makes.org/blah_');
  });

  it("toMakeUrl() should work w/ webmaker desktop keys", function() {
    keys.toMakeUrl('webmaker-desktop/aHR0cHM6Ly93ZWJtYWtlci1kZXNrdG9wLXN0YWdpbmcuaGVyb2t1YXBwLmNvbS8jL3RodW1ibmFpbD91c2VyPTEmcHJvamVjdD0xJnBhZ2U9MQ==')
      .should.eql('https://webmaker-desktop-staging.herokuapp.com/#/thumbnail?user=1&project=1&page=1');
  });
});
