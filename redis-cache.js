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
  _getInfoKey: function(url) {
    return this.prefix + "info_" + url
  },
  set: function(url, info, cb) {
    this.client.set(this._getInfoKey(url), JSON.stringify(info),
                    "EX", INFO_EXPIRY_IN_SECONDS.toString(), cb);
  },
  lockAndSet: function(url, cacheCb, doneCb, retryMethod) {
    var self = this;
    var infoKey = this._getInfoKey(url);
    var lockToken = Math.random().toString();
    var lockKey = this.prefix + "lock_" + url;

    retryMethod = retryMethod || this.lockAndSet;
    if (typeof(retryMethod) != 'function')
      throw new Error('retryMethod is not a function');

    self.client.set([
      lockKey, lockToken, "NX", "EX",
      LOCK_EXPIRY_IN_SECONDS.toString()
    ], function(err, result) {
      if (err) return doneCb(e);
      if (result === null) {
        setTimeout(retryMethod.bind(self, url, cacheCb, doneCb, retryMethod),
                   self.unlockWaitMs);
      } else {
        cacheCb(url, function(err, info) {
          if (err) {
            // TODO: Be nice and release our lock.
            return doneCb(err);
          }
          self.client.multi()
            .set(infoKey, JSON.stringify(info),
                 "EX", INFO_EXPIRY_IN_SECONDS.toString())
            .eval(RELEASE_LOCK_SCRIPT, "1", lockKey, lockToken)
            .exec(function(err, results) {
              if (err) {
                // TODO: Be nice and release our lock.
                return doneCb(err);
              }
              doneCb(null, info);
            });
        });
      }
    });
  },
  get: function(url, cacheCb, doneCb) {
    var self = this;
    var infoKey = self._getInfoKey(url);

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
        return self.lockAndSet(url, cacheCb, doneCb, self.get);
      }
    });
  }
};

module.exports = RedisCache;
