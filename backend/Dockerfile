FROM node:20-bookworm-slim

WORKDIR /app

# Install Nmap in the image so scans work reliably across deploys.
RUN apt-get update \
  && apt-get install -y --no-install-recommends nmap ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY logs ./logs

ENV NODE_ENV=production

# Render injects PORT; app reads it from process.env.PORT.
EXPOSE 10000

CMD ["npm", "start"]