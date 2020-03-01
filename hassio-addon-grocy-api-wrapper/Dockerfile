ARG BUILD_FROM
FROM $BUILD_FROM

ENV LANG C.UTF-8

RUN apk add --no-cache nodejs-npm
WORKDIR /usr/src/app
# Copy data for add-on
COPY package.json .
COPY package-lock.json .
COPY . .
COPY run.sh /usr/src/app
#COPY json /json/
RUN chmod a+x /usr/src/app/run.sh

CMD [ "/usr/src/app/run.sh" ]