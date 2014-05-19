This is a simple web service that uses [Blitline][] to make it easy
to render screenshots of [Webmaker][] makes on-the-fly.

## Requirements

* Node v0.10
* A free Blitline account
* An Amazon S3 bucket

You can get a Blitline account either through their website, or via
a free [Heroku add-on][].

The S3 bucket is used to upload screenshots into. You'll want to
give Blitline [permission][] to upload into it.

## Quick Start

From the root directory, run:

```
npm install
export BLITLINE_APPLICATION_ID='your blitline application id'
export S3_BUCKET='your s3 bucket'
node app.js
```

At this point, you can visit http://localhost:3000/.

  [Blitline]: http://blitline.com/
  [Webmaker]: https://webmaker.org/
  [Heroku add-on]: https://addons.heroku.com/blitline
  [permission]: http://blitline.com/docs/s3_permissions
