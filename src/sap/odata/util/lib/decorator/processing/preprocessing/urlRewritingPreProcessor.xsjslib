var Processor = $.import('sap.odata.util.lib.decorator.processing', 'processor').Processor;

function UrlRewritingPreProcessor(request, metadataClient) {
	if(!request) throw 'Missing required attribute request\nat: ' + new Error().stack;
	if(!metadataClient) throw 'Missing required attribute metadataClient\nat: ' + new Error().stack;
	
	Processor.call(this, request, metadataClient);
	
	Object.defineProperties(this, {
		'replacementRegex': {
			value: new RegExp('(.*:\\/\\/[^/]+)(\\/.*' + request.getServiceName() + '\\.xsjs)(.*)')
		}
	});
}

UrlRewritingPreProcessor.prototype = new Processor();
UrlRewritingPreProcessor.prototype.constructor = UrlRewritingPreProcessor;

UrlRewritingPreProcessor.prototype.apply = function () {
	if(!this.request.json) return;
	
	var data = this.request.body;
	data.traverse(function(object, parent, name) {
		if(object && ~['uri', 'id', '__delta', '__next'].indexOf(name)) {
			parent[name] = this.replace(object);
		}
	}.bind(this));
	
	var location = this.request.headers.get('location');
	if(location) this.request.headers.set('location', this.replace(location));
};

UrlRewritingPreProcessor.prototype.replace = function (url) {
	return url.replace(this.replacementRegex, '$1' + this.request.getTargetServicePath() + '$3');
};
