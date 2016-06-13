CREATE TRIGGER "com.example.delta.data::hcpms_xso_hvt.demo.BusinessPartner_INS" AFTER INSERT ON "HCPMS_XSO_HVT_DEMO"."com.example.delta.data::hcpms_xso_hvt.demo.BusinessPartner"
REFERENCING NEW ROW newrow
FOR EACH ROW
BEGIN
    UPSERT "HCPMS_XSO_HVT_DEMO"."com.example.delta.data::hcpms_xso_hvt.demo.BusinessPartner_Shadow"
		( "ID.PARTNERID", DELTATOKEN, IS_DELETED )
	VALUES( :newrow.PARTNERID, CURRENT_UTCTIMESTAMP, 'N' )  WITH PRIMARY KEY;
END;

CREATE TRIGGER "com.example.delta.data::hcpms_xso_hvt.demo.BusinessPartner_UPD" AFTER UPDATE ON "HCPMS_XSO_HVT_DEMO"."com.example.delta.data::hcpms_xso_hvt.demo.BusinessPartner"
REFERENCING NEW ROW newrow
FOR EACH ROW
BEGIN
	UPDATE "HCPMS_XSO_HVT_DEMO"."com.example.delta.data::hcpms_xso_hvt.demo.BusinessPartner_Shadow"
	set DELTATOKEN = CURRENT_UTCTIMESTAMP
	WHERE "ID.PARTNERID" = :newrow.PARTNERID;
END;

CREATE TRIGGER "com.example.delta.data::hcpms_xso_hvt.demo.BusinessPartner_DEL" AFTER DELETE ON "HCPMS_XSO_HVT_DEMO"."com.example.delta.data::hcpms_xso_hvt.demo.BusinessPartner"
REFERENCING OLD ROW oldrow
FOR EACH ROW
BEGIN
	UPDATE "HCPMS_XSO_HVT_DEMO"."com.example.delta.data::hcpms_xso_hvt.demo.BusinessPartner_Shadow" set DELTATOKEN = CURRENT_UTCTIMESTAMP, IS_DELETED='Y' WHERE "ID.PARTNERID" = :oldrow.PARTNERID;
END;

CREATE TRIGGER "com.example.delta.data::hcpms_xso_hvt.demo.SalesOrderHeader_INS" AFTER INSERT ON "HCPMS_XSO_HVT_DEMO"."com.example.delta.data::hcpms_xso_hvt.demo.SalesOrderHeader"
REFERENCING NEW ROW newrow
FOR EACH ROW
BEGIN
    UPSERT "HCPMS_XSO_HVT_DEMO"."com.example.delta.data::hcpms_xso_hvt.demo.SalesOrderHeader_Shadow"
		( "ID.SALESORDERID", DELTATOKEN, IS_DELETED )
	VALUES( :newrow.SALESORDERID, CURRENT_UTCTIMESTAMP, 'N' )  WITH PRIMARY KEY;
END;

CREATE TRIGGER "com.example.delta.data::hcpms_xso_hvt.demo.SalesOrderHeader_UPD" AFTER UPDATE ON "HCPMS_XSO_HVT_DEMO"."com.example.delta.data::hcpms_xso_hvt.demo.SalesOrderHeader"
REFERENCING NEW ROW newrow
FOR EACH ROW
BEGIN
	UPDATE "HCPMS_XSO_HVT_DEMO"."com.example.delta.data::hcpms_xso_hvt.demo.SalesOrderHeader_Shadow"
	set DELTATOKEN = CURRENT_UTCTIMESTAMP
	WHERE "ID.SALESORDERID" = :newrow.SALESORDERID;
END;

CREATE TRIGGER "com.example.delta.data::hcpms_xso_hvt.demo.SalesOrderHeader_DEL" AFTER DELETE ON "HCPMS_XSO_HVT_DEMO"."com.example.delta.data::hcpms_xso_hvt.demo.SalesOrderHeader"
REFERENCING OLD ROW oldrow
FOR EACH ROW
BEGIN
	UPDATE "HCPMS_XSO_HVT_DEMO"."com.example.delta.data::hcpms_xso_hvt.demo.SalesOrderHeader_Shadow" set DELTATOKEN = CURRENT_UTCTIMESTAMP, IS_DELETED='Y' WHERE "ID.SALESORDERID" = :oldrow.SALESORDERID;
END;

CREATE TRIGGER "com.example.delta.data::hcpms_xso_hvt.demo.Addresses_INS" AFTER INSERT ON "HCPMS_XSO_HVT_DEMO"."com.example.delta.data::hcpms_xso_hvt.demo.Addresses"
REFERENCING NEW ROW newrow
FOR EACH ROW
BEGIN
    UPSERT "HCPMS_XSO_HVT_DEMO"."com.example.delta.data::hcpms_xso_hvt.demo.Addresses_Shadow"
		( "ID.ADDRESSID", DELTATOKEN, IS_DELETED )
	VALUES( :newrow.ADDRESSID, CURRENT_UTCTIMESTAMP, 'N' )  WITH PRIMARY KEY;
END;

CREATE TRIGGER "com.example.delta.data::hcpms_xso_hvt.demo.Addresses_UPD" AFTER UPDATE ON "HCPMS_XSO_HVT_DEMO"."com.example.delta.data::hcpms_xso_hvt.demo.Addresses"
REFERENCING NEW ROW newrow
FOR EACH ROW
BEGIN
	UPDATE "HCPMS_XSO_HVT_DEMO"."com.example.delta.data::hcpms_xso_hvt.demo.Addresses_Shadow"
	set DELTATOKEN = CURRENT_UTCTIMESTAMP
	WHERE "ID.ADDRESSID" = :newrow.ADDRESSID;
END;

CREATE TRIGGER "com.example.delta.data::hcpms_xso_hvt.demo.Addresses_DEL" AFTER DELETE ON "HCPMS_XSO_HVT_DEMO"."com.example.delta.data::hcpms_xso_hvt.demo.Addresses"
REFERENCING OLD ROW oldrow
FOR EACH ROW
BEGIN
	UPDATE "HCPMS_XSO_HVT_DEMO"."com.example.delta.data::hcpms_xso_hvt.demo.Addresses_Shadow" set DELTATOKEN = CURRENT_UTCTIMESTAMP, IS_DELETED='Y' WHERE "ID.ADDRESSID" = :oldrow.ADDRESSID;
END;
