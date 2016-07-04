/**
 * Enhances the String class with <code>getByteLength</code>, a method that
 * tells the string length in bytes.
 * 
 * The calculation is rather costly and should be avoided if possible.
 * 
 */
(function() {
	String.prototype.getByteLength = function() {
		return ~-encodeURI(this).split(/%..|./).length;
	}
})();
