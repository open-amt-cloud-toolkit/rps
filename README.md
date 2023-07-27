# Remote Provisioning Server

[![Known Vulnerabilities](https://snyk.io/test/github/open-amt-cloud-toolkit/rps/badge.svg?targetFile=package.json)](https://snyk.io/test/github/open-amt-cloud-toolkit/rps?targetFile=package.json) ![RPS API Tests](https://github.com/open-amt-cloud-toolkit/rps/workflows/RPS%20API%20Tests/badge.svg) ![Node.js CI](https://github.com/open-amt-cloud-toolkit/rps/workflows/Node.js%20CI/badge.svg) ![codecov.io](https://codecov.io/github/open-amt-cloud-toolkit/rps/coverage.svg?branch=main) [![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/open-amt-cloud-toolkit/rps/badge)](https://api.securityscorecards.dev/projects/github.com/open-amt-cloud-toolkit/rps) [![Discord Shield](https://discordapp.com/api/guilds/1063200098680582154/widget.png?style=shield)](https://discord.gg/yrcMp2kDWh)


> Disclaimer: Production viable releases are tagged and listed under 'Releases'.  All other check-ins should be considered 'in-development' and should not be used in production

The Remote Provisioning Server (RPS) enables the configuration and activation of Intel® AMT devices based on a defined profile. RPS utilizes the [Remote Provision Client (RPC)](https://github.com/open-amt-cloud-toolkit/rps) deployed onto edge devices to connect the devices to the [Management Presence Server (MPS)](https://github.com/open-amt-cloud-toolkit/mps) and enable remote manageability features.

<br><br>

**For detailed documentation** about Getting Started or other features of the Open AMT Cloud Toolkit, see the [docs](https://open-amt-cloud-toolkit.github.io/docs/).

<br>

## Prerequisites

To successfully deploy RPS, the following software must be installed on your development system:

- [Node.js* LTS 18.x.x or newer](https://nodejs.org/en/)
- [git](https://git-scm.com/downloads)

## Deploy the Remote Provisioning Server (RPS) Microservice

To deploy the RPS on a local development system: 

1. Clone the repo and switch to the `rps` directory.

    ```
    git clone https://github.com/open-amt-cloud-toolkit/rps.git && cd rps
    ```

2. Install the dependencies from the working `rps` directory.

    ``` bash
    npm install
    ```

3. Start the service.

    ``` bash
    npm start
    ```

4. The RPS listens on port 8081 by default. Successful installation produces the command line message:

    ```
    RPS Microservice Rest APIs listening on https://:8081.
    ```
    
For detailed documentation about RPS, see the [docs](https://open-amt-cloud-toolkit.github.io/docs/)

<br>

## Deploy with Docker and Run API Tests

We leverage [Postman](https://www.postman.com/) and Docker for executing RESTful API tests. Once you have Postman and Docker installed, you can follow the steps below:

1. Clone the repo and switch to the `rps` directory.

    ```
    git clone https://github.com/open-amt-cloud-toolkit/rps.git && cd rps
    ```

2. Build the docker image.
    ```
    docker build -t rps-microservice:v1 .
    ```

3. Ensure RPS is running in a docker container.
    ```
    docker-compose up -d
    ```

4. Import the test collection located at `./src/test/collections/rps.postman_collection.json`.

5. Run the tests using the Collection Runner in postman. If any of the tests fail, file a github issue here: https://github.com/open-amt-cloud-toolkit/rps/pull/34

<br>

## Additional Resources

- For detailed documentation and Getting Started, [visit the docs site](https://open-amt-cloud-toolkit.github.io/docs).

- Looking to contribute? [Find more information here about contribution guidelines and practices](.\CONTRIBUTING.md).

- Find a bug? Or have ideas for new features? [Open a new Issue](https://github.com/open-amt-cloud-toolkit/rps/issues).

- Need additional support or want to get the latest news and events about Open AMT? Connect with the team directly through Discord.

    [![Discord Banner 1](https://discordapp.com/api/guilds/1063200098680582154/widget.png?style=banner2)](https://discord.gg/yrcMp2kDWh)

    