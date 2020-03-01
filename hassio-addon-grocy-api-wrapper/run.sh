#!/bin/bash
set -e

# CONFIG_PATH=/data/options.json
# CONNECTION_STRING="$(jq --raw-output '.connectionString' $CONFIG_PATH)"

cd /usr/src/app
cp /data/options.json .
npm install
node index.js