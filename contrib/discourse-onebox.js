// To make this work for your Discourse:
//
//   * Change BASE_SCREENSHOT_URL to the root of your web service.
//   * Host this script somewhere.
//   * In the Discourse admin panel, go to "Content", then
//     "HTML head", and add a script tag to this script. Alternatively,
//     just include this script inline.

// Thanks to https://gist.github.com/leonardteo/8976640 for this pattern!
Discourse.PostView.reopen({
  didInsertElement: function addScreenshotsToMakes() {
    var MAKES_URL_RE = /^https:\/\/[A-Za-z0-9_\-]+\.makes\.org\//;
    var BASE_SCREENSHOT_URL = 'https://webmaker-screenshot.herokuapp.com/';
    this._super();

    this.$('a').each(function() {
      var href = $(this).attr('href');
      var isLinkOnItsOwnLine = (
        this.parentNode.nodeName == 'P' &&
        $(this.parentNode).children().length == 1 &&
        $.trim($(this.parentNode).text()) == $.trim($(this).text())
      );
      if (!(MAKES_URL_RE.test(href) && isLinkOnItsOwnLine)) return;

      var img = document.createElement('img');
      img.setAttribute('src', BASE_SCREENSHOT_URL + href.slice(8));
      img.setAttribute('style', 'display: block');
      $(this).prepend(img);
      $(this.parentNode).wrap('<blockquote></blockquote>');
    });
  }
});
