var Processor = $.import('sap.odata.util.lib.decorator.processing', 'processor').Processor;

/**
 * Base Processor for processors dealing with skip tokens.
 * This class implements basic skip token decoding used byte
 * all token processors.
 */
function UrlRewritingProcessor(request, metadataClient) {
	Processor.call(this, request, metadataClient);
	
	request && Object.defineProperties(this, {
		'URI_PROPERTIES': {
			value: ['uri', 'id', '__delta', '__next']
		}
	});
}

UrlRewritingProcessor.prototype = new Processor();
UrlRewritingProcessor.prototype.constructor = UrlRewritingProcessor;

/*
 * @see lib.decorator.processing.Processor.isActive
 */
UrlRewritingProcessor.prototype.isActive = function(request) {
	return !this.request.isMultipartRequest() &&
		!this.request.isMetadataRequest(request);
};

UrlRewritingProcessor.prototype.replaceLocation = function(requestOrResponse) {
	var location = requestOrResponse.headers.get('location');
	if(location) requestOrResponse.headers.set('location', this.replace(location));
};

/*
 * @see lib.decorator.processing.Processor.visit
 */
UrlRewritingProcessor.prototype.visit = function(object, parent, name) {
	if(object && ~this.URI_PROPERTIES.indexOf(name)) {
		parent[name] = this.replace(object);
	}
}

/**
 * Returns a rewritten version of the specified absolute url string in which the
 * reference to the upstream XSOData service is replaced with a reference to the
 * current wrapper XSJS service.
 */
UrlRewritingProcessor.prototype.replace = function (url) {
	return url.replace(this.replacementRegex, '$1' + this.replacementPath + '$3');
};
