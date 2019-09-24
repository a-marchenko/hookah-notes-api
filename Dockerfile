FROM node:12
WORKDIR /app
COPY package.json .
RUN npm install --production
COPY build .
COPY wait-for-it.sh .
CMD node index.js