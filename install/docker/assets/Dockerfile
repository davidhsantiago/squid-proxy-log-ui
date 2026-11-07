FROM node:20-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY src ./src
COPY public ./public

RUN apt-get update \
    && apt-get install -y --no-install-recommends squid curl \
    && mkdir -p /var/log/squid /var/spool/squid \
    && rm -rf /var/lib/apt/lists/*

COPY install/docker/assets/squid.conf /etc/squid/squid.conf

EXPOSE 3000 3128

CMD ["bash", "-lc", "squid -N -f /etc/squid/squid.conf & node src/index.js"]
