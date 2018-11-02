var Response = $.import('sap.odata.util.lib.transfer.response', 'response').Response;
var MultiMap = $.import('sap.odata.util.lib', 'multiMap').MultiMap;
var Performance = $.import('sap.odata.util.lib.performance', 'skiptoken').Performance;
var SkipTokenDecorator = $.import('sap.odata.util.lib.decorator', 'skiptoken').SkipTokenDecorator;
var COMMA_BYTE_LENGTH = ','.getByteLength();

/**
 * Response wrapper class for $batch entity response manipulation.
 */
function WebResponse(webRequest, webResponse) {
	if(!webRequest) throw 'Missing required attribute webRequest\nat: ' + new Error().stack;
	if(!webResponse) throw 'Missing required attribute webResponse for request ' + webRequest.id + '\nat: ' + new Error().stack;
	
	Performance.trace('Initializing ' + this, 'WebResponse ' + webRequest.id);
	
	Response.call(this, webRequest, webResponse); 
	
	var headers = this.copyHeaders(),
		json = webResponse.status < 300 &&
			headers.get('content-type') === 'application/json',
		data = this.webResponse.body ? json ? JSON.parse($.util.stringify(webResponse.body.asArrayBuffer())) :
			$.util.stringify(webResponse.body.asArrayBuffer()) : null;
	
	Object.defineProperties(this, {
		'data': {
			value: data
		},
		'json': {
			value: json && typeof data === 'object'
		},
		'headers': {
			value: headers
		}
	});
	
	Object.defineProperties(this, {
		'boundary': {
			value: this.isMultipartResponse()
					? this.headers.get('content-type').match(/boundary=([^;]*)/)[1]
					: null
		},
		'maxContentLength': {
		    value: parseInt(this.getConfiguredValue('skiptoken.maxContentLength'), 10)
		}
	});
	
	Performance.finishStep('WebResponse ' + webRequest.id);
}

WebResponse.prototype = new Response();
WebResponse.prototype.constructor = WebResponse;

/*
 * See sap.odata.util.lib.request.Request#copyRequestHeadersTo
 */
WebResponse.prototype.copy = function(propertyName) {
	return MultiMap.from(this.webResponse[propertyName]);
};

WebResponse.prototype.copyHeaders = function() {
	return this.copy('headers');
};

WebResponse.prototype.copyResponseHeadersTo = function(upstreamResponse) {
	this.headers.filter(function(entry) {
		// HANA will take care of this
		return ['content-length', 'content-encoding'].indexOf(entry.key) === -1;
	}).copyToTupleList(upstreamResponse.headers);
	upstreamResponse.contentType = this.headers.get('content-type');
};

/*
 * @see lib.transfer.response.Response.truncate
 */
WebResponse.prototype.truncate = function(outboundBody) {
    if(!this.getSkipTokenPostprocessor()) return false;
    
    var contentLength = outboundBody.getByteLength();
    var originalArrayLength = this.data.d.results.length;
    var sliceIndex;
    var droppedBytes = 0;
    // Minimum return one entity
    // If one single entity exceeds the size limit, we are screwed anyway
    if(contentLength < this.maxContentLength * 2) {
        $.trace.debug('Truncating downwards');
        for(sliceIndex = this.data.d.results.length; sliceIndex > 0 && (contentLength - droppedBytes) > this.maxContentLength; sliceIndex--) {
            droppedBytes += (JSON.stringify(this.data.d.results[sliceIndex - 1]).getByteLength() + COMMA_BYTE_LENGTH);
        }
    } else {
        $.trace.debug('Truncating upwards');
        var keptBytes = JSON.stringify(this.data.d.results[0]).getByteLength();
        var currentBytes = 0;
        for(sliceIndex = 1; sliceIndex <= this.data.d.results.length && (keptBytes + currentBytes) < this.maxContentLength; sliceIndex++) {
            keptBytes += currentBytes;
            currentBytes = JSON.stringify(this.data.d.results[sliceIndex - 1]).getByteLength() + COMMA_BYTE_LENGTH;
        }
        if(sliceIndex > 1) {
            sliceIndex--;
        }
        droppedBytes = contentLength - keptBytes;
    }
    this.data.d.results = this.data.d.results.slice(0, sliceIndex);
    
    if(droppedBytes) {
        $.trace.info("Dropped " + droppedBytes + " bytes in " + (originalArrayLength - sliceIndex) + " entites.");
        this.data.d.__next = this.getSkipTokenPostprocessor().getWrapperNextPageUrl(this.data.d.results[this.data.d.results.length - 1]);
        delete this.data.d.__delta; // Only the final page should have a delta token
        return true;
    }
    return false;
};

WebResponse.prototype.getSkipTokenPostprocessor = function() {
    var decorators = this.webRequest.decorator.decorators;
    var skipTokenDecorator;
    
    for(var i = 0; i < decorators.length; i++) {
        if(decorators[i].constructor === SkipTokenDecorator) skipTokenDecorator = decorators[i];
    }
    
    return (skipTokenDecorator || {}).postprocessor;
};

WebResponse.prototype.applyToOutboundResponse = function() {
	this.copyResponseHeadersTo($.response);
	
	$.response.status = this.hasPostProcessingError() ? + this.error.code : this.webResponse.status;
	
	var body = this.getOutboundBody();
	
	Performance.trace('Truncating response', 'WebResponse.truncate');
	
	if(this.webRequest.isCollectionRequest() && this.data.d && this.data.d.results && this.truncate(body)) {
	    body = this.getOutboundBody();
	}
	
	Performance.finishStep('WebResponse.truncate');
	
	$.trace.debug('Outbound response body:\n' + body);
	
	$.response.setBody(body);
};

WebResponse.prototype.getOutboundBody = function() {
    var result;
    
    Performance.trace('Serializing response', 'WebResponse.serialize');
    
	if(this.hasPostProcessingError()) {
	    result = JSON.stringify({error: this.error});
	} else if(!this.isMultipartResponse()) {
		result = this.json ? JSON.stringify(this.data) : this.data || '';
	} else {
	    result = this.getOutboundChildEntityBody() + '\r\n';
	}
	
	Performance.finishStep('WebResponse.serialize');
	
	return result;
};

WebResponse.prototype.getOutboundChildEntityBody = function() {
	var bodyParts = [];
	
	this.children.forEach(function(child) {
		bodyParts.push('--' + this.boundary);
		bodyParts.push(child.getOutboundBody());
	}.bind(this));
	
	bodyParts.push('--' + this.boundary + '--');
	
	return bodyParts.join('\r\n') + '\r\n';
};
