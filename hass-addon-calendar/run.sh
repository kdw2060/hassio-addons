#!/command/with-contenv bashio
cp /data/options.json .
npm --loglevel=error install 
node index.js