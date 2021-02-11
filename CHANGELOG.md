<a name="v1.1.0"></a>
## v1.1.0

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
- Added network configuration on AMT device
- Added a feature to update MEBx password on AMT device

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

