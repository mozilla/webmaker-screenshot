var redis = require('redis');
var should = require('should');

var RedisCache = require("../redis-cache");

function noCache() {
  throw new Error("this should never be called");
}

var UNLOCK_WAIT_MS = 10;

describe("RedisCache", function() {
  var cache, client;

  beforeEach(function() {
    client = redis.createClient();
    cache = new RedisCache(client, 'TESTING_', UNLOCK_WAIT_MS);
  });

  afterEach(function(done) {
    client.keys('TESTING_*', function(err, keys) {
      if (err) return done(err);
      keys.length ? client.del(keys, done) : done();
    });
  });

  describe("get()", function() {
    it("should retry", function(done) {
      var retrySecondGet;

      cache.get({
        key: "bip",
        cache: function(key, firstCacheDoneCb) {
          cache.get({
            key: "bip",
            cache: noCache,
            setTimeout: function(cb, ms) {
              retrySecondGet = cb;
              process.nextTick(firstCacheDoneCb.bind(null, null, "sup"));
            },
            done: function(err, info) {
              if (err) return done(err);
              info.should.eql("sup");
              done();
            }
          });
        },
        done: function(err) {
          if (err) return done(err);
          process.nextTick(retrySecondGet);
        }
      });
    });

    it("should use cached value if available", function(done) {
      cache.get({
        key: "blop", 
        cache: function(key, cb) {
          cb(null, {thing: "yay " + key});
        },
        done: function(err, info) {
          if (err) return done(err);
          cache.get({
            key: "blop",
            cache: noCache,
            done: function(err, info) {
              if (err) return done(err);
              info.should.eql({thing: "yay blop"});
              done();
            }
          });
        }
      });
    });

    it("should report JSON errors", function(done) {
      client.set("TESTING_info_blah", "sup", function(err) {
        if (err) return done(err);
        cache.get({
          key: "blah",
          cache: noCache,
          done: function(err, info) {
            err.toString().should.match(/unexpected token/i);
            done();
          }
        });
      });
    });
  });

  describe("lockAndSet()", function() {
    it("should pass arguments as expected", function(done) {
      cache.lockAndSet({
        key: "foo",
        cache: function(key, cb) {
          key.should.eql("foo");
          process.nextTick(cb.bind(null, null, {thing: "bar"}));
        },
        done: function(err, info) {
          if (err) return done(err);
          info.should.eql({thing: "bar"});
          done();
        }
      });
    });

    it("should use lockKey option if present", function(done) {
      cache.lockAndSet({
        key: "bar",
        lockKey: "goop",
        cache: function(key, cb) {
          client.get("TESTING_lock_goop", function(err, val) {
            if (err) return done(err);
            should.exist(val);
            cb(null, "yay");
          });
        },
        done: done
      });
    });

    it("should hold lock while caching, release after", function(done) {
      cache.lockAndSet({
        key: "bar",
        cache: function(key, cb) {
          client.get("TESTING_lock_bar", function(err, val) {
            if (err) return done(err);
            should.exist(val);
            cb(null, "yay");
          });
        },
        done: function(err, info) {
          if (err) return done(err);
          client.get("TESTING_lock_bar", function(err, val) {
            if (err) return done(err);
            should.not.exist(val);
            done();
          });
        }
      });
    });

    it("should release lock after caching error", function(done) {
      cache.lockAndSet({
        key: "bar",
        cache: function(key, cb) {
          process.nextTick(cb.bind(null, new Error("blah")));
        },
        done: function(err, info) {
          err.message.should.eql("blah");
          client.get("TESTING_lock_bar", function(err, val) {
            if (err) return done(err);
            should.not.exist(val);
            done();
          });
        }
      });      
    });

    it("should call retry when lock is taken", function(done) {
      cache.lockAndSet({
        key: "foo",
        cache: function(key, cb) {
          var o = {
            key: "foo",
            cache: noCache,
            done: function(err, info) {
              throw new Error("this should not be called");
            },
            retry: function(options) {
              options.key.should.eql("foo");
              options.cache.should.equal(o.cache);
              options.done.should.equal(o.done);
              options.retry.should.equal(o.retry);
              cb(null, "hooray");
            }
          };
          cache.lockAndSet(o);
        },
        done: done
      });
    });
  });
});
