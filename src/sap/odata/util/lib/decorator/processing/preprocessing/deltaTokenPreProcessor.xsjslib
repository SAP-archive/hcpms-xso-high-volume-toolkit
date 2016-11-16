var DeltaTokenProcessor = $.import('sap.odata.util.lib.decorator.processing', 'deltaTokenProcessor').DeltaTokenProcessor;
$.import('sap.odata.util.lib', 'Date.toODataV2String');

/**
 * Pre processor that filters entity sets based on the supplied delta token.
 *
 * It applies a $filter expression to the upstream request that requests entities
 * are not older than the timestamp encoded in the $deltatoken query option.
 *
 * Configuration options (default):
 *  - deltatoken.deltaPropertyName  (DELTATOKEN)
 *		Name of the field indicating when an entity was last modified (UTC)
 *  - deltatoken.deletedPropertyName (IS_DELETED)
 *		Name of the field indicating tombstones, i.e. entities that have been deleted
 *	- deltatoken.deletedPropertyYesValue (Y)
 *		Nominal value that needs to be in the tombstone flag field so that it marks a tombstone
 *
 * @see lib.db.Configuration
 */
function DeltaTokenPreProcessor(request, metadataClient) {
	if(!request) throw 'Missing required attribute request\nat: ' + new Error().stack;
	if(!metadataClient) throw 'Missing required attribute metadataClient\nat: ' + new Error().stack;
	
	DeltaTokenProcessor.call(this, request, metadataClient);
}

DeltaTokenPreProcessor.prototype = new DeltaTokenProcessor();
DeltaTokenPreProcessor.prototype.constructor = DeltaTokenPreProcessor;

/*
 * @see lib.decorator.processing.DeltaTokenProcessor.isActive
 */
DeltaTokenPreProcessor.prototype.isActive = function() {
	return DeltaTokenProcessor.prototype.isActive.call(this) && this.request.isDeltaRequest();
};

/*
 * @see lib.decorator.processing.Processor.apply
 */
DeltaTokenPreProcessor.prototype.apply = function() {
	var parameters = this.request.parameters;
	parameters.remove('!deltatoken');
	
	var filter = parameters.contains('$filter') ?
			parameters.get('$filter') + ' and ' : '';
	
	if(this.request.isDeltaRequest()) {
		parameters.set('$filter', filter + this.deltaPropertyName + ' ge datetime\'' +
			new Date(this.getCurrentDeltaToken()).toODataV2String() + '\'');
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
	return parseInt(this.request.originalParameters.get('!deltatoken'), 10) || 0;
};
