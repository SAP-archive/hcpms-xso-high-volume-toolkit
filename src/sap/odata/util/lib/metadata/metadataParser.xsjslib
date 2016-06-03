var NAMESPACE = 'http://schemas.microsoft.com/ado/2008/09/edm';
var E_SCHEMA = NAMESPACE + ':Schema';
var E_ENTITY_TYPE = NAMESPACE + ':EntityType';
var E_KEY = NAMESPACE + ':Key';
var E_PROPERTY_REF = NAMESPACE + ':PropertyRef';
var E_PROPERTY = NAMESPACE + ':Property';
var E_ENTITY_SET = NAMESPACE + ':EntitySet';

/**
 * @see {@link http://www.odata.org/documentation/odata-version-2-0/overview/#AbstractTypeSystem|OData Type System}
 * @see {@link http://www.odata.org/documentation/odata-version-2-0/json-format/#PrimitiveTypes|JSON representation}
 */
var TYPE_MAP = {
//	 Not supported due to missing Base64 implementation		
//	 See OData v2 JSON representation of Edm.Binary:
//	 "Base64 encoded value of an EDM.Binary value represented as a JSON string"
//	 'Edm.Binary': 'binary',
	'Edm.Boolean': 'boolean',
	'Edm.Guid': 'guid',
	'Edm.Byte': 'number',
	'Edm.SByte': 'number',
	'Edm.Int16': 'number',
	'Edm.Int32': 'number',
	'Edm.Int64': 'long',
	'Edm.String': 'string',
	'Edm.DateTime': 'datetime',
	'Edm.Time': 'time',
	'Edm.DateTimeOffset': 'datetimeoffset'
};

function MetadataParser() {
}

MetadataParser.prototype.parse = function(xmlString) {
	var parser = new $.util.SAXParser();
	
	var metadata = {
		collections: {}
	};
	
	var currentCollection;
	// Key name -> key object map for easy access
	var currentKeyIndex;
	// Tells if we are currently inside a <Key />
	var isKey = false;
	var namespace;
	// keep track of types for cleanup
	var types = {};
	
	parser.startElementHandler = function(name, attrs) {
		if(name === E_SCHEMA) {
			namespace = attrs.Namespace;
		} else
		if(name === E_ENTITY_TYPE) {
			currentCollection = { keys: [] };
			currentKeyIndex = {};
			var qualifiedTypeName = namespace + '.' + attrs.Name;
			types[qualifiedTypeName] = currentCollection;
		} else
		if(name === E_KEY) { isKey = true; }
		else
		if(isKey && name === E_PROPERTY_REF) {
			var key = {
				name: attrs.Name
			};
			
			currentCollection.keys.push(key);
			currentKeyIndex[attrs.Name] = key;
		} else
		if(name === E_PROPERTY && currentKeyIndex[attrs.Name]) {
			if(!TYPE_MAP[attrs.Type]) throw 'Unsupported key type in collection ' +
				currentCollection.name + ', key ' + attrs.Name + ', type ' + attrs.Type;
			currentKeyIndex[attrs.Name].type = TYPE_MAP[attrs.Type];
		} else
		if(name === E_ENTITY_SET) {
			metadata.collections[attrs.Name] = types[attrs.EntityType];
		}
		

	};

	parser.endElementHandler = function(name) {
	  if(name === E_KEY) isKey = false;
	};
	
	parser.parse(xmlString);
	
	return metadata;
}

