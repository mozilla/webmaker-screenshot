[![Build Status](https://travis-ci.org/toolness/webmaker-screenshot.svg?branch=master)](https://travis-ci.org/toolness/webmaker-screenshot)

This is a simple web service that uses [Blitline][] to make it easy
to render screenshots of [Webmaker][] makes on-the-fly.

## Requirements

* Node v0.10
* A free Blitline account
* An Amazon S3 bucket
* Redis 2.6.17 or later

You can get a Blitline account either through their website, or via
a free [Heroku add-on][].

The S3 bucket is used to upload screenshots into. You'll want to
give Blitline [permission][] to upload into it.

## Quick Start

**Note:** The following instructions assume redis is installed at
the default port on localhost. If this isn't the case, see below
for configuring redis.

From the root directory, run:

```
npm install
npm test
export BLITLINE_APPLICATION_ID='your blitline application id'
export S3_BUCKET='your s3 bucket'
export DEBUG=
node app.js
```

At this point, you can visit http://localhost:3000/.

## API

All POST endpoints take JSON-encoded bodies.

### Terminology

* A **viewport** represents the dimensions of the display area
  that a webpage is rendered into. Examples include desktop
  and mobile.

* A **thumbnail** represents a screenshot of a webpage on a
  particular viewport, usually scaled down to a specific
  resolution.

* The **default viewport** is defined to be the first viewport
  listed in `screenshot-config.json`.

* The **default thumbnail** for a viewport is defined to be the
  first thumbnail listed for a viewport in `screenshot-config.json`.

### URL Parameters

* `:viewport` is a viewport slug as defined in
  `screenshot-config.json`.

* `:thumbnail` is a thumbnail slug for `:viewport` as defined in
  `screenshot-config.json`.

* `:key` is the hostname of the make followed by its path. Currently,
  makes can be hosted on a subdomain of makes.org or mofodev.net.

### Methods

#### `GET /:viewport/:thumbnail/:key`

Returns an HTTP redirect to a thumbnail of a Webmaker make for a
particular viewport, generating it on-the-fly if needed.

So, for example, given a make at:

    https://toolness.makes.org/thimble/LTcwNzI2NDUxMg==/example

The `large` thumbnail of the `desktop` viewport can be found at:

```
/desktop/large/toolness.makes.org/thimble/LTcwNzI2NDUxMg==/example
```

#### `GET /:viewport/:key`

Returns an HTTP redirect to the default thumbnail a Webmaker make
on a particular viewport, generating it on-the-fly if needed.

#### `GET /:key`

Returns an HTTP redirect to the default thumbnail of a Webmaker make
on the default viewport, generating it on-the-fly if needed.

#### `POST /:viewport/:key`

Regenerates all thumbnails of a make for a particular viewport.

Body parameters:

* `wait` - If set to `true`, the screenshotting service will wait
  for several seconds before taking the screenshot. This is useful
  for pages that need extra time after the `load` event is fired
  to put themselves together. Defaults to `false`.

## Discourse Support

You can use `contrib/discourse-onebox.js` as a basis for automatically
embedding screenshots of Webmaker makes in a [Discourse][] forum.

For an example of this in action, see the [Webmaker Discourse][].

## Optional Environment Variables

If your S3 bucket is hosted at a custom domain, you can optionally
set `S3_WEBSITE` to its origin followed by a `/`, e.g.
`http://my-webmaker-screenshots.com/`.

If your redis instance isn't at the default of port 6379 on localhost,
you can define `REDIS_URL` to point at it. Use the form
`redis://:password@hostname:port`.

`REDISTOGO_URL` is a synonym for `REDIS_URL`, to make deployment on
Heroku easier.

If `DEBUG` is defined in the environment (even as an empty string),
then some assets will be always be regenerated on-the-fly, which
is useful for debugging.

## Running Tests

To run the test suite, run `npm test`.

Currently, the test suite assumes that redis is installed on
localhost at the default port. At present, there is no way to
override this.

There's also a manual test suite at http://localhost:3000/manual-test/.

  [Blitline]: http://blitline.com/
  [Webmaker]: https://webmaker.org/
  [Heroku add-on]: https://addons.heroku.com/blitline
  [permission]: http://blitline.com/docs/s3_permissions
  [Discourse]: http://discourse.org/
  [Webmaker Discourse]: http://discourse.webmaker.org/t/webmaker-screenshots/331
