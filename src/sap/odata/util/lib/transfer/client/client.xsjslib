var WebRequest = $.import('sap.odata.util.lib.transfer.request', 'webRequest').WebRequest;
var WebResponse = $.import('sap.odata.util.lib.transfer.response', 'webResponse').WebResponse;
var MetadataClient = $.import('sap.odata.util.lib.metadata', 'metadataClient').MetadataClient;
var CompositeDecorator = $.import('sap.odata.util.lib.decorator', 'composite').CompositeDecorator;
var TombstoneFilterDecorator = $.import('sap.odata.util.lib.decorator', 'tombstoneFilter').TombstoneFilterDecorator;
var Performance = $.import('sap.odata.util.lib.performance', 'skiptoken').Performance;

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
    var traceTag = 'Decorator.' + request.id;
    Performance.trace('Creating decorators', traceTag)
	var metadataClient = new MetadataClient(request, this.destination);
	var decorator = new CompositeDecorator(request, metadataClient, this.decoratorClasses);
	Performance.finishStep(traceTag);
	
	return decorator;
}

/**
 * Same as #apply(), but lets you specify the actual pre- and post request handlers,
 * that are bound to this instance. This method also skips the #isActive() check.
 */
Client.prototype.apply = function() {
	log($.request, 'inbound request');
	
	Performance.trace('Transforming request', 'Client.transformRequest');
	this.request.traverse(function(request) {
		var decorator = this.createDecorator(request);
		decorator.preRequest(request);
	}.bind(this));
	Performance.finishStep('Client.transformRequest');
	
	Performance.trace('Firing upstream request', 'Client.request');
	var response = this.doRequest();
	Performance.finishStep('Client.request');
	
	Performance.trace('Transforming response', 'Client.transformResponse');
	response.traverse(function(response) {
		var decorator = response.webRequest.decorator;
		decorator.postRequest(response);
	}.bind(this));
	Performance.finishStep('Client.transformResponse');
	
	Performance.trace('Writing response', 'Client.respond');
	response.applyToOutboundResponse();
	Performance.finishStep('Client.respond');
	
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
	
	Performance.trace('Sending...', 'Client.doRequest.send');
	client.request(upstreamRequest, this.destination);
	var response = client.getResponse();
	Performance.finishStep('Client.doRequest.send');
	
	log(response, 'inbound response');
	
	if(response.status === 303) throw 'Got redirect requesting ' +
		this.request.getTargetCollectionPath() +
		'. Please check the credentials.\nat: ' + new Error().stack;
	
	Performance.trace('Wrapping response...', 'Client.doRequest.wrap');
	var webResponse = new WebResponse(this.request, response);
	Performance.finishStep('Client.doRequest.wrap');
	
	return webResponse
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

Client.prototype.toString = function() { return '[Client object]'; };
