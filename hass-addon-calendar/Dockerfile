# ARG BUILD_FROM
ARG BUILD_FROM=ghcr.io/hassio-addons/base-nodejs:0.1.4
FROM ${BUILD_FROM}

WORKDIR /app

# Copy data for add-on
COPY nodejsApp /app

RUN npm install

RUN chmod a+x /app/run.sh

CMD [ "/app/run.sh" ]