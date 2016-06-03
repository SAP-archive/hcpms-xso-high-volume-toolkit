var oDataUtils = $.import('sap.odata.util', 'decorators');
var destination = $.net.http.readDestination('com.example.wrapper', 'xsodata');

oDataUtils
	.decorate(destination)
	.withDeltaTokens()
	.withSkipTokens()
	.withUrlRewriting()
	.and.applyDecorators();
