/**
 * Enhances the String class with <code>getByteLength</code>, a method that
 * tells the string length in bytes.
 * 
 * The calculation is rather costly and should be avoided if possible.
 * 
 */
(function() {
	String.prototype.getByteLength = function() {
		// returns the byte length of an utf8 string
		var s = this.length;
		for (var i = this.length - 1; i >= 0; i--) {
			var code = this.charCodeAt(i);
			if (code > 0x7f && code <= 0x7ff) s++;
			else if (code > 0x7ff && code <= 0xffff) s+=2;
			if (code >= 0xDC00 && code <= 0xDFFF) i--; //trail surrogate
		}
		return s;
	}
})();
