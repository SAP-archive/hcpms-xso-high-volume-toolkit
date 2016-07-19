$.import('sap.odata.util.lib', 'String.getByteLength');
var Request = $.import('sap.odata.util.lib.request', 'request').Request;
var WebRequest = $.import('sap.odata.util.lib.request', 'webRequest').WebRequest;
var MultiMap = $.import('sap.odata.util.lib', 'multiMap').MultiMap;

/**
 * Request wrapper class for top-level request manipulation.
 * 
 */
function WebEntityRequest(webRequest, id, destination) {
	if(!webRequest) throw 'Missing required attribute webRequest\nat: ' + new Error().stack;
	if(!id) throw 'Missing required attribute id\nat: ' + new Error().stack;
	if(!destination) throw 'Missing required attribute destination\nat: ' + new Error().stack;
	
	
	Request.call(this, webRequest, destination);
	
	Object.defineProperties(this, {
		'id': {
			value: id
		}
	});
	
	if(!this.isMultipartRequest()) {
		var webRequestBody = webRequest.body.asString();
		var parseRegex = /^([A-Z]+)\s+([^?]+)\??(\S+)?\s+HTTP\/1\.1\s*(((?!\n\n)(?!\r\r)(?!\r\n\r\n)[\s\S])*)(\r\n\r\n|\r\r|\n\n)([\s\S]*)?$/;
		//				   ^method    ^path	  ^query ^headers								^2x newline			^body
		var pieces = webRequestBody.match(parseRegex);
		var headerLines = pieces[4].split(/\r\n?|\n/).filter(function(pair) { return pair.length; });
		var headers = new MultiMap();
		headerLines.forEach(function(line) {
			var keyAndValue = line.split(': '),
				key = keyAndValue[0],
				value = keyAndValue[1];
			headers.set(key, value);
		});
		headers.add('Accept', 'application/json;charset=UTF-8;q=0.9,*/*;q=0.8');
		
		var parameterPairs = (pieces[3] || '').split(/&/).filter(function(pair) { return pair.length; });
		var parameters = new MultiMap();
		
		parameterPairs.forEach(function(pair) {
			var split = pair.split(/=/);
			parameters.set(split[0], split[1]);
		});
		
		var parsedBody = {
			method: pieces[1],
			path: pieces[2],
			headers: headers,
			body: pieces[7] || '',
			parameters: parameters
		};
		
		this.parsedBody = parsedBody;
		
		Object.defineProperties(this, {
			'originalParameters': {
				value: Object.freeze(this.copyParameters())
			},
			'parameters': {
				value: this.copyParameters()
			},
			'headers': {
				value: Object.freeze(this.copyHeaders())
			},
			'methodMap': {
				value: {
				    'OPTIONS': 0,
					'GET': 1,
					'HEAD': 2,
					'POST': 3,
					'PUT': 4,
					'DELETE': 5,
					'TRACE': 6,
					'CONNECT': 7
				}
			},
			'id': {
				value: id
			}
		});
		
		var json = this.headers.get('content-type') === 'application/json' ||
		this.headers.get('content-type') === 'text/json';
		var rawBody = parsedBody.body;
		var body = json && rawBody ? JSON.parse(rawBody) : rawBody;
		
		Object.defineProperties(this, {
			'json': {
				value: json && typeof body === 'object'
			},
			'body': {
				value: body
			}
		});
	} else {
		Object.defineProperties(this, {
			'boundary': {
				value: this.webRequest.headers.get('content-type').match(/boundary=([^;]*)/)[1]
			}
		});
	}
}

WebEntityRequest.prototype = new Request();
WebEntityRequest.prototype.constructor = WebEntityRequest;

WebEntityRequest.prototype.copy = function(propertyName) {
	return MultiMap.from(this.parsedBody[propertyName]);
};

/*
 * See sap.odata.util.lib.request.Request#copyParameters
 */
WebEntityRequest.prototype.copyParameters = function() {
	return this.copy('parameters');
};

/*
 * See sap.odata.util.lib.request.Request#copyParameters
 */
WebEntityRequest.prototype.copyHeaders = function() {
	return this.copy('headers');
};

/*
 * See sap.odata.util.lib.request.Request#getServicePath
 */
WebEntityRequest.prototype.getServicePath = function() {
	var servicePathRegex = /(.*xsjs)/;
	
	var servicePath = servicePathRegex.exec(this.getPath())[1];
	
	if(!servicePath) throw 'Unable to extract service path for OData decorator'
		' from current request path ' + this.getPath();
	
	return servicePath;
};

/*
 * See sap.odata.util.lib.request.Request#getRequestPath
 */
WebEntityRequest.prototype.getPath = function() {
	return this.parsedBody.path.indexOf('/') === 0 ? this.parsedBody.path :
		$.request.path.substring(0, $.request.path.length - '/$batch'.length) + '/' + this.parsedBody.path;
};

/*
 * See sap.odata.util.lib.request.Request#getMethod
 */
WebEntityRequest.prototype.getMethod = function() {
	return this.methodMap[this.parsedBody.method];
};

/*
 * See sap.odata.util.lib.request.Request#getMethodName
 */
WebRequest.prototype.getMethodName = function() {
	return this.parsedBody.method;
};

/*
 * See sap.odata.util.lib.request.Request#getQueryPath
 */
WebEntityRequest.prototype.getQueryPath = function() {
	var queryPathRegex = /(.*xsjs)(.*)/;
	
	var queryPath = queryPathRegex.exec(this.getPath())[2];
	
	if(!queryPath) throw 'Unable to extract service path for OData decorator'
		' from current request path ' + this.getPath();
	
	return queryPath;
};

/*
 * See sap.odata.util.lib.request.Request#applyParametersTo
 */
WebEntityRequest.prototype.applyParametersTo = function(outboundEntity) {
	this.parameters.copyToTupleList(outboundEntity.parameters);
};

/*
 * See sap.odata.util.lib.request.Request#copyRequestHeadersTo
 */
WebEntityRequest.prototype.copyRequestHeadersTo = function(upstreamRequest) {
	var query = this.querify(this.parameters);
	this.parsedBody.path = this.getPath() + (query ? '?' + query : '');
};

WebEntityRequest.prototype.getOutboundBody = function() {
	if(this.isMultipartRequest()) {
		return [this.getOutboundHeaderString(),
		        WebRequest.prototype.getOutboundChildEntityBody.call(this) + '\r\n'].join('\r\n');
	}
	
	var bodyBody = this.getOutboundBodyBodyString();
	
	this.parsedBody.headers.set('Content-Length', bodyBody.getByteLength());
	
	return [this.getOutboundHeaderString(),
 	        this.getOutboundRequestLine(),
	        this.getOutboundBodyHeaderString(),
	        bodyBody].join('\r\n');
};

WebEntityRequest.prototype.getOutboundHeaderString = function() {
	var headerLines = [];
	for(var i = 0; i < this.webRequest.headers.length; i++) {
		var header = this.webRequest.headers[i];
		headerLines.push(header.name + ': ' + header.value);
	}
	
	return headerLines.join('\r\n') + '\r\n';
};

WebEntityRequest.prototype.getOutboundRequestLine = function() {
	var query = this.querify(this.parameters);
	return this.parsedBody.method + ' ' + this.getQueryPath().substring(1) + (query ? '?' + query : '') + ' HTTP/1.1';
};

WebEntityRequest.prototype.getOutboundBodyHeaderString = function() {
	return this.parsedBody.headers.map(function(entry) {
		return entry.key + ': ' + entry.value;
	}.bind(this)).join('\r\n') + '\r\n';
};

WebEntityRequest.prototype.getOutboundBodyBodyString = function() {
	return this.json ? JSON.stringify(this.body) : this.body;
};

/**
 * Turns the specified parameters object into a query string.
 * Values are URL-encoded.
 */
WebEntityRequest.prototype.querify = function(parameters) {
	return parameters.map(function(entry) {
		return entry.key + '=' + escape(entry.value);
	}).join('&');
};
