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
 * Loads the most specific* configuration value for the current request
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
