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
    var MAKEAPI_URL = 'https://makeapi.webmaker.org/api/20130724/make/search';
    var MAKES_URL_RE = /^https:\/\/([A-Za-z0-9_\-]+\.makes\.org)\//;
    var BASE_SCREENSHOT_URL = 'https://webmaker-screenshot.herokuapp.com/';
    this._super();

    this.$('a').each(function() {
      var href = $(this).attr('href');
      var parent = this.parentNode;
      var isLinkOnItsOwnLine = (parent.nodeName == 'P' &&
                                $(parent).children().length == 1 &&
                                ($.trim($(parent).text()) ==
                                 $.trim($(this).text())));

      if (!(MAKES_URL_RE.test(href) && isLinkOnItsOwnLine)) return;

      var onebox = $(
        '<div class="onebox-result">' +
        '<div class="source"><div class="info">' +
        '<img src="https://webmaker.org/img/favicon.ico" ' +
        'style="margin-top: -2px"> </div></div>' +
        '<div class="onebox-result-body">' +
        '<div class="clearfix"></div>' +
        '</div>' +
        '</div>'
      );

      $('.info', onebox).append(this);
      $.getJSON(MAKEAPI_URL, {
        url: href
      }, function(data) {
        if (!(data && data.total == 1)) return;

        var make = data.makes[0];
        var link = $('<a></a>').attr('href', href).text(make.title);

        $(img).after(document.createTextNode(make.description));
        $(img).after($('<h4></h4>').text('By ' + make.username));
        $(img).after($('<h3></h3>').append(link));
      });

      var img = document.createElement('img');
      img.setAttribute('src', BASE_SCREENSHOT_URL + href.slice(8));
      $('.onebox-result-body', onebox).prepend(img);

      // If the link text is just the URL, replace it w/ the domain.
      for (var i = 0; i < this.childNodes.length; i++) {
        var node = this.childNodes[i];

        if (node.nodeType == this.TEXT_NODE &&
            $.trim(node.nodeValue) == href) {
          node.nodeValue = href.match(MAKES_URL_RE)[1];
        }
      }

      $(parent).replaceWith(onebox);
    });
  }
});
