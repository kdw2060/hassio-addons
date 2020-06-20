//////////
//CONFIG//
//////////
// The Node.js libraries we'll be using
// If you're new to creating http requests, check out this tutorial: https://blog.logrocket.com/how-to-make-http-requests-like-a-pro-with-axios/
const axios = require("axios");
const cron = require('node-cron');

// HOME ASSISTANT API OPTIONS
// This gets the supervisor token and configures the header for the posts to the Home Assistant api that we will be doing. No need to change anything here.
const postReqOptions = {headers: {'Authorization': 'Bearer ' + process.env.SUPERVISOR_TOKEN}};

// API REQUEST OPTIONS
// Some common options that might or might not be required by the api you're consuming. Consult the api documentation and set them as needed.
const user = "";
const password = "";
const baseUrl = "http://192.168.1.15:9192";
const reqOptions = { headers: {'GROCY-API-KEY': '*redacted*'} };


///////////////////////
//GETTERS AND SETTERS//
///////////////////////

// One or more functions that fetch the data and post it to Home Assistant sensor(s) 
//This particular consumer was built because the existing Grocy component you can get through Hacs doesn't include a sensor for the Tasks entered in Grocy. For now I've chosen to just map the Grocy api-calls one on one to three sensors. You could however also choose to combine the data first and then send only one data object to HA.

function getTasks() {
  // Define sensor object
  // If the sensor name you enter here doesn't exist yet, Home Assistant will automagically create it
  let sensorName = "grocy_tasks";
  let sensorData;

  // 1. Get the data from the api we're consuming
  axios.get(baseUrl + '/api/tasks', reqOptions)
  .then((response) => {
    sensorData = response.data;
    //console.log(sensorData);

    // 2. Transform the data if needed
    // Because Axios does such a swell job at parsing json this will likely not be necessary. If the source api gives you too much info or a non-json response however, you'll probably need to do some magic here.


      // 3. Then post the data to Home Assistant
      // Because our response exceeds the 255 character limit for the sensor state, we set it as a sensor attribute.
      // Each use case will have its own requirements, define the post body object as you see fit.
      axios.post('http://supervisor/core/api/states/sensor.' + sensorName, 
        { state: 'none',
        attributes: {data: sensorData}
        },
        postReqOptions)
      .then((response) => {
        console.log('posted Grocy Tasks to Hass');
      }, (error) => {
        console.log(error);
      });

  }, (error) => {
    console.log(error);
  });
}


function getTaskCategories() {
  // Define sensor object
  let sensorName = "grocy_taskCategories";
  let sensorData;

  // 1. Get the data from the api we're consuming
  axios.get(baseUrl + '/api/objects/task_categories', reqOptions)
  .then((response) => {
    sensorData = response.data;

    // 2. Transform the data if needed

      // 3. Then post the data to Home Assistant
      axios.post('http://supervisor/core/api/states/sensor.' + sensorName, 
        { state: 'none',
        attributes: {data: sensorData}
        },
        postReqOptions)
      .then((response) => {
        console.log('posted Grocy Task Categories to Hass');
      }, (error) => {
        console.log(error);
      });
      
  }, (error) => {
    console.log(error);
  });
}


function getUsers() {
  // Define sensor object
  let sensorName = "grocy_users";
  let sensorData;

  // 1. Get the data from the api we're consuming
  axios.get(baseUrl + '/api/users', reqOptions)
  .then((response) => {
    sensorData = response.data;

    // 2. Transform the data if needed

      // 3. Then post the data to Home Assistant
      axios.post('http://supervisor/core/api/states/sensor.' + sensorName, 
        { state: 'none',
        attributes: {data: sensorData}
        },
        postReqOptions)
      .then((response) => {
        console.log('posted Grocy Users to Hass');
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

//Finally let's define how often the function(s) should be executed and thus the sensor updated
//To learn how to define your cron-job, have a look at https://www.npmjs.com/package/node-cron or use a generator like https://crontab-generator.org/

//The tasks sensor is refreshed every 30 minutes
cron.schedule('*/30 * * * *', () => {
  getTasks();
  console.log("getTasks cronjob executed at: " + new Date() );
});

//These two don't change very often, so I only have them updated once a day
cron.schedule('47 20 * * *', () => {
  getTaskCategories();
  getUsers();  
});

