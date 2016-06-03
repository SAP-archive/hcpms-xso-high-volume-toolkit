(function() {
	var originalToString = Error.prototype.toString;
	Error.prototype.toString = function() {
		return originalToString.call(this) + "\nat: " + this.stack;
	}
})();
