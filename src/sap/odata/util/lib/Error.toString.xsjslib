/**
 * Enhances the default toString method of error objects to also
 * print the stack trace. Great for debugging purposes.
 * Please note: this only affects uncaught errors, not those that
 * are thrown explicity:
 *
 * <code>
 * var x = null; x.get(); // Throws error with stack
 * throw 'No stack for me :('; // Throws an error without stack
 * </code>
 */
(function() {
	var originalToString = Error.prototype.toString;
	Error.prototype.toString = function() {
		return originalToString.call(this) + "\nat: " + this.stack;
	}
})();
