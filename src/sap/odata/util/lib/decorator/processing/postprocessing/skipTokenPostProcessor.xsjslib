var SkipTokenProcessor = $.import('sap.odata.util.lib.decorator.processing', 'skipTokenProcessor').SkipTokenProcessor;
$.import('sap.odata.util.lib', 'Date.latestSafeTimestamp');

/**
 * Post processor that adds a __next link to the response JSON.
 *
 * When either of the last options is turned on via configuration, the
 * proxied response is deep inspected and rewritten.
 *
 * During server-side paginations (via $skiptoken) the delta link is
 * preserved.
 * 
 */
function SkipTokenPostProcessor(request, metadataClient) {
	if(!request) throw 'Missing required attribute request\nat: ' + new Error().stack;
	if(!metadataClient) throw 'Missing required attribute metadataClient\nat: ' + new Error().stack;
	
	SkipTokenProcessor.call(this, request, metadataClient);
}

SkipTokenPostProcessor.prototype = new SkipTokenProcessor();
SkipTokenPostProcessor.prototype.constructor = SkipTokenPostProcessor;

/*
 * @see lib.decorator.processor.Processor.apply
 */
SkipTokenPostProcessor.prototype.apply = function(response) {
	if(!response.json) return;
	
	var data = response.data.d;
	
	this.applyNextPageLink(data);
	this.removeInlineCount(data);
};

/**
 * Checks if a <pre><code>__next</pre></code> link needs to be applied to the request
 * as per OData Spec 4.0 11.2.5.7 Server-Driven Paging
 * (http://docs.oasis-open.org/odata/odata/v4.0/errata02/os/complete/part1-protocol/odata-v4.0-errata02-os-part1-protocol-complete.html#_Toc406398310)
 * and adds it to the response.
 *
 * Link is only added if the response contains a __count value and if it is
 * greater than the configured page size.
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
 * Returns the skip token of the __next link. It will "carry over" the timestamp
 * encoded in the current $skiptoken, if there is any. Otherwise the latest known
 * timestamp according to database snapshot isolation is chosen. This is in order to
 * ensure that if deltas are enabled, we can return the same __delta link during the
 * whole pagination.
 *
 * @see lib.decorator.processing.SkipTokenProcessor.getCurrentSkipToken
 * @see lib.Date.latestSafeTimestamp
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
 * Removes the <pre><code>__count</pre></code> property from the specified data.
 */
SkipTokenPostProcessor.prototype.removeInlineCount = function(data) {
	delete data.__count;
};
