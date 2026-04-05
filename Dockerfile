FROM node:20

RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*

WORKDIR /root/Capstone

CMD cp server/.env.example server/.env && \
    cd server && npm install && \
    cd ../web && npm install && npm run build && \
    cd ../mobile/DatasetBuilderApp && npm install && \
    until pg_isready -h db -p 5432 -U postgres; do echo "Waiting for Postgres..."; sleep 1; done && \
    cd /root/Capstone/server && node server.js & \
    cd /root/Capstone/mobile/DatasetBuilderApp && npx expo start --port 8081 & \
    wait
