var Decorator = $.import('sap.odata.util.lib.decorator', 'decorator').Decorator;
var SkipTokenPreProcessor = $.import('sap.odata.util.lib.decorator.processing.preprocessing', 'skipTokenPreProcessor').SkipTokenPreProcessor;
var SkipTokenPostProcessor = $.import('sap.odata.util.lib.decorator.processing.postprocessing', 'skipTokenPostProcessor').SkipTokenPostProcessor;
var Performance = $.import('sap.odata.util.lib.performance', 'skiptoken').Performance;

/**
 * Decorator that adds skip token support to the current request as per
 * http://docs.oasis-open.org/odata/odata/v4.0/errata02/os/complete/part1-protocol/odata-v4.0-errata02-os-part1-protocol-complete.html#_Toc406398238
 * 
 * Does not support the <pre><code>odata.maxPageSize</pre></code> preference.
 *
 * Active for
 * - non-multipart GET requests
 * - targeting entity sets
 * - except $metadata, $count, $top, $skip and $orderby requests
 *
 * This decorator does not support $orderby because it relies on the natural
 * stable order of the entities to work reliably. This is because the pagination
 * is implemented in terms of $filter requests to the upstream XSOData service.
 * The natural order by primary key is leveraged in order to separate the entities
 * into chunks, and a custom ordering would lead to pseudo-random results missing
 * most of the entities.
 *
 * $top and $skip are forbidden in conjunction with $skiptoken as per the specification.
 * 
 */
function SkipTokenDecorator(request, metadataClient) {
	if(!request) throw 'Missing required attribute request\nat: ' + new Error().stack;
	if(!metadataClient) throw 'Missing required attribute metadataClient\nat: ' + new Error().stack;
	
	var traceTag = 'SkipTokenDecorator.init.' + request.id;
	Performance.trace('Creating skip token decorator ' + request.id, traceTag);
	
	Decorator.call(this, request, metadataClient, SkipTokenPreProcessor, SkipTokenPostProcessor);
	
	Performance.finishStep(traceTag);
}

SkipTokenDecorator.prototype = new Decorator();
SkipTokenDecorator.prototype.constructor = SkipTokenDecorator;

/*
 * @see lib.decorator.Decorator.isActive
 */
SkipTokenDecorator.prototype.isActive = function() {
	return !this.request.isMultipartRequest() &&
		this.request.isGetRequest() &&
		!this.request.isMetadataRequest() &&
		!this.request.isCountRequest() &&
		this.request.isCollectionRequest() &&
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
