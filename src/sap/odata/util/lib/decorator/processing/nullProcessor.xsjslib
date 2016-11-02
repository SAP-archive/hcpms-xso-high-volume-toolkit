var Processor = $.import('sap.odata.util.lib.decorator.processing', 'processor').Processor;

/**
 * No-op processor
 */
function NullProcessor() {}

NullProcessor.prototype = new Processor();
NullProcessor.prototype.constructor = NullProcessor;

NullProcessor.prototype.isActive = function() { return false; };
