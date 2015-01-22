var redis = require('redis');
var urlParse = require("url").parse;

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
  lockAndSet: function(baseKey, cacheCb, doneCb, retryMethod) {
    var self = this;
    var infoKey = this._getInfoKey(baseKey);
    var lockToken = Math.random().toString();
    var lockKey = this.prefix + "lock_" + baseKey;

    retryMethod = retryMethod || this.lockAndSet;
    if (typeof(retryMethod) != 'function')
      throw new Error('retryMethod is not a function');

    self.client.set([
      lockKey, lockToken, "NX", "EX",
      LOCK_EXPIRY_IN_SECONDS.toString()
    ], function(err, result) {
      if (err) return doneCb(err);
      if (result === null) {
        setTimeout(retryMethod.bind(self, baseKey, cacheCb, doneCb,
                                    retryMethod),
                   self.unlockWaitMs);
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
  get: function(baseKey, cacheCb, doneCb) {
    var self = this;
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
        return self.lockAndSet(baseKey, cacheCb, doneCb, self.get);
      }
    });
  }
};

module.exports = RedisCache;
