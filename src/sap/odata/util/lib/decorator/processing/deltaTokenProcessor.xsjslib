var Processor = $.import('sap.odata.util.lib.decorator.processing', 'processor').Processor;

/**
 * Base Processor for processors dealing with delta tokens.
 */
function DeltaTokenProcessor(request, metadataClient) {
	Processor.call(this, request, metadataClient);
	
	request && Object.defineProperties(this, {
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

DeltaTokenProcessor.prototype = new Processor();
DeltaTokenProcessor.prototype.constructor = DeltaTokenProcessor;

/*
 * @see lib.decorator.processing.Processor.isActive
 */
DeltaTokenProcessor.prototype.isActive = function() {
	return Processor.prototype.isActive.call(this) && this.collectionSupportsDelta();
};
