/**
 * "Interface" class defining a common API for both WebRequests and $batch request entities.
 * 
 *  This class provides some common features, but is by no means meant as a contract in terms of
 *  the Liskov substitution principle. Subclasses may behave radically different.
 * 
 */
function Request(webRequest) {
	if(webRequest) {
		Object.defineProperty(this, 'webRequest', { value: webRequest });
		Object.defineProperties(this, {
			'children': {
				value: []
			}
		});
	}
}

function notImplemented() { throw 'Method not implemented:\n' + new Error().stack; };

/**
 * Traverses this request and its entities recursively, calling the specified visitor
 * with each sub-request. Unless this is a batch request, the visitor is only called once. 
 * 
 * @parameter visitor {function(Request)} visitor to call on each sub-request
 */
Request.prototype.traverse = function(visitor) {
	for(var i = 0; i < this.webRequest.entities.length; i++) {
		var newChild = new WebEntityRequest(this.webRequest.entities[i], this.id + '.' + i);
		this.children.push(newChild);
		newChild.traverse(visitor);
	}
	
	visitor(this);
	
	return this;
};

/**
 * Returns a copy of the request parameters object, transformed to an
 * associative array.
 * 
 * @parameter writable {boolean?} If set to false, returns a read-only copy of the parameters.
 * 	Default: true
 * 
 * @returns {object} An associative copy of the current request parameters
 */
Request.prototype.copyParameters = notImplemented;

/**
 * Returns a copy of the request headers object, transformed to an
 * associative array.
 * 
 * @parameter writable {boolean?} If set to false, returns a read-only copy of the parameters.
 * 	Default: true
 * 
 * @returns {object} An associative copy of the current request headers
 */
Request.prototype.copyHeaders = function() {};

/**
 * Returns the target service path which is being proxied, including the query path
 * 
 * <pre><code>
 * 
 * http://myhost:8000/my/service.xsodata/MyCollection
 *                   ^------------------------------^
 * </code></pre>
 */
Request.prototype.getTargetCollectionPath = notImplemented;

/**
 * Returns the request method if avaible, or undefined.
 * 
 * <pre><code>
 * 
 * http://myhost:8000/my/service.xsodata/MyCollection
 *                   ^------------------------------^
 * </code></pre>
 */
Request.prototype.getRequestMethod = notImplemented;

/**
 * Returns the target service path which is being proxied, excluding the query path
 * 
 * <pre><code>
 * 
 * http://myhost:8000/my/service.xsodata/MyCollection
 *                   ^-----------------^
 * </code></pre>
 */
Request.prototype.getTargetServicePath = notImplemented;

/**
 * Returns the request path, including the query path
 * 
 * <pre><code>
 * 
 * http://myhost:8000/my/service.xsjs/MyCollection
 *                   ^---------------------------^
 * </code></pre>
 */
Request.prototype.getPath = notImplemented;

/**
 * Returns the full request path, including the query path
 * 
 * <pre><code>
 * 
 * http://myhost:8000/my/service.xsodata/MyCollection
 * ^------------------------------------------------^
 * </code></pre>
 */
Request.prototype.getFullTargetServicePath = function() {
	var fullPath = this.getPath().indexOf('http') === 0 ? this.getPath() :
		$.request.headers.get('clientprotocol') + '://' +
		$.request.headers.get('host') + this.getPath();
	
	return fullPath.replace(/\.xsjs/, '.xsodata');
};

/**
 * Returns the request method.
 * 
 */
Request.prototype.getMethod = notImplemented;

/**
 * Returns the request method name.
 * 
 */
Request.prototype.getMethodName = notImplemented;

/**
 * Returns wrapper service path.
 * 
 * <pre><code>
 * 
 * http://myhost:8000/my/service.xsjs/MyCollection
 *                   ^--------------^
 * </code></pre>
 * 
 * @returns {string} The wrapper service path
 */
Request.prototype.getServicePath = function() {
	var servicePathRegex = /(.*xsjs)/;
	
	var servicePath = servicePathRegex.exec(this.getPath())[1];
	
	if(!servicePath) throw 'Unable to extract service path for OData decorator'
		' from request ' + this.id + ' path ' + this.getPath() + '\nat: ' + new Error().stack;
	
	return servicePath;
};

/**
 * Returns the name of the wrapped service, which by convention
 * is identical to the wrapper service name.
 * 
 * <pre><code>
 * 
 * http://myhost:8000/my/service.xsjs/MyCollection
 *                       ^-----^
 * </code></pre>
 * 
 * @returns {string} The (wrapper and target) service name.
 */
Request.prototype.getServiceName = function() {
	var serviceNameRegex = /.*(?:\/)(.*?)(?:\.xsjs)/;

	var serviceName = serviceNameRegex.exec(this.getPath())[1];
	
	if(!serviceName) throw 'Unable to extract service name for OData decorator'
		' from current request ' + this.id + ' path ' + this.getPath() + '\nat: ' + new Error().stack;
	
	return serviceName;
};

/**
 * Returns the query path portion of the current request,
 * i.e. the additional path fragments following the actual URL.
 * 
 * <pre><code>path/to/my/service.xsjs --> <empty string></code></pre>
 * <pre><code>path/to/my/service.xsjs/and/more --> /and/more</code></pre>
 */
Request.prototype.getQueryPath = notImplemented;

/**
 * Extracts the collection name from the current query path. Throws an error
 * if the current request is not a collection this.webRequest.
 * 
 * <pre><code>
 * 
 * http://myhost:8000/my/service.xsjs/MyCollection
 *                                    ^----------^
 * </code></pre>
 */
Request.prototype.getCollectionName = function() {
	if(!this.isCollectionRequest()) {
		throw 'Cannot extract collection name from non-entity set request ' + this.id + ' \nat: ' + new Error().stack;
	}
	var collectionNameRegex = /(?:\/)([a-zA-Z_][a-zA-Z0-9_]+)/;
	return collectionNameRegex.exec(this.getQueryPath())[1];
};

/**
 * Tells if the current requests is targeting an OData collection. 
 */
Request.prototype.isCollectionRequest = function() {
	return this.getQueryPath() && !this.isSingleEntityRequest() && !this.isMetadataRequest();
};

/**
 * Tells if the current request is targeting a single entity.
 */
Request.prototype.isSingleEntityRequest = function() {
	var entityRegex = /\(.*\)/; //matches the (...) part when requesting single entities
	return this.getPath().match(entityRegex);
};

/**
 * Tells if the current request is requesting the service root.
 */
Request.prototype.isServiceRootRequest = function() {
	var metadataRegex = /\.xsjs$/;
	return this.getPath().match(metadataRegex);
};

/**
 * Tells if the current request is requesting metadata.
 */
Request.prototype.isMetadataRequest = function() {
	var metadataRegex = /\/\$metadata.*/;
	return this.getPath().match(metadataRegex);
};

/**
 * Tells if the current request is requesting a collection count.
 */
Request.prototype.isCountRequest = function() {
	var metadataRegex = /\/\$count.*/;
	return this.getPath().match(metadataRegex);
};

/**
 * Tells if the current requests is a GET request. 
 */
Request.prototype.isGetRequest = function() {
	return !this.isMultipartRequest() &&
		this.getMethod() === $.net.http.GET;
};

/**
 * Tells if the current request is a $batch request. 
 */
Request.prototype.isMultipartRequest = function() {
	return !!this.webRequest.entities.length;
};

/**
 * Tells if the current request is a delta request. 
 */
Request.prototype.isDeltaRequest = function() {
	return this.originalParameters.contains('!deltatoken');
};


/**
 * Applies the current request parameters to the specified request.
 */
Request.prototype.applyParametersTo= notImplemented;

/**
 * Copies the current request headers to the specified web request.
 */
Request.prototype.copyRequestHeadersTo = notImplemented;

/**
 * Creates a new $.net.http.Request from this request
 */
Request.prototype.toUpstreamRequest = notImplemented;

/**
 * More speaking toString implementation that prints the class name and entity id.
 */
Request.prototype.toString = function() {
	return '[' + this.constructor.name + ' ' + this.id + ' (' + this.getRequestDetailMessage() + ')]';
};

Request.prototype.getRequestDetailMessage = function() {
    return this.isMultipartRequest() ? 'multipart ' + this.boundary : this.getMethodName() + ' ' + this.getQueryPath();
};

// At bottom due to circular reference
var WebRequest = $.import('sap.odata.util.lib.request', 'webRequest').WebRequest;
var WebEntityRequest = $.import('sap.odata.util.lib.request', 'webEntityRequest').WebEntityRequest;
