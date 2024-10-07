FROM node:18

USER root

RUN apt-get update && apt-get install -y nginx \
    lvm2 mkcert systemd

RUN mkcert -install

WORKDIR /app

COPY . .

RUN npm install

CMD ["sh", "-c", "node server.js"]

EXPOSE 3500