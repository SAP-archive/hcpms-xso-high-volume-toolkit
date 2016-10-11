var Configuration = $.import('sap.odata.util.lib.db', 'configuration').Configuration;

/**
 * Decorator base class implementing the generic upstream request
 * strategy and providing extension points for inheriting classes
 * in order to customize the behavior.
 * 
 * Extension points:
 * 
 * - isActive
 * - preRequest
 * - postRequest(response)
 */
function Decorator(request, metadataClient, preprocessorClass, postprocessorClass) {
	Object.defineProperties(this, {
		'request': {
			value: request
		},
		'metadataClient': {
			value: metadataClient
		}
	});
	if(request && this.isActive()) {
		Object.defineProperties(this, {
			'preprocessor': {
				value: preprocessorClass ? new preprocessorClass(request, metadataClient) : function() {}
			},
			'postprocessor': {
				value: postprocessorClass ? new postprocessorClass(request, metadataClient) : function() {}
			}
		});
	}
}

/**
 * More speaking toString implementation that prints the class name.
 */
Decorator.prototype.toString = function() {
	return '[' + this.constructor.name + ' object]';
};

/**
 * Tells if this decorator should be applied to the current request.
 * By default, this is is the case for
 * - non-multipart GET requests
 * - against collections or single entities
 * - excluding $metadata and $count requests
 */
Decorator.prototype.isActive = function() {
	return !this.request.isMultipartRequest() &&
		(this.request.isSingleEntityRequest() || this.request.isCollectionRequest()) &&
		this.request.isGetRequest() &&
		!this.request.isMetadataRequest() &&
		!this.request.isCountRequest();
};

/**
 * Template method that allows inheriting classes to customize
 * the request parameters before it is sent.
 */
Decorator.prototype.preRequest = function() { return this.preprocessor.apply(); };

/**
 * Template method that allows inheriting classes to customize
 * the current response after the upstream response has been fetched.
 * 
 * This method is only called when the request was successful (i.e. status 200).
 * 
 * @parameter {object|string} response Metadata XML string (iff <code>isMetadataRequest()</code>),
 * 		parsed response body (iff <code>!isMetadataRequest()</code>) or undefined, if there was no body
 * 
 * @returns Transformed data. If a falsy value is returned, the original data is sent to the client.
 */
Decorator.prototype.postRequest = function(response) {
	try {
		return this.postprocessor.apply(response);
	} catch(e) {
		if(e && e.code) {
			response.setPostProcessingError(e);
		} else throw e;
	}
};

Decorator.prototype.visitPostRequest = function(object, parent, name) {
	try {
		return this.postprocessor.visit(object, parent, name);
	} catch(e) {
		if(e && e.code) {
			response.setPostProcessingError(e);
		} else throw e;
	}
};

/**
 * Tells if the targeted collection has the required delta properties for delta
 * queries to work.
 */
Decorator.prototype.collectionSupportsDelta = function() {
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
Decorator.prototype.getConfiguredValue = function(key) {
	return Configuration.getProperty(key, this.request.getServicePath(),
			this.request.isCollectionRequest() ? this.request.getCollectionName() : undefined);
};
