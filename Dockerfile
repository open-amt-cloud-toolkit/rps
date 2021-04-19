FROM node:14-buster-slim

WORKDIR /rcs-microservice

# Default Ports Used
EXPOSE 8080
EXPOSE 8081

# Copy needed files
COPY package*.json ./
COPY tsconfig.json ./
COPY src ./src/
COPY .rpsrc ./
COPY private/data.json ./private/

# Install dependencies
RUN npm ci

# Transpile TS => JS
RUN npm run compile
RUN npm prune --production

CMD ["node", "./dist/Index.js"]
