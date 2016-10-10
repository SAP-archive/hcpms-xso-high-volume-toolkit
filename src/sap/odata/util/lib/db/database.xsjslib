/**
 * Simple database access class encapsulating the SQL connection
 * configuration and dealing with setup issues.
 */
function Database() {
}

Database.connection = null;

/**
 * Creates a new connection using the dedicated library SQL connection.
 */
Database.prototype.getConnection = function() {
	try {
	    if(Database.connection) return Database.connection;
	    Database.connection = $.db.getConnection("sap.odata.util.lib.db::odataUtil");
		return Database.connection;
	} catch (e) {
		if(e.code === 2) {
			throw 'OData Utilities not configured: Please configure a user with the' +
			' sap.odata:util.roles::conf role for odataUtil.xssqlcc in' +
			' /sap/hana/xs/admin/#/package/sap.odata.util.lib';
		}
		throw e;
	}
}

/**
 * Accepts a "prepare statement" function that is called with a database connection. Within
 * the function a statement can be prepared and executed.
 * 
 * @parameter statementFunction {function($.db.Connection): void} "prepare statement" function
 */
Database.prototype.prepareStatement = function(statementFunction) {
	try {
		return statementFunction(this.getConnection());
	} catch(e) {
		if(e.code === 258) {
			throw 'OData Utilities not configured: Please configure a user with the' +
			' sap.odata:util.roles::conf role for odataUtil.xssqlcc in' +
			' /sap/hana/xs/admin/#/package/sap.odata.util.lib';
		}
		throw e;
	}
}
