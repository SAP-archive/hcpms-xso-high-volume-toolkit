$.import('sap.odata.util.lib', 'Error.toString'); // Appends stack trace to errors
var SkipTokenDecorator = $.import('sap.odata.util.lib.decorator', 'skiptoken').SkipTokenDecorator;
var DeltaTokenDecorator = $.import('sap.odata.util.lib.decorator', 'deltatoken').DeltaTokenDecorator;
var UrlRewritingDecorator = $.import('sap.odata.util.lib.decorator', 'urlrewrite').UrlRewritingDecorator;
var Client = $.import('sap.odata.util.lib.transfer.client', 'client').Client;
var Performance = $.import('sap.odata.util.lib.performance', 'skiptoken').Performance;

/**
 * Creates a decorator API facade targeting the specified destination. By convention,
 * the destination should point to the root folder of the actual target xsodata service,
 * e.g. <pre><code>/sap/hana/democontent/epm/services</code></pre> if you are targeting
 * <pre><code>/sap/hana/democontent/epm/services/salesOrders.xsodata</code></pre>.
 * 
 * @param destination The target destination
 * 
 * @returns {DecoratorFacade} A decorator facade
 */
function decorate(destination) {
	return new DecoratorFacade(destination);
}

/**
 * Exposes the HCPms High Volume Toolkit (HVT) API to clients. This should be the only point
 * of interaction between implementing XSJS services and the HVT itself.
 */
function DecoratorFacade(destination) {
	this.client = new Client(destination);
	
	this.and = this;
}

/**
 * Applies a url rewriting decorator to the destination that will rewrite URLs
 * pointing to the upstream service to point to this service instead.
 * 
 * It is generally advised to leave this turned off in favor of SAP Mobile Platform/
 * HANA Cloud Platform mobile service custom URL rewriting for performance reasons.
 */
DecoratorFacade.prototype.withUrlRewriting = function() {
      this.client.addDecoratorClass(UrlRewritingDecorator);
      return this;
};


/**
 * Applies a skip token decorator to the destination that will add server-side pagination
 * if the current request is a GET request targeting a collection.
 */
DecoratorFacade.prototype.withSkipTokens = function() {
	this.client.addDecoratorClass(SkipTokenDecorator);
	return this;
}

/**
 * Applies a delta token decorator to the destination that will add delta token support.
 */
DecoratorFacade.prototype.withDeltaTokens = function() {
	this.client.addDecoratorClass(DeltaTokenDecorator);
	return this;
}

/**
 * Applies the currently configured and active decorators to the current request.
 */
DecoratorFacade.prototype.applyDecorators = function() {
    Performance.trace('Applying HVT', 'HVT.apply');
	this.client.apply();
	Performance.finishStep('HVT.apply');
}

Performance.trace('HVT start');
