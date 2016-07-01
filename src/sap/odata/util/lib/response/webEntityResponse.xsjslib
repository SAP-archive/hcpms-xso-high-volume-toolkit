var Response = $.import('sap.odata.util.lib.response', 'response').Response;
var WebResponse = $.import('sap.odata.util.lib.response', 'webResponse').WebResponse;
var MultiMap = $.import('sap.odata.util.lib', 'multiMap').MultiMap;

/**
 * Response wrapper class for top-level response manipulation.
 */
function WebEntityResponse(webRequest, webResponse) {
	if(!webRequest) throw 'Missing required attribute webRequest\nat: ' + new Error().stack;
	if(!webResponse) throw 'Missing required attribute webResponse for request ' + webRequest.id + '\nat: ' + new Error().stack;
	
	Response.call(this, webRequest, webResponse);
	
	if(!this.isMultipartResponse()) {
		var body = webResponse.body.asString();
		var parseRegex = /^HTTP\/1\.1\s+([0-9.]+)\s+([a-zA-Z ]+)\s*([\s\S]*)(\r\n\r\n|\r\r|\n\n)([\s\S]*)?$/;
		//				                ^status		^status msg    ^headers	^2x newline			^body
		var pieces = body.match(parseRegex);
		var headerLines = pieces[3].split(/\r\n?|\n/);
		var headers = new MultiMap();
		headerLines.forEach(function(line) {
			var keyAndValue = line.split(': '),
				key = keyAndValue[0],
				value = keyAndValue[1];
			headers.add(key, value);
		});
		
		var parsedBody = {
			status: pieces[1],
			message: pieces[2],
			headers: headers,
			body: pieces[5] || ''
		};
		
		this.parsedBody = parsedBody;
		
		var json = parsedBody.status < 300 &&
				headers.get('Content-Type') === 'application/json',
			data = json ? JSON.parse(parsedBody.body) :
				parsedBody.body;
		
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
	} else {
		Object.defineProperties(this, {
			'boundary': {
				value: webResponse.headers.get('content-type').match(/boundary=(.*)$/)[1]
			}
		});
	}
}

WebEntityResponse.prototype = new Response();
WebEntityResponse.prototype.constructor = WebEntityResponse;

/*
 * See sap.odata.util.lib.request.Request#copyRequestHeadersTo
 */
WebEntityResponse.prototype.copy = function(propertyName) {
	return MultiMap.from(webResponse[propertyName]);
};

WebEntityResponse.prototype.copyHeaders = function() {
	return this.copy('headers');
}

WebEntityResponse.prototype.getOutboundBody = function() {
	if(this.isMultipartResponse()) {
		return [this.getOutboundHeaderString(),
		WebResponse.prototype.getOutboundChildEntityBody.call(this)].join('\n');
	}
	
	var body = [this.getOutboundHeaderString(),
	 	        this.getOutboundResponseLine(),
		        this.getOutboundBodyHeaderString(),
		        this.json ? JSON.stringify(this.data) : this.data].join('\n')
	
	return body;
};

WebEntityResponse.prototype.getOutboundHeaderString = function() {
	var headerLines = [];
	for(var i = 0; i < this.webResponse.headers.length; i++) {
		var header = this.webResponse.headers[i];
		headerLines.push(header.name + ': ' + header.value);
	}
	
	return headerLines.join('\n') + '\n';
};

WebEntityResponse.prototype.getOutboundResponseLine = function() {
	return 'HTTP/1.1 ' + this.parsedBody.status + ' ' + this.parsedBody.message;
};

WebEntityResponse.prototype.getOutboundBodyHeaderString = function() {
	return this.parsedBody.headers.map(function(entry) {
		return entry.key + ': ' + entry.value;
	}.bind(this)).join('\n') + '\n';
};
