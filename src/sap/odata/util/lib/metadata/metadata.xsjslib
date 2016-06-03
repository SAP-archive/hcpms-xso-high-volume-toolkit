var Database = $.import('sap.odata.util.lib.db', 'database').Database;

var Metadata = (function() {
	function Metadata() {
	}
	
	Metadata.prototype = new Database();
	Metadata.prototype.constructor = Metadata;
	
	Metadata.prototype.getMetadataStatement = function(serviceId) {
		return function(connection) {
			var statement = connection
			.prepareStatement('select METADATA from "ODATA_UTIL"."sap.odata.util.data::odata.metadata.ServiceMetadata" WHERE SERVICE_ID = ?');
			
			statement.setString(1, serviceId);
			
			return statement;
		};
	};
	
	Metadata.prototype.getMetadata = function(serviceId) {
		var resultSet = this.prepareStatement(this.getMetadataStatement(serviceId)).executeQuery();
		
		if(!resultSet.next()) return null;
		
		return JSON.parse(resultSet.getNString(1));
	};
	
	Metadata.prototype.saveMetadata = function(serviceId, metadata) {
		this.prepareStatement(function(connection) {
			var statement = connection
			.prepareStatement('UPSERT "ODATA_UTIL"."sap.odata.util.data::odata.metadata.ServiceMetadata" VALUES (?, ?) WITH PRIMARY KEY');
				statement.setString(1, serviceId);
				statement.setString(2, JSON.stringify(metadata));
				
				statement.executeUpdate();
				connection.commit();
			}
		);
	};
	
	return new Metadata();
})();
