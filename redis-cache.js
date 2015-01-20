var LOCK_EXPIRY_IN_SECONDS = 10;
var UNLOCK_WAIT_MS = 500;
var RELEASE_LOCK_SCRIPT = [
  'if redis.call("get",KEYS[1]) == ARGV[1]',
  'then',
  '  return redis.call("del",KEYS[1])',
  'else',
  '  return 0',
  'end'
].join('\n');

function RedisCache(client) {
  this.client = client;
}

RedisCache.prototype = {
  get: function(url, cacheCb, doneCb) {
    var self = this;
    var infoKey = "info_" + url;

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
        var lockToken = Math.random().toString();
        var lockKey = "lock_" + url;
        self.client.set([
          lockKey, lockToken, "NX", "EX",
          LOCK_EXPIRY_IN_SECONDS.toString()
        ], function(err, result) {
          if (err) return doneCb(e);
          if (result === null) {
            setTimeout(function() {
              self.get(url, cacheCb, doneCb);
            }, UNLOCK_WAIT_MS);
          } else {
            cacheCb(function(err, info) {
              if (err) {
                // TODO: Be nice and release our lock.
                return doneCb(err);
              }
              self.client.multi()
                .set(infoKey, JSON.stringify(info))
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
      }
    });
  }
};

module.exports = RedisCache;
