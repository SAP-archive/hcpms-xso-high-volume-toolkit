var UrlRewritingProcessor = $.import('sap.odata.util.lib.decorator.processing', 'urlRewritingProcessor').UrlRewritingProcessor;

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
	
	UrlRewritingProcessor.call(this, request, metadataClient);
	
	Object.defineProperties(this, {
		'replacementRegex': {
			value: new RegExp('(.*:\\/\\/[^/]+)(\\/.*' + request.getServiceName() + '\\.xsodata)(.*)')
		},
		'replacementPath': {
			value: this.request.getServicePath()
		}
	});
}

UrlRewritingPostProcessor.prototype = new UrlRewritingProcessor();
UrlRewritingPostProcessor.prototype.constructor = UrlRewritingPostProcessor;

/*
 * @see lib.decorator.processor.Processor.apply
 */
UrlRewritingPostProcessor.prototype.apply = function(response) {
	this.replaceLocation(response);
};
