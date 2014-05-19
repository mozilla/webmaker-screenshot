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

## Usage

Given a make at:

    https://toolness.makes.org/thimble/LTcwNzI2NDUxMg==/example

The screenshot can be found at:

    http://localhost:3000/toolness.makes.org/thimble/LTcwNzI2NDUxMg==/example

In other words, just remove the `https://` at the beginning of the make and
add it to the root of the web service.

If the screenshot doesn't already exist, it will be created on-the-fly.
Then the client will be redirected to the screenshot's location on S3.

### Regenerating Screenshots

If a screenshot becomes out-of-date, you can forcibly regenerate it using
the form at the root of the website. Alternatively, issue a `POST`
request to the root of the website with the `url` parameter set to the
URL of the make.

### Discourse Support

You can use `contrib/discourse-onebox.js` as a basis for automatically
embedding screenshots of Webmaker makes in a [Discourse][] forum.

## Optional Environment Variables

If your S3 bucket is hosted at a custom domain, you can optionally
set `S3_WEBSITE` to its origin followed by a `/`, e.g.
`http://my-webmaker-screenshots.com/`.

  [Blitline]: http://blitline.com/
  [Webmaker]: https://webmaker.org/
  [Heroku add-on]: https://addons.heroku.com/blitline
  [permission]: http://blitline.com/docs/s3_permissions
  [Discourse]: http://discourse.org/
