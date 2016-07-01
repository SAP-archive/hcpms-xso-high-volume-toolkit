var Processor = $.import('sap.odata.util.lib.decorator.processing', 'processor').Processor;

/**
 * Preprocessor that rewrites URLs in request bodies. The body is deep-inspected
 * and occurrences of URLs pointing to the this service are being replaced
 * with urls pointing to the upstream XSOData service. Only values in fields named
 * "uri", "id", "__delta" and "__next" are rewritten. The "location" header is also
 * rewritten, if present.
 *
 * Example:
 *
 * <code>
 * {
 * 	"id": "https://myxse.acme.com:443/com/example/wrapper/delta.xsjs"
 * }
 * </code>
 * becomes
 * <code>
 * {
 * 	"id": "https://myxse.acme.com:443/com/example/delta/delta.xsodata"
 * }
 * </code>
 */
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

/*
 * @see lib.decorator.processor.Processor.apply
 */
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

/**
 * Returns a rewritten version of the specified absolute url string in which the
 * reference to the upstream XSOData service is replaced with a reference to the
 * current wrapper XSJS service.
 */
UrlRewritingPreProcessor.prototype.replace = function (url) {
	return url.replace(this.replacementRegex, '$1' + this.request.getTargetServicePath() + '$3');
};
