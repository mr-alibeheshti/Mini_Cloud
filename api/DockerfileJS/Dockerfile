FROM node:latest

WORKDIR /app

COPY package*.json ./
COPY . .

RUN npm ci --no-cache

CMD ["node", "index.js"]
