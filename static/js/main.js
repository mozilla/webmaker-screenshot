var form = document.querySelector('form');

function getScreenshot(url, cb) {
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
  req.send(JSON.stringify({url: url}));
}

form.addEventListener('submit', function(event) {
  event.preventDefault();
  getScreenshot(form.elements.url.value, function(err, screenshot) {
    if (err) {
      alert(err.message);
      return;
    }
    var img = new Image();
    img.src = screenshot;
    document.body.appendChild(img);
  });
}, false);
