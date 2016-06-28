var Decorator = $.import('sap.odata.util.lib.decorator', 'decorator').Decorator;
var UrlRewritingPostProcessor = $.import('sap.odata.util.lib.decorator.processing.postprocessing', 'urlRewritingPostProcessor').UrlRewritingPostProcessor;
var UrlRewritingPreProcessor = $.import('sap.odata.util.lib.decorator.processing.preprocessing', 'urlRewritingPreProcessor').UrlRewritingPreProcessor;

/**
 * Decorator that that rewrites URLs pointing to the wrapped XSOData service
 * with URLs pointing to the current XSJS wrapper.
 * 
 * URLs are replaced iff:
 * 
 * - This is not a $metadata request
 * 
 * 
 */
function UrlRewritingDecorator(utils, metadataClient) {
	if(!utils) throw 'Missing required attribute request\nat: ' + new Error().stack;
	if(!metadataClient) throw 'Missing required attribute metadataClient\nat: ' + new Error().stack;
	
	Decorator.call(this, utils, metadataClient, UrlRewritingPreProcessor, UrlRewritingPostProcessor);
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
