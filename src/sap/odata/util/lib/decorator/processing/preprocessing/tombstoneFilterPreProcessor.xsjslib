var Processor = $.import('sap.odata.util.lib.decorator.processing', 'processor').Processor;

/**
 * Preprocessor adding a $filter expression so that tombstones are not retrieved
 * from the XSOData service.
 *
 * Configuration options (default):
 *  - deltatoken.deletedPropertyName (IS_DELETED)
 *		Name of the field indicating tombstones, i.e. entities that have been deleted
 *	- deltatoken.deletedPropertyYesValue (Y)
 *		Nominal value that needs to be in the tombstone flag field so that it marks a tombstone
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

/*
 * @see lib.decorator.processing.DeltaTokenProcessor.isActive
 */
TombstoneFilterPreProcessor.prototype.isActive = function(request) {
	return this.request.isGetRequest() &&
		!this.request.isServiceRootRequest() &&
		!this.request.isMetadataRequest() &&
		!this.request.isSingleEntityRequest() &&
		!this.request.isDeltaRequest() &&
		this.collectionSupportsDelta();
};

/**
 * Returns a filter that will prevent tombstones from being retrieved from the
 * XSOData service.
 *
 * Example:
 *
 * IS_DELETED ne 'Y'
 */
TombstoneFilterPreProcessor.prototype.apply = function() {
	var parameters = this.request.parameters;
	var tombstoneFilter = this.deletedPropertyName + ' ne \'' + this.deletedPropertyYesValue + '\''
	
	if(parameters.contains('$filter')) {
		parameters.set('$filter', '( ' + parameters.get('$filter') + ' ) and ( ' + tombstoneFilter + ' )');
	} else {
		parameters.set('$filter', tombstoneFilter );
	}	
};
