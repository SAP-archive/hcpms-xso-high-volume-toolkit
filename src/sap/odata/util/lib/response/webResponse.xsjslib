var Response = $.import('sap.odata.util.lib.response', 'response').Response;

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
function WebResponse(webRequest, webResponse) {
	if(!webRequest) throw 'Missing required attribute webRequest\nat: ' + new Error().stack;
	if(!webResponse) throw 'Missing required attribute webResponse for request ' + webRequest.id + '\nat: ' + new Error().stack;
	
	Response.call(this, webRequest, webResponse);
	
	var headers = this.copyHeaders(false),
		json = webResponse.status < 300 &&
			headers['content-type'] === 'application/json',
		data = this.webResponse.body ? json ? JSON.parse(this.webResponse.body.asString()) :
			this.webResponse.body.asString() : null;
			
	Object.defineProperties(this, {
		'data': {
			value: data
		},
		'json': {
			value: json
		},
		'headers': {
			value: headers
		}
	});
	
	Object.defineProperties(this, {
		'boundary': {
			value: this.isMultipartResponse()
					? this.headers['content-type'].match(/boundary=(.*)$/)[1]
					: null
		}
	});
}

WebResponse.prototype = new Response();
WebResponse.prototype.constructor = WebResponse;

/*
 * See sap.odata.util.lib.request.Request#copyRequestHeadersTo
 */
WebResponse.prototype.copy = function(propertyName, writable, excludes) {
	if(writable === undefined) writable = true;
	var copy = {};
	var cookie = false;
	for(var i = 0; i < this.webResponse[propertyName].length; i++) {
		var property = this.webResponse[propertyName][i];
		
		if(excludes.indexOf(property.name) !== -1) continue;
		Object.defineProperty(copy, property.name, {
			value: property.value,
			writable: writable,
			configurable: writable,
			enumerable: true
		})
	}
	
	return copy;
};

WebResponse.prototype.copyHeaders = function(writable) {
	return this.copy('headers', writable, ['set-cookie']);
};

WebResponse.prototype.copyResponseHeadersTo = function(upstreamResponse) {
	Object.getOwnPropertyNames(this.headers).forEach(function(headerName) {
		if(['content-length', 'content-encoding'].indexOf(headerName) !== -1) return; // HANA will set those
		upstreamResponse.headers.set(headerName, this.headers[headerName]);
	}.bind(this));
};

WebResponse.prototype.applyToOutboundResponse = function() {
	this.copyResponseHeadersTo($.response);
	$.response.status = this.webResponse.status;
	
	$.response.setBody(this.getOutboundBody());
};

WebResponse.prototype.getOutboundBody = function() {
	if(!this.isMultipartResponse()) {
		return this.json ? JSON.stringify(this.data) : this.data || '';
	}
	
	return this.getOutboundChildEntityBody();
};

WebResponse.prototype.getOutboundChildEntityBody = function() {
	var bodyParts = [];
	
	this.children.forEach(function(child) {
		bodyParts.push('--' + this.boundary);
		bodyParts.push(child.getOutboundBody());
	}.bind(this));
	
	bodyParts.push('--' + this.boundary + '--');
	
	return bodyParts.join('\n');
};


