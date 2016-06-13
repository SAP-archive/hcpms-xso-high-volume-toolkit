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
	'Edm.Binary': 'binary',
	'Edm.Boolean': 'boolean',
	'Edm.Guid': 'guid',
	'Edm.Byte': 'number',
	'Edm.SByte': 'number',
	'Edm.Int16': 'number',
	'Edm.Int32': 'number',
	'Edm.Int64': 'long',
	'Edm.Decimal': 'number',
	'Edm.String': 'string',
	'Edm.DateTime': 'datetime',
	'Edm.Time': 'time',
	'Edm.DateTimeOffset': 'datetimeoffset'
};

//Not supported due to missing Base64 implementation		
//See OData v2 JSON representation of Edm.Binary:
//"Base64 encoded value of an EDM.Binary value represented as a JSON string"
var KEY_TYPE_BLACKLIST = ['Edm.Binary'];

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
	// Property name -> property object map for easy access
	var isKey = false;
	var namespace;
	// keep track of types for cleanup
	var types = {};
	
	parser.startElementHandler = function(name, attrs) {
		if(name === E_SCHEMA) setCurrentNamespace(); else
		if(name === E_ENTITY_TYPE) initCurrentEntityType(); else
		if(name === E_KEY) enterKey(); else
		if(isKey && name === E_PROPERTY_REF) addKeyDeclaration(); else
		if(name === E_PROPERTY && currentKeyIndex[attrs.Name]) updateKeyMetadata(); else
		if(name === E_PROPERTY) addProperty(); else
		if(name === E_ENTITY_SET) mapEntityTypeToEntitySet()
		
		function setCurrentNamespace() {
			namespace = attrs.Namespace;
		}
		
		function initCurrentEntityType() {
			currentCollection = { keys: [], properties: [] };
			currentKeyIndex = {};
			var qualifiedTypeName = namespace + '.' + attrs.Name;
			types[qualifiedTypeName] = currentCollection;
		}
		
		function enterKey() {
			isKey = true;
		}
		
		function addKeyDeclaration() {
			var key = {
				name: attrs.Name
			};
			
			currentCollection.keys.push(key);
			currentKeyIndex[attrs.Name] = key;
		}
		
		function addProperty() {
			currentCollection.properties.push({
				name: attrs.Name,
				type: TYPE_MAP[attrs.Type]
			});
		}
		
		function updateKeyMetadata() {
			if(~KEY_TYPE_BLACKLIST.indexOf(attrs.Type)) throw 'Unsupported key type in collection ' +
			currentCollection.name + ', key ' + attrs.Name + ', type ' + attrs.Type;
			currentKeyIndex[attrs.Name].type = TYPE_MAP[attrs.Type];
		}
		
		function mapEntityTypeToEntitySet() {
			metadata.collections[attrs.Name] = types[attrs.EntityType];
		}
	};

	parser.endElementHandler = function(name) {
	  if(name === E_KEY) isKey = false;
	};
	
	parser.parse(xmlString);
	
	return metadata;
}

