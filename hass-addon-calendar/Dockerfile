# ARG BUILD_FROM
ARG BUILD_FROM=ghcr.io/home-assistant/amd64-base:latest
FROM ${BUILD_FROM}

RUN apk add --no-cache \
    nodejs \
    npm \
    git \
    build-base \
    # Clean up apk cache in the same layer to reduce final image size
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy data for add-on
COPY nodejsApp /app

RUN npm install --unsafe-perm

RUN chmod a+x /app/run.sh

CMD [ "/app/run.sh" ]