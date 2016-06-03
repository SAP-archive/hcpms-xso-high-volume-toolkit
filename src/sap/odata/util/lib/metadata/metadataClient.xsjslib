var MetadataParser = $.import('sap.odata.util.lib.metadata', 'metadataParser').MetadataParser;
var Metadata = $.import('sap.odata.util.lib.metadata', 'metadata').Metadata;

function  MetadataClient(request, destination) {
	this.request = request;
	this.destination = destination;
}

MetadataClient.prototype.loadMetadata = function() {
	var request = new $.web.WebRequest($.net.http.GET, this.request.getTargetServicePath() + '/$metadata');
	var client = new $.net.http.Client();
	client.request(request, this.destination);
	var response = client.getResponse();
	
	var metadata =  new MetadataParser().parse(response.body.asString());
	
	Metadata.saveMetadata(this.request.getServicePath(), metadata);
	
	return metadata;
};

MetadataClient.prototype.getMetadata = function() {
	var metadata = Metadata.getMetadata(this.request.getServicePath());
	if(!metadata || !metadata.collections[this.request.getCollectionName()]) {
		metadata = this.loadMetadata();
	}
	return metadata.collections[this.request.getCollectionName()];
};
