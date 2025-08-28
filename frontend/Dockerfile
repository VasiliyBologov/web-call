# Frontend Dockerfile (Vite build + preview)
FROM node:20-alpine AS build
WORKDIR /app
COPY frontend/package.json ./
COPY frontend/tsconfig.json ./
COPY frontend/vite.config.ts ./
COPY frontend/index.html ./
COPY frontend/src ./src
RUN npm ci || npm i
# Build with defaults; override via build args if needed
ARG VITE_API_BASE
ARG VITE_WS_BASE
ARG VITE_ICE_JSON
ENV VITE_API_BASE=${VITE_API_BASE}
ENV VITE_WS_BASE=${VITE_WS_BASE}
ENV VITE_ICE_JSON=${VITE_ICE_JSON}
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=build /app/dist ./dist
RUN npm i -g vite
EXPOSE 5173
CMD ["vite", "preview", "--host", "0.0.0.0", "--port", "5173"]
