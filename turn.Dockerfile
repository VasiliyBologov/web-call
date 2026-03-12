FROM coturn/coturn:4.6.2
USER root
RUN apt-get update && apt-get install -y netcat-openbsd curl && rm -rf /var/lib/apt/lists/*
USER turnserver

# Default configuration variables
ENV TURN_USERNAME=user
ENV TURN_PASSWORD=secret
ENV TURN_REALM=localhost
ENV MIN_PORT=50000
ENV MAX_PORT=50100

EXPOSE 3478/tcp 3478/udp 50000-50100/udp

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD nc -z localhost 3478 || exit 1

# Start turnserver with environment variables and necessary flags
CMD turnserver \
    --listening-port=3478 \
    --listening-ip=0.0.0.0 \
    --user=${TURN_USERNAME}:${TURN_PASSWORD} \
    --realm=${TURN_REALM} \
    --min-port=${MIN_PORT} \
    --max-port=${MAX_PORT} \
    --fingerprint \
    --lt-cred-mech \
    --stale-nonce \
    --no-cli \
    --log-file=stdout \
    --verbose