/**
 * Quick & dirty performance tracing module. Logs messages along
 * with an identifier unique per request and the time elapsed
 * since initialization.
 * 
 * Allows basic log-based performance analysis
 * 
 * <code>
 * Performance.trace('Hello, trace!')
 * // Prints: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx/tttt: Hello, trace!
 * // (xxxx = UUID, tttt = elapsed time in MS)
 * </code>
 * 
 * Also allows sub-measurements via tagged steps:
 * 
 * <code>
 * Performance.trace('Hello, trace!', 'tag.hello')
 * // Prints: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx/tttt/hello.tag: Hello, trace!
 * 
 * Performance.finishStep('tag.hello')
 * // Prints: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx/tttt/hello.tag: Finished after ttttms.
 * </code>
 * 
 */
var Performance = {
    // Quick&dirty UUID generator for log analysis
    _uuid: function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    },
    uuid: null,
    start: new Date().getTime(),
    timings: {},
    timeSinceStart: function() {
        return new Date().getTime() - Performance.start;
    },
    _prefix: function(tag) {
        return Performance.uuid + '/' + Performance.timeSinceStart() + (tag ? '/' + tag : '');
    },
    trace: function(message, tag) {
        tag = tag || '';
        $.trace.info(Performance._prefix(tag) + ': ' + message);
        Performance.timings[tag] = new Date().getTime();
    },
    finishStep: function(tag) {
        tag = tag || '';
        $.trace.info(Performance._prefix(tag) + ': Finished after ' + (new Date().getTime() - Performance.timings[tag]) + 'ms.');
    }
};

// Set UUID for this API call
Performance.uuid = Performance._uuid()

Performance.trace('Tracing performance. Format: <request UUID>/<time since start>[/<trace tag>]: <message>');
