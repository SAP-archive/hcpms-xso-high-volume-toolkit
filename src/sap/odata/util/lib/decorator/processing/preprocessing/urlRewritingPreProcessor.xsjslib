var UrlRewritingProcessor = $.import('sap.odata.util.lib.decorator.processing', 'urlRewritingProcessor').UrlRewritingProcessor;

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
	
	UrlRewritingProcessor.call(this, request, metadataClient);
	
	Object.defineProperties(this, {
		'replacementRegex': {
			value: new RegExp('(.*:\\/\\/[^/]+)(\\/.*' + request.getServiceName() + '\\.xsjs)(.*)')
		},
		'replacementPath': {
			value: this.request.getTargetServicePath()
		}
	});
}

UrlRewritingPreProcessor.prototype = new UrlRewritingProcessor();
UrlRewritingPreProcessor.prototype.constructor = UrlRewritingPreProcessor;

/*
 * @see lib.decorator.processor.Processor.apply
 */
UrlRewritingPreProcessor.prototype.apply = function () {
	this.replaceLocation(this.request);
};
