var form = document.querySelector('form');

form.addEventListener('submit', function(event) {
  var req = new XMLHttpRequest();

  event.preventDefault();
  req.open('POST', window.location.pathname);
  req.setRequestHeader('Content-Type', 'application/json');
  req.responseType = 'json';
  req.addEventListener('load', function(event) {
    console.log('GOT', req.response);
  }, false);
  req.send(JSON.stringify({url: form.elements.url.value}));
}, false);
