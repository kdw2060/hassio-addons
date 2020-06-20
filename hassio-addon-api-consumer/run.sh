#!/bin/bash
set -e

cd /usr/src/app
cp /data/options.json .
mkdir -p /share/consumers && cp -r *Consumer.js /share/consumers/

npm install
node index.js