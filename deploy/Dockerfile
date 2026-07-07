# Build: docker build -f deploy/Dockerfile -t oranjehuis .   (run from repo root)

# 1. Build the SPA
FROM node:22-alpine AS build
WORKDIR /app
# no package-lock.json is committed yet; switch to `npm ci` once one exists
COPY package*.json ./
RUN npm install --no-audit --no-fund
COPY . .
RUN npm run build

# 2. Runtime: tiny Node server (serves the SPA, reverse-proxies HA, stores config)
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev --no-audit --no-fund
COPY server ./server
COPY --from=build /app/dist ./dist
EXPOSE 80
# config + profiles persist here; map an appdata path to /data on the host
VOLUME ["/data"]
CMD ["node", "server/server.mjs"]
