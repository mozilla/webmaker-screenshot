var redis = require('redis');
var should = require('should');

var RedisCache = require("../redis-cache");

function noCache() {
  throw new Error("this should never be called");
}

describe("RedisCache", function() {
  var cache, client;

  beforeEach(function() {
    client = redis.createClient();
    cache = new RedisCache(client, 'TESTING_', 10);
  });

  afterEach(function(done) {
    client.keys('TESTING_*', function(err, keys) {
      if (err) return done(err);
      keys.length ? client.del(keys, done) : done();
    });
  });

  describe("get()", function() {
    it("should use cached value if available", function(done) {
      cache.get("blop", function cache(key, cb) {
        cb(null, {thing: "yay " + key});
      }, function(err, info) {
        if (err) return done(err);
        cache.get("blop", noCache, function(err, info) {
          if (err) return done(err);
          info.should.eql({thing: "yay blop"});
          done();
        });
      });
    });

    it("should report JSON errors", function(done) {
      client.set("TESTING_info_blah", "sup", function(err) {
        if (err) return done(err);
        cache.get("blah", noCache, function(err, info) {
          err.toString().should.match(/unexpected token/i);
          done();
        });
      });
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

    it("should hold lock while caching, release after", function(done) {
      cache.lockAndSet("bar", function cache(key, cb) {
        client.get("TESTING_lock_bar", function(err, val) {
          if (err) return done(err);
          should.exist(val);
          cb(null, "yay");
        });
      }, function(err, info) {
        if (err) return done(err);
        client.get("TESTING_lock_bar", function(err, val) {
          if (err) return done(err);
          should.not.exist(val);
          done();
        });
      });
    });

    it("should release lock after caching error", function(done) {
      cache.lockAndSet("bar", function cache(key, cb) {
        process.nextTick(cb.bind(null, new Error("blah")));
      }, function(err, info) {
        err.message.should.eql("blah");
        client.get("TESTING_lock_bar", function(err, val) {
          if (err) return done(err);
          should.not.exist(val);
          done();
        });
      });      
    });

    it("should call retryMethod when lock is taken", function(done) {
      cache.lockAndSet("foo", function firstCache(key, cb) {
        var secondDone = function(err, info) {
          throw new Error("this should not be called");
        };
        var retry = function(key, cacheCb, doneCb, retryMethod) {
          key.should.eql("foo");
          cacheCb.should.equal(noCache);
          doneCb.should.equal(secondDone);
          retryMethod.should.equal(retry);
          cb(null, "hooray");
        };
        cache.lockAndSet("foo", noCache, secondDone, retry);
      }, done);
    });
  });
});
