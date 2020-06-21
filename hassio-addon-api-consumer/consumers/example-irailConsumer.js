//////////
//CONFIG//
//////////
//const axios = require("axios");
//const cron = require('node-cron');

// HOME ASSISTANT API OPTIONS
const postReqOptions = {headers: {'Authorization': 'Bearer ' + process.env.SUPERVISOR_TOKEN}};

// API REQUEST OPTIONS
const baseUrl = "https://api.irail.be";


///////////////////////
//GETTERS AND SETTERS//
///////////////////////

// This consumer was built to replace my earlier custom card (https://github.com/kdw2060/hassio-custom-cards/tree/master/nmbs-routeboard)


function getTrains() {
  // Define sensor object
  let sensorName = "treinen_naar_brussel";
  let sensorData;

  // 1. Get the data from the api we're consuming
  // Docs for this api: https://docs.irail.be/
  axios.get(baseUrl + '/connections/?from=Antwerpen-Berchem&to=Brussel-Centraal&format=json&lang=nl&results=5')
  .then((response) => {
    sensorData = response.data;

    // 2. Transform the data
    let simplifiedSensorData = [];

    for (let i=0 ; i < sensorData.connection.length ; i++) {
        let scheduledTime = new Date(sensorData.connection[i].departure.time * 1000);
        let hours = scheduledTime.getHours();
        let minutes = ('0' + scheduledTime.getMinutes()).slice(-2);
        let platform = sensorData.connection[i].departure.platform;
        let direction = sensorData.connection[i].arrival.direction.name;
        let delay = sensorData.connection[i].departure.delay;
        let delayString;
        if (delay == 0) {delayString = '';}
        else {delay = delay / 60; delayString = "+" + delay + "'";}

        let connection = { "id": i, "time": hours + ':' + minutes, "delay": delayString, "platform": platform, "direction": direction};
        simplifiedSensorData.push(connection);      
    }
      // 3. Then post the data to Home Assitant
      axios.post('http://supervisor/core/api/states/sensor.' + sensorName, 
        { state: 'none',
        attributes: {data: simplifiedSensorData}
        },
        postReqOptions)
      .then((response) => {
      }, (error) => {
        console.log(error);
      });

  }, (error) => {
    console.log(error);
  });
}


////////
//CRON//
////////

// Update sensor every 2 minutes
cron.schedule('*/2 * * * *', () => {
  getTrains();
  console.log("getTrains cronjob executed at: " + new Date() );
});


