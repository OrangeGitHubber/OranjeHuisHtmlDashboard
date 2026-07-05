# Build: docker build -f deploy/Dockerfile -t oranjehuis .   (run from repo root)
FROM node:22-alpine AS build
WORKDIR /app
# no package-lock.json is committed yet; switch to `npm ci` once one exists
COPY package*.json ./
RUN npm install --no-audit --no-fund
COPY . .
RUN npm run build

FROM nginx:alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
