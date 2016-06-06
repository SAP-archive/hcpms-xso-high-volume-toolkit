var SkipTokenProcessor = $.import('sap.odata.util.lib.decorator.processing', 'skipTokenProcessor').SkipTokenProcessor;
$.import('sap.odata.util.lib', 'Date.latestSafeTimestamp');

function SkipTokenPostProcessor(request, metadataClient) {
	if(!request) throw 'Missing required attribute request\nat: ' + new Error().stack;
	if(!metadataClient) throw 'Missing required attribute metadataClient\nat: ' + new Error().stack;
	
	SkipTokenProcessor.call(this, request, metadataClient);
}

SkipTokenPostProcessor.prototype = new SkipTokenProcessor();
SkipTokenPostProcessor.prototype.constructor = SkipTokenPostProcessor;

SkipTokenPostProcessor.prototype.apply = function(response) {
	var data = response.data.d;
	
	this.applyNextPageLink(data);
	this.removeInlineCount(data);
};

/**
 * Checks if a <pre><code>__next</pre></code> link needs to be applied to the request
 * as per OData Spec 4.0 11.2.5.7 Server-Driven Paging
 * (http://docs.oasis-open.org/odata/odata/v4.0/errata02/os/complete/part1-protocol/odata-v4.0-errata02-os-part1-protocol-complete.html#_Toc406398310).
 */
SkipTokenPostProcessor.prototype.applyNextPageLink = function(data) {
	if(data.__count > this.pageSize) {
		var lastObject = data.results[data.results.length - 1];
		data.__next = this.getNextPageUrl(lastObject);
	}
};

/**
 * Returns the URL to the next page, relative to the server base URL.
 */
SkipTokenPostProcessor.prototype.getNextPageUrl = function(lastObject) {
	return this.request.getFullTargetServicePath() + '?' + this.querify(this.getNextPageRequestParameters(lastObject));
};

/**
 * Returns the request parameters for the next page, including an updated
 * skip token value.
 */
SkipTokenPostProcessor.prototype.getNextPageRequestParameters = function(lastObject) {
	var parameters = this.request.copyParameters();
	
	parameters.set('$skiptoken', this.getNextSkipToken(lastObject));
	
	return parameters;
};

/**
 * Returns the skip token of the next page.
 */
SkipTokenPostProcessor.prototype.getNextSkipToken = function(lastObject) {
	var currentToken = this.getCurrentSkipToken();
	
	var token = '' + (currentToken ? currentToken.timestamp :
		this.request.originalParameters.get('!deltatoken') || Date.latestSafeTimestamp().getTime());
	
	this.getMetadata().keys.forEach(function(key) {
		token += '-' + encodeURIComponent('' + lastObject[key.name]);
	});
	
	return token;
};

/**
 * Removes the <pre><code>__count</pre></code> property from the specified data,
 * unless the client specifically requested it.
 */
SkipTokenPostProcessor.prototype.removeInlineCount = function(data) {
	delete data.__count;
};
