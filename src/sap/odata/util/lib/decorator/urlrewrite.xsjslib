var Decorator = $.import('sap.odata.util.lib.decorator', 'decorator').Decorator;
var UrlRewritingPostProcessor = $.import('sap.odata.util.lib.decorator.processing.postprocessing', 'urlRewritingPostProcessor').UrlRewritingPostProcessor;
var UrlRewritingPreProcessor = $.import('sap.odata.util.lib.decorator.processing.preprocessing', 'urlRewritingPreProcessor').UrlRewritingPreProcessor;
var Performance = $.import('sap.odata.util.lib.performance', 'skiptoken').Performance;

/**
 * Decorator that that rewrites URLs pointing to the wrapped XSOData service
 * with URLs pointing to the current XSJS wrapper.
 * 
 * Active for all requests that are not $metadata or $batch requests.
 * 
 */
function UrlRewritingDecorator(request, metadataClient) {
	if(!request) throw 'Missing required attribute request\nat: ' + new Error().stack;
	if(!metadataClient) throw 'Missing required attribute metadataClient\nat: ' + new Error().stack;
	
	var traceTag = 'UrlRewritingDecorator.init.' + request.id;
	Performance.trace('Creating url rewriting filter decorator ' + request.id, traceTag);
	
	Decorator.call(this, request, metadataClient, UrlRewritingPreProcessor, UrlRewritingPostProcessor);
	
	Object.defineProperties(this, {
		'visiting': {
			value: true
		}
	});
	
	Performance.finishStep(traceTag);
}

UrlRewritingDecorator.prototype = new Decorator();
UrlRewritingDecorator.prototype.constructor = UrlRewritingDecorator;

/*
 * See Decorator.isActive
 */
UrlRewritingDecorator.prototype.isActive = function(request) {
	return !this.request.isMultipartRequest() &&
		!this.request.isMetadataRequest(request);
};
