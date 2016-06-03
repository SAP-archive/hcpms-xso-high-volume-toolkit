var Processor = $.import('sap.odata.util.lib.decorator.processing', 'processor').Processor;

/**
 * 
 */
function TombstoneFilterPreProcessor(request, metadataClient) {
	if(!request) throw 'Missing required attribute request\nat: ' + new Error().stack;
	if(!metadataClient) throw 'Missing required attribute metadataClient\nat: ' + new Error().stack;
	
	Processor.call(this, request, metadataClient);
	
	Object.defineProperties(this, {
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

TombstoneFilterPreProcessor.prototype = new Processor();
TombstoneFilterPreProcessor.prototype.constructor = TombstoneFilterPreProcessor;

TombstoneFilterPreProcessor.prototype.apply = function() {
	var parameters = this.request.parameters;
	
	var filter = parameters.contains('$filter') ? parameters.get('$filter') + ' and ' : '';
	
	parameters.set('$filter',
			filter + this.deletedPropertyName + ' ne \'' + this.deletedPropertyYesValue + '\'');
};
