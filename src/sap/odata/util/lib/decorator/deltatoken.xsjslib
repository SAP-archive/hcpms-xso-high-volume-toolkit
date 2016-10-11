var Configuration = $.import('sap.odata.util.lib.db', 'configuration').Configuration;
var Decorator = $.import('sap.odata.util.lib.decorator', 'decorator').Decorator;
var DeltaTokenPreProcessor = $.import('sap.odata.util.lib.decorator.processing.preprocessing', 'deltaTokenPreProcessor').DeltaTokenPreProcessor;
var DeltaTokenPostProcessor = $.import('sap.odata.util.lib.decorator.processing.postprocessing', 'deltaTokenPostProcessor').DeltaTokenPostProcessor;
var Performance = $.import('sap.odata.util.lib.performance', 'skiptoken').Performance;

/**
 * Adds delta token support to the current request as per
 * http://docs.oasis-open.org/odata/odata/v4.0/errata02/os/complete/part1-protocol/odata-v4.0-errata02-os-part1-protocol-complete.html#_Toc406398316
 * 
 * Does not support the <pre><code>odata.track-changes</pre></code> preference, but always returns a
 * delta link, since this behavior has not been specified prior to OData V4.
 * 
 * Does not support deleted links.
 *
 * Active under default conditions and only if the targeted entity set supports delta queries.
 * 
 */
function DeltaTokenDecorator(request, metadataClient) {
	if(!request) throw 'Missing required attribute request\nat: ' + new Error().stack;
	if(!metadataClient) throw 'Missing required attribute metadataClient\nat: ' + new Error().stack;
	
	var traceTag = 'DeltaTokenDecorator.init.' + request.id;
	Performance.trace('Creating delta token decorator ' + request.id, traceTag);
	
	Decorator.call(this, request, metadataClient, DeltaTokenPreProcessor, DeltaTokenPostProcessor);
	
	Object.defineProperties(this, {
		'visiting': {
			value: this.postprocessor.replaceDeletedEntities || this.postprocessor.stripDeltaFields
		}
	});
	
	Performance.finishStep(traceTag);
}

DeltaTokenDecorator.prototype = new Decorator();
DeltaTokenDecorator.prototype.constructor = DeltaTokenDecorator;

/*
 * @see lib.decorator.Decorator.isActive
 */
DeltaTokenDecorator.prototype.isActive = function() {
	return Decorator.prototype.isActive.call(this) && this.collectionSupportsDelta();
};
