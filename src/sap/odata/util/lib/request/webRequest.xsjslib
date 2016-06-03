var Request = $.import('sap.odata.util.lib.request', 'request').Request;

/**
 * 
 * 
 * <code>
 * 
 * GET https://example.hana.ondemand.com/path/to/service.xsodata HTTP/1.1
 * Content-Type: multipart/mixed;boundary=batch_7317-c239-9c8d
 * 
 * </code>
 * 
 * 
 */
function WebRequest(webRequest) {
	if(!webRequest) throw 'Missing required attribute webRequest\nat: ' + new Error().stack;
	
	Request.call(this, webRequest);
	
	Object.defineProperties(this, {
		'body': {
			value: webRequest.body
		},
		'path': {
			value: webRequest.path
		},
		'originalParameters': {
			value: this.copyParameters(false)
		},
		'parameters': {
			value: this.copyParameters()
		},
		'headers': {
			value: this.copyHeaders(false)
		},
		'id': {
			value: 'root'
		}
	});
	
	Object.defineProperties(this, {
		'boundary': {
			value: this.isMultipartRequest()
					? this.headers['content-type'].match(/boundary=(.*)$/)[1]
					: null
		}
	});
}

WebRequest.prototype = new Request();
WebRequest.prototype.constructor = WebRequest;

WebRequest.prototype.copy = function(propertyName, writable) {
	if(writable === undefined) writable = true;
	
	var copy = {};
	for(var i = 0; i < this.webRequest[propertyName].length; i++) {
		var property = this.webRequest[propertyName][i];
		
		Object.defineProperty(copy, property.name, {
			value: property.value,
			writable: writable,
			configurable: writable,
			enumerable: true
		})
	}
	
	return copy;
};

/*
 * See sap.odata.util.lib.request.Request#copyParameters
 */
WebRequest.prototype.copyParameters = function(writable) {
	return this.copy('parameters', writable);
};

/*
 * See sap.odata.util.lib.request.Request#copyParameters
 */
WebRequest.prototype.copyHeaders = function(writable) {
	return this.copy('headers', writable);
};

/*
 * See sap.odata.util.lib.request.Request#getTargetCollectionPath
 */
WebRequest.prototype.getTargetCollectionPath = function() {
	return this.getTargetServicePath() + this.getQueryPath();
};

/*
 * See sap.odata.util.lib.request.Request#getRequestMethod
 */
WebRequest.prototype.getRequestMethod = function() {
	return this.webRequest.method;
};

/*
 * See sap.odata.util.lib.request.Request#getPath
 */
WebRequest.prototype.getPath = function() {
	return this.webRequest.path;
};

/*
 * See sap.odata.util.lib.request.Request#getMethod
 */
WebRequest.prototype.getMethod = function() {
	return this.webRequest.method;
};

/*
 * See sap.odata.util.lib.request.Request#getTargetServicePath
 */
WebRequest.prototype.getTargetServicePath = function() {
	return '/' + this.getServiceName() + '.xsodata';
};

/*
 * See sap.odata.util.lib.request.Request#getQueryPath
 */
WebRequest.prototype.getQueryPath = function() {
	return this.webRequest.queryPath ? '/' + this.webRequest.queryPath : '';
};

/*
 * See sap.odata.util.lib.request.Request#applyParametersTo
 */
WebRequest.prototype.applyParametersTo = function(outboundEntity) {
	Object.getOwnPropertyNames(this.parameters).forEach(function(key) {
		outboundEntity.parameters.set(key, this.parameters[key] + '');
	}.bind(this));
};

/*
 * See sap.odata.util.lib.request.Request#copyRequestHeadersTo
 */
WebRequest.prototype.copyRequestHeadersTo = function(upstreamRequest) {
	Object.getOwnPropertyNames(this.headers).forEach(function(headerName) {
		upstreamRequest.headers.set(headerName, this.headers[headerName]);
	}.bind(this));
};

/*
 * See sap.odata.util.lib.request.Request#toUpstreamRequest
 */
WebRequest.prototype.toUpstreamRequest = function() {
	var outboundRequest = new $.net.http.Request(this.getMethod(), this.getTargetCollectionPath());
	
	this.copyRequestHeadersTo(outboundRequest);
	this.applyParametersTo(outboundRequest);
	
	outboundRequest.headers.set('Accept', 'application/json;charset=UTF-8;q=0.9,*/*;q=0.8');
	
	var body = this.getOutboundBody();
	outboundRequest.setBody(body);
	
	$.trace.debug('Outbound entity body:\n' + body);
	
	return outboundRequest;
};

WebRequest.prototype.getOutboundBody = function() {
	if(!this.isMultipartRequest() && this.webRequest.body) {
		return this.webRequest.body.asString();
	}
	
	return this.getOutboundChildEntityBody();
};

WebRequest.prototype.getOutboundChildEntityBody = function() {
	var bodyParts = [];
	
	this.children.forEach(function(child) {
		bodyParts.push('--' + this.boundary);
		bodyParts.push(child.getOutboundBody());
	}.bind(this));
	
	bodyParts.push('--' + this.boundary + '--');
	
	return bodyParts.join('\n');
};
