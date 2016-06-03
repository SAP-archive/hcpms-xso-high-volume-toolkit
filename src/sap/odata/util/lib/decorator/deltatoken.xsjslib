var Decorator = $.import('sap.odata.util.lib.decorator', 'decorator').Decorator;
var DeltaTokenPreProcessor = $.import('sap.odata.util.lib.decorator.processing.preprocessing', 'deltaTokenPreProcessor').DeltaTokenPreProcessor;
var DeltaTokenPostProcessor = $.import('sap.odata.util.lib.decorator.processing.postprocessing', 'deltaTokenPostProcessor').DeltaTokenPostProcessor;

/**
 * Adds delta token support to the current request as per
 * http://docs.oasis-open.org/odata/odata/v4.0/errata02/os/complete/part1-protocol/odata-v4.0-errata02-os-part1-protocol-complete.html#_Toc406398316
 * 
 * Does not support the <pre><code>odata.track-changes</pre></code> preference, but always returns a
 * delta link, since this behavior has not been specified prior to OData V4.
 * 
 * Does not support deleted links.
 * 
 */
function DeltaTokenDecorator(utils, metadataClient) {
	if(!utils) throw 'Missing required attribute request\nat: ' + new Error().stack;
	if(!metadataClient) throw 'Missing required attribute metadataClient\nat: ' + new Error().stack;
	
	Decorator.call(this, utils, metadataClient, DeltaTokenPreProcessor, DeltaTokenPostProcessor);
}

DeltaTokenDecorator.prototype = new Decorator();
DeltaTokenDecorator.prototype.constructor = DeltaTokenDecorator;
