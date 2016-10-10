var Decorator = $.import('sap.odata.util.lib.decorator', 'decorator').Decorator;
var Performance = $.import('sap.odata.util.lib.performance', 'skiptoken').Performance;

/**
 * Composite decorator delegating the life cycle calls to all of its
 * registered decorators.
 */
function CompositeDecorator(request, metadataClient, decoratorClasses) {
	if(!request) throw 'Missing required attribute request\nat: ' + new Error().stack;
	if(!metadataClient) throw 'Missing required attribute metadataClient\nat: ' + new Error().stack;
	if(!decoratorClasses) throw 'Missing required attribute decoratorClasses\nat: ' + new Error().stack;
	
	Performance.trace('Creating composite decorator ' + request.id, 'CompositeDecorator.init');
	
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
	
	Performance.finishStep('CompositeDecorator.init');
}

CompositeDecorator.prototype = new Decorator();
CompositeDecorator.prototype.constructor = CompositeDecorator;

/**
 * Add a decorator to this decorator list.
 */
CompositeDecorator.prototype.addDecorator = function(decoratorClass) {
	this.decorators.push(new decoratorClass(this.request, this.metadataClient));
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
	Performance.trace('preRequest of ' + this.request.id);
	
	this.getActiveDecorators().forEach(function(decorator) {
		Performance.trace('Calling ' + decorator, decorator);
		decorator.preRequest();
		Performance.finishStep(decorator);
	});
};

/*
 * See Decorator.postRequest
 */
CompositeDecorator.prototype.postRequest = function(response) {
	Performance.trace('postRequest of ' + this.request.id);
	
	this.getActiveDecorators().forEach(function(decorator) {
		Performance.trace('Calling ' + decorator, decorator);
		decorator.postRequest(response);
		Performance.finishStep(decorator);
	});
};
