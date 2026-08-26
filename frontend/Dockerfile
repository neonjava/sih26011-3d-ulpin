# Stage 1: Build React + Vite + Three.js Application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json* ./

# Install npm dependencies
RUN npm ci || npm install

# Copy source code
COPY . .

# Build production bundle
RUN npm run build

# Stage 2: Serve via Nginx reverse proxy
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
