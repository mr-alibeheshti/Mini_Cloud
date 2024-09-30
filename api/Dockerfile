FROM node:18

USER root

RUN apt-get update && apt-get install -y nginx \
    lvm2 mkcert systemd

RUN mkcert -install

WORKDIR /app

COPY . .

RUN npm install

# RUN adduser node sudo && \
    # echo "node ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart nginx.service" >> /etc/sudoers

USER node

CMD ["sh", "-c", "node server.js"]

EXPOSE 3500
