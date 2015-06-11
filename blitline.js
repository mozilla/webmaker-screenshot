var request = require('request');

function screenshot(options, cb) {
  var wait = options.wait;
  var viewport = options.viewport;
  var thumbnails = options.thumbnails;
  var crop = options.crop || {
    x: 0,
    y: 0,
    width: viewport.width,
    height: viewport.height
  };

  request.post('http://api.blitline.com/job', {
    json: {json: {
      v: 1.20,
      application_id: options.appId,
      src: options.url,
      src_type: "screen_shot_url",
      src_data: {
        viewport: viewport.width + "x" + viewport.height,
        delay: wait
      },
      functions: [{
        name: "crop",
        params: crop,
        functions: thumbnails.map(function(thumbnail) {
          return {
            name: "resize_to_fit",
            params: {
              width: thumbnail.width
            },
            save: {
              quality: 90,
              image_identifier: 'screenshot:' + thumbnail.s3key,
              s3_destination: {
                bucket: options.s3bucket,
                key: thumbnail.s3key
              }
            }
          };
        })
      }]
    }}
  }, function(err, res, body) {
    if (err) return cb(err);

    if (res.statusCode != 200) {
      if (body && body.results && body.results.error)
        return cb(new Error('Blitline error: ' + body.results.error));
      return cb(new Error('HTTP ' + res.statusCode));
    }

    cb(null, thumbnails.map(function(thumbnail, i) {
      return {
        url: body.results.images[i].s3_url,
        width: thumbnail.width,
        height: thumbnail.height
      };
    }));
  });
}

module.exports.screenshot = screenshot;
