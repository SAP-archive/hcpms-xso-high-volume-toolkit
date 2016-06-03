var Processor = $.import('sap.odata.util.lib.decorator.processing', 'processor').Processor;

function SkipTokenProcessor(request, metadataClient) {
	Processor.call(this, request, metadataClient);
	
	if(request) Object.defineProperties(this, {
		'skipTokenSeparator': {
			value: '-'
		},
		'pageSize': {
			value: parseInt(this.getConfiguredValue('skiptoken.pageSize'), 10)
		}
	});
}

SkipTokenProcessor.prototype = new Processor();
SkipTokenProcessor.prototype.constructor = SkipTokenProcessor;

/**
 * Returns the current request <pre><code>$skiptoken</code></pre> parameter
 * or 0 if it is undefined.
 * Leverages sanitization of <pre><code>parseInt</code></pre>.
 * 
 * @returns {number} The current skip token (default 0).
 */
SkipTokenProcessor.prototype.getCurrentSkipToken = function(request) {
	var encodedToken = this.request.originalParameters['$skiptoken'];
	
	if(!encodedToken) return null;
	
	var components = encodedToken.split(this.skipTokenSeparator);
	
	return {
		timestamp: parseInt(components[0], 10),
		keys: components.splice(1, components.length - 1).map(function(encodedKey) {
			return decodeURIComponent(encodedKey);
		}),
		meta: this.getMetadata(),
		raw: encodedToken
	};
};
