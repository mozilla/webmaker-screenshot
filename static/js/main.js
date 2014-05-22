var form = document.querySelector('form');
var screenshotHolder = document.querySelector('#screenshot-holder');
var errorHolder = document.querySelector('#error-holder');

function getScreenshot(url, wait, cb) {
  var req = new XMLHttpRequest();

  req.open('POST', window.location.pathname);
  req.setRequestHeader('Content-Type', 'application/json');
  req.responseType = 'json';
  req.addEventListener('load', function(event) {
    console.log('GOT', req.response);
    if (req.response && req.response.error)
      return cb(new Error(req.response.error));
    else if (req.status != 200)
      return cb(new Error('Got HTTP ' + req.status));
    cb(null, req.response.screenshot);
  }, false);
  req.send(JSON.stringify({url: url, wait: wait}));
}

form.addEventListener('submit', function(event) {
  var url = form.elements.url.value;
  var wait = form.elements.wait.checked;

  event.preventDefault();

  document.body.className = 'progress';
  getScreenshot(url, wait, function(err, screenshot) {
    if (err) {
      document.body.className = 'error';
      errorHolder.appendChild(document.createTextNode(err.message));
      return;
    }
    var img = new Image();
    img.src = screenshot;
    screenshotHolder.appendChild(img);
    document.body.className = 'end';
  });
}, false);
