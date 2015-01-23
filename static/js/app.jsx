var makes = require('./makes');

var URLForm = React.createClass({
  handleChange: function(e) {
    var urlField = this.refs.url.getDOMNode();
    if (makes.validateAndNormalizeUrl(urlField.value))
      urlField.setCustomValidity('');
    else
      urlField.setCustomValidity("This doesn't look like a Webmaker make.");
  },
  handleSubmit: function(e) {
    e.preventDefault();
    this.props.onSubmit(this.refs.url.getDOMNode().value);
  },
  render: function() {
    return (
      <div>
        <p>Paste the URL of a <a href="https://webmaker.org/">Webmaker</a> make below and we'll show you some screenshots of it, courtesy of <a href="http://blitline.com/">Blitline</a>.</p>
        <form role="form" onSubmit={this.handleSubmit}>
          <div className="form-group">
            <label className="sr-only">URL</label>
            <input ref="url" className="form-control" name="url" type="url" placeholder="https://" required onChange={this.handleChange}/>
          </div>
          <button type="submit" className="btn btn-primary">Submit</button>
        </form>
      </div>
    );
  }
});

var Thumbnail = React.createClass({
  getInitialState: function() {
    return {
      loadingImage: true,
      loadedImageSrc: null
    };
  },
  componentDidMount: function() {
    this.loadImage();
  },
  componentDidUpdate: function(prevProps, prevState) {
    if (prevProps.url != this.props.url)
      this.loadImage();
  },
  loadImage: function() {
    var image = document.createElement('img');
    var src = this.getImagePath() + '?bust=' + Date.now();
    this.setState({
      loadingImage: true,
      loadedImageSrc: src
    });
    image.onload = this.onImageLoad.bind(this, src);
    image.onerror = this.onImageError.bind(this, src);
    image.setAttribute('src', src);
  },
  onImageError: function(src) {
    if (!this.isMounted() || src != this.state.loadedImageSrc) return;
    // TODO: Actually make this show some kind of error image,
    // instead of a broken image.
    this.setState({loadingImage: false});
  },
  onImageLoad: function(src) {
    if (!this.isMounted() || src != this.state.loadedImageSrc) return;
    this.setState({loadingImage: false});
  },
  preventChange: function() {
    // Don't do anything; we want the field to be read-only, but
    // using HTML5's readOnly attribute doesn't let the user
    // select the text, which is lame. We're providing this null
    // callback so React doesn't complain.
  },
  getImagePath: function() {
    var mt = this.props.config.forMake(this.props.url);
    return "/" + mt.key;
  },
  render: function() {
    var thumbnail = this.props.config;
    var imgPath = this.getImagePath();
    var url = '//' + window.location.host + imgPath;
    var loadingImage = this.state.loadingImage;

    return (
      <div className="well">
        <h3 style={{marginTop: 0}}>{thumbnail.slug}</h3>
        <div style={{marginTop: -10, marginBottom: 10}}>
          <small><span className="text-muted">{thumbnail.width}&times;{thumbnail.height}</span></small>
        </div>

        <p>
          <a href={imgPath}>
            <img style={{
              boxSizing: 'border-box',
              mozBoxSizing: 'border-box',
              webkitBoxSizing: 'border-box',
              width: thumbnail.width,
              height: thumbnail.height,
              border: '1px solid gray',
              padding: loadingImage ? 100 : 0,
              opacity: loadingImage ? 0.5 : 1
            }} src={loadingImage ? "/img/throbber.svg" : this.state.loadedImageSrc}/>
          </a>
        </p>

        <div className="form-group">
          <label>URL</label>
          <input className="form-control" value={url} onChange={this.preventChange}/>
        </div>
      </div>
    );
  }
});

var Viewport = React.createClass({
  getInitialState: function() {
    return {
      regenerating: false
    };
  },
  componentDidUpdate: function(prevProps, prevState) {
    if (prevProps.url != this.props.url && this.state.regenerating) {
      // It's pretty unlikely for this to happen, but just in case
      // it does...
      this.regenerateRequest = null;
      this.setState({regenerating: false});
    }
  },
  handleRegenerate: function() {
    var req = new XMLHttpRequest();
    var mt = this.props.config.defaultThumbnail.forMake(this.props.url);
    var url = '/' + mt.key;
    var wait = this.refs.wait.getDOMNode().checked;

    this.setState({
      regenerating: true,
      regenerateError: null
    });
    this.regenerateRequest = req;
    req.open('POST', url);
    req.setRequestHeader('Content-Type', 'application/json');
    req.responseType = 'json';
    req.addEventListener('load', this.onRegenerateDone, false);
    req.send(JSON.stringify({wait: wait}));
  },
  onRegenerateDone: function(e) {
    var req = this.regenerateRequest;
    if (!this.isMounted() || e.target !== req) return;
    console.log('GOT', req.response);
    if (req.response && req.response.error)
      return this.setState({
        regenerateError: req.response.error
      });
    else if (req.status != 200)
      return this.setState({
        regenerateError: 'Got HTTP ' + req.status
      });
    this.setState({regenerating: false});
  },
  render: function() {
    var viewport = this.props.config;
    var content;

    if (this.state.regenerating) {
      content = (
        <div>
          {this.state.regenerateError
           ? <div className="alert alert-danger">
               <p>Alas, an error occurred while regenerating screenshots for {viewport.slug}: <code>{this.state.regenerateError}</code></p>
             </div>
           : <p>Regenerating {viewport.slug} screenshots&hellip; <img src="/img/throbber.svg"/></p>}
        </div>
      );
    } else {
      content = (
        <div>
          {viewport.thumbnails.map(function(thumbnail) {
            return <Thumbnail key={thumbnail.slug} config={thumbnail} url={this.props.url}/>;
          }, this)}
          <button className="btn btn-primary" onClick={this.handleRegenerate}>
            <i className="fa fa-refresh"></i> Regenerate {viewport.slug} screenshots
          </button>
          <div className="checkbox">
            <input ref="wait" type="checkbox"/> Wait a few extra seconds for JavaScript to load before taking the screenshots
          </div>
        </div>
      );
    }

    return (
      <div>
        <h2>{viewport.slug}</h2>
        <div style={{marginTop: -10, marginBottom: 10}}>
          <small><span className="text-muted">{viewport.width}&times;{viewport.height} viewport</span></small>
        </div>
        {content}
      </div>
    );
  }
});

var Screenshots = React.createClass({
  render: function() {
    return (
      <div>
        <p>Here are screenshots for <a href={this.props.url}>{this.props.url}</a>.</p>
        <button className="btn btn-default btn-xs" onClick={this.props.onGoBack}>
          <i className="fa fa-angle-double-left"></i> Choose a different URL&hellip;
        </button>        
        {this.props.config.viewports.map(function(viewport) {
          return <Viewport key={viewport.slug} config={viewport} url={this.props.url}/>;
        }, this)}
      </div>
    );
  }
});

var App = React.createClass({
  render: function() {
    var isValidURL = !!makes.validateAndNormalizeUrl(this.props.url);

    return (
      <div className="container">
        <h1>Webmaker Screenshot</h1>
        {isValidURL
         ? <Screenshots url={this.props.url} config={this.props.config} onGoBack={this.props.onSubmitURL.bind(null, '')}/>
         : <URLForm onSubmit={this.props.onSubmitURL}/>}
      </div>
    );
  }
});
