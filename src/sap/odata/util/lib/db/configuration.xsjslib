var Database = $.import('sap.odata.util.lib.db', 'database').Database;

/**
 * Singleton class that grants access to configuration.
 */
var Configuration = (function() {
	function Configuration() {
		this.db = new Database();
		this.cache = {};
	}
	
	/**
	 * Returns a prepared statement preconfigured with the specified values.
	 * 
	 * @parameter {string} propertyName Configuration property identifier
	 * @parameter {string?} serviceId Service discriminator, e.g. <code>/my/service.xsjs</code>.
	 *   Defaults to empty string.
	 * @parameter {string?} collectionName Collection discriminator, e.g. <code>ProductSet</code>
	 *   Defaults to empty string. 
	 */
	Configuration.prototype.propertyStatement = function(propertyName, serviceId, collectionName) {
		return function(connection) {
			var statement = connection
				.prepareStatement('select VALUE from "ODATA_UTIL"."sap.odata.util.data::odata.config.Configuration" WHERE KEY = ? AND SERVICE_ID = ? AND COLLECTION_NAME = ?');
				statement.setString(1, propertyName);
				statement.setString(2, serviceId || '');
				statement.setString(3, collectionName || '');
			
			return statement;
		};
	};
	
	/**
	 * Retrieves the specified property from the database. This method tries to find the most specific matching value
	 * according to the parameters. If <code>collectionName</code> is not specified or no value can be found for this
	 * combination of <code>propertyName</code>, <code>serviceId</code> and <code>collectionName</code>, then it will
	 * try to obtain a value for the combination <code>propertyName</code> and <code>serviceId</code>. If no value can
	 * be found either or <code>serviceId</code> is not specified, it will load the "global" default value for
	 * <code>propertyName</code>. 
	 * 
	 * @parameter {string} propertyName Configuration property identifier
	 * @parameter {string?} serviceId Service discriminator, e.g. <code>/my/service.xsjs</code>
	 * @parameter {string?} collectionName Collection discriminator, e.g. <code>ProductSet</code>
	 */
	Configuration.prototype.getProperty = function(propertyName, serviceId, collectionName) {
		var args = [propertyName, serviceId, collectionName];
		var cacheKey = args.join('\\');
		
		if(this.cache[cacheKey]) return this.cache[cacheKey]; 
		
		var resultSet;
		
		do {
			resultSet = this.db.prepareStatement(this.propertyStatement.apply(this, args)).executeQuery();
			args.pop();
		} while(!resultSet.next() && args.length);
		
		try {
			var result = resultSet.getNString(1);
			this.cache[cacheKey] = result;
			return result;
		} catch(e) {
			throw 'OData Utility Configuration parameter ' + propertyName + ' could not be found.';
		}
	}
	
	return new Configuration();
})();
