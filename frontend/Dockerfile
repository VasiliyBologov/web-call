# Frontend Dockerfile (Vite build + preview)
FROM node:20-alpine AS build
WORKDIR /app
COPY frontend/package.json ./
COPY frontend/tsconfig.json ./
COPY frontend/vite.config.ts ./
COPY frontend/index.html ./
COPY frontend/src ./src
COPY frontend/public ./public
RUN npm ci || npm i
# Build with defaults; override via build args if needed
ARG VITE_API_BASE
ARG VITE_WS_BASE
ARG VITE_ICE_JSON
ARG VITE_ICE_TRANSPORT_POLICY
ENV VITE_API_BASE=${VITE_API_BASE}
ENV VITE_WS_BASE=${VITE_WS_BASE}
ENV VITE_ICE_JSON=${VITE_ICE_JSON}
ENV VITE_ICE_TRANSPORT_POLICY=${VITE_ICE_TRANSPORT_POLICY}
RUN npm run build

FROM nginx:alpine AS runner
# Install curl for healthcheck
RUN apk add --no-cache curl
# Copy built static files to nginx html directory
COPY --from=build /app/dist /usr/share/nginx/html
# Nginx config for SPA + API/WS proxy to backend service
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
