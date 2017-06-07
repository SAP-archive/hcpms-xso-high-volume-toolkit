/**
 * Enhances the String class with <code>getByteLength</code>, a method that
 * tells the string length in bytes.
 * 
 */
(function() {
    // byteLengthBySpecificRegex is approx. 5 times faster than the others
	String.prototype.getByteLength = byteLengthBySpecificRegex;
	
	function byteLengthByChar() {
	    var s = this.length;
		for (var i = this.length - 1; i >= 0; i--) {
			var code = this.charCodeAt(i);
			if (code > 0x7f && code <= 0x7ff) s++;
			else if (code > 0x7ff && code <= 0xffff) s+=2;
			if (code >= 0xDC00 && code <= 0xDFFF) i--; //trail surrogate
		}
		return s;
	}
	
	function byteLengthByWildcardRegex() {
	    return ~-encodeURIComponent(this).split(/%..|./).length;
	}
	
	function byteLengthBySpecificRegex() {
	    var m = encodeURIComponent(this).match(/%[89ABab]/g);
        return this.length + (m ? m.length : 0);
	}
})();
