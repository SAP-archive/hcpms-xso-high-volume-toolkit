var Database = $.import('sap.odata.util.lib.db', 'database').Database;

/**
 * Utility class for metadata access via the database. The values returned
 * are cached per request.
 */
var Metadata = (function() {
	function Metadata() {
		this.cache = {};
	}
	
	Metadata.prototype = new Database();
	Metadata.prototype.constructor = Metadata;
	
	/**
	 * Returns a statement function that creates a statement selecting
	 * the metadata of the specified service from the database.
	 *
	 * @return {function($.db.Connection):$.db.PreparedStatement}
	 */
	Metadata.prototype.getMetadataStatement = function(serviceId) {
		return function(connection) {
			var statement = connection
			.prepareStatement('select METADATA from "ODATA_UTIL"."sap.odata.util.data::odata.metadata.ServiceMetadata" WHERE SERVICE_ID = ?');
			
			statement.setString(1, serviceId);
			
			return statement;
		};
	};
	
	/**
	 * Gets the metadata for the specified service from the database. Results are cached
	 * per request.
	 * @return {{
	 * collections: {
	 *	[key: string]: {
	 *			keys: {name: string, type: string},
	 *			properties: {name: string, type: string}
	 *		}
	 *	}
	 * }}
	 */
	Metadata.prototype.getMetadata = function(serviceId) {
		if(this.cache[serviceId]) return this.cache[serviceId];
		
		var resultSet = this.prepareStatement(this.getMetadataStatement(serviceId)).executeQuery();
		
		if(!resultSet.next()) return null;
		
		var result = JSON.parse(resultSet.getNString(1));
		
		this.cache[serviceId] = result;
		
		return result;
	};
	
	/**
	 * Saves the specified metadata document for the specified service ID.
	 *
	 * @parameter serviceId ID of the service
	 * @parameter metadata {{
	 * collections: {
	 *	[key: string]: {
	 *			keys: {name: string, type: string},
	 *			properties: {name: string, type: string}
	 *		}
	 *	}
	 * }}
	 */
	Metadata.prototype.saveMetadata = function(serviceId, metadata) {
		this.prepareStatement(function(connection) {
			var statement = connection
			.prepareStatement('UPSERT "ODATA_UTIL"."sap.odata.util.data::odata.metadata.ServiceMetadata" VALUES (?, ?) WITH PRIMARY KEY');
			statement.setString(1, serviceId);
			statement.setString(2, JSON.stringify(metadata));
			
			statement.executeUpdate();
			connection.commit();
			delete this.cache[serviceId];
		}.bind(this));
	};
	
	return new Metadata();
})();
