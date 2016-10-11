var Processor = $.import('sap.odata.util.lib.decorator.processing', 'processor').Processor;

/**
 * Postprocessor that rewrites URLs in response bodies. The body is deep-inspected
 * and occurrences of URLs pointing to the upstream XSOData service are being replaced
 * with urls pointing to the wrapper XSJS service. Only values in fields named
 * "uri", "id", "__delta" and "__next" are rewritten. The "location" header is also
 * rewritten, if present.
 *
 * Example:
 *
 * <code>
 * {
 * 	"id": "https://myxse.acme.com:443/com/example/delta/delta.xsodata"
 * }
 * </code>
 * becomes
 * <code>
 * {
 * 	"id": "https://myxse.acme.com:443/com/example/wrapper/delta.xsjs"
 * }
 * </code>
 */
function UrlRewritingPostProcessor(request, metadataClient) {
	if(!request) throw 'Missing required attribute request\nat: ' + new Error().stack;
	if(!metadataClient) throw 'Missing required attribute metadataClient\nat: ' + new Error().stack;
	
	Processor.call(this, request, metadataClient);
	
	Object.defineProperties(this, {
		'replacementRegex': {
			value: new RegExp('(.*:\\/\\/[^/]+)(\\/.*' + request.getServiceName() + '\\.xsodata)(.*)')
		}
	});
}

UrlRewritingPostProcessor.prototype = new Processor();
UrlRewritingPostProcessor.prototype.constructor = UrlRewritingPostProcessor;

/*
 * @see lib.decorator.processor.Processor.apply
 */
UrlRewritingPostProcessor.prototype.apply = function (response) {
	var location = response.headers.get('location');
	if(location) response.headers.set('location', this.replace(location));
};

UrlRewritingPostProcessor.prototype.visit = function(object, parent, name) {
	if(object && ~['uri', 'id', '__delta', '__next'].indexOf(name)) {
		parent[name] = this.replace(object);
	}
}

/**
 * Returns a rewritten version of the specified absolute url string in which the
 * reference to the upstream XSOData service is replaced with a reference to the
 * current wrapper XSJS service.
 */
UrlRewritingPostProcessor.prototype.replace = function (url) {
	return url.replace(this.replacementRegex, '$1' + this.request.getServicePath() + '$3');
};
