#!/bin/bash
set -e

cd /usr/src/app
cp /data/options.json .
npm install
node index.js