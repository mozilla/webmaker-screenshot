// To make this work for your Discourse:
//
//   * In the Discourse admin panel, go to "Content", then
//     "HTML head", and add a script tag to this script.

// Thanks to https://gist.github.com/leonardteo/8976640 for this pattern!
var makes = require('../makes');
var urlParse = require('url').parse;

function getBaseScreenshotURL() {
  var findMyScript = function() {
    var scripts = document.getElementsByTagName("script")
    for (var i = 0; i < scripts.length; ++i) {
      if (/discourse-onebox\.js/.test(scripts[i].src)) {
        return scripts[i];
      }
    }
  };
  var me = document.currentScript || findMyScript();
  var parsed = urlParse(me.src);
  return parsed.protocol + '//' + parsed.host + '/';
}

var BASE_SCREENSHOT_URL = getBaseScreenshotURL();
var MAKEAPI_URL = 'https://makeapi.webmaker.org/api/20130724/make/search';

Discourse.PostView.reopen({
  didInsertElement: function addScreenshotsToMakes() {
    this._super();

    this.$('a').each(function() {
      var href = $(this).attr('href');
      var makeInfo = makes.fromUrl(href);
      var parent = this.parentNode;
      var isLinkOnItsOwnLine = (parent.nodeName == 'P' &&
                                $(parent).children().length == 1 &&
                                ($.trim($(parent).text()) ==
                                 $.trim($(this).text())));

      if (!(makeInfo && isLinkOnItsOwnLine)) return;

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
        url: makeInfo.url
      }, function(data) {
        if (!(data && data.total == 1)) return;

        var makeApiInfo = data.makes[0];
        var link = $('<a></a>').attr('href', makeInfo.url)
          .text(makeApiInfo.title);

        $(img).after(document.createTextNode(makeApiInfo.description));
        $(img).after($('<h4></h4>').text('By ' + makeApiInfo.username));
        $(img).after($('<h3></h3>').append(link));
      });

      var img = document.createElement('img');
      img.setAttribute('src', BASE_SCREENSHOT_URL + makeInfo.hostnameAndPath);
      $('.onebox-result-body', onebox).prepend(img);

      // If the link text is just the URL, replace it w/ the domain.
      for (var i = 0; i < this.childNodes.length; i++) {
        var node = this.childNodes[i];

        if (node.nodeType == this.TEXT_NODE &&
            $.trim(node.nodeValue) == href) {
          node.nodeValue = urlParse(makeInfo.url).hostname;
        }
      }

      $(parent).replaceWith(onebox);
    });
  }
});
