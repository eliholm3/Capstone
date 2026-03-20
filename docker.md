# Guide for setting up local:

## Make sure you have dependencies
 - Docker
 - Docker-Compose

## How to run?
 - please just use

```bash
docker compose build && docker compose up
```
## Basically how it works

 - There are two containers, {dev, db}, that run with the docker compose
 - They connect to each other via docker networking layer 
 -- Using 'db' and 'dev' work as valid ip addresses when communicating regardless of where they are hosted
 - The dev container has the express server, mobile server, and web server, and the db container just has psql.
 -- They are seperated  so they can emulate the interactions between EC2 and RDS, which will be a one line change in the .env

## PORTS - "How do I connect to this ahh"
### Once the container is running there are three exposed ports,
 - PORT 3000: Express server!
 - PORT 8081: React Native Live Server!
 - PORT 5000: An extra port if we ever need it!

#### There is no exposed port for db because all interactions should be internal through the express server
