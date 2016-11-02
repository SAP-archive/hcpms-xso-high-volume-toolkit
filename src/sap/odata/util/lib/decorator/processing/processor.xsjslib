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
		return entry.key + '=' + escape(entry.value);
	}).join('&');
};
