var request = require('request');

var VIEWPORT_WIDTH = 800;
var VIEWPORT_HEIGHT = 600;
var THUMBNAIL_WIDTH = 320;
var THUMBNAIL_HEIGHT = Math.floor(VIEWPORT_HEIGHT * THUMBNAIL_WIDTH /
                                  VIEWPORT_WIDTH);

function screenshot(options, cb) {
  request.post('http://api.blitline.com/job', {
    json: {json: {
      v: 1.20,
      application_id: options.appId,
      src: options.url,
      src_type: "screen_shot_url",
      src_data: {
        viewport: VIEWPORT_WIDTH + "x" + VIEWPORT_HEIGHT,
        delay: 0
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
            image_identifier: 'screenshot:' + options.s3.key,
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
