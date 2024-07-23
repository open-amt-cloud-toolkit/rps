#*********************************************************************
# Copyright (c) Intel Corporation 2021
# SPDX-License-Identifier: Apache-2.0
#*********************************************************************/
FROM node:22-bullseye-slim@sha256:1399b299f2d236677007709378929b8216b41602ef4b0c54c226c895b4a175ca as builder

WORKDIR /rps

# Copy needed files
COPY package*.json ./

# Install dependencies
RUN npm ci

COPY tsconfig.json tsconfig.build.json ./
COPY src ./src/
COPY .rpsrc ./

# Transpile TS => JS
RUN npm run compile
RUN npm prune --production

# set the user to non-root
USER node

FROM alpine:latest@sha256:0a4eaa0eecf5f8c050e5bba433f58c052be7587ee8af3e8b3910ef9ab5fbe9f5
LABEL license='SPDX-License-Identifier: Apache-2.0' \
      copyright='Copyright (c) Intel Corporation 2021'

RUN addgroup -g 1000 node && adduser -u 1000 -G node -s /bin/sh -D node 
RUN apk update && apk upgrade && apk add nodejs && rm -rf /var/cache/apk/*

COPY --from=builder  /rps/dist /rps/dist
# for healthcheck backwards compatibility
COPY --from=builder  /rps/.rpsrc /.rpsrc
COPY --from=builder  /rps/node_modules /rps/node_modules
COPY --from=builder  /rps/package.json /rps/package.json
# set the user to non-root
USER node
# Default Ports Used
EXPOSE 8080
EXPOSE 8081
EXPOSE 8082
CMD ["node", "/rps/dist/Index.js"]
