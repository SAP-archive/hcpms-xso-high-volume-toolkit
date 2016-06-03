function Database() {
}

Database.prototype.getConnection = function() {
	try {
		return $.db.getConnection("sap.odata.util.lib.db::odataUtil");
	} catch (e) {
		if(e.code === 2) {
			throw 'OData Utilities not configured: Please configure a user with the' +
			' sap.hana.xs.selfService.user.roles::USSExecutor role for odataUtil.xssqlcc in' +
			' /sap/hana/xs/admin/#/package/sap.odata.util.lib';
		}
		throw e;
	}
}

Database.prototype.prepareStatement = function(statementFunction) {
	try {
		return statementFunction(this.getConnection());
	} catch(e) {
		if(e.code === 258) {
			throw 'OData Utilities not configured: Please configure a user with the' +
			' sap.odata:util::Database role for odataUtil.xssqlcc in' +
			' /sap/hana/xs/admin/#/package/sap.odata.util.lib';
		}
		throw e;
	}
}
