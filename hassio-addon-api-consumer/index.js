// This file only serves to load the various api consumers.
// Upload your consumers to the /share/consumers folder and define your consumers in the consumerList option by listing their filename minus the .js
const options = require("./options"); 
for (const consumer of options.consumerList) {
   require('/share/consumers/' + consumer);
}

 