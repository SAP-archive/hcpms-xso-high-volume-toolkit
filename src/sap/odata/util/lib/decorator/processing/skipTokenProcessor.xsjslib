var Processor = $.import('sap.odata.util.lib.decorator.processing', 'processor').Processor;

/**
 * Base Processor for processors dealing with skip tokens.
 * This class implements basic skip token decoding used byte
 * all token processors.
 */
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
 * Returns the decoded value of the current request <pre><code>$skiptoken
 * </code></pre> parameter or null, if there is none.
 *
 * A skip token is constructed as follows:
 * $skiptoken = timestamp-key[-key]*
 * 
 * The timestamp is the latest known safe point in time in terms of
 * snapshot isolation before the pagination started, and is carried over
 * during the whole pagination in order to be able to return the same
 * __delta link all the time. The keys are the URI encoded primary key
 * string values of the last entity in the last response, according to
 * natural entity order. They are used to start the selection of the next
 * chunk of entities via $filter from the upstream XSOData service.
 * 
 * @returns {{timestamp: number, keys: string[]}}
 */
SkipTokenProcessor.prototype.getCurrentSkipToken = function(request) {
	var encodedToken = this.request.originalParameters.get('$skiptoken');
	
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
