var MetadataParser = $.import('sap.odata.util.lib.metadata', 'metadataParser').MetadataParser;
var Metadata = $.import('sap.odata.util.lib.metadata', 'metadata').Metadata;

/**
 * Client class implementing access to the XSOData metadata document,
 * providing its parsed contents.
 */
function  MetadataClient(request, destination) {
	this.request = request;
	this.destination = destination;
}

/**
 * Loads the metadata document from the targeted service, parses it and
 * stores it in the database.
 *
 * @return {{
 * collections: {
 *	[key: string]: {
 *			keys: {name: string, type: string},
 *			properties: {name: string, type: string}
 *		}
 *	}
 * }}
 */
MetadataClient.prototype.loadMetadata = function() {
	var request = new $.web.WebRequest($.net.http.GET, this.request.getTargetServiceName() + '/$metadata');
	var client = new $.net.http.Client();
	client.request(request, this.destination);
	var response = client.getResponse();
	
	var metadata =  new MetadataParser().parse(response.body.asString());
	
	if(!metadata.collections[this.request.getCollectionName()]) throw this.request.getCollectionName() + ' does not refer to an existing entity set.';
	
	Metadata.saveMetadata(this.request.getServicePath(), metadata);
	
	return metadata;
};

/**
 * Returns the metadata of the currently targeted entity set.
 *
 * @return {{
 *	keys: {name: string, type: string},
 *	properties: {name: string, type: string}
 * }}
 */
MetadataClient.prototype.getMetadata = function() {
	var metadata = Metadata.getMetadata(this.request.getServicePath());
	if(!metadata || !metadata.collections[this.request.getCollectionName()]) {
		metadata = this.loadMetadata();
		$.trace.debug("Updated metadata for service " + this.request.getServicePath() + ":\n" + JSON.stringify(metadata));
	}
	return metadata.collections[this.request.getCollectionName()];
};
