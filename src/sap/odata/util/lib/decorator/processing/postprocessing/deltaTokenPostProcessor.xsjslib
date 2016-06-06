var Processor = $.import('sap.odata.util.lib.decorator.processing', 'processor').Processor;
var SkipTokenPostProcessor = $.import('sap.odata.util.lib.decorator.processing.postprocessing', 'skipTokenPostProcessor').SkipTokenPostProcessor;
$.import('sap.odata.util.lib', 'Date.latestSafeTimestamp');
$.import('sap.odata.util.lib', 'Object.traverse');

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

DeltaTokenPostProcessor.prototype.apply = function(response) {
	if(!response.json) return;
	
	var data = response.data.d;
	
	if(response.webRequest.isCollectionRequest()) data.__delta = this.getDeltaUrl();
	this.metadata = this.getMetadata();
	
	if (!this.replaceDeletedEntities && !this.stripDeltaFields) {
	    return data;
	}
	
	data.traverse(function(object, parent, name) {
		var isDeltaProperty = function(key) {
			return ~[this.deltaPropertyName, this.deletedPropertyName].indexOf(key);
		}.bind(this);
		
		var isDeleted = function(object) {
			return object && object[this.deletedPropertyName] === this.deletedPropertyYesValue;
		}.bind(this);
		
		if(this.stripDeltaFields && isDeltaProperty(name)) delete parent[name];
		else if(this.replaceDeletedEntities && isDeleted(object)) replaceWithDeletedEntity.call(this, object, parent);
		
		function replaceWithDeletedEntity(object, parentArray) {
			if(!parentArray) throw { "code": "410", "message": { "lang": "en-US", "value": "The requested resource no longer exists."}}
			
			var id = object.__metadata.uri;
			Object.getOwnPropertyNames(object).forEach(function(property) { delete object[property]; });
			object['@odata.context'] = '$metadata#' + this.request.getCollectionName() + '/$deletedEntity';
			object.id = id;
		}
	}.bind(this));
};

/**
 * Returns the URL to the next page, relative to the server base URL.
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
 * Returns the current request <pre><code>!deltatoken</code></pre> parameter
 * or 0 if it is undefined.
 * Leverages sanitization of <pre><code>parseInt</code></pre>.
 * 
 * @returns {number} The current delta token (default 0).
 */
DeltaTokenPostProcessor.prototype.getNextDeltaToken = function() {
	if(this.request.originalParameters.contains('$skiptoken')) {
		return SkipTokenPostProcessor.prototype.getCurrentSkipToken.call(this).timestamp;
	}
	return Date.latestSafeTimestamp().getTime();
};

