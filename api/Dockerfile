FROM node:18

RUN apt-get update && apt-get install -y nginx && apt install mkcert && mkcert -install && apt install systemctl

WORKDIR /app

COPY . .

RUN npm install

CMD ["sh", "-c", "service nginx start && node server.js"]

EXPOSE 3500
