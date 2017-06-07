var Configuration = $.import('sap.odata.util.lib.db', 'configuration').Configuration;

function Response(webRequest, webResponse) {
	if(webRequest) {
		Object.defineProperties(this, {
			'webRequest': {
				value: webRequest
			},
			'webResponse': {
				value: webResponse
			},
			'successful': {
				value: webResponse.status < 300
			},
			'children': {
				value: []
			},
			'error': {
				value: null,
				writable: true
			}
		});
	}
}

/**
 * Traverses this request and its entities recursively, calling the specified visitor
 * with each sub-request. Unless this is a batch request, the visitor is only called once. 
 * 
 * @parameter visitor {function(Request)} visitor to call on each sub-request
 */
Response.prototype.traverse = function(visitor) {
	for(var i = 0; i < this.webRequest.children.length; i++) {
		if(!this.webResponse.entities[i]) continue; // The whole changeset failed
		var newChild = new WebEntityResponse(this.webRequest.children[i], this.webResponse.entities[i]);
		this.children.push(newChild);
		newChild.traverse(visitor);
	}
	visitor(this);
	
	return this;
};

/**
 * Tells if the current request is a $batch this.webRequest. 
 */
Response.prototype.isMultipartResponse = function() {
	return !!this.webResponse.entities.length;
};

/**
 * Tells if the current request is in a erroneous state due to postprocessing. 
 */
Response.prototype.hasPostProcessingError = function() {
	return !!this.error;
};

/**
 * Tells if the current request is in a erroneous state due to postprocessing. 
 */
Response.prototype.getPostProcessingError = function() {
	return this.error;
};

/**
 * Tells if the current request is in a erroneous state due to postprocessing. 
 */
Response.prototype.setPostProcessingError = function(error) {
	this.error = error;
};

/**
 * Truncates this response so that its content length will not exceed the byte limit
 * specified in the skiptoken.maxContentLength configuration parameter. This method
 * does not apply to batch requests.
 */
Response.prototype.truncate = function() { };

/**
 * Loads the most specific configuration value for the current request
 * based on the specified key.
 * 
 * Most specific based on granularity out of [global, service-level, collection-level].
 * 
 * @returns {string} The most specific configuration value
 */
Response.prototype.getConfiguredValue = function(key) {
	return Configuration.getProperty(key, this.webRequest.getServicePath(),
			this.webRequest.isCollectionRequest() ? this.webRequest.getCollectionName() : undefined);
};

/**
 * More speaking toString implementation that prints the class name and entity id.
 */
Response.prototype.toString = function() {
    var info = ' <uninitialized>';
    if(this.webRequest) info = ' ' + this.webRequest.id + ')';
	return '[' + this.constructor.name + info + ']';
};

var WebEntityResponse = $.import('sap.odata.util.lib.transfer.response', 'webEntityResponse').WebEntityResponse;
