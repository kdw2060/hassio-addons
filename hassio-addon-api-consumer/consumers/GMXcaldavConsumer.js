//////////
//CONFIG//
//////////
const axios = require("/usr/src/app/node_modules/axios");
const cron = require('/usr/src/app/node_modules/node-cron');
const cheerio = require("/usr/src/app/node_modules/cheerio");
const icsToJson = require("/share/consumers/ics-to-json").default;
const moment = require('/usr/src/app/node_modules/moment');
require('/usr/src/app/node_modules/moment/locale/nl-be');
moment.updateLocale('nl-be');

// HOME ASSISTANT API OPTIONS
const postReqOptions = {headers: {'Authorization': 'Bearer ' + process.env.SUPERVISOR_TOKEN}};

// API REQUEST OPTIONS
const baseUrl = "https://caldav.gmx.net";
const reqOptions = {headers: {'Authorization': 'REDACTED - calendar auth goes here'}};

///////////////////////
//GETTERS AND SETTERS//
///////////////////////
let eventUris = [];
let currentEvents = [];
let currentEventsCounter = 0
let sensorName = "agenda_kris";

function getEvents() {
  eventUris = [];
  currentEvents = [];
  currentEventsCounter = 0;
  // 1. Get the data from the api we're consuming
  axios.get(baseUrl + '/begenda/dav/REDACTED - path to calendar goes here', reqOptions)
  .then((response) => {
    let data = response.data;
    // 2. Parse the html data
    const $ = cheerio.load(data);
    $('li a').each(function(i, elem) {
        eventUris[i] = $(this).attr('href');
      });
  }, (error) => {
    console.log(error.config.url + error.response);
  }).then(() => {
      for (let i = 0; i < eventUris.length; i++ ) {
        axios.get(baseUrl + eventUris[i], reqOptions)
        .then((response) => {
          let calenderItem = icsToJson(response.data);
          
          if (moment(calenderItem[0].endDate).isAfter() == true) {
            currentEventsCounter++;
            calenderItem[0].startDate = moment(calenderItem[0].startDate);
            calenderItem[0].year = calenderItem[0].startDate.format("YY");
            calenderItem[0].start_month = calenderItem[0].startDate.format("MMM");
            calenderItem[0].start_day = parseInt(calenderItem[0].startDate.format("DD"));
            calenderItem[0].start_time = calenderItem[0].startDate.format("HH:mm");
            calenderItem[0].endDate = moment(calenderItem[0].endDate);
            calenderItem[0].end_month = calenderItem[0].endDate.format("MMM");
            calenderItem[0].end_day = parseInt(calenderItem[0].endDate.format("DD"));
            calenderItem[0].end_time = calenderItem[0].endDate.format("HH:mm");
            currentEvents.push(calenderItem[0]);
          }
        },(error) => {
          console.log(error.config.url + error.response);
        })
      }
  })
}

function postEvents(){
  //console.log("before sort: " + JSON.stringify(currentEvents));
  currentEvents.sort(function(a,b){
    a = new Date(a.startDate);
    b = new Date(b.startDate);
    return a>b ? 1 : a<b ? -1 : 0;
  });
  //console.log("after sort: " + JSON.stringify(currentEvents));
  axios.post('http://supervisor/core/api/states/sensor.' + sensorName, 
    { state: currentEventsCounter,
    attributes: {data: currentEvents}
    },
    postReqOptions)
    .then((response) => {}
    ,(error) => {
      console.log(error.config.url + error.response);
    });
}

cron.schedule('2 6-10,16-23 * * *', () => {
  getEvents();
  console.log("getEvents cronjob executed at: " + new Date() );
});

cron.schedule('5 6-10,16-23 * * *', () => {
  postEvents();
  console.log("postEvents cronjob executed at: " + new Date() );
 });