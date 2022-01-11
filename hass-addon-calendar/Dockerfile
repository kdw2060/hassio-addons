ARG BUILD_FROM
FROM $BUILD_FROM

ENV LANG C.UTF-8

RUN \ 
    apk add --no-cache \
        nodejs \
        npm

# Copy data for add-on
COPY package.json .
COPY index.js .

COPY ics-to-json ./ics-to-json/

COPY run.sh /

RUN chmod a+x /run.sh

CMD [ "/run.sh" ]