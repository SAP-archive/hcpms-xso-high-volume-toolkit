var Database = $.import('sap.odata.util.lib.db', 'database').Database;

var Metadata = (function() {
	function Metadata() {
		this.cache = {};
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
		if(this.cache[serviceId]) return this.cache[serviceId];
		
		var resultSet = this.prepareStatement(this.getMetadataStatement(serviceId)).executeQuery();
		
		if(!resultSet.next()) return null;
		
		var result = JSON.parse(resultSet.getNString(1));
		
		this.cache[serviceId] = result;
		
		return result;
	};
	
	Metadata.prototype.saveMetadata = function(serviceId, metadata) {
		this.prepareStatement(function(connection) {
			var statement = connection
			.prepareStatement('UPSERT "ODATA_UTIL"."sap.odata.util.data::odata.metadata.ServiceMetadata" VALUES (?, ?) WITH PRIMARY KEY');
			statement.setString(1, serviceId);
			statement.setString(2, JSON.stringify(metadata));
			
			statement.executeUpdate();
			connection.commit();
			delete this.cache[serviceId];
		});
	};
	
	return new Metadata();
})();
