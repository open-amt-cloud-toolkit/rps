#*********************************************************************
# Copyright (c) Intel Corporation 2021
# SPDX-License-Identifier: Apache-2.0
#*********************************************************************/
FROM node:18-bullseye-slim as builder
LABEL license='SPDX-License-Identifier: Apache-2.0' \
      copyright='Copyright (c) Intel Corporation 2021'
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

FROM alpine:latest

RUN addgroup -g 1000 node && adduser -u 1000 -G node -s /bin/sh -D node 
RUN apk update && apk add nodejs && rm -rf /var/cache/apk/*

COPY --from=builder  /rps/dist /rps/dist
# for healthcheck backwards compatibility
COPY --from=builder  /rps/dist/Healthcheck.js /dist/Healthcheck.js 
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
