FROM node:18

USER root

RUN apt-get update && apt-get install -y nginx sudo \
    glusterfs-client lvm2 mkcert systemd

RUN mkcert -install

WORKDIR /app

COPY . .

RUN npm install

RUN adduser node sudo && \
    echo "node ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart nginx.service" >> /etc/sudoers

USER node

CMD ["sh", "-c", "sudo service nginx start && node server.js"]

EXPOSE 3500
