#*********************************************************************
# Copyright (c) Intel Corporation 2021
# SPDX-License-Identifier: Apache-2.0
#*********************************************************************/
FROM node:16-bullseye-slim
LABEL license='SPDX-License-Identifier: Apache-2.0' \
      copyright='Copyright (c) Intel Corporation 2021'
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

# set the user to non-root
USER node

CMD ["node", "./dist/Index.js"]
