var Decorator = $.import('sap.odata.util.lib.decorator', 'decorator').Decorator;
var TombstoneFilterPreProcessor = $.import('sap.odata.util.lib.decorator.processing.preprocessing', 'tombstoneFilterPreProcessor').TombstoneFilterPreProcessor;
var Performance = $.import('sap.odata.util.lib.performance', 'skiptoken').Performance;

/**
 * Decorator that that adds a filter to requests so that tombstones are not being retrieved.
 * This is generally desirable unless we are explicitly requesting deltas.
 *
 * Active for GET requests returning entitiy sets supporting delta queries.
 * 
 */
function TombstoneFilterDecorator(request, metadataClient) {
	if(!request) throw 'Missing required attribute request\nat: ' + new Error().stack;
	if(!metadataClient) throw 'Missing required attribute metadataClient\nat: ' + new Error().stack;
	
	var traceTag = 'TombstoneFilterDecorator.init.' + request.id;
	Performance.trace('Creating tombstone filter decorator ' + request.id, traceTag);
	
	Decorator.call(this, request, metadataClient, TombstoneFilterPreProcessor, null);
	
	Performance.finishStep(traceTag);
}

TombstoneFilterDecorator.prototype = new Decorator();
TombstoneFilterDecorator.prototype.constructor = TombstoneFilterDecorator;

/*
 * See Decorator.isActive
 */
TombstoneFilterDecorator.prototype.isActive = function(request) {
	return this.request.isGetRequest() &&
		!this.request.isServiceRootRequest() &&
		!this.request.isMetadataRequest() &&
		!this.request.isSingleEntityRequest() &&
		!this.request.isDeltaRequest() &&
		this.collectionSupportsDelta();
};
