# ARG BUILD_FROM
ARG BUILD_FROM
FROM ${BUILD_FROM}

# Set shell
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

ENV \
    LANG=C.UTF-8 \
    S6_BEHAVIOUR_IF_STAGE2_FAILS=2 \
    S6_CMD_WAIT_FOR_SERVICES_MAXTIME=0 \
    S6_CMD_WAIT_FOR_SERVICES=1

RUN \ 
    apt-get update \
    \
    && curl -s -fsSL https://deb.nodesource.com/setup_16.x | bash - \
    \
    && apt-get install -y --no-install-recommends \
        tzdata=2022f-0ubuntu0.20.04.0 \
        nodejs \
    \
    && npm install -g npm@9.1.1 \
    && apt-get -y clean \
    && rm -fr \
        /tmp/* \
        /var/{cache,log}/* \
        /var/lib/apt/lists/*

# Copy data for add-on
COPY package.json .
COPY index.js .
COPY run.sh /

RUN chmod a+x /run.sh

CMD [ "/run.sh" ]
