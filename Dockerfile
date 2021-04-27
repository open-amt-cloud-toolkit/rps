#*********************************************************************
# Copyright (c) Intel Corporation 2021
# SPDX-License-Identifier: Apache-2.0
#*********************************************************************/
FROM node:14-buster-slim

WORKDIR /rcs-microservice

# Default Ports Used
EXPOSE 8080
EXPOSE 8081

# Copy needed files
COPY package*.json ./

# Install dependencies
RUN npm ci

COPY tsconfig.json ./
COPY src ./src/
COPY .rpsrc ./



# Transpile TS => JS
RUN npm run compile
RUN npm prune --production

CMD ["node", "./dist/Index.js"]
