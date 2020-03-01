#!/bin/bash
set -e

CONFIG_PATH=/data/options.json
CONNECTION_STRING="$(jq --raw-output '.connectionString' $CONFIG_PATH)"

echo Hello!
node -v
npm -v
npm install
node index.js