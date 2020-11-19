FROM node:10.16
WORKDIR /rcs-microservice
RUN apt-get update -y && apt-get install netcat -y

COPY package*.json ./
RUN npm install

COPY src ./src/
COPY .rpsrc ./
COPY tsconfig.json ./
COPY private/data.json ./private/

EXPOSE 8080
EXPOSE 8081
