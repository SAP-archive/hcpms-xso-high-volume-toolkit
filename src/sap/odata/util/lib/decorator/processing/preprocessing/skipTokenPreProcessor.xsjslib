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

/**
 * Function returning its first argument.
 */
function IDENTITY(x) { return x; }

/**
 * Preprocessor that translates the $skiptoken in the request
 * into an upstream $filter query and limiting the result in terms
 * of $top. This preprocessor requires the targeted entity set to be
 * in a stable ordering, so that the entity sets can be separated into
 * chunks by their primary key. Therefore it cannot be used in conjunction
 * with $orderby.
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
 * corresponds to the current request parameters. Removes $skiptoken from the
 * upstream request and adds a $filter expression that selects
 * the next chunk of entities.
 */
SkipTokenPreProcessor.prototype.apply = function() {
	var parameters = this.request.parameters;
	
	parameters.remove('$skiptoken');
	
	var pageFilter = this.createFilter();	
	if(pageFilter) {
		if(parameters.contains('$filter')) {
 			parameters.set('$filter', '( ' + parameters.get('$filter') + ' ) and ( ' + pageFilter + ' )');
		} else {
			parameters.set('$filter', pageFilter);
		}
	}
	parameters.set('$top', this.pageSize);
};

/* 
 * Creates a $filter expression selecting the next chunk of entities.
 * The filter is created so that all entities "greater than" the last
 * returned entity are fetched from the XSOData service. This is done by
 * leveraging the strict increasing natural order on primary keys of HANA.
 *
 * The primary key of the last returned entity are encoded in the $skiptoken
 * of __next links.
 *
 * Example:
 * The last  entity set has keys
 *	- sId: string = 123
 *	- nId: number = 234
 *	- gId: guid = 345
 *
 * The generated filter would be (spanning across lines):
 *	sId gt '123' or
 *	sId eq '123' and nId gt 234 or
 *	sId eq '123' and nId eq 234 and gId gt guid'345'
 *
 * @return {string} filter expression
 */
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
