<a name="unreleased"></a>
## [Unreleased]


<a name="2.0.1"></a>
## [2.0.1] - 2021-09-22
### Build
- **deps:** bump tmpl from 1.0.4 to 1.0.5 (#53b175f) 
- **version:** update to v2.0.1 (#1222ff7) 

### Ci
- azure boards issue sync (#a730ce7) 

### Fix
- **mqtt:** topic publishing is now rps/events (#d8cab2d) 


<a name="v2.0.0"></a>
## [v2.0.0] - 2021-09-15
### Build
- update version to v2.0.0 (#1dbd15c) 
- **deps:** bump ws from 7.5.3 to 8.2.1 (#5ebdc3f) 
- **deps:** bump ws from 8.2.1 to 8.2.2 (#8506620) 
- **deps:** bump path-parse from 1.0.6 to 1.0.7 (#6cf900e) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/parser from 4.30.0 to 4.31.0 (#84964a7) 
- **deps-dev:** bump [@types](https://github.com/types)/node-forge from 0.10.3 to 0.10.4 (#a39bb6a) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/parser from 4.29.3 to 4.30.0 (#68d69ea) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin (#d8868a3) 
- **deps-dev:** bump eslint-config-standard-with-typescript (#e52a541) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin (#5358336) 
- **deps-dev:** bump eslint-plugin-import from 2.24.1 to 2.24.2 ([#394](https://github.com/open-amt-cloud-toolkit/rps/issues/394)) (#35f9fd5) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin ([#391](https://github.com/open-amt-cloud-toolkit/rps/issues/391)) (#34cd325) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/parser from 4.29.2 to 4.29.3 (#cfe2ea9) 
- **deps-dev:** bump [@types](https://github.com/types)/jest from 26.0.24 to 27.0.1 (#4e4f1d6) 
- **deps-dev:** bump eslint-plugin-import from 2.24.0 to 2.24.1 (#05aa5a6) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/parser from 4.29.1 to 4.29.2 (#6ed304c) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin (#78947a4) 
- **deps-dev:** bump [@types](https://github.com/types)/node-forge from 0.10.2 to 0.10.3 (#dade1b6) 
- **deps-dev:** bump typescript from 4.3.5 to 4.4.2 (#444bd5d) 

### Docs
- **changelog:** update changelog (#15ca5ec) 

### Feat
- **ciraconfig:** allow null values for ciraconfigname in profile edit (#f3b2659) 
- **multitenancy:** add support for multiple tenants (#bbbdf95) 

### Fix
- **activation:** update client response message (#23a7a0b) 
- **activation:** now device is saved after activation in acm ([#416](https://github.com/open-amt-cloud-toolkit/rps/issues/416)) (#c1b02f4) 
- **dbquery:** wifi configs incorrectly joined with AMT Profiles ([#415](https://github.com/open-amt-cloud-toolkit/rps/issues/415)) (#81e2198) 
- **errors:** return error name while delete request fails (#bf1f76c) 
- **mqtt:** corrects messages for 'getAll' requests (#8ee8964) 
- **mqtt:** adds activation success message (#cfd6a34) 
- **multitenancy:** device creation with MPS now includes tenantId (#e01cd79) 
- **network:** now removes all the profiles with proirity 0 ([#424](https://github.com/open-amt-cloud-toolkit/rps/issues/424)) (#b00e6a9) 
- **network:** get wifi passphrase from vault ([#409](https://github.com/open-amt-cloud-toolkit/rps/issues/409)) (#35532d2) 
- **parser:** handle when guid is sent as string or buffer (#fdff8bf) 
- **wireless:** Updated passphrase key name in vault to sync with other keys ([#419](https://github.com/open-amt-cloud-toolkit/rps/issues/419)) (#313daa2) 

### Refactor
- **database:** simplify database organization (#9570a01) 
- **database:** simplify database organization (#93803a8) 
- **docker:** remove old scripts (#c5d3af4) 
- **interfaces:** organize interfaces in one location (#1a9f2c4) 
- **interfaces:** clean up naming convention (#7ebedfa) 
- **profile:** adds server side pass gen (#fddb57e) 
- **secrets:** remove unused interface functions (#b4cdb96) 
- **sslpostgres:** removed username, password and enabled ssl (#8ad5ead) 
- **types:** add types for express (#bda26af) 
- **validator:** move API validation to middleware (#f06e5de) 

### BREAKING CHANGE

tenantId is a new field in the db and all queries now require it


<a name="v1.5.0"></a>
## [v1.5.0] - 2021-08-12
### Build
- **deps:** bump express-validator from 6.12.0 to 6.12.1 (#9d64d0d) 
- **deps:** bump node-vault from 0.9.21 to 0.9.22 (#3c5b63f) 
- **deps:** bump ws from 7.5.0 to 7.5.1 (#e810305) 
- **deps:** bump ws from 7.5.1 to 7.5.2 ([#321](https://github.com/open-amt-cloud-toolkit/rps/issues/321)) (#ba7acfd) 
- **deps:** bump ws from 7.5.2 to 7.5.3 (#afa15de) 
- **deps:** bump pg from 8.6.0 to 8.7.1 (#ad5ca5e) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/parser from 4.26.1 to 4.27.0 (#70033b3) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/parser from 4.28.4 to 4.28.5 (#29f013d) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin (#162b2d6) 
- **deps-dev:** bump sinon from 11.1.1 to 11.1.2 (#2e56653) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/parser from 4.28.2 to 4.28.4 (#9363278) 
- **deps-dev:** bump [@types](https://github.com/types)/ws from 7.4.6 to 7.4.7 (#25f91ec) 
- **deps-dev:** bump [@types](https://github.com/types)/node-forge from 0.10.0 to 0.10.2 (#dc10ca8) 
- **deps-dev:** bump [@types](https://github.com/types)/express from 4.17.12 to 4.17.13 (#bcbd64a) 
- **deps-dev:** bump eslint from 7.31.0 to 7.32.0 (#2cbe72a) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin (#155269c) 
- **deps-dev:** bump [@types](https://github.com/types)/pg from 8.6.0 to 8.6.1 (#2153a3f) 
- **deps-dev:** bump eslint from 7.30.0 to 7.31.0 ([#340](https://github.com/open-amt-cloud-toolkit/rps/issues/340)) (#82b0d51) 
- **deps-dev:** bump nodemon from 2.0.9 to 2.0.12 (#fdb16d0) 
- **deps-dev:** bump [@types](https://github.com/types)/jest from 26.0.23 to 26.0.24 ([#328](https://github.com/open-amt-cloud-toolkit/rps/issues/328)) (#4e54c0c) 
- **deps-dev:** bump [@types](https://github.com/types)/body-parser from 1.19.0 to 1.19.1 ([#331](https://github.com/open-amt-cloud-toolkit/rps/issues/331)) (#9cb081c) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin ([#325](https://github.com/open-amt-cloud-toolkit/rps/issues/325)) (#fd94a29) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/parser from 4.28.5 to 4.29.1 ([#367](https://github.com/open-amt-cloud-toolkit/rps/issues/367)) (#e469b38) 
- **deps-dev:** bump [@types](https://github.com/types)/ws from 7.4.5 to 7.4.6 ([#324](https://github.com/open-amt-cloud-toolkit/rps/issues/324)) (#592213e) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/parser from 4.28.1 to 4.28.2 ([#326](https://github.com/open-amt-cloud-toolkit/rps/issues/326)) (#0e49242) 
- **deps-dev:** bump eslint from 7.29.0 to 7.30.0 (#2192646) 
- **deps-dev:** bump typescript from 4.3.4 to 4.3.5 (#e3f2cf4) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/parser from 4.27.0 to 4.28.1 (#9d72ea2) 
- **deps-dev:** bump nodemon from 2.0.8 to 2.0.9 (#e8598ee) 
- **deps-dev:** bump nodemon from 2.0.7 to 2.0.8 (#84b325f) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin ([#311](https://github.com/open-amt-cloud-toolkit/rps/issues/311)) (#56db326) 
- **deps-dev:** bump eslint-plugin-import from 2.23.4 to 2.24.0 ([#366](https://github.com/open-amt-cloud-toolkit/rps/issues/366)) (#89ccd76) 
- **deps-dev:** bump eslint from 7.28.0 to 7.29.0 (#0d8a0bd) 
- **deps-dev:** bump [@types](https://github.com/types)/node from 14.17.3 to 14.17.4 (#6a8812f) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin (#e182e98) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin ([#368](https://github.com/open-amt-cloud-toolkit/rps/issues/368)) (#54d1087) 
- **version:** bump to v1.5.0 ([#376](https://github.com/open-amt-cloud-toolkit/rps/issues/376)) (#429fbdb) 

### Docs
- update copyright label (#341039e) 
- **api:** updated api documentation ([#319](https://github.com/open-amt-cloud-toolkit/rps/issues/319)) (#7f88085) 
- **readme:** docker change (#7cc208b) 
- **readme:** update to v1.4.0 (#1abf070) 
- **security:** added SECURITY.md file (#f84d79b) 
- **security:** added security.md file (#b8a743e) 

### Feat
- **actions:** added wifi configuration on the amt device ([#333](https://github.com/open-amt-cloud-toolkit/rps/issues/333)) (#e7d6ab0) 
- **api:** add pagination following odata spec ([#348](https://github.com/open-amt-cloud-toolkit/rps/issues/348)) (#47fc760) 
- **api:** integrated wifi configurations with AMT profile ([#318](https://github.com/open-amt-cloud-toolkit/rps/issues/318)) (#ea56267) 
- **api:** added new wifi api ([#307](https://github.com/open-amt-cloud-toolkit/rps/issues/307)) (#dc0f5a1) 
- **mqtt:** Adds event logging to rps (#2e01558) 

### Fix
- db script has duplicate wireless config tables ([#327](https://github.com/open-amt-cloud-toolkit/rps/issues/327)) (#185172f) 
- **activation:** updated client response message to json ([#352](https://github.com/open-amt-cloud-toolkit/rps/issues/352)) (#ced7fc2) 
- **api:** ciraconfigname accepts null values now (#a4f190e) 
- **api:** removed network config (#c590f0f) 
- **db:** updated db mappings ([#336](https://github.com/open-amt-cloud-toolkit/rps/issues/336)) (#688475e) 
- **docs:** updated swagger documentation as per latest api changes (#a6ed57b) 

### Refactor
- **db:** removed unused configuration script from profiles ([#312](https://github.com/open-amt-cloud-toolkit/rps/issues/312)) (#4e38fae) 
- **logging:** changed vault key to be hard coded (#eef6a22) 
- **logging:** removed key logging (#355b5a4) 
- **logging:** removed vault log statement (#e0ced54) 
- **logging:** removed logging sensitive data (#6ad8a2c) 
- **logging:** updated log messages (#4e683f7) 

### BREAKING CHANGE

removed configuration_script column from profiles db


<a name="v1.4.0"></a>
## [v1.4.0] - 2021-06-23
### Build
- **dep:** bump color-string to 1.5.5 (#0e7455b) 
- **deps:** bump normalize-url from 4.5.0 to 4.5.1 (#b5c68c7) 
- **deps:** bump express-validator from 6.10.1 to 6.11.1 (#a351ac6) 
- **deps:** bump hosted-git-info from 2.8.8 to 2.8.9 (#ce17106) 
- **deps:** bump ws from 7.4.5 to 7.4.6 (#4d399b6) 
- **deps:** bump express-validator from 6.11.1 to 6.12.0 ([#290](https://github.com/open-amt-cloud-toolkit/rps/issues/290)) (#2a331f1) 
- **deps:** bump express-ws from 4.0.0 to 5.0.2 ([#279](https://github.com/open-amt-cloud-toolkit/rps/issues/279)) (#391ae2f) 
- **deps:** bump ws from 7.4.6 to 7.5.0 ([#295](https://github.com/open-amt-cloud-toolkit/rps/issues/295)) (#e8ae0a1) 
- **deps:** bump glob-parent from 5.1.1 to 5.1.2 (#9365b3d) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin (#def2289) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin (#580fea5) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/parser from 4.26.0 to 4.26.1 ([#278](https://github.com/open-amt-cloud-toolkit/rps/issues/278)) (#d642fc0) 
- **deps-dev:** bump [@types](https://github.com/types)/node-forge from 0.9.9 to 0.10.0 ([#277](https://github.com/open-amt-cloud-toolkit/rps/issues/277)) (#1df53c0) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin ([#280](https://github.com/open-amt-cloud-toolkit/rps/issues/280)) (#c4e9c7e) 
- **deps-dev:** bump [@types](https://github.com/types)/node from 14.17.2 to 14.17.3 ([#281](https://github.com/open-amt-cloud-toolkit/rps/issues/281)) (#935044d) 
- **deps-dev:** bump eslint from 7.27.0 to 7.28.0 (#679104f) 
- **deps-dev:** bump eslint-plugin-import from 2.23.3 to 2.23.4 (#6ff1281) 
- **deps-dev:** bump eslint-plugin-import from 2.22.1 to 2.23.2 (#0aa6fa0) 
- **deps-dev:** bump [@types](https://github.com/types)/node from 14.17.1 to 14.17.2 (#ea74ff3) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/parser from 4.24.0 to 4.26.0 (#e9edde0) 
- **deps-dev:** bump typescript from 4.2.4 to 4.3.2 (#c4f2a81) 
- **deps-dev:** bump ts-jest from 26.5.5 to 26.5.6 (#46cbc06) 
- **deps-dev:** bump [@types](https://github.com/types)/node-forge from 0.9.7 to 0.9.9 (#92442f8) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin ([#289](https://github.com/open-amt-cloud-toolkit/rps/issues/289)) (#863e3e9) 
- **deps-dev:** bump [@types](https://github.com/types)/node from 14.17.0 to 14.17.1 (#063e4e6) 
- **deps-dev:** bump [@types](https://github.com/types)/express from 4.17.11 to 4.17.12 (#5ddd544) 
- **deps-dev:** bump eslint-config-standard from 16.0.2 to 16.0.3 (#9c653fc) 
- **deps-dev:** bump sinon from 10.0.1 to 11.1.1 (#7a9dc70) 
- **deps-dev:** bump [@types](https://github.com/types)/pg from 7.14.11 to 8.6.0 (#5ca6215) 
- **deps-dev:** bump [@types](https://github.com/types)/node from 14.14.45 to 14.17.0 (#cd6ee2b) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin (#2bca3c0) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/parser from 4.22.0 to 4.22.1 (#ffb4f48) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/parser from 4.23.0 to 4.24.0 (#9730e07) 
- **deps-dev:** bump eslint from 7.25.0 to 7.27.0 (#4d1dcb3) 
- **deps-dev:** bump [@types](https://github.com/types)/node from 14.14.44 to 14.14.45 (#401efec) 
- **deps-dev:** bump [@types](https://github.com/types)/ws from 7.4.2 to 7.4.4 (#391d380) 
- **deps-dev:** bump [@types](https://github.com/types)/ws from 7.4.4 to 7.4.5 (#31462bd) 
- **deps-dev:** bump typescript from 4.3.2 to 4.3.4 ([#298](https://github.com/open-amt-cloud-toolkit/rps/issues/298)) (#f4ae9b9) 
- **deps-dev:** bump [@types](https://github.com/types)/node from 14.14.43 to 14.14.44 (#0f8128a) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/parser from 4.22.1 to 4.23.0 (#b327ea3) 
- **docker:** set user as non root (#f8e7366) 
- **version:** bump to v1.4.0 (#ea95076) 

### Ci
- add codeql for code analysis (#c7ad021) 
- **changelog:** add automation for changelog (#af0691a) 

### Docs
- **api:** added license to swagger.yaml ([#242](https://github.com/open-amt-cloud-toolkit/rps/issues/242)) (#004e8c0) 
- **package.json:** filled in additional info (#59351b9) 

### Feat
- **api:** cira config will accept static or generates dynamic password ([#283](https://github.com/open-amt-cloud-toolkit/rps/issues/283)) (#ec1ec11) 

### Fix
- **api:** mps password updates in vault on edit in cira profiles ([#303](https://github.com/open-amt-cloud-toolkit/rps/issues/303)) (#97a14ee) 
- **api:** delete mps password when random generate password is true in ciraconfig edit ([#293](https://github.com/open-amt-cloud-toolkit/rps/issues/293)) (#6339a1b) 
- **api:** updated mps api for device creation and deletion ([#245](https://github.com/open-amt-cloud-toolkit/rps/issues/245)) (#0e9fbbb) 
- **swagger:** updated API documentation (#93d26c0) 
- **swagger:** updated API documentation (#28ab03e) 
- **swagger:** updated API documentation (#bd5ee49) 
- **swagger:** updated API documentation (#ba4e238) 
- **swagger:** updated API documentation (#f9ed938) 

### Refactor
- **cira:** mps username and password are stored in db and vault respectively for each device ([#284](https://github.com/open-amt-cloud-toolkit/rps/issues/284)) (#c5aa6e3) 
- **logging:** remove file transport for log output (#27a4978) 
- **vault:** removed profile name prefixes for key names (#f3d2a13) 

### BREAKING CHANGE

DB Schema changes for CIRA config to accept both static
and dynamic passwords.

Vault KEY names are changed


<a name="v1.3.0"></a>
## [v1.3.0] - 2021-05-06
### Build
- bump version in package.json and swagger (#bf94f12) 
- **deps:** bump express-validator from 6.10.0 to 6.10.1 (#ee7c6ab) 
- **deps:** bump ws from 7.4.4 to 7.4.5 (#fe90335) 
- **deps:** bump pg from 8.5.1 to 8.6.0 (#70bca49) 
- **deps-dev:** bump eslint from 7.24.0 to 7.25.0 (#65ba870) 
- **deps-dev:** bump [@types](https://github.com/types)/jest from 26.0.22 to 26.0.23 (#6eb70f3) 
- **deps-dev:** bump [@types](https://github.com/types)/ws from 7.4.1 to 7.4.2 (#15b5a0e) 
- **deps-dev:** bump [@types](https://github.com/types)/node from 14.14.39 to 14.14.41 ([#212](https://github.com/open-amt-cloud-toolkit/rps/issues/212)) (#899435a) 
- **deps-dev:** bump ts-jest from 26.5.4 to 26.5.5 ([#213](https://github.com/open-amt-cloud-toolkit/rps/issues/213)) (#a7ff95a) 
- **deps-dev:** bump [@types](https://github.com/types)/node from 14.14.37 to 14.14.39 (#ea594dc) 
- **deps-dev:** bump [@types](https://github.com/types)/node from 14.14.41 to 14.14.43 (#0f3b3df) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin (#d6f9285) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/parser from 4.21.0 to 4.22.0 (#807c4c9) 
- **deps-dev:** bump typescript from 4.2.3 to 4.2.4 (#bcc79f8) 
- **deps-dev:** bump eslint-plugin-promise from 4.3.1 to 5.1.0 (#48d224f) 
- **deps-dev:** bump eslint from 7.23.0 to 7.24.0 (#484f73a) 
- **deps-dev:** bump sinon from 10.0.0 to 10.0.1 (#f1a43a0) 
- **deps-dev:** bump typescript from 4.2.3 to 4.2.4 (#bd7b129) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/parser from 4.20.0 to 4.21.0 (#2f41ff0) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin (#2489246) 
- **deps-dev:** bump [@types](https://github.com/types)/ws from 7.4.0 to 7.4.1 (#21667b8) 

### Ci
- update API tests (#c0f1acf) 

### Docs
- **changelog:** add v1.3.0 (#12e2285) 
- **swagger:** update auth (#ff64412) 

### Fix
- mps registration for metadata (#d5a9c71) 
- **acm:** updated device secret store flow to be more reliable ([#194](https://github.com/open-amt-cloud-toolkit/rps/issues/194)) (#9f021ac) 
- **activator:** saving mebx password in vault (#ea4bb91) 
- **cira:** update cira config to remove existing configurations ([#190](https://github.com/open-amt-cloud-toolkit/rps/issues/190)) (#afc9308) 
- **cira:** cira config is case insensitive to pull the data from vault ([#217](https://github.com/open-amt-cloud-toolkit/rps/issues/217)) (#2fb9b37) 
- **dockerfile:** Update Dockerfile (#849348d) 
- **dockerfile:** added license to dockerfile (#d4f8839) 
- **domains:** update domain properly sets keys in vault (#c7d4c4a) 
- **heartbeat:** slowed heartbeat to every 1 second (#cb6bb08) 
- **postman:** added postman tests to test profile name case insensitivity (#5b0f638) 

### Refactor
- remove certs, cors, APIKEY from RPS (#54c1de9) 
- update  MPS api call (#fba74f4) 
- **activation:** merged ACM and CCM flows (#9dd40b8) 
- **devmode:** remove devmode (#ad9bc6a) 
- **dockerfile:** removed netcat (#bc6b5eb) 
- **heartbeat:** changed heartbeat to 5 second (#8b59535) 
- **vault:** vault is required in all modes (#0046136) 

### Test
- update API test to remove port (#d1cce2f) 

### BREAKING CHANGE

Auth now handled by kong


<a name="v1.2.0"></a>
## [v1.2.0] - 2021-04-02
### Build
- update dockerfile to node 14-buster-slim (#4b7b854) 
- **dep:** force latest lodash (#08b32cf) 
- **deps:** bump express-promise-router from 4.0.1 to 4.1.0 (#93f0f01) 
- **deps:** bump crypto-random-string from 3.3.0 to 3.3.1 (#23d5ee5) 
- **deps:** bump [@types](https://github.com/types)/pg from 7.14.9 to 7.14.10 (#3211236) 
- **deps:** bump ws from 7.4.2 to 7.4.3 (#7ec3a7a) 
- **deps:** bump express-validator from 6.9.2 to 6.10.0 (#0d3eb42) 
- **deps:** bump [@types](https://github.com/types)/pg from 7.14.10 to 7.14.11 (#67a809b) 
- **deps:** bump ws from 7.4.3 to 7.4.4 (#3b30f96) 
- **deps-dev:** bump [@types](https://github.com/types)/node from 14.14.35 to 14.14.36 (#6d631f8) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/parser from 4.18.0 to 4.19.0 (#6ac68bb) 
- **deps-dev:** bump [@types](https://github.com/types)/jest from 26.0.20 to 26.0.21 (#d599c40) 
- **deps-dev:** bump ts-jest from 26.5.3 to 26.5.4 (#94ac75f) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/parser from 4.17.0 to 4.18.0 (#4d79af8) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin (#d7900bf) 
- **deps-dev:** bump [@types](https://github.com/types)/node from 14.14.33 to 14.14.35 (#d3f3776) 
- **deps-dev:** bump eslint from 7.21.0 to 7.22.0 (#d338358) 
- **deps-dev:** bump [@types](https://github.com/types)/node from 14.14.32 to 14.14.33 (#d36016a) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin (#5828079) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/parser from 4.16.1 to 4.17.0 (#3b8250d) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin (#f645db4) 
- **deps-dev:** bump [@types](https://github.com/types)/node from 14.14.31 to 14.14.32 (#03ab7ab) 
- **deps-dev:** bump typescript from 4.2.2 to 4.2.3 (#a2f7899) 
- **deps-dev:** bump sinon from 9.2.4 to 10.0.0 (#f4edfdb) 
- **deps-dev:** bump ts-jest from 26.5.2 to 26.5.3 (#6cd9144) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin (#732aee4) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/parser from 4.15.2 to 4.16.1 (#015ff78) 
- **deps-dev:** bump eslint from 7.20.0 to 7.21.0 (#b92e1bd) 
- **deps-dev:** bump ts-jest from 26.5.1 to 26.5.2 (#e78b91e) 
- **deps-dev:** bump typescript from 4.1.5 to 4.2.2 (#a3cb1a5) 
- **deps-dev:** bump [@types](https://github.com/types)/jest from 26.0.21 to 26.0.22 (#aa96563) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/parser from 4.15.1 to 4.15.2 (#1b11f99) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin (#3d53af2) 
- **deps-dev:** bump [@types](https://github.com/types)/node from 14.14.28 to 14.14.31 (#3ca0f16) 
- **deps-dev:** bump typescript from 3.9.7 to 4.1.5 (#71138e6) 
- **deps-dev:** bump [@types](https://github.com/types)/node from 14.14.36 to 14.14.37 (#54672b2) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/parser from 4.19.0 to 4.20.0 (#456e2d7) 
- **deps-dev:** bump eslint from 7.19.0 to 7.20.0 (#e31fd87) 
- **deps-dev:** bump eslint from 7.22.0 to 7.23.0 (#13ce270) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/parser from 4.14.2 to 4.15.1 (#5beff80) 
- **deps-dev:** bump ts-jest from 26.5.0 to 26.5.1 (#5749ba4) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin (#35b40f0) 
- **deps-dev:** bump eslint-plugin-promise from 4.2.1 to 4.3.1 (#802ec47) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin (#56c461d) 
- **deps-dev:** bump [@types](https://github.com/types)/node from 14.14.22 to 14.14.28 (#c04722e) 

### Ci
- add initial jenkinsfile (#daa035a) 

### Docs
- add changelog (#e7a1bf1) 
- **api:** add swagger.yaml (#8e02a1c) 

### Feat
- **activation:** added a delay with configurable time after activation ([#167](https://github.com/open-amt-cloud-toolkit/rps/issues/167)) (#73d9a2f) 
- **api:** api responses are changed to structured JSON (#4372f31) 
- **api:** post api's respomd with appropriate object instead of success message ([#139](https://github.com/open-amt-cloud-toolkit/rps/issues/139)) (#6df11ca) 
- **api:** add input validation to restful api (#f266933) 
- **certs:** use environment variables to store certs for web socket ([#185](https://github.com/open-amt-cloud-toolkit/rps/issues/185)) (#5e85da8) 
- **metadata:** add metadata registration with MPS (#e7c97c7) 
- **tags:** register tags with MPS Metadata (#f9c6731) 
- **tags:** add tagging support for AMT Configuration (#09ac5fb) 

### Fix
- regression on endpoint for MPS /devices to /metadata (#91b6e58) 
- **activation:** password not found issue resolved ([#136](https://github.com/open-amt-cloud-toolkit/rps/issues/136)) (#f4031f6) 
- **api:** APIs should return consistent casing of properties (#f91a8e7) 
- **api:** updated passwords to accept nulls in profile (#65155cb) 
- **config:** default cors_origin to http://localhost:4200 (#f7c378f) 
- **mps:** update endpoints for MPS registration (#a811c9d) 
- **network-config:** using old propertyName for networkConfig (#197965d) 
- **validation:** API validation no longer checks length if generate is false (#9158ab9) 
- **validation:** commonName no longer enforced when not appropriate (#33eecea) 

### Refactor
- api responses to return data (#98d4114) 
- **api:** removed payload from the request json structure (#3810867) 
- **api:** patch request will respond with updated properties (#87b6f8f) 
- **config:** update default to use vault (#6479c7b) 

### Test
- **api:** added unit tests to update amt profiles (#901742f) 

### BREAKING CHANGE

Added heart beats after activation till the delay time completes

now API requests are without payload in object

PATCH now returns updated object and passwordlength properties renamed

APIs are updated to return properties with camelcase

API responses are structured and no longer return string messages


<a name="v1.1.0"></a>
## [v1.1.0] - 2021-02-11
### Build
- **config:** update cors defaults (#70fbf7e) 
- **deps:** bump [@types](https://github.com/types)/pg from 7.14.8 to 7.14.9 (#dd8b21d) 
- **deps:** bump ws from 7.4.1 to 7.4.2 (#4b5e2f5) 
- **deps:** bump express-promise-router from 3.0.3 to 4.0.1 (#bed03b2) 
- **deps:** bump [@types](https://github.com/types)/pg from 7.14.7 to 7.14.8 (#0b43c42) 
- **deps-dev:** bump eslint from 7.17.0 to 7.18.0 (#6d688a5) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/parser from 4.14.0 to 4.14.1 (#72447d4) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin (#d849cae) 
- **deps-dev:** bump sinon from 9.2.3 to 9.2.4 (#e1629d8) 
- **deps-dev:** bump [@types](https://github.com/types)/node-forge from 0.9.6 to 0.9.7 (#9c95666) 
- **deps-dev:** bump [@types](https://github.com/types)/node from 14.14.21 to 14.14.22 (#56a6998) 
- **deps-dev:** bump eslint-config-standard-with-typescript (#030903a) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin (#3a83a2d) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/parser from 4.13.0 to 4.14.0 (#d2876eb) 
- **deps-dev:** bump eslint from 7.18.0 to 7.19.0 (#6f62028) 
- **deps-dev:** bump [@types](https://github.com/types)/node from 14.14.20 to 14.14.21 (#8617613) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/parser from 4.14.1 to 4.14.2 (#177ba51) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin (#2622978) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin (#301fc84) 
- **deps-dev:** bump [@types](https://github.com/types)/ws from 6.0.4 to 7.4.0 (#21c37dd) 
- **deps-dev:** bump [@types](https://github.com/types)/jest from 26.0.19 to 26.0.20 (#3da1faf) 
- **deps-dev:** bump ts-jest from 26.4.4 to 26.5.0 (#0f6f72b) 
- **deps-dev:** bump sinon from 7.5.0 to 9.2.3 (#2f65321) 
- **deps-dev:** bump ts-node from 8.6.2 to 9.1.1 (#616a461) 
- **deps-dev:** bump [@types](https://github.com/types)/node-vault from 0.9.1 to 0.9.13 (#6e3f261) 
- **deps-dev:** bump jest-sinon from 1.0.2 to 1.0.4 (#7354fca) 
- **deps-dev:** bump nodemon from 2.0.3 to 2.0.7 (#07df0d0) 
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/parser from 4.12.0 to 4.13.0 (#5daa3a0) 

### Ci
- add types for conventional commits (#5f7fa3f) 
- add docker push to ci (#dee9067) 
- add lint to build requirements (#e7733ba) 
- remove snyk from github actions (#d8c30e8) 

### Docs
- add changelog (#7f589eb) 
- add status badges (#60ff0ee) 
- add release disclaimer (#dc2e4a0) 
- update readme for how to run API tests locally (#09a3ca6) 

### Feat
- **cors:** allow withCredentials to be sent to server (#bc321b4) 
- **cors:** add support for CORS (#d57873f) 

### Fix
- upgrade ws from 7.4.0 to 7.4.1 (#a386576) 
- **CORS:** added support to multiple origins (#921db03) 
- **deps:** missing atob dependency in prod (#9a066c9) 
- **networkConfig:** removed delete and edit api's (#9b0a720) 
- **networkConfigs:** added default network configurations (#ee15b9a) 

### Refactor
- array-callback-return lint (#3912fbf) 
- array-callback-return lint (#cef9e11) 
- migrate from internal github (#518eec9) 
- **lint:** fix remaining lint issues (#840a7c3) 
- **lint:** eqeqeq rule (#e9ceba5) 
- **lint:** misc rules (#925a7d8) 
- **lint:** no var requires (#9eab829) 
- **lint:** fix lint issues (#3bba146) 
- **lint:** no var requires (#7d3c377) 
- **lint:** [@typescript](https://github.com/typescript)/prefer-optional-chain (#e5edf70) 
- **lint:** [@typescript](https://github.com/typescript)-eslint/no-extraneous-class (#cee8a8c) 
- **lint:** "[@typescript](https://github.com/typescript)-eslint/explicit-function-return-type" (#842e1d2) 
- **lint:** add eslint for typescript (#bcd1b24) 
- **lint:** consistent-type-assertions (#ade87d7) 

### Tests
- **api:** add automated api tests (#254815b) 


<a name="v1.0.0"></a>
## v1.0.0 - 2020-11-20
### Ci
- automation for scanning and builds (#b73e176) 

### Fix
- **docker:** build times in docker build taking too long (#bd9e390) 
- **docker:** downgrade node image to 12 (#cffbabb) 

### Refactor
- **docker:** optimize dockerfile (#ad2319d) 


[Unreleased]: https://github.com/open-amt-cloud-toolkit/rps/compare/2.0.1...HEAD
[2.0.1]: https://github.com/open-amt-cloud-toolkit/rps/compare/v2.0.0...2.0.1
[v2.0.0]: https://github.com/open-amt-cloud-toolkit/rps/compare/v1.5.0...v2.0.0
[v1.5.0]: https://github.com/open-amt-cloud-toolkit/rps/compare/v1.4.0...v1.5.0
[v1.4.0]: https://github.com/open-amt-cloud-toolkit/rps/compare/v1.3.0...v1.4.0
[v1.3.0]: https://github.com/open-amt-cloud-toolkit/rps/compare/v1.2.0...v1.3.0
[v1.2.0]: https://github.com/open-amt-cloud-toolkit/rps/compare/v1.1.0...v1.2.0
[v1.1.0]: https://github.com/open-amt-cloud-toolkit/rps/compare/v1.0.0...v1.1.0
