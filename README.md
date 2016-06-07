# XS OData Utils

The XS OData Utils expose a simple API that lets you add delta query and server-driven pagination support on top of classic XS OData web services. This way you may reduce load between your HANA system and downstream servers and clients.

# Features

- Various decorators
 - Delta tokens
 - Server-side pagination (skip tokens)
 - URL rewriting
- Configuration
 - Maximum page size (skip tokens)
 - Change tracking fields to use (delta tokens)
 - Hide change tracking information (delta tokens) 
 - System-wide, service-wide and per collection granularity

# Installation

1. Implement change tracking for your data (see "getting started" guide)
2. [Import](https://help.sap.com/saphelp_hanaplatform/helpdata/en/e6/c0c1f7373f417894e1f73be9f0e2fd/content.htm) and configure the XS OData Utils Delivery Unit
3. Wrap your XS OData service in XSJS
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

# Getting Started

See "Delta Queries and Server-Side Pagination with XSOData.docx" for an in-depth guide from implementing change tracking to wrapper fine-tuning.
