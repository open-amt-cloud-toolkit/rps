<a name="v1.4.0"></a>
## [v1.4.0] - 2021-06-22
### Build
- **dep:** bump color-string to 1.5.5
- **deps:** bump normalize-url from 4.5.0 to 4.5.1
- **deps:** bump express-validator from 6.10.1 to 6.11.1
- **deps:** bump hosted-git-info from 2.8.8 to 2.8.9
- **deps:** bump ws from 7.4.5 to 7.4.6
- **deps:** bump express-validator from 6.11.1 to 6.12.0 ([#290](https://github.com/open-amt-cloud-toolkit/rps/issues/290))
- **deps:** bump express-ws from 4.0.0 to 5.0.2 ([#279](https://github.com/open-amt-cloud-toolkit/rps/issues/279))
- **deps:** bump ws from 7.4.6 to 7.5.0 ([#295](https://github.com/open-amt-cloud-toolkit/rps/issues/295))
- **deps:** bump glob-parent from 5.1.1 to 5.1.2
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/parser from 4.26.0 to 4.26.1 ([#278](https://github.com/open-amt-cloud-toolkit/rps/issues/278))
- **deps-dev:** bump [@types](https://github.com/types)/node-forge from 0.9.9 to 0.10.0 ([#277](https://github.com/open-amt-cloud-toolkit/rps/issues/277))
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin ([#280](https://github.com/open-amt-cloud-toolkit/rps/issues/280))
- **deps-dev:** bump [@types](https://github.com/types)/node from 14.17.2 to 14.17.3 ([#281](https://github.com/open-amt-cloud-toolkit/rps/issues/281))
- **deps-dev:** bump eslint from 7.27.0 to 7.28.0
- **deps-dev:** bump eslint-plugin-import from 2.23.3 to 2.23.4
- **deps-dev:** bump eslint-plugin-import from 2.22.1 to 2.23.2
- **deps-dev:** bump [@types](https://github.com/types)/node from 14.17.1 to 14.17.2
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/parser from 4.24.0 to 4.26.0
- **deps-dev:** bump typescript from 4.2.4 to 4.3.2
- **deps-dev:** bump ts-jest from 26.5.5 to 26.5.6
- **deps-dev:** bump [@types](https://github.com/types)/node-forge from 0.9.7 to 0.9.9
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin ([#289](https://github.com/open-amt-cloud-toolkit/rps/issues/289))
- **deps-dev:** bump [@types](https://github.com/types)/node from 14.17.0 to 14.17.1
- **deps-dev:** bump [@types](https://github.com/types)/express from 4.17.11 to 4.17.12
- **deps-dev:** bump eslint-config-standard from 16.0.2 to 16.0.3
- **deps-dev:** bump sinon from 10.0.1 to 11.1.1
- **deps-dev:** bump [@types](https://github.com/types)/pg from 7.14.11 to 8.6.0
- **deps-dev:** bump [@types](https://github.com/types)/node from 14.14.45 to 14.17.0
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/parser from 4.22.0 to 4.22.1
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/parser from 4.23.0 to 4.24.0
- **deps-dev:** bump eslint from 7.25.0 to 7.27.0
- **deps-dev:** bump [@types](https://github.com/types)/node from 14.14.44 to 14.14.45
- **deps-dev:** bump [@types](https://github.com/types)/ws from 7.4.2 to 7.4.4
- **deps-dev:** bump [@types](https://github.com/types)/ws from 7.4.4 to 7.4.5
- **deps-dev:** bump typescript from 4.3.2 to 4.3.4 ([#298](https://github.com/open-amt-cloud-toolkit/rps/issues/298))
- **deps-dev:** bump [@types](https://github.com/types)/node from 14.14.43 to 14.14.44
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/parser from 4.22.1 to 4.23.0
- **docker:** set user as non root
- **version:** bump to v1.4.0

### Ci
- add codeql for code analysis
- **changelog:** add automation for changelog

### Docs
- **api:** added license to swagger.yaml ([#242](https://github.com/open-amt-cloud-toolkit/rps/issues/242))
- **package.json:** filled in additional info

### Feat
- **api:** cira config will accept static or generates dynamic password ([#283](https://github.com/open-amt-cloud-toolkit/rps/issues/283))

### Fix
- **api:** delete mps password when random generate password is true in ciraconfig edit ([#293](https://github.com/open-amt-cloud-toolkit/rps/issues/293))
- **api:** updated mps api for device creation and deletion ([#245](https://github.com/open-amt-cloud-toolkit/rps/issues/245))
- **swagger:** updated API documentation

### Refactor
- **cira:** mps username and password are stored in db and vault respectively for each device ([#284](https://github.com/open-amt-cloud-toolkit/rps/issues/284))
- **logging:** remove file transport for log output
- **vault:** removed profile name prefixes for key names

### BREAKING CHANGE

DB Schema changes for CIRA config to accept both static
and dynamic passwords.

Vault KEY names are changed

<a name="v1.3.0"></a>
## [v1.3.0]

### Build
- bump version in package.json and swagger
- **deps:** bump express-validator from 6.10.0 to 6.10.1
- **deps:** bump ws from 7.4.4 to 7.4.5
- **deps:** bump pg from 8.5.1 to 8.6.0
- **deps-dev:** bump eslint from 7.24.0 to 7.25.0
- **deps-dev:** bump [@types](https://github.com/types)/jest from 26.0.22 to 26.0.23
- **deps-dev:** bump [@types](https://github.com/types)/ws from 7.4.1 to 7.4.2
- **deps-dev:** bump [@types](https://github.com/types)/node from 14.14.39 to 14.14.41 ([#212](https://github.com/open-amt-cloud-toolkit/rps/issues/212))
- **deps-dev:** bump ts-jest from 26.5.4 to 26.5.5 ([#213](https://github.com/open-amt-cloud-toolkit/rps/issues/213))
- **deps-dev:** bump [@types](https://github.com/types)/node from 14.14.37 to 14.14.39
- **deps-dev:** bump [@types](https://github.com/types)/node from 14.14.41 to 14.14.43
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/parser from 4.21.0 to 4.22.0
- **deps-dev:** bump typescript from 4.2.3 to 4.2.4
- **deps-dev:** bump eslint-plugin-promise from 4.3.1 to 5.1.0
- **deps-dev:** bump eslint from 7.23.0 to 7.24.0
- **deps-dev:** bump sinon from 10.0.0 to 10.0.1
- **deps-dev:** bump typescript from 4.2.3 to 4.2.4
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/parser from 4.20.0 to 4.21.0
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin
- **deps-dev:** bump [@types](https://github.com/types)/ws from 7.4.0 to 7.4.1

### Ci
- update API tests

### Docs
- **swagger:** update auth

### Fix
- mps registration for metadata
- **acm:** updated device secret store flow to be more reliable ([#194](https://github.com/open-amt-cloud-toolkit/rps/issues/194))
- **activator:** saving mebx password in vault
- **cira:** update cira config to remove existing configurations ([#190](https://github.com/open-amt-cloud-toolkit/rps/issues/190))
- **cira:** cira config is case insensitive to pull the data from vault ([#217](https://github.com/open-amt-cloud-toolkit/rps/issues/217))
- **dockerfile:** Update Dockerfile
- **dockerfile:** added license to dockerfile
- **domains:** update domain properly sets keys in vault
- **heartbeat:** slowed heartbeat to every 1 second
- **postman:** added postman tests to test profile name case insensitivity

### Refactor
- **BREAKING CHANGE:** remove certs, cors, APIKEY from RPS
- update  MPS api call
- **activation:** merged ACM and CCM flows
- **devmode:** **BREAKING CHANGE:** remove devmode
- **dockerfile:** removed netcat
- **heartbeat:** changed heartbeat to 5 second
- **vault:** **BREAKING CHANGE:** vault is required in all modes

### Test
- update API test to remove port


<a name="v1.2.0"></a>
## [v1.2.0] - 2021-04-02
### Build
- update dockerfile to node 14-buster-slim
- **dep:** force latest lodash
- **deps:** bump express-promise-router from 4.0.1 to 4.1.0
- **deps:** bump crypto-random-string from 3.3.0 to 3.3.1
- **deps:** bump [@types](https://github.com/types)/pg from 7.14.9 to 7.14.10
- **deps:** bump ws from 7.4.2 to 7.4.3
- **deps:** bump express-validator from 6.9.2 to 6.10.0
- **deps:** bump [@types](https://github.com/types)/pg from 7.14.10 to 7.14.11
- **deps:** bump ws from 7.4.3 to 7.4.4
- **deps-dev:** bump [@types](https://github.com/types)/node from 14.14.35 to 14.14.36
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/parser from 4.18.0 to 4.19.0
- **deps-dev:** bump [@types](https://github.com/types)/jest from 26.0.20 to 26.0.21
- **deps-dev:** bump ts-jest from 26.5.3 to 26.5.4
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/parser from 4.17.0 to 4.18.0
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin
- **deps-dev:** bump [@types](https://github.com/types)/node from 14.14.33 to 14.14.35
- **deps-dev:** bump eslint from 7.21.0 to 7.22.0
- **deps-dev:** bump [@types](https://github.com/types)/node from 14.14.32 to 14.14.33
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/parser from 4.16.1 to 4.17.0
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin
- **deps-dev:** bump [@types](https://github.com/types)/node from 14.14.31 to 14.14.32
- **deps-dev:** bump typescript from 4.2.2 to 4.2.3
- **deps-dev:** bump sinon from 9.2.4 to 10.0.0
- **deps-dev:** bump ts-jest from 26.5.2 to 26.5.3
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/parser from 4.15.2 to 4.16.1
- **deps-dev:** bump eslint from 7.20.0 to 7.21.0
- **deps-dev:** bump ts-jest from 26.5.1 to 26.5.2
- **deps-dev:** bump typescript from 4.1.5 to 4.2.2
- **deps-dev:** bump [@types](https://github.com/types)/jest from 26.0.21 to 26.0.22
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/parser from 4.15.1 to 4.15.2
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin
- **deps-dev:** bump [@types](https://github.com/types)/node from 14.14.28 to 14.14.31
- **deps-dev:** bump typescript from 3.9.7 to 4.1.5
- **deps-dev:** bump [@types](https://github.com/types)/node from 14.14.36 to 14.14.37
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/parser from 4.19.0 to 4.20.0
- **deps-dev:** bump eslint from 7.19.0 to 7.20.0
- **deps-dev:** bump eslint from 7.22.0 to 7.23.0
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/parser from 4.14.2 to 4.15.1
- **deps-dev:** bump ts-jest from 26.5.0 to 26.5.1
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin
- **deps-dev:** bump eslint-plugin-promise from 4.2.1 to 4.3.1
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin
- **deps-dev:** bump [@types](https://github.com/types)/node from 14.14.22 to 14.14.28

### Ci
- add initial jenkinsfile

### Docs
- add changelog
- **api:** add swagger.yaml

### Feat
- **activation:** added a delay with configurable time after activation ([#167](https://github.com/open-amt-cloud-toolkit/rps/issues/167))
- **api:** api responses are changed to structured JSON
- **api:** post api's respomd with appropriate object instead of success message ([#139](https://github.com/open-amt-cloud-toolkit/rps/issues/139))
- **api:** add input validation to restful api
- **certs:** use environment variables to store certs for web socket ([#185](https://github.com/open-amt-cloud-toolkit/rps/issues/185))
- **metadata:** add metadata registration with MPS
- **tags:** register tags with MPS Metadata
- **tags:** add tagging support for AMT Configuration

### Fix
- regression on endpoint for MPS /devices to /metadata
- **activation:** password not found issue resolved ([#136](https://github.com/open-amt-cloud-toolkit/rps/issues/136))
- **api:** APIs should return consistent casing of properties
- **api:** updated passwords to accept nulls in profile
- **config:** default cors_origin to http://localhost:4200
- **mps:** update endpoints for MPS registration
- **network-config:** using old propertyName for networkConfig
- **validation:** API validation no longer checks length if generate is false
- **validation:** commonName no longer enforced when not appropriate

### Refactor
- api responses to return data
- **api:** removed payload from the request json structure
- **api:** patch request will respond with updated properties
- **config:** update default to use vault

### Test
- **api:** added unit tests to update amt profiles

### BREAKING CHANGE

Added heart beats after activation till the delay time completes

now API requests are without payload in object

PATCH now returns updated object and passwordlength properties renamed

APIs are updated to return properties with camelcase

API responses are structured and no longer return string messages


<a name="v1.1.0"></a>
## [v1.1.0] - 2021-02-11
### Build
- **config:** update cors defaults
- **deps:** bump [@types](https://github.com/types)/pg from 7.14.8 to 7.14.9
- **deps:** bump ws from 7.4.1 to 7.4.2
- **deps:** bump express-promise-router from 3.0.3 to 4.0.1
- **deps:** bump [@types](https://github.com/types)/pg from 7.14.7 to 7.14.8
- **deps-dev:** bump eslint from 7.17.0 to 7.18.0
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/parser from 4.14.0 to 4.14.1
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin
- **deps-dev:** bump sinon from 9.2.3 to 9.2.4
- **deps-dev:** bump [@types](https://github.com/types)/node-forge from 0.9.6 to 0.9.7
- **deps-dev:** bump [@types](https://github.com/types)/node from 14.14.21 to 14.14.22
- **deps-dev:** bump eslint-config-standard-with-typescript
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/parser from 4.13.0 to 4.14.0
- **deps-dev:** bump eslint from 7.18.0 to 7.19.0
- **deps-dev:** bump [@types](https://github.com/types)/node from 14.14.20 to 14.14.21
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/parser from 4.14.1 to 4.14.2
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/eslint-plugin
- **deps-dev:** bump [@types](https://github.com/types)/ws from 6.0.4 to 7.4.0
- **deps-dev:** bump [@types](https://github.com/types)/jest from 26.0.19 to 26.0.20
- **deps-dev:** bump ts-jest from 26.4.4 to 26.5.0
- **deps-dev:** bump sinon from 7.5.0 to 9.2.3
- **deps-dev:** bump ts-node from 8.6.2 to 9.1.1
- **deps-dev:** bump [@types](https://github.com/types)/node-vault from 0.9.1 to 0.9.13
- **deps-dev:** bump jest-sinon from 1.0.2 to 1.0.4
- **deps-dev:** bump nodemon from 2.0.3 to 2.0.7
- **deps-dev:** bump [@typescript](https://github.com/typescript)-eslint/parser from 4.12.0 to 4.13.0

### Ci
- add types for conventional commits
- add docker push to ci
- add lint to build requirements
- remove snyk from github actions

### Docs
- add changelog
- add status badges
- add release disclaimer
- update readme for how to run API tests locally

### Feat
- **cors:** allow withCredentials to be sent to server
- **cors:** add support for CORS

### Fix
- upgrade ws from 7.4.0 to 7.4.1
- **CORS:** added support to multiple origins
- **deps:** missing atob dependency in prod
- **networkConfig:** removed delete and edit api's
- **networkConfigs:** added default network configurations

### Refactor
- array-callback-return lint
- array-callback-return lint
- migrate from internal github
- **lint:** fix remaining lint issues
- **lint:** eqeqeq rule
- **lint:** misc rules
- **lint:** no var requires
- **lint:** fix lint issues
- **lint:** no var requires
- **lint:** [@typescript](https://github.com/typescript)/prefer-optional-chain
- **lint:** [@typescript](https://github.com/typescript)-eslint/no-extraneous-class
- **lint:** "[@typescript](https://github.com/typescript)-eslint/explicit-function-return-type"
- **lint:** add eslint for typescript
- **lint:** consistent-type-assertions

### Tests
- **api:** add automated api tests


<a name="v1.0.0"></a>
## v1.0.0 - 2020-11-20
### Ci
- automation for scanning and builds

### Fix
- **docker:** build times in docker build taking too long
- **docker:** downgrade node image to 12

### Refactor
- **docker:** optimize dockerfile


