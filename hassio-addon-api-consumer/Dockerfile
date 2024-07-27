ARG BUILD_FROM=ghcr.io/hassio-addons/base-nodejs:0.2.3
FROM $BUILD_FROM

ENV LANG C.UTF-8
WORKDIR /app

# Copy data for add-on
COPY package.json /app
COPY index.js /app
COPY consumers/ /app
COPY run.sh /app

RUN npm install

RUN chmod a+x /app/run.sh

CMD [ "/app/run.sh" ]