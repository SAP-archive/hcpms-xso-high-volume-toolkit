var Configuration = $.import('sap.odata.util.lib.db', 'configuration').Configuration;
var Utils = $.import('sap.odata.util.lib', 'utils').Utils;

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
 * By default, this is is the case for GET requests against collections.
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
 * @parameter {objec|string} response Metadata XML string (iff <code>isMetadataRequest()</code>),
 * 		parsed response body (iff <code>!isMetadataRequest()</code>) or undefined, if there was no body
 * 
 * @returns Transformed data. If a falsy value is returned, the original data is sent to the client.
 */
Decorator.prototype.postRequest = function(response) { return this.postprocessor.apply(response); };
