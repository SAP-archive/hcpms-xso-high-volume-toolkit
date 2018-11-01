var Configuration = $.import('sap.odata.util.lib.db', 'configuration').Configuration;

/**
 * Base processor class for request preprocessing and response postprocessing
 * classes. Provides basic access to configuration, the current context and some
 * common utilities.
 */
function Processor(request, metadataClient) {
	Object.defineProperties(this, {
		'request': {
			value: request
		},
		'metadataClient': {
			value: metadataClient
		} 
	});
}

/**
 * Tells if this processor should be applied to the current request.
 * By default, this is is the case for
 * - non-multipart GET requests
 * - against collections or single entities
 * - excluding $metadata and $count requests
 */
Processor.prototype.isActive = function() {
	return !this.request.isMultipartRequest() &&
		(this.request.isSingleEntityRequest() || this.request.isCollectionRequest()) &&
		this.request.isGetRequest() &&
		!this.request.isMetadataRequest() &&
		!this.request.isCountRequest();
};

/**
 * Applies this processor to the current request or response.
 * 
 * @param {sap.odata.util.lib.transfer.response.Response|undefined} [responseOrUndefined]
 * 	Preprocessors: Undefined
 * 	Postprocessors: The response to apply to
 */
Processor.prototype.apply = function(responseOrUndefined) { }; // no-op

/**
 * Visits the specified node in the request or response object graph and applies
 * a transformation, if applicable.
 */
Processor.prototype.visit = function(object, parent, name) { }; // no-op

/**
 * Loads the most specific configuration value for the current request
 * based on the specified key.
 * 
 * Most specific based on granularity out of [global, service-level, collection-level].
 * 
 * @returns {string} The most specific configuration value
 */
Processor.prototype.getConfiguredValue = function(key) {
	return Configuration.getProperty(key, this.request.getServicePath(),
			this.request.isCollectionRequest() ? this.request.getCollectionName() : undefined);
};

/**
 * Returns the metadata of the collection 
 */
Processor.prototype.getMetadata = function() {
	return this.metadataClient.getMetadata();
};

/**
 * Turns the specified parameters object into a query string.
 * Values are URL-encoded.
 */
Processor.prototype.querify = function(parameters) {
	return parameters.map(function(entry) {
		var value = entry.value;
		if(entry.key !== '$skiptoken') {
			// $skiptoken has already been escaped
			value = escape(value);
		}
		return entry.key + '=' + value;
	}).join('&');
};

/**
 * Tells if the targeted collection has the required delta properties for delta
 * queries to work.
 */
Processor.prototype.collectionSupportsDelta = function() {
	var deltaPropertyName = this.getConfiguredValue('deltatoken.deltaPropertyName');
	var deletedPropertyName = this.getConfiguredValue('deltatoken.deletedPropertyName');
	
	var deltaProperties = this.metadataClient.getMetadata().properties.filter(function(property) {
		return ~[deltaPropertyName, deletedPropertyName].indexOf(property.name);
	}.bind(this));
	return deltaProperties && deltaProperties.length === 2;
};
