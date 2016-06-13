# SAP HCPms XS OData High Volume Toolkit

This toolkit provides a simple API that lets you enhance your XS OData services with delta query and server-driven pagination support. In high-volume scenarios [delta tokens help you reduce the network load between your server and its clients](http://scn.sap.com/blogs/pault/2014/03/08/delta-queries-part-1). [Skip tokens provide a way to enforce server-side pagination](http://scn.sap.com/community/developer-center/mobility-platform/blog/2015/06/04/implementing-a-skip-token-odata-query-option-skiptoken-for-soap-data-using-integration-gateway), and therefore help you break down large result sets over multiple smaller requests. Both mechanisms can be leveraged to optimize the network load between your SAP Mobile Platform 3.0/HCP Mobile Services for Development & Operations.

These additional features are implemented in terms of a XS JavaScript service (generally referred to here as "wrapper") that processes provided delta tokens and skip tokens and translates them to plain XS OData. Server-side pagination will work out of the box, while you will need to have change tracking in terms of UTC timestamps implemented in your HANA system for delta queries to work.

# Features

- Individually applicable XSOData enhancements
 - Delta tokens
 - Skip tokens
 - Wrapper-level URL rewriting
- Configuration
 - Maximum page size for server-driven pagination
 - Exposed change tracking fields
 - Wrapper-level change tracking information stripping (delta tokens)
 - System-wide, service-wide and per collection configuration granularity

# Getting Started

1. [Download the latest release Delivery Unit (ODATA_UTIL_*)](https://github.com/SAP/hcpms-odata-skip-token-pagination/tree/master/dist)
2. [Import](https://help.sap.com/saphelp_hanaplatform/helpdata/en/e6/c0c1f7373f417894e1f73be9f0e2fd/content.htm) and [configure](https://github.com/SAP/hcpms-xso-high-volume-toolkit#further-documentation) the XS OData Utils Delivery Unit
3. (Optional for delta queries) [Implement change tracking for your data](https://github.com/SAP/hcpms-xso-high-volume-toolkit#further-documentation)
4. Wrap your XS OData service in XSJS
```
// com/example/wrapper/delta.xsjs
var oDataUtils = $.import('sap.odata.util', 'decorators');
var destination = $.net.http.readDestination('com.example.delta', 'xsodata');

oDataUtils
	.decorate(destination)
	.withDeltaTokens()
	.withSkipTokens()
	.withUrlRewriting()
	.and.applyDecorators();
```

Done!

# Further Documentation

See "Delta Queries and Server-Side Pagination with XSOData.docx" for an in-depth guide from implementing change tracking to wrapper fine-tuning.
