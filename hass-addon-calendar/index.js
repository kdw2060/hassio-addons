// Prerequisites //
const options = require("./options");
const fs =  require("fs");
const axios = require("axios");
const cron = require("node-cron");
const cheerio = require("cheerio");
const icsToJson = require("./ics-to-json").default;
const {google} = require("googleapis");
const moment = require("moment");
const locale = options.calendarList[0].locale;
require(`moment/locale/${locale}`);
moment.updateLocale(locale);

// HOME ASSISTANT API REQUESTS HEADER //
const postReqOptions = {headers: {'Authorization': 'Bearer ' + process.env.SUPERVISOR_TOKEN}};

// Processing calendars //
const numberOfCalendars = options.calendarList.length;
let allFutureEvents = {};

function getEvents() {
  for (let i = 0; i < numberOfCalendars; i++) {
    let sensorName = options.calendarList[i].calName;
    let username = options.calendarList[i].username;
    let pass = options.calendarList[i].password;
    let now = new Date();
    let startDTSTRING = (now.getFullYear() + ("0" + (now.getMonth()+1)).slice(-2) + ("0" + now.getDate()).slice(-2) + "T" + ("0" + now.getHours()).slice(-2) + ("0" + now.getMinutes()).slice(-2) + "00Z");
    let oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    let endDTSTRING = (oneYearFromNow.getFullYear() + ("0" + (oneYearFromNow.getMonth()+1)).slice(-2) + ("0" + oneYearFromNow.getDate()).slice(-2) + "T" + ("0" + oneYearFromNow.getHours()).slice(-2) + ("0" + oneYearFromNow.getMinutes()).slice(-2) + "00Z");

    var caldavReportBody = `<c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">\n\t<d:prop>\n\t\t<d:getetag />\n\t</d:prop>\n\t<c:filter>\n\t\t<c:comp-filter name="VCALENDAR">\n\t\t\t<c:comp-filter name="VEVENT">\n\t\t\t\t<c:time-range  start="${startDTSTRING}" end="${endDTSTRING}"/>\n\t\t\t</c:comp-filter>\n\t\t</c:comp-filter>\n\t</c:filter>\n</c:calendar-query>`;
  
    if (options.calendarList[i].calType === 'caldav') {
      let eventUris = [];
      const caldavUrl = options.calendarList[i].caldavUrl;
      const toEncode = username + ':' + pass;
      const buff = Buffer.from(toEncode, 'utf-8');
      const base64string = 'Basic '+ buff.toString('base64');
      const reqOptions1 = {
        headers: {'Authorization': base64string, 'Content-Type': 'text/xml','Depth': '1'},
        method: 'report',
        url: caldavUrl,
        data: caldavReportBody
      };
      const reqOptions2 = {headers: {'Authorization': base64string}};
      axios(reqOptions1)
      .then((response) => {
        let data = response.data;
        const $ = cheerio.load(data, {xmlMode: true});
        $("D\\:href").each(function(j, elem) {
            let rawUriParts = $(this).text().split("/");
            eventUris[j] = rawUriParts.pop();
          });
      }, (error) => {console.log('axios error: ' + error.message + error.response);})
      .then(() => {
        allFutureEvents[`${sensorName}`] = [];
        for (let i = 0; i < eventUris.length; i++ ) {
          axios.get(caldavUrl + eventUris[i], reqOptions2)
          .then((response) => {
            let calendarItem = icsToJson(response.data);
            if (calendarItem[0] !== undefined) {  
              if (calendarItem[0].endDate == undefined) {
                // for recurring events - so far only solution for yearly recurring
                calendarItem[0].startDate = moment(calendarItem[0].startDate).add(1, 'years');
                calendarItem[0].endDate = calendarItem[0].startDate;
              }
              calendarItem[0].startDate = moment(calendarItem[0].startDate);
              calendarItem[0].year = calendarItem[0].startDate.format("YY");
              calendarItem[0].start_month = calendarItem[0].startDate.format("MMM");
              calendarItem[0].start_day = parseInt(calendarItem[0].startDate.format("DD"));
              calendarItem[0].start_time = calendarItem[0].startDate.format("HH:mm");
              calendarItem[0].endDate = moment(calendarItem[0].endDate);
              calendarItem[0].end_month = calendarItem[0].endDate.format("MMM");
              calendarItem[0].end_day = parseInt(calendarItem[0].endDate.format("DD"));
              calendarItem[0].end_time = calendarItem[0].endDate.format("HH:mm");
              if (calendarItem[0].location) {calendarItem[0].location = calendarItem[0].location.replace(/\\/g, '');}
              allFutureEvents[`${sensorName}`].push(calendarItem[0]);

              if (i = (eventUris.length - 1)){
                  allFutureEvents[`${sensorName}`].sort(function(a,b) {
                    a = new Date(a.startDate);
                    b = new Date(b.startDate);
                    return a>b ? 1 : a<b ? -1 : 0;
                  });
                }
            }
          },(error) => {
            console.log('error with: ' + error.config.url + error.response);
          })
        }
      })
    }
  
    if (options.calendarList[i].calType === 'google') {
      const calId = options.calendarList[i].calId;
      const keyfile = options.calendarList[i].googleServiceAccountKeyfile;
      const key = JSON.parse(fs.readFileSync('/share/' + keyfile, 'utf-8'));
      const SCOPES = ['https://www.googleapis.com/auth/calendar'];
      var auth = new google.auth.JWT(
        key.client_email,
        null,
        key.private_key,
        SCOPES,
        key.client_email
      );
      
      let today = now.toISOString();
      let todayNextYear = oneYearFromNow.toISOString();
      const api = google.calendar({version: 'v3', auth});
      api.events.list({
        calendarId: calId,
        timeMin: today,
        timeMax: todayNextYear,
        orderBy: 'startTime',
        singleEvents: true
      }, function(err, res) {
        if (err) {
          console.log('There was an error loading the gcal data: ' + err);
          return;
        }
        if (res.status === 200) {
          allFutureEvents[`${sensorName}`] = [];
  
          res.data.items.forEach(element => {
            let calendarItem = {};
            calendarItem.summary = element.summary;
            if (element.location) {calendarItem.location = element.location.replace(/\\/g, '');}
            if (element.description) {calendarItem.label = element.description;}  
            calendarItem.startDate = moment(element.start.dateTime);
            calendarItem.endDate = moment(element.end.dateTime);
            calendarItem.year = calendarItem.startDate.format("YY");
            calendarItem.start_month = calendarItem.startDate.format("MMM");
            calendarItem.start_day = parseInt(calendarItem.startDate.format("DD"));
            calendarItem.start_time = calendarItem.startDate.format("HH:mm");
            calendarItem.end_month = calendarItem.endDate.format("MMM");
            calendarItem.end_day = parseInt(calendarItem.endDate.format("DD"));
            calendarItem.end_time = calendarItem.endDate.format("HH:mm");
          
            allFutureEvents[`${sensorName}`].push(calendarItem);
          });
        }
      });
    }
  }
}


function postEvents(sensorName){
  let events = JSON.parse(fs.readFileSync('/data/allFutureEvents.json', 'utf-8'));
  let numberOfEvents = events[`${sensorName}`].length;
  
  axios.post('http://supervisor/core/api/states/sensor.' + sensorName, 
    { state: numberOfEvents,
    attributes: {data: events[`${sensorName}`]}
    },
    postReqOptions)
    .then((response) => {}
    ,(error) => {
      console.log('error with: ' + error.config.url + error.response);
    });
}

function postEventsAllCalendars() {
  for (let k = 0; k < numberOfCalendars; k++) { 
    postEvents(options.calendarList[k].calName);
  }
}


////////
//CRON//
////////

//Upon restart, if events are stored, load and push to sensor(s)
if ( fs.existsSync('/data/allFutureEvents.json') ) {
  /// dirty quick check in case add-on configuration has changed since last restart - needs more work
  let events = JSON.parse(fs.readFileSync('/data/allFutureEvents.json', 'utf-8'));
  let firstCal = options.calendarList[0].calName;
  if (events[`${firstCal}`] !== undefined ) {
    postEventsAllCalendars();
    console.log("Previously stored events posted to sensor(s) at: " + new Date() );
  }
}

// Getting and posting events every 30 minutes
cron.schedule('4,34 * * * *', () => {
  getEvents();
  console.log("Calendar(s) queried at: " + new Date() );
});

cron.schedule('6,36 * * * *', () => {
  fs.writeFileSync('/data/allFutureEvents.json', JSON.stringify(allFutureEvents), err => { if(err){console.log(err); return}});  
  postEventsAllCalendars();
  console.log("Events posted to sensor(s) at: " + new Date() );
});