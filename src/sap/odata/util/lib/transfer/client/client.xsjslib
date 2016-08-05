var WebRequest = $.import('sap.odata.util.lib.transfer.request', 'webRequest').WebRequest;
var WebResponse = $.import('sap.odata.util.lib.transfer.response', 'webResponse').WebResponse;
var MetadataClient = $.import('sap.odata.util.lib.metadata', 'metadataClient').MetadataClient;
var CompositeDecorator = $.import('sap.odata.util.lib.decorator', 'composite').CompositeDecorator;
var TombstoneFilterDecorator = $.import('sap.odata.util.lib.decorator', 'tombstoneFilter').TombstoneFilterDecorator;

/**
 * Client class proxying
 * - the incoming OData request to the upstream XSOData
 * - the incoming XSOData response to the downstream OData client
 * and applying the added decorator types.
 *
 * Decorator classes are instantiated per request entity
 * and sub-entity (in case of $batch requests).
 * 
 * The tombstone filter decorator is always applied, so that
 * tombstones of hard-deleted entities never leak to the client.
 *
 * @see lib.decorator.TomstoneFilterDecorator
 */
function Client(destination) {
	Object.defineProperties(this, {
		"request": {
			value: new WebRequest($.request, destination)
		},
		"destination": {
			value: destination
		},
		"decoratorClasses": {
			value: [TombstoneFilterDecorator]
		}
	});
}

/**
 * Adds the specified decorator to be applied to the proxied request
 * and response.
 */
Client.prototype.addDecoratorClass = function(decoratorClass) {
	this.decoratorClasses.push(decoratorClass);
}

/**
 * Creates a new composite decorator consolidating the added decorator classes.
 */
Client.prototype.createDecorator = function(request) {
	var metadataClient = new MetadataClient(request, this.destination);
	
	return new CompositeDecorator(request, metadataClient, this.decoratorClasses);
}

String.prototype.toByteArray = function() {
  var out = [], p = 0;
  for (var i = 0; i < this.length; i++) {
    var c = this.charCodeAt(i);
    if (c < 128) {
      out[p++] = c;
    } else if (c < 2048) {
      out[p++] = (c >> 6) | 192;
      out[p++] = (c & 63) | 128;
    } else if (
        ((c & 0xFC00) == 0xD800) && (i + 1) < this.length &&
        ((this.charCodeAt(i + 1) & 0xFC00) == 0xDC00)) {
      // Surrogate Pair
      c = 0x10000 + ((c & 0x03FF) << 10) + (this.charCodeAt(++i) & 0x03FF);
      out[p++] = (c >> 18) | 240;
      out[p++] = ((c >> 12) & 63) | 128;
      out[p++] = ((c >> 6) & 63) | 128;
      out[p++] = (c & 63) | 128;
    } else {
      out[p++] = (c >> 12) | 224;
      out[p++] = ((c >> 6) & 63) | 128;
      out[p++] = (c & 63) | 128;
    }
  }
  return out;
};

String.prototype.toCodePoints = function() {
    return this.toByteArray().map(function(code) {
	    return '\\x' + code;
    }).join('');
}

/**
 * Same as #apply(), but lets you specify the actual pre- and post request handlers,
 * that are bound to this instance. This method also skips the #isActive() check.
 */
Client.prototype.apply = function() {
	log($.request, 'inbound request');
	
	this.request.traverse(function(request) {
		var decorator = this.createDecorator(request);
		decorator.preRequest(request);
	}.bind(this));
	var response = this.doRequest();
	response.traverse(function(response) {
		var decorator = response.webRequest.decorator;
		decorator.postRequest(response);
	}.bind(this));
	
	response.applyToOutboundResponse();
	
	log($.response, 'outbound response');
};

/**
 * Carries out the upstream request, returning the response object.
 * 
 * @returns the {lib.response.WebResponse} the response
 */
Client.prototype.doRequest = function() {
	var upstreamRequest = this.request.toUpstreamRequest();
	var client = new $.net.http.Client();
	
	log(upstreamRequest, 'outbound request');
	
	client.request(upstreamRequest, this.destination);
	var response = client.getResponse();
	
	log(response, 'inbound response');
	
	if(response.status === 303) throw 'Got redirect requesting ' +
		this.request.getTargetCollectionPath() +
		'. Please check the credentials.\nat: ' + new Error().stack;
	
	return new WebResponse(this.request, response);
};

/**
 * Log the specified request or response headers and parameters.
 * 
 * @parameter type {string} arbitrary message string that should
 * identify the logged request or response
 * 		(e.g. 'outbound Google Search', 'inbound request')
 */
function log(requestOrResponse, type) {
	$.trace.debug('Logging ' + type);
	
	doLog('headers');
	doLog('parameters');
	doLog('cookies');
	
	try {
		if(requestOrResponse.body) {
			$.trace.debug('  Body: \n' + requestOrResponse.body.asString());
		} else {
			$.trace.debug('  No body.');
		}
	} catch(e) { // reading .body not supported - FIXME
	}
	
	for(var i = 0; i < requestOrResponse.entities.length; i++) {
		log(requestOrResponse.entities[i], 'child #' + i + ' of ' + type);
	}
	
	function doLog(tupleListName) {
		var tupleList = requestOrResponse[tupleListName];
		if(tupleList && tupleList.length){
			$.trace.debug('  ' + tupleListName + ':');
			for(var i = 0; i < tupleList.length; i++) {
				$.trace.debug('    ' + tupleList[i].name + '='
						+ tupleList[i].value);
			}
		}
	}
};
