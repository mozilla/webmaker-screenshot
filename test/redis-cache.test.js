var redis = require('redis');
var should = require('should');

var RedisCache = require("../redis-cache");

describe("RedisCache", function() {
  var cache, client;

  beforeEach(function() {
    client = redis.createClient();
    cache = new RedisCache(client, 'TESTING_', 10);
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
        process.nextTick(cb.bind(null, null, {thing: "bar"}));
      }, function(err, info) {
        if (err) return done(err);
        info.should.eql({thing: "bar"});
        done();
      });
    });

    it("should hold lock while caching", function(done) {
      cache.lockAndSet("bar", function cache(key, cb) {
        client.get("TESTING_lock_bar", function(err, val) {
          if (err) return done(err);
          should.exist(val);
          cb(null, "yay");
        });
      }, function(err, info) {
        client.get("TESTING_lock_bar", function(err, val) {
          if (err) return done(err);
          should.not.exist(val);
          done();
        });
      });
    });

    it("should call retryMethod when lock is taken", function(done) {
      cache.lockAndSet("foo", function firstCache(key, cb) {
        var secondCache = function(key, cb) {
          throw new Error("this should not be called");
        };
        var secondDone = function(err, info) {
          throw new Error("this should not be called either");
        };
        var retry = function(key, cacheCb, doneCb, retryMethod) {
          key.should.eql("foo");
          cacheCb.should.equal(secondCache);
          doneCb.should.equal(secondDone);
          retryMethod.should.equal(retry);
          cb(null, "hooray");
        };
        cache.lockAndSet("foo", secondCache, secondDone, retry);
      }, done);
    });
  });
});
