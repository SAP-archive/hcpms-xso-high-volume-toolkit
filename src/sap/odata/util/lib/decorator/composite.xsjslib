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
	$.trace.debug('Active preprocessors for request ' + this.request.id + ': ' + this.getActivePreProcessors());
	$.trace.debug('Active postprocessors for request ' + this.request.id + ': ' + this.getActivePostProcessors());
	
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
 * Returns a list of decorators that apply to the current request.
 */
CompositeDecorator.prototype.getActivePreProcessors = function() {
	return this.decorators.filter(function(decorator) {
		return decorator.preProcessorIsActive();
	});
};

/**
 * Returns a list of decorators that apply to the current request.
 */
CompositeDecorator.prototype.getActivePostProcessors = function() {
	return this.decorators.filter(function(decorator) {
		return decorator.postProcessorIsActive();
	});
};

/*
 * See Decorator.preRequest
 */
CompositeDecorator.prototype.preRequest = function() {
	Performance.trace('preRequest of ' + this.request.id);
	
	this.getActivePreProcessors().forEach(function(decorator) {
		Performance.trace('Calling ' + decorator, decorator);
		decorator.preRequest();
		Performance.finishStep(decorator);
	});
	if(this.request.json) {
		var decorators = this.getActivePreProcessors();
		
		Performance.trace('Visiting data nodes of ' + this.request.id + ' with ' + decorators, 'CompositeDecorator.visitPreRequest');
		this.request.data.traverse(function(object, parent, name) {
			for(var i = 0; i < decorators.length; i++) {
				decorators[i].visitPreRequest(object, parent, name);
			}
		});
		Performance.finishStep('CompositeDecorator.visitPreRequest');
	}
};

/*
 * See Decorator.postRequest
 */
CompositeDecorator.prototype.postRequest = function(response) {
	Performance.trace('postRequest of ' + this.request.id);
	
	this.getActivePostProcessors().forEach(function(decorator) {
		Performance.trace('Calling ' + decorator, decorator);
		decorator.postRequest(response);
		Performance.finishStep(decorator);
	});
	if(response.json) {
		var decorators = this.getActivePostProcessors();
		
		Performance.trace('Visiting data nodes of ' + this.request.id + ' with ' + decorators, 'CompositeDecorator.visitPostRequest');
		response.data.traverse(function(object, parent, name) {
			for(var i = 0; i < decorators.length; i++) {
				decorators[i].visitPostRequest(object, parent, name);
			}
		});
		Performance.finishStep('CompositeDecorator.visitPostRequest');
	}
};
