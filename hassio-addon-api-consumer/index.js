// This file only serves to load the various api consumers.
// Define your consumers in the fileList option by listing their filename minus the .js

const options = require("./options");

for (let i = 0 ; i < options.consumerList.length; i++) {
   require('./' + options.consumerList[i]);
 }
