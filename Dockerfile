FROM node:20

WORKDIR /root/Capstone

CMD cd server && npm install && cd ../web && npm install && bash
