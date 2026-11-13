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

CMD ["bash", "-lc", "set -euo pipefail; mkdir -p /var/log/squid /var/spool/squid /var/run/squid; touch /var/log/squid/access.log /var/log/squid/cache.log /var/log/squid/store.log; chown -R proxy:proxy /var/log/squid /var/spool/squid /var/run/squid; rm -f /var/run/squid.pid; squid -N -f /etc/squid/squid.conf & SQUID_PID=$!; node src/index.js & NODE_PID=$!; wait -n $SQUID_PID $NODE_PID; EXIT_CODE=$?; kill $SQUID_PID $NODE_PID 2>/dev/null || true; wait || true; exit $EXIT_CODE"]
