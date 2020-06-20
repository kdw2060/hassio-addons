ARG BUILD_FROM
FROM $BUILD_FROM

ENV LANG C.UTF-8

RUN apk add --no-cache nodejs-npm
WORKDIR /usr/src/app
# Copy data for add-on
COPY package.json .
COPY index.js .
COPY consumers/*Consumer.js /usr/src/app/
COPY run.sh /usr/src/app
RUN chmod a+x /usr/src/app/run.sh

CMD [ "/usr/src/app/run.sh" ]