var Request = $.import('sap.odata.util.lib.request', 'request').Request;
var WebRequest = $.import('sap.odata.util.lib.request', 'webRequest').WebRequest;

/**
 * 
 * 
 * 
 * <code>
 * 
 * POST https://example.hana.ondemand.com/path/to/service.xsodata/$batch HTTP/1.1
 * Content-Type: multipart/mixed;boundary=batch_7317-c239-9c8d
 * 
 * --batch_7317-c239-9c8d
 * Content-Type: multipart/mixed; boundary=changeset_63f8-0a2b-ee0b
 * 
 * --changeset_63f8-0a2b-ee0b
 * Content-Type: application/http
 * Content-Transfer-Encoding: binary
 * 
 * MERGE Buyer('0100000000') HTTP/1.1
 * Accept-Language: en-US
 * Accept: application/json
 * MaxDataServiceVersion: 2.0
 * DataServiceVersion: 2.0
 * Content-Type: application/json
 * Content-Length: 40
 * 
 * {"EMAILADDRESS":"karl.mueller2@sap.com"}
 * --changeset_63f8-0a2b-ee0b--
 * 
 * 
 * --batch_7317-c239-9c8d
 * Content-Type: application/http
 * Content-Transfer-Encoding: binary
 * 
 * GET Buyer/$count HTTP/1.1
 * Accept-Language: en-US
 * Accept: application/json
 * MaxDataServiceVersion: 2.0
 * DataServiceVersion: 2.0
 * 
 * 
 * --batch_7317-c239-9c8d--
 * </code>
 * 
 * 
 */
function WebEntityRequest(webRequest, id) {
	if(!webRequest) throw 'Missing required attribute webRequest\nat: ' + new Error().stack;
	if(!id) throw 'Missing required attribute id\nat: ' + new Error().stack;
	
	
	Request.call(this, webRequest);
	
	Object.defineProperties(this, {
		'id': {
			value: id
		}
	});
	
	if(!this.isMultipartRequest()) {
		var body = webRequest.body.asString();
		var parseRegex = /^([A-Z]+)\s+([^?]+)\??(\S+)?\s+HTTP\/1\.1\s*([\s\S]*)(\r\n\r\n|\r\r|\n\n)([\s\S]*)?$/;
		//				   ^method    ^path	  ^query			   ^headers	^2x newline	  ^body
		var pieces = body.match(parseRegex);
		var headerLines = pieces[4].split(/\r\n?|\n/).filter(function(pair) { return pair.length; });
		var headers = {};
		headerLines.forEach(function(line) {
			var keyAndValue = line.split(': '),
				key = keyAndValue[0],
				value = keyAndValue[1];
			headers[key] = value;
		});
		headers['Accept'] = 'application/json;charset=UTF-8;q=0.9,*/*;q=0.8';
		
		var parameterPairs = (pieces[3] || '').split(/&/).filter(function(pair) { return pair.length; });
		var parameters = {};
		
		parameterPairs.forEach(function(pair) {
			var split = pair.split(/=/);
			parameters[split[0]] = split[1];
		});
		
		var parsedBody = {
			method: pieces[1],
			path: pieces[2],
			headers: headers,
			body: pieces[6] || '',
			parameters: parameters
		};
		
		this.parsedBody = parsedBody;
		
		Object.defineProperties(this, {
			'originalParameters': {
				value: this.copyParameters(false)
			},
			'parameters': {
				value: this.copyParameters()
			},
			'headers': {
				value: this.copyHeaders(false)
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
	} else {
		Object.defineProperties(this, {
			'boundary': {
				value: this.webRequest.headers.get('content-type').match(/boundary=(.*)$/)[1]
			}
		});
	}
}

WebEntityRequest.prototype = new Request();
WebEntityRequest.prototype.constructor = WebEntityRequest;

WebEntityRequest.prototype.copy = function(propertyName, writable) {
	if(writable === undefined) writable = true;
	var copy = {};
	var property = this.parsedBody[propertyName];
	Object.getOwnPropertyNames(property).forEach(function(propertyName) {
		Object.defineProperty(copy, propertyName, {
			value: property[propertyName],
			writable: writable,
			configurable: writable,
			enumerable: true
		})
	});
	
	return copy;
};

/*
 * See sap.odata.util.lib.request.Request#copyParameters
 */
WebEntityRequest.prototype.copyParameters = function(writable) {
	return this.copy('parameters', writable);
};

/*
 * See sap.odata.util.lib.request.Request#copyParameters
 */
WebEntityRequest.prototype.copyHeaders = function(writable) {
	return this.copy('headers', writable);
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
	Object.getOwnPropertyNames(this.parameters).forEach(function(key) {
		outboundEntity.parameters.set(key, this.parameters[key] + '');
	}.bind(this));
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
		        WebRequest.prototype.getOutboundChildEntityBody.call(this)].join('\n');
	}
	
	return [this.getOutboundHeaderString(),
 	        this.getOutboundRequestLine(),
	        this.getOutboundBodyHeaderString(),
	        this.parsedBody.body].join('\n');
};

WebEntityRequest.prototype.getOutboundHeaderString = function() {
	var headerLines = [];
	for(var i = 0; i < this.webRequest.headers.length; i++) {
		var header = this.webRequest.headers[i];
		headerLines.push(header.name + ': ' + header.value);
	}
	
	return headerLines.join('\n') + '\n';
};

WebEntityRequest.prototype.getOutboundRequestLine = function() {
	var query = this.querify(this.parameters);
	return this.parsedBody.method + ' ' + this.getQueryPath().substring(1) + (query ? '?' + query : '') + ' HTTP/1.1';
};

WebEntityRequest.prototype.getOutboundBodyHeaderString = function() {
	var bodyHeaderLines = [];
	Object.getOwnPropertyNames(this.parsedBody.headers).forEach(function(header) {
		bodyHeaderLines.push(header + ': ' + this.parsedBody.headers[header]);
	}.bind(this));
	
	return bodyHeaderLines.join('\n') + '\n';
};

/**
 * Turns the specified parameters object into a query string.
 * Values are URL-encoded.
 */
WebEntityRequest.prototype.querify = function(parameters) {
	return Object.getOwnPropertyNames(parameters).map(function(key) {
		return key + '=' + escape(parameters[key]);
	}).join('&');
};
