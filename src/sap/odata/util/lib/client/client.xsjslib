var Utils = $.import('sap.odata.util.lib', 'utils').Utils;
var WebRequest = $.import('sap.odata.util.lib.request', 'webRequest').WebRequest;
var WebResponse = $.import('sap.odata.util.lib.response', 'webResponse').WebResponse;
var MetadataClient = $.import('sap.odata.util.lib.metadata', 'metadataClient').MetadataClient;
var CompositeDecorator = $.import('sap.odata.util.lib.decorator', 'composite').CompositeDecorator;
var TombstoneFilterDecorator = $.import('sap.odata.util.lib.decorator', 'tombstoneFilter').TombstoneFilterDecorator;

/**
 * Decorator base class implementing the generic upstream request
 * strategy and providing extension points for inheriting classes
 * in order to customize the behavior.
 * 
 * Extension points:
 * 
 * - isActive
 * - preRequest
 * - postRequest(response)
 */
function Client(destination, decorator) {
	Object.defineProperties(this, {
		"request": {
			value: new WebRequest($.request)
		},
		"destination": {
			value: destination
		},
		"decoratorClasses": {
			value: [TombstoneFilterDecorator]
		}
	});
}

Client.prototype.addDecoratorClass = function(decoratorClass) {
	this.decoratorClasses.push(decoratorClass);
}

Client.prototype.createDecorator = function(request) {
	var metadataClient = new MetadataClient(request, this.destination);
	
	return new CompositeDecorator(request, metadataClient, this.decoratorClasses);
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
};

/**
 * Carries out the upstream request, returning the response object.
 * 
 * @returns the {$.web.Response} the response
 */
Client.prototype.doRequest = function() {
	var upstreamRequest = this.request.toUpstreamRequest();
	var client = new $.net.http.Client();
	
	log(upstreamRequest, 'outbound request');
	
	client.request(upstreamRequest, this.destination);
	var response = client.getResponse();
	
	log(response, 'inbound response');
	
	if(response.status === 303) throw 'Got redirect requesting ' + this.request.getTargetCollectionPath()
		+ '. Please check the credentials.\nat: ' + new Error().stack;
	
	return new WebResponse(this.request, response);
};

/**
 * Log the specifried request or response headers and parameters.
 * 
 * @parameter type {string} arbitrary message string that should identify the logged request or response
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
