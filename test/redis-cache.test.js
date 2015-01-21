var redis = require('redis');
var should = require('should');

var RedisCache = require("../redis-cache");

describe("RedisCache", function() {
  var cache, client;

  beforeEach(function() {
    client = redis.createClient();
    cache = new RedisCache(client, 'TESTING_');
  });

  afterEach(function(done) {
    client.keys('TESTING_*', function(err, keys) {
      if (err) return done(err);
      client.del(keys, done);
    });
  });

  describe("lockAndSet()", function() {
    it("should pass arguments as expected", function(done) {
      cache.lockAndSet("foo", function cache(key, cb) {
        key.should.eql("foo");
        cb(null, {thing: "bar"});
      }, function(err, info) {
        if (err) return done(err);
        info.should.eql({thing: "bar"});
        done();
      });
    });
  });
});
