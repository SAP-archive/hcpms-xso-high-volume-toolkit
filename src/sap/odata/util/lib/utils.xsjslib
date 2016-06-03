/**
 */
function Utils(request) {
	this.request = request;
}

/**
 * Returns a copy of the request parameters object, transformed to an
 * associative array.
 * 
 * @returns {object} An associative copy of the current request parameters
 */
Utils.prototype.copyParameters = function() {
	var parameters = {};
	for(var i = 0; i < this.request.parameters.length; i++) {
		parameters[this.request.parameters[i].name] = this.request.parameters[i].value;
	}
	
	return parameters;
};

/**
 * Returns the target service path which is being proxied, including the query path
 * 
 * <pre><code>
 * 
 * http://myhost:8000/my/service.xsodata/MyCollection
 *                   ^------------------------------^
 * </code></pre>
 */
Utils.prototype.getTargetCollectionPath = function() {
	return this.getTargetServicePath() + this.getQueryPath();
};

/**
 * Returns the request method if avaible, or undefined.
 * 
 * <pre><code>
 * 
 * http://myhost:8000/my/service.xsodata/MyCollection
 *                   ^------------------------------^
 * </code></pre>
 */
Utils.prototype.getRequestMethod = function() {
	if(this.request.body) return this.request.body.asWebRequest().method;
};

/**
 * Returns the target service path which is being proxied, excluding the query path
 * 
 * <pre><code>
 * 
 * http://myhost:8000/my/service.xsodata/MyCollection
 *                   ^-----------------^
 * </code></pre>
 */
Utils.prototype.getTargetServicePath = function() {
	return '/' + this.getServiceName() + '.xsodata';
};

Utils.prototype.getRequestPath = function() {
	return this.request.path.indexOf('/') === 0 ? this.request.path : $.request.path + '/' + this.request.path;
};

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
Utils.prototype.getServicePath = function() {
	var servicePathRegex = /(.*xsjs)/;
	
	var servicePath = servicePathRegex.exec(this.getRequestPath())[1];
	
	if(!servicePath) throw 'Unable to extract service path for OData decorator'
		' from current request path ' + this.getRequestPath();
	
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
Utils.prototype.getServiceName = function() {
	var serviceNameRegex = /.*(?:\/)(.*?)(?:\.xsjs)/;

	var serviceName = serviceNameRegex.exec(this.getRequestPath())[1];
	
	if(!serviceName) throw 'Unable to extract service name for OData decorator'
		' from current request path ' + this.getRequestPath();
	
	return serviceName;
};

/**
 * Returns the query path portion of the current request,
 * i.e. the additional path fragments following the actual URL.
 * 
 * <pre><code>path/to/my/service.xsjs --> <empty string></code></pre>
 * <pre><code>path/to/my/service.xsjs/and/more --> /and/more</code></pre>
 */
Utils.prototype.getQueryPath = function() {
	return this.request.queryPath ? '/' + this.request.queryPath : '';
};

/**
 * Extracts the collection name from the current query path. Throws an error
 * if the current request is not a collection this.request.
 * 
 * <pre><code>
 * 
 * http://myhost:8000/my/service.xsjs/MyCollection
 *                                    ^----------^
 * </code></pre>
 */
Utils.prototype.getCollectionName = function() {
	if(!this.isCollectionRequest()) throw 'Cannot extract collection name from non-entity set requests';
	var collectionNameRegex = /(?:\/)([a-zA-Z_][a-zA-Z0-9_]+)/;
	return collectionNameRegex.exec(this.getQueryPath())[1];
};

/**
 * Tells if the current requests is targeting an OData collection. 
 */
Utils.prototype.isCollectionRequest = function() {
	return this.request.queryPath && !this.isSingleEntityRequest() && !this.isMetadataRequest();
};

/**
 * Tells if the current request is targeting a single entity.
 */
Utils.prototype.isSingleEntityRequest = function() {
	var entityRegex = /\(.*\)/; //matches the (...) part when requesting single entities
	return this.getRequestPath().match(entityRegex);
};

/**
 * Tells if the current request is requesting metadata.
 */
Utils.prototype.isMetadataRequest = function() {
	var metadataRegex = /\/\$[a-zA-Z]*/; //matches e.g. /$metadata, /$count
	return this.getRequestPath().match(metadataRegex);
};

/**
 * Tells if the current requests is a GET this.request. 
 */
Utils.prototype.isGetRequest = function() {
	return this.request.method === $.net.http.GET;
};

/**
 * Tells if the current request is a $batch this.request. 
 */
Utils.prototype.isBatchRequest = function() {
	return this.request.method === $.net.http.POST && this.getRequestPath().match(/\$batch$/);
};