# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci || npm i
COPY frontend/ ./
ARG VITE_API_BASE=""
ARG VITE_WS_BASE=""
ARG VITE_ICE_JSON='[{"urls":["stun:20.80.101.0:3478"]},{"urls":["turn:20.80.101.0:3478?transport=udp","turn:20.80.101.0:3478?transport=tcp"],"username":"testuser","credential":"testpassword"}]'
ARG VITE_ICE_TRANSPORT_POLICY="all"
ARG VITE_FORCE_H264="false"
ENV VITE_API_BASE=${VITE_API_BASE}
ENV VITE_WS_BASE=${VITE_WS_BASE}
ENV VITE_ICE_JSON=${VITE_ICE_JSON}
ENV VITE_ICE_TRANSPORT_POLICY=${VITE_ICE_TRANSPORT_POLICY}
ENV VITE_FORCE_H264=${VITE_FORCE_H264}
RUN npm run build

# Stage 2: Final Image
FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# System dependencies: Nginx, Supervisor, build-essential
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    nginx \
    supervisor \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/app ./app

# Copy scripts and configs
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY nginx.conf /etc/nginx/sites-available/default
# Ensure the symlink for default site exists in sites-enabled
RUN ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default

# Copy frontend static files
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Create necessary directories
RUN mkdir -p /var/log/supervisor /var/run/supervisor

# Expose ports
# HTTP (Nginx)
EXPOSE 80

# Start supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
