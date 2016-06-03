var Decorator = $.import('sap.odata.util.lib.decorator', 'decorator').Decorator;

/**
 * Composite decorator delegating the life cycle calls to all of its
 * registered decorators.
 */
function CompositeDecorator(request, metadataClient, decoratorClasses) {
	if(!request) throw 'Missing required attribute request\nat: ' + new Error().stack;
	if(!metadataClient) throw 'Missing required attribute metadataClient\nat: ' + new Error().stack;
	if(!decoratorClasses) throw 'Missing required attribute decoratorClasses\nat: ' + new Error().stack;
	
	Decorator.call(this, request, metadataClient);
	
	Object.defineProperties(this, {
		'decorators': {
			value: []
		}
	});
	decoratorClasses.forEach(this.addDecorator.bind(this));
	
	Object.defineProperty(request, 'decorator', { value: this });
	
	$.trace.debug('Configured decorators for request ' + this.request.id + ': ' + this.decorators);
	$.trace.debug('Active decorators for request ' + this.request.id + ': ' + this.getActiveDecorators());
}

CompositeDecorator.prototype = new Decorator();
CompositeDecorator.prototype.constructor = CompositeDecorator;

/**
 * Add a decorator to this decorator list.
 */
CompositeDecorator.prototype.addDecorator = function(decoratorClass) {
	this.decorators.push(new decoratorClass(this.request, this.metadataClient, this.parameters));
};

/**
 * Tells if any of the registered decorators are configured to apply to the current
 * request.
 */
CompositeDecorator.prototype.hasActiveDecorators = function(request) {
	return !!this.getActiveDecorators(request).length;
};

/**
 * Returns a list of decorators that apply to the current request.
 */
CompositeDecorator.prototype.getActiveDecorators = function() {
	return this.decorators.filter(function(decorator) {
		return decorator.isActive();
	});
};

/*
 * See Decorator.preRequest
 */
CompositeDecorator.prototype.preRequest = function() {
	$.trace.debug('preRequest of ' + this.request.id);
	
	this.getActiveDecorators().forEach(function(decorator) {
		$.trace.debug('Calling ' + decorator);
		decorator.preRequest();
	});
};

/*
 * See Decorator.postRequest
 */
CompositeDecorator.prototype.postRequest = function(response) {
	$.trace.debug('postRequest of ' + this.request.id);
	
	this.getActiveDecorators().forEach(function(decorator) {
		$.trace.debug('Calling ' + decorator);
		decorator.postRequest(response);
	});
};
