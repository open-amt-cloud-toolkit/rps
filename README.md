# amt-rcs
A Remote Configuration Service for configuring Intel:registered: AMT devices into admin control mode.  Depends on node-forge and ws NPM libraries.  Before running the service, you'll need to npm install both of these packages.
Built to work with MeshCMD which you can get here: https://www.meshcommander.com/meshcommander/meshcmd

### New Features
- Version 0.2.0 makes this into a module library for improved integration into your existing solutions
- Support for custom websocket server, database, logging integration added in 0.2.0.
- Support for setting up tls for secure websocket communication (for the included wsserver)
- Supports multiple AMT profiles.  Passes designated script file to MeshCMD or receiving client application/agent
- Supports multiple AMT domain suffix and perform DNS Suffix matching server side
- Supports custom AMT provisioning hashes and perform provisioning hash matching server side

### Instructions
Requires: 
 - Intel:registered: AMT provisioning certificate that matches the DNS suffix of your Intel:registered: AMT machine

Modify the rcs-config.json file to specify the location of the provisioning certificate and specify the Intel:registered: AMT password to be set
```
{
  "Name": "RCS Configuration File",
  "Description": "Contains settings to configure the RCS Server",
  "WSConfiguration": {
    "WebSocketPort": 8080,
    "WebSocketTLS": false,
    "WebSocketCertificate": "tlscert.pem",
    "WebSocketCertificateKey": "tlskey.pem"
  },
  "AMTConfigurations": [
    {
      "ProfileName": "default",
      "AMTPassword": "password",
      "ConfigurationScript": ""
    },
    {
      "ProfileName": "config2",
      "AMTPassword": "password",
      "ConfigurationScript": ""
    }
  ],
  "AMTDomains": [
    {
      "Name": "domain1",
      "DomainSuffix": "amt.net",
      "ProvisioningCert": "d1.pfx",
      "ProvisioningCertPassword": "password"
    },
    {
      "Name": "domain2",
      "DomainSuffix": "somethingelse.com",
      "ProvisioningCert": "d2.pfx",
      "ProvisioningCertPassword": "password"
    }
  ]
}
```

Start from command line: node amt-rcs.js

### Future Work
 - Adding support for listening for remote configuration messages from Intel:registered: AMT

