var Configuration = $.import('sap.odata.util.lib.db', 'configuration').Configuration;
var NullProcessor = $.import('sap.odata.util.lib.decorator.processing', 'nullProcessor').NullProcessor;

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
	
	request && Object.defineProperties(this, {
		'preprocessor': {
			value: preprocessorClass && !request.isMultipartRequest() ? new preprocessorClass(request, metadataClient) : new NullProcessor()
		},
		'postprocessor': {
			value: postprocessorClass && !request.isMultipartRequest() ? new postprocessorClass(request, metadataClient) : new NullProcessor()
		}
	});
}

/**
 * More speaking toString implementation that prints the class name.
 */
Decorator.prototype.toString = function() {
	return '[' + this.constructor.name + ' object]';
};

/**
 * Tells if this preprocessor should be applied to the current request.
 */
Decorator.prototype.preProcessorIsActive = function() {
	return this.preprocessor && this.preprocessor.isActive();
};

/**
 * Tells if this postprocessor should be applied to the current request.
 */
Decorator.prototype.postProcessorIsActive = function() {
	if(this.postprocessor && !this.postprocessor.isActive) throw this.postprocessor.isActive;
	return this.postprocessor && this.postprocessor.isActive();
};

/**
 * Template method that allows inheriting classes to customize
 * the request parameters before it is sent.
 */
Decorator.prototype.preRequest = function() { return this.preprocessor.apply(); };

Decorator.prototype.visitPreRequest = function(object, parent, name) {
	return this.preprocessor.visit(object, parent, name);
};

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
