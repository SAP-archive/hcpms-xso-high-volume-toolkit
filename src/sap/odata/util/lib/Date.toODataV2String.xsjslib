(function() {
	if(!Date.prototype.toODataV2String) {
		/**
		 * Returns the date formatted as an OData V2 date
		 * (yyyy-mm-ddddThh:mm:ss.sss0000).
		 */
		Date.prototype.toODataV2String = function() {
			function twoDigits(number) {
				return('0' + number).slice(-2);
			}
			
			function threeDigits(number) {
				return('00' + number).slice(-3);
			}
			
			return this.getUTCFullYear() + '-' + 
			twoDigits(this.getUTCMonth() + 1) + '-' +
			twoDigits(this.getUTCDate()) + 'T' +
			twoDigits(this.getUTCHours()) + ':' +
			twoDigits(this.getUTCMinutes()) + ':' +
			twoDigits(this.getUTCSeconds()) + '.' +
			threeDigits(this.getUTCMilliseconds()) + '0000';
		}
	}
})();
