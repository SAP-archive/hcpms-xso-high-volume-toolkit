var Processor = $.import('sap.odata.util.lib.decorator.processing', 'processor').Processor;

function UrlRewritingPostProcessor(request, metadataClient) {
	if(!request) throw 'Missing required attribute request\nat: ' + new Error().stack;
	if(!metadataClient) throw 'Missing required attribute metadataClient\nat: ' + new Error().stack;
	
	Processor.call(this, request, metadataClient);
	
	Object.defineProperties(this, {
		'replacementRegex': {
			value: new RegExp('(.*:\\/\\/[^/]+)(\\/.*' + request.getServiceName() + '\\.xsodata)(.*)')
		}
	});
}

UrlRewritingPostProcessor.prototype = new Processor();
UrlRewritingPostProcessor.prototype.constructor = UrlRewritingPostProcessor;

UrlRewritingPostProcessor.prototype.apply = function (response) {
	if(!response.json) return;
	
	var data = response.data.d;
	
	var servicePath = this.request.getServicePath();
	
	data.traverse(function(object, parent, name) {
		if(object && ~['uri', 'id', '__delta', '__next'].indexOf(name)) {
			parent[name] = object.replace(this.replacementRegex, '$1' + this.request.getServicePath() + '$3');
		}
	}.bind(this));
};
