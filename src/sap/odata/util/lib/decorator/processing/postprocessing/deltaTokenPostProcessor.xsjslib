var Processor = $.import('sap.odata.util.lib.decorator.processing', 'processor').Processor;
var SkipTokenPostProcessor = $.import('sap.odata.util.lib.decorator.processing.postprocessing', 'skipTokenPostProcessor').SkipTokenPostProcessor;
$.import('sap.odata.util.lib', 'Date.latestSafeTimestamp');
$.import('sap.odata.util.lib', 'Object.traverse');

/**
 * Post processor that
 *
 * - applies delta links to entity set responses
 * - optionally replaces tombstones with $deletedEntity entries
 * - optionally strips delta-related entity fields from the response
 *    (change tracking deletion flag and timestamp)
 *
 * When either of the last options is turned on via configuration, the
 * proxied response is deep inspected and rewritten.
 *
 * During server-side paginations (via $skiptoken) the delta link is
 * preserved.
 * 
 * Configuration options (default):
 *  - deltatoken.deltaPropertyName  (DELTATOKEN)
 *		Name of the field indicating when an entity was last modified (UTC)
 *  - deltatoken.deletedPropertyName (IS_DELETED)
 *		Name of the field indicating tombstones, i.e. entities that have been deleted
 *	- deltatoken.deletedPropertyYesValue (Y)
 *		Nominal value that needs to be in the tombstone flag field so that it marks a tombstone
 *  - deltatoken.stripDeltaFields
 *		Tells if delta-related fields (default: IS_DELETED, DELTATOKEN) should be stripped from entities
 *	- deltatoken.replaceDeletedEntities
 *		Tells if tombstones should be replaced with $deletedEntity entriess
 *
 * @see lib.db.Configuration
 */
function DeltaTokenPostProcessor(request, metadataClient) {
	if(!request) throw 'Missing required attribute request\nat: ' + new Error().stack;
	if(!metadataClient) throw 'Missing required attribute metadataClient\nat: ' + new Error().stack;
	
	Processor.call(this, request, metadataClient);
	
	Object.defineProperties(this, {
		"deltaPropertyName": {
			value: this.getConfiguredValue('deltatoken.deltaPropertyName')
		},
		"deletedPropertyName": {
			value: this.getConfiguredValue('deltatoken.deletedPropertyName')
		},
		"deletedPropertyYesValue": {
			value: this.getConfiguredValue('deltatoken.deletedPropertyYesValue')
		},
		"stripDeltaFields": {
			value: this.getConfiguredValue('deltatoken.stripDeltaFields')
		},
		"replaceDeletedEntities": {
			value: this.getConfiguredValue('deltatoken.replaceDeletedEntities')
		}
	});
}

DeltaTokenPostProcessor.prototype = new Processor();
DeltaTokenPostProcessor.prototype.constructor = DeltaTokenPostProcessor;

/*
 * @see lib.decorator.processing.Processor.apply
 */
DeltaTokenPostProcessor.prototype.apply = function(response) {
	if(!response.json) return;
	
	var data = response.data.d;
	
	if(response.webRequest.isCollectionRequest()) data.__delta = this.getDeltaUrl();
};

DeltaTokenPostProcessor.prototype.visit = function(object, parent, name) {
	if(this.stripDeltaFields && this.isDeltaProperty(name)) delete parent[name];
	else if(this.replaceDeletedEntities && this.isDeleted(object)) this.replaceWithDeletedEntity.call(this, object, parent);
}

DeltaTokenPostProcessor.prototype.isDeltaProperty = function(key) {
	return ~[this.deltaPropertyName, this.deletedPropertyName].indexOf(key);
};

DeltaTokenPostProcessor.prototype.isDeleted = function(object) {
	return object && object[this.deletedPropertyName] === this.deletedPropertyYesValue;
};

DeltaTokenPostProcessor.prototype.replaceWithDeletedEntity = function(object, parentArray) {
	if(!parentArray) throw { "code": "410", "message": { "lang": "en-US", "value": "The requested resource no longer exists."}}
	
	var id = object.__metadata.uri;
	Object.getOwnPropertyNames(object).forEach(function(property) { delete object[property]; });
	object['@odata.context'] = '$metadata#' + this.request.getCollectionName() + '/$deletedEntity';
	object.id = id;
};

/**
 * Returns the absolute delta link URL.
 */
DeltaTokenPostProcessor.prototype.getDeltaUrl = function() {
	return this.request.getFullTargetServicePath() + '?' + this.querify(this.getDeltaRequestParameters());
};

/**
 * Returns the request parameters for the next page, including an updated
 * skip token value. 
 */
DeltaTokenPostProcessor.prototype.getDeltaRequestParameters = function() {
	var parameters = this.request.copyParameters();
	
	parameters.set('!deltatoken', this.getNextDeltaToken());
	parameters.remove('$skiptoken');
	parameters.remove('$top');
	parameters.remove('$skip');
	
	return parameters;
};

/**
 * Returns the delta token that should be returned with the current
 * response. If a skiptoken is available, the encoded delta token is
 * returned. If none is available, the latest "safe" timestamp in terms of
 * database snapshot isloation (ongoing changing transactions) is used.
 *
 * @see lib.Date.latestSafeTimestamp
 * 
 * @returns {number} The delta token for the next delta link to be returned.
 */
DeltaTokenPostProcessor.prototype.getNextDeltaToken = function() {
	if(this.request.originalParameters.contains('$skiptoken')) {
		return SkipTokenPostProcessor.prototype.getCurrentSkipToken.call(this).timestamp;
	}
	return Date.latestSafeTimestamp().getTime();
};
