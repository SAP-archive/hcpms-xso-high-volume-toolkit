var Processor = $.import('sap.odata.util.lib.decorator.processing', 'processor').Processor;
$.import('sap.odata.util.lib', 'Date.toODataV2String');

function DeltaTokenPreProcessor(request, metadataClient) {
	if(!request) throw 'Missing required attribute request\nat: ' + new Error().stack;
	if(!metadataClient) throw 'Missing required attribute metadataClient\nat: ' + new Error().stack;
	
	Processor.call(this, request, metadataClient);
	
	Object.defineProperties(this, {
		"deltaPropertyName": {
			value: this.getConfiguredValue('deltatoken.deltaPropertyName'),
			writable: false
		},
		"deletedPropertyName": {
			value: this.getConfiguredValue('deltatoken.deletedPropertyName'),
			writable: false
		},
		"deletedPropertyYesValue": {
			value: this.getConfiguredValue('deltatoken.deletedPropertyYesValue'),
			writable: false
		}
	});
}

DeltaTokenPreProcessor.prototype = new Processor();
DeltaTokenPreProcessor.prototype.constructor = DeltaTokenPreProcessor;

DeltaTokenPreProcessor.prototype.apply = function() {
	var parameters = this.request.parameters;
	delete parameters['!deltatoken'];
	
	var filter = parameters.$filter ? parameters.$filter + ' and ' : '';
	
	if(this.request.isDeltaRequest()) {
		parameters.$filter = filter + this.deltaPropertyName + ' ge datetime\'' +
			new Date(this.getCurrentDeltaToken()).toODataV2String() + '\'';
	}
};

/**
 * Returns the current request <pre><code>!deltatoken</code></pre> parameter
 * or 0 if it is undefined.
 * Leverages sanitization of <pre><code>parseInt</code></pre>.
 * 
 * @returns {number} The current delta token (default 0).
 */
DeltaTokenPreProcessor.prototype.getCurrentDeltaToken = function() {
	return parseInt(this.request.originalParameters['!deltatoken'], 10) || 0;
};
