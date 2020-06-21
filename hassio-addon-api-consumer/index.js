// This file only serves to load the various api consumers.
// Upload your consumers to the /share/consumers folder and define your consumers in the consumerList option by listing their filename minus the .js
const axios = require("axios");
const cron = require('node-cron');
const moment = require('moment');
const options = require("./options");

for (let i = 0 ; i < options.consumerList.length; i++) {
   require('/share/consumers/' + options.consumerList[i]);
 }