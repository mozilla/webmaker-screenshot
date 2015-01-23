var urlParse = require("url").parse;
var _ = require('underscore');
var redis = require('redis');

var LOCK_EXPIRY_IN_SECONDS = 10;
var INFO_EXPIRY_IN_SECONDS = 60 * 60;
var DEFAULT_UNLOCK_WAIT_MS = 500;
var RELEASE_LOCK_SCRIPT = [
  'if redis.call("get",KEYS[1]) == ARGV[1]',
  'then',
  '  return redis.call("del",KEYS[1])',
  'else',
  '  return 0',
  'end'
].join('\n');

function clientFromURL(url) {
  var urlInfo = urlParse(url);
  var client = redis.createClient(urlInfo.port, urlInfo.hostname);
  if (urlInfo.auth)
    client.auth(urlInfo.auth.split(":")[1]);
  return client;
}

function RedisCache(client, prefix, unlockWaitMs) {
  if (!client) {
    client = redis.createClient();
  } else if (typeof(client) == 'string') {
    client = clientFromURL(client);
  }
  this.client = client;
  this.prefix = prefix || '';
  this.unlockWaitMs = unlockWaitMs || DEFAULT_UNLOCK_WAIT_MS;
}

RedisCache.prototype = {
  _getInfoKey: function(baseKey) {
    return this.prefix + "info_" + baseKey
  },
  // This relatively simplistic locking mechanism doesn't have 
  // the safety property of mutual exclusion when there are
  // multiple redis instances in play, but for our purposes
  // that's ok. For more information, see:
  //
  //   http://redis.io/topics/distlock
  lockAndSet: function(options) {
    options = _.defaults(options || {}, {
      retry: this.lockAndSet
    });
    var self = this;
    var baseKey = options.key;
    var baseLockKey = options.lockKey || baseKey;
    var cacheCb = options.cache;
    var doneCb = options.done;
    var retryCb = options.retry;
    var setTimeout = options.setTimeout || global.setTimeout;
    var infoKey = this._getInfoKey(baseKey);
    var lockToken = Math.random().toString();
    var lockKey = this.prefix + "lock_" + baseLockKey;

    if (typeof(retryCb) != 'function')
      throw new Error('retry is not a function');

    self.client.set([
      lockKey, lockToken, "NX", "EX",
      LOCK_EXPIRY_IN_SECONDS.toString()
    ], function(err, result) {
      if (err) return doneCb(err);
      if (result === null) {
        setTimeout(retryCb.bind(self, options), self.unlockWaitMs);
      } else {
        var releaseArgs = [RELEASE_LOCK_SCRIPT, "1", lockKey, lockToken];
        cacheCb(baseKey, function(err, info) {
          if (err)
            return self.client.eval(releaseArgs, function() {
              return doneCb(err);
            });
          self.client.multi()
            .set(infoKey, JSON.stringify(info),
                 "EX", INFO_EXPIRY_IN_SECONDS.toString())
            .eval(releaseArgs)
            .exec(function(err, results) {
              if (err) return doneCb(err);
              doneCb(null, info);
            });
        });
      }
    });
  },
  get: function(options) {
    options = options || {};
    var self = this;
    var baseKey = options.key;
    var doneCb = options.done;
    var infoKey = self._getInfoKey(baseKey);

    self.client.get(infoKey, function(err, info) {
      if (err) return doneCb(err);
      if (info) {
        try {
          info = JSON.parse(info);
        } catch (e) {
          return doneCb(e);
        }
        return doneCb(null, info);
      } else {
        // There is an irritatingly small chance that another
        // job may set infoKey and release the lock before
        // the following call executes, but for our purposes that's ok
        // since it will just mean running an unnecessary additional
        // re-caching.
        return self.lockAndSet(_.extend({}, options, {
          retry: self.get
        }));
      }
    });
  }
};

module.exports = RedisCache;
