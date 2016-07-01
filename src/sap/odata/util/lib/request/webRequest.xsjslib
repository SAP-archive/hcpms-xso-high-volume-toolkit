var Request = $.import('sap.odata.util.lib.request', 'request').Request;
var MultiMap = $.import('sap.odata.util.lib', 'multiMap').MultiMap;

/**
 * Request wrapper class for $batch entity request manipulation.
 */
function WebRequest(webRequest, destination) {
	if(!webRequest) throw 'Missing required attribute webRequest\nat: ' + new Error().stack;
	if(!destination) throw 'Missing required attribute destination\nat: ' + new Error().stack;
	
	Request.call(this, webRequest, destination);
	
	Object.defineProperties(this, {
		'path': {
			value: webRequest.path
		},
		'originalParameters': {
			value: Object.freeze(this.copyParameters())
		},
		'parameters': {
			value: this.copyParameters()
		},
		'headers': {
			value: Object.freeze(this.copyHeaders())
		},
		'id': {
			value: 'root'
		}
	});
	
	var json = this.headers.get('content-type') === 'application/json' ||
		this.headers.get('content-type') === 'text/json';
	var body = webRequest.body ? webRequest.body.asString() : null;
	
	Object.defineProperties(this, {
		'boundary': {
			value: this.isMultipartRequest()
					? this.headers.get('content-type').match(/boundary=(.*)$/)[1]
					: null
		},
		'json': {
			value: json
		},
		'body': {
			value: json && body ? JSON.parse(body) : body
		}
	});
}

WebRequest.prototype = new Request();
WebRequest.prototype.constructor = WebRequest;

WebRequest.prototype.copy = function(propertyName) {
	return MultiMap.from(this.webRequest[propertyName]);
};

/*
 * See sap.odata.util.lib.request.Request#copyParameters
 */
WebRequest.prototype.copyParameters = function() {
	return this.copy('parameters');
};

/*
 * See sap.odata.util.lib.request.Request#copyParameters
 */
WebRequest.prototype.copyHeaders = function() {
	return this.copy('headers');
};

/*
 * See sap.odata.util.lib.request.Request#getTargetCollectionPath
 */
WebRequest.prototype.getTargetCollectionPath = function() {
	return this.getTargetServiceName() + this.getQueryPath();
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
 * See sap.odata.util.lib.request.Request#getMethodName
 */
WebRequest.prototype.getMethodName = function() {
	return this.headers.get('~request_method');
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
	this.parameters.copyToTupleList(outboundEntity.parameters);
};

/*
 * See sap.odata.util.lib.request.Request#copyRequestHeadersTo
 */
WebRequest.prototype.copyRequestHeadersTo = function(upstreamRequest) {
	this.headers.copyToTupleList(upstreamRequest.headers);
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
	if(body) outboundRequest.setBody(body);
	
	$.trace.debug('Outbound entity body:\n' + body);
	
	return outboundRequest;
};

WebRequest.prototype.getOutboundBody = function() {
	if(!this.isMultipartRequest()) {
		return this.json ? JSON.stringify(this.body) : (this.body || '');
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
