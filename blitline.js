var request = require('request');

var VIEWPORT_WIDTH = 800;
var VIEWPORT_HEIGHT = 600;
var THUMBNAIL_WIDTH = 320;
var THUMBNAIL_HEIGHT = Math.floor(VIEWPORT_HEIGHT * THUMBNAIL_WIDTH /
                                  VIEWPORT_WIDTH);

// TODO: This keeps track of all in-progress screenshots to ensure
// that we don't submit multiple identical jobs to Blitline, but it's
// not 12-factor compliant. We should use Redis or something
// to keep track of jobs across multiple processes.
var inProgress = {};

function makeBroadcaster(key, firstCb) {
  var callbacks = [firstCb];
  inProgress[key] = callbacks;
  return function(err, info) {
    delete inProgress[key];
    callbacks.forEach(function(cb) {
      process.nextTick(function() { cb(err, info); });
    });
  };
}

function screenshot(options, cb) {
  var key = options.s3.key;
  var wait = options.wait;
  if (key in inProgress)
    // We're already making a screenshot, just piggyback on the other job.
    return inProgress[key].push(cb);
  cb = makeBroadcaster(key, cb);
  request.post('http://api.blitline.com/job', {
    json: {json: {
      v: 1.20,
      application_id: options.appId,
      src: options.url,
      src_type: "screen_shot_url",
      src_data: {
        viewport: VIEWPORT_WIDTH + "x" + VIEWPORT_HEIGHT,
        delay: wait
      },
      functions: [{
        name: "crop",
        params: {
          x: 0,
          y: 0,
          width: VIEWPORT_WIDTH,
          height: VIEWPORT_HEIGHT
        },
        functions: [{
          name: "resize_to_fit",
          params: {
            width: THUMBNAIL_WIDTH
          },
          save: {
            quality: 90,
            image_identifier: 'screenshot:' + key,
            s3_destination: options.s3
          }
        }]
      }]
    }}
  }, function(err, res, body) {
    if (err) return cb(err);

    if (res.statusCode != 200) {
      if (body && body.results && body.results.error)
        return cb(new Error('Blitline error: ' + body.results.error));
      return cb(new Error('HTTP ' + res.statusCode));
    }

    var longPollUrl = 'http://cache.blitline.com/listen/' +
                      body.results.job_id;
    request.get(longPollUrl, function(err, pollRes, pollBody) {
      if (err) return cb(err);

      if (pollRes.statusCode != 200)
        return cb(new Error('HTTP ' + pollRes.statusCode + ': ' + pollBody));
      cb(null, {
        url: body.results.images[0].s3_url,
        width: THUMBNAIL_WIDTH,
        height: THUMBNAIL_HEIGHT
      });
    });
  });
}

module.exports.screenshot = screenshot;
