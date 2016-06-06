var Decorator = $.import('sap.odata.util.lib.decorator', 'decorator').Decorator;
var SkipTokenPreProcessor = $.import('sap.odata.util.lib.decorator.processing.preprocessing', 'skipTokenPreProcessor').SkipTokenPreProcessor;
var SkipTokenPostProcessor = $.import('sap.odata.util.lib.decorator.processing.postprocessing', 'skipTokenPostProcessor').SkipTokenPostProcessor;

/**
 * Decorator that adds skip token support to the current request as per
 * http://docs.oasis-open.org/odata/odata/v4.0/errata02/os/complete/part1-protocol/odata-v4.0-errata02-os-part1-protocol-complete.html#_Toc406398238
 * 
 * Does not support the <pre><code>odata.maxPageSize</pre></code> preference.
 * 
 */
function SkipTokenDecorator(utils, metadataClient) {
	if(!utils) throw 'Missing required attribute request\nat: ' + new Error().stack;
	if(!metadataClient) throw 'Missing required attribute metadataClient\nat: ' + new Error().stack;
	
	Decorator.call(this, utils, metadataClient, SkipTokenPreProcessor, SkipTokenPostProcessor);
}

SkipTokenDecorator.prototype = new Decorator();
SkipTokenDecorator.prototype.constructor = SkipTokenDecorator;

/*
 * See Decorator.isActive
 */
SkipTokenDecorator.prototype.isActive = function() {
	return Decorator.prototype.isActive.call(this) &&
		this.isNotClientDrivenPagingRequest() &&
		this.isNotCustomOrderingRequest();
};

/**
 * Tells if this request does <b>not</b> use client-driven paging.
 */
SkipTokenDecorator.prototype.isNotClientDrivenPagingRequest = function(request) {
	return !this.request.originalParameters.contains('$skip') &&
		!this.request.originalParameters.contains('$top');
};

/**
 * Tells if this request does <b>not</b> use $orderby.
 */
SkipTokenDecorator.prototype.isNotCustomOrderingRequest = function(request) {
	return !this.request.originalParameters.contains('$orderby');
};
