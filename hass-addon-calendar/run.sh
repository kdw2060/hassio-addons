#!/bin/bash
set -e

cp /data/options.json .

npm install
node index.js