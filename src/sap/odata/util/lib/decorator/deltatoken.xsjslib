var Configuration = $.import('sap.odata.util.lib.db', 'configuration').Configuration;
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

/**
 * Tells if this decorator should be applied to the current request.
 * By default, this is is the case for GET requests against collections.
 */
DeltaTokenDecorator.prototype.isActive = function() {
	return Decorator.prototype.isActive.call(this) && this.collectionSupportsDelta();
};

/**
 * Tells if the targeted collection has the required delta properties for delta
 * queries to work.
 */
DeltaTokenDecorator.prototype.collectionSupportsDelta = function() {
	var deltaPropertyName = this.getConfiguredValue('deltatoken.deltaPropertyName');
	var deletedPropertyName = this.getConfiguredValue('deltatoken.deletedPropertyName');
	
	var deltaProperties = this.metadataClient.getMetadata().properties.filter(function(property) {
		return ~[deltaPropertyName, deletedPropertyName].indexOf(property.name);
	}.bind(this));
	return deltaProperties && deltaProperties.length === 2;
};

/**
 * Loads the most specific* configuration value for the current request
 * based on the specified key.
 * 
 * Most specific based on granularity out of [global, service-level, collection-level].
 * 
 * @returns {string} The most specific configuration value
 */
DeltaTokenDecorator.prototype.getConfiguredValue = function(key) {
	return Configuration.getProperty(key, this.request.getServicePath(),
			this.request.isCollectionRequest() ? this.request.getCollectionName() : undefined);
};
