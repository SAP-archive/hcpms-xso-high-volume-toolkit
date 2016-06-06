var SkipTokenProcessor = $.import('sap.odata.util.lib.decorator.processing', 'skipTokenProcessor').SkipTokenProcessor;

/**
 * Map of formatters for specific ID types. The formatters
 * take string inputs and format the string inputs as IDs,
 * as required for $filter queries.
 * 
 * The map keys correspond to the key types saved in the metadata table.
 * 
 * <code>ID_FORMATTERS['guid']('abc')</code> --> <code>'guid\'123\''</code>
 * <code>ID_FORMATTERS['number']('abc')</code> --> <code>123</code>
 * <code>ID_FORMATTERS['string']('abc')</code> --> <code>'\'123\''</code>
 * 
 * @see Key type parser: {@link metadataParser.xsjslib#TYPE_MAP}
 * @see {@link http://www.odata.org/documentation/odata-version-2-0/overview/#AbstractTypeSystem|OData Type System}
 * @see {@link http://www.odata.org/documentation/odata-version-2-0/json-format/#PrimitiveTypes|JSON representation}
 */
var ID_FORMATTERS = {
	// Not supported
	// See metadataParser.xsjslib#TYPE_MAP
//	binary: function(id) {			// X'123'
//		return 'X' + ID_FORMATTERS.string(atob(id));
//	},
	boolean: IDENTITY,				// true | false
	string: function(id) {			// '123'
		return '\'' + id + '\'';
	},
	number: function(id) {			// 123
		return parseInt(id, 10)
	},
	long: IDENTITY,					// 123L
	guid: IDENTITY,					// guid'213'
	datetime: function(id) {		// datetime'2000-12-12T12:00'
		return 'datetime' + ID_FORMATTERS.string(id.match(/\/Date\(([0-9]+)\)\//)[1]);
	},
	time: IDENTITY,					// time'13:20:00'
	datetimeoffset: IDENTITY		// datetimeoffset'2002-10-10T17:00:00Z'
};

function IDENTITY(x) { return x; }

/**
 * 
 */
function SkipTokenPreProcessor(request, metadataClient) {
	if(!request) throw 'Missing required attribute request\nat: ' + new Error().stack;
	if(!metadataClient) throw 'Missing required attribute metadataClient\nat: ' + new Error().stack;
	
	SkipTokenProcessor.call(this, request, metadataClient);
}

SkipTokenPreProcessor.prototype = new SkipTokenProcessor();
SkipTokenPreProcessor.prototype.constructor = SkipTokenPreProcessor;

/**
 * Sets the request parameters for the request to the target service that
 * corresponds to the current request parameters.
 */
SkipTokenPreProcessor.prototype.apply = function() {
	var parameters = this.request.parameters;
	
	parameters.remove('$skiptoken');
	
	var pageFilter = this.createFilter();
	
	if(pageFilter) {
		parameters.set('$filter', (parameters.contains('$filter') ? parameters.get('$filter') + ' and ' : '') +
			pageFilter);
	}
	parameters.set('$top', this.pageSize);
	parameters.set('$inlinecount', 'allpages');
};

SkipTokenPreProcessor.prototype.createFilter = function() {
	if(!this.getCurrentSkipToken()) return;
	
	var keys = this.getMetadata().keys;
	var values = this.getCurrentSkipToken().keys;
	
	var filters = [];
	
	for(var i = 0; i < keys.length; i++) {
		var predicates = [keys[i].name + ' gt ' + ID_FORMATTERS[keys[i].type](values[i])];
		for(var j = 0; j < i; j++) {
			predicates.push([keys[j].name + ' eq ' + ID_FORMATTERS[keys[j].type](values[j])])
		}
		filters.push(predicates.join(' and '));
	}
	
	return filters.join(' or ');
};
