FROM node:20

RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*

WORKDIR /root/Capstone

CMD cd server && npm install && cd ../web && npm install && bash
