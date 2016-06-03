var Configuration = $.import('sap.odata.util.lib.db', 'configuration').Configuration;


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
	throw this.request.getServicePath();
	return Configuration.getProperty(key, this.request.getServicePath(),
			this.request.isCollectionRequest() ? this.request.getCollectionName() : undefined);
};

Processor.prototype.getMetadata = function() {
	return this.metadataClient.getMetadata();
};

/**
 * Turns the specified parameters object into a query string.
 * Values are URL-encoded.
 */
Processor.prototype.querify = function(parameters) {
	return Object.getOwnPropertyNames(parameters).map(function(key) {
		return key + '=' + escape(parameters[key]);
	}).join('&');
};
