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
  preventChange: function() {
    // Don't do anything; we want the field to be read-only, but
    // using HTML5's readOnly attribute doesn't let the user
    // select the text, which is lame. We're providing this null
    // callback so React doesn't complain.
  },
  render: function() {
    var thumbnail = this.props.config;
    var mt = thumbnail.forMake(this.props.url);
    var imgPath = "/" + mt.key;
    var url = '//' + window.location.host + imgPath;

    return (
      <div className="well">
        <h3 style={{marginTop: 0}}>{thumbnail.slug}</h3>
        <div style={{marginTop: -10, marginBottom: 10}}>
          <small><span className="text-muted">{thumbnail.width}&times;{thumbnail.height}</span></small>
        </div>

        <p>
          <a href={imgPath}>
            <img src={imgPath} width={thumbnail.width} height={thumbnail.height}/>
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
  handleRegenerate: function() {
    alert("TODO: Implement this.");
  },
  render: function() {
    var viewport = this.props.config;

    return (
      <div>
        <h2>{viewport.slug}</h2>
        <div style={{marginTop: -10, marginBottom: 10}}>
          <small><span className="text-muted">{viewport.width}&times;{viewport.height} viewport</span></small>
        </div>
        {viewport.thumbnails.map(function(thumbnail) {
          return <Thumbnail key={thumbnail.slug} config={thumbnail} url={this.props.url}/>;
        }, this)}
        <button className="btn btn-primary" onClick={this.handleRegenerate}>
          <i className="fa fa-refresh"></i> Regenerate {viewport.slug} screenshots
        </button>
        <div className="checkbox">
          <input type="checkbox"/> Wait a few extra seconds for JavaScript to load before taking the screenshots
        </div>
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
