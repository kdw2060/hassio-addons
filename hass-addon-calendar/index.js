// Prerequisites //
const options = require("./options");
const fs = require("fs");
const axios = require("axios");
const cron = require("node-cron");
const cheerio = require("cheerio");
const icsToJson = require("./ics-to-json").default;
const { google } = require("googleapis");
const moment = require("moment");
const locale = options.locale;
require(`moment/locale/${locale}`);
moment.updateLocale(locale);

//For detecting changed config
let storedOptions;
try {
  storedOptions = fs.readFileSync("/data/optionsCopy.json", "utf-8");
  } catch (err) {
    if (err.code === 'ENOENT') {console.log('no previously stored options found');}
  }
fs.writeFileSync("/data/optionsCopy.json", JSON.stringify(options), (err) => {
  if (err) {
    console.log(err);
    return;
  }
});

// HOME ASSISTANT API REQUESTS HEADER //
const postReqOptions = { headers: { Authorization: "Bearer " + process.env.SUPERVISOR_TOKEN } };

// Options for the CRON jobs
const fetchCRON = options.fetchCRON //e.g. */2 * * * * every 2 minutes

// Options for how many days from now we want calendar entries
const fetchDays = options.fetchDays;

// Processing calendars //
const numberOfCalendars = options.calendarList.length;
let allFutureEvents = {};

async function getEvents() {
  for (let i = 0; i < numberOfCalendars; i++) {
    let sensorName = options.calendarList[i].calName;
    let username = options.calendarList[i].username;
    let pass = options.calendarList[i].password;

    // create date objects for google and caldav fetch calls
    let now = new Date();
    let startDTSTRING =
      now.getFullYear() +
      ("0" + (now.getMonth() + 1)).slice(-2) +
      ("0" + now.getDate()).slice(-2) +
      "T" +
      ("0" + now.getHours()).slice(-2) +
      ("0" + now.getMinutes()).slice(-2) +
      "00Z";

    let userDaterangeEnd = new Date();
    userDaterangeEnd.setDate(userDaterangeEnd.getDate() + fetchDays);
    let endDTSTRING =
      userDaterangeEnd.getFullYear() +
      ("0" + (userDaterangeEnd.getMonth() + 1)).slice(-2) +
      ("0" + userDaterangeEnd.getDate()).slice(-2) +
      "T" +
      ("0" + userDaterangeEnd.getHours()).slice(-2) +
      ("0" + userDaterangeEnd.getMinutes()).slice(-2) +
      "00Z";
    var caldavReportBody = `<c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">\n\t<d:prop>\n\t\t<d:getetag />\n\t</d:prop>\n\t<c:filter>\n\t\t<c:comp-filter name="VCALENDAR">\n\t\t\t<c:comp-filter name="VEVENT">\n\t\t\t\t<c:time-range  start="${startDTSTRING}" end="${endDTSTRING}"/>\n\t\t\t</c:comp-filter>\n\t\t</c:comp-filter>\n\t</c:filter>\n</c:calendar-query>`;

    // create date objects for Baikal fetch call
    let startTimestamp = Math.floor(new Date().getTime()/1000);
    let fetchDateFromNow = new Date();
    fetchDateFromNow.setDate(fetchDateFromNow.getDate() + fetchDays);
    let endTimestamp = Math.floor(fetchDateFromNow.getTime()/1000);

    // fetch Calendar objects for Baikal CALDAV
    if (options.calendarList[i].calType === "baikal") {
      let eventUris = [];
      const caldavUrl = options.calendarList[i].caldavUrl;
      const toEncode = username + ":" + pass;
      const buff = Buffer.from(toEncode, "utf-8");
      const base64string = "Basic " + buff.toString("base64");
      const reqOptions = {
        headers: { Authorization: base64string, "Content-Type": "text/xml", Depth: "1" },
        method: "get",
        url: caldavUrl + '?export&accept=jcal&start=' + startTimestamp + '&end=' + endTimestamp + '&expand=1'
      };

      try {
        let response = await axios(reqOptions);
        let data = response.data;

        allFutureEvents[`${sensorName}`] = [];

        let dataType = data[0];
        if (dataType == 'vcalendar') {
          let calendarInfos = data[1];
          // for (let i = 0; i< calendarInfos.length; i++) {
          //   console.log(calendarInfos[i][0] + ' - ' + calendarInfos[i][3])
          // }
          let calendarEvents = data[2];
          console.log('Events fetched: ' + calendarEvents.length);
          for (let j = 0; j < calendarEvents.length; j++) {
            let event = calendarEvents[j];
            if (event[0] == 'vevent') {
              let eventJSON = {};
              eventJSON['categories'] =[];
              for (let k = 0; k < event[1].length; k++){
                let eventDetail = event[1][k];
                switch (eventDetail[0]) {
                  case 'dtstart':
                    eventJSON['start_date'] = moment(eventDetail[3])
                    eventJSON['start_year'] = eventJSON['start_date'].format("YYYY")
                    eventJSON['start_month'] = eventJSON['start_date'].format("MM")
                    eventJSON['start_month_digits'] = parseInt(eventJSON['start_date'].format("MM"))
                    eventJSON['start_day'] = eventJSON['start_date'].format("DD")
                    eventJSON['start_time'] = eventJSON['start_date'].format("HH:mm")
                    break;
                  case 'dtend':
                    eventJSON['end_date'] = moment(eventDetail[3])
                    eventJSON['end_year'] = eventJSON['end_date'].format("YYYY")
                    eventJSON['end_month'] = eventJSON['end_date'].format("MM")
                    eventJSON['end_month_digits'] = parseInt(eventJSON['end_date'].format("MM"))
                    eventJSON['end_day'] = eventJSON['end_date'].format("DD")
                    eventJSON['end_time'] = eventJSON['end_date'].format("HH:mm")
                    break;
                  case 'summary':
                    eventJSON['summary'] = eventDetail[3];
                    break;
                  case 'description':
                    eventJSON['description'] = eventDetail[3];
                    break;
                  case 'location':
                    eventJSON['location'] = eventDetail[3].replace(/\\/g, "");
                    break;
                  case 'categories':
                    eventJSON['categories'].push(eventDetail[3]);
                    break;
                  case 'priority':
                    eventJSON['priority'] = eventDetail[3];
                    break;
                  case 'status':
                    eventJSON['status'] = eventDetail[3];
                    break;
                  case 'sequence':
                    eventJSON['sequence'] = eventDetail[3];
                    break;
                  case 'recurrence-id':
                    eventJSON['recurring'] = true;
                    break;
                }
              }

              // check if we have a full day event
              st = (eventJSON['end_date'].toString());
              en = (eventJSON['start_date'].add(1, "d").toString());
              if (st == en) {
                eventJSON['wholeDay'] = true;
              }
              allFutureEvents[`${sensorName}`].push(eventJSON)
            }
          }
          // sort the events
          allFutureEvents[`${sensorName}`].sort(function (a, b) {
            a = new Date(a.start_date);
            b = new Date(b.start_date);
            return a > b ? 1 : a < b ? -1 : 0;
          });
        }
      }
      catch (error) {
        console.log("error: " + error.message + error.response);
      }
    }

    // fetch entries for CALDAV calendar
    if (options.calendarList[i].calType === "caldav") {
      let eventUris = [];
      const caldavUrl = options.calendarList[i].caldavUrl;
      const toEncode = username + ":" + pass;
      const buff = Buffer.from(toEncode, "utf-8");
      const base64string = "Basic " + buff.toString("base64");
      const reqOptions1 = {
        headers: { Authorization: base64string, "Content-Type": "text/xml", Depth: "1" },
        method: "report",
        url: caldavUrl,
        data: caldavReportBody,
      };
      const reqOptions2 = { headers: { Authorization: base64string } };

      try {
        let response = await axios(reqOptions1);

        let data = response.data;
        let counter = 0;
        const $ = cheerio.load(data, { xmlMode: true });
        $("href").each(function (elem) {
          let rawUriParts = $(this).text().split("/");
          eventUris[counter] = rawUriParts.pop();
          counter++;
        });
        $("d\\:href").each(function (elem) {
          let rawUriParts = $(this).text().split("/");
          eventUris[counter] = rawUriParts.pop();
          counter++;
        });
        $("D\\:href").each(function (elem) {
          let rawUriParts = $(this).text().split("/");
          eventUris[counter] = rawUriParts.pop();
          counter++;
        });
        // console.log(counter + ' entries found')
        // console.log('eventUris length ' + eventUris.length)

        allFutureEvents[`${sensorName}`] = [];
        for (let i = 0; i < eventUris.length; i++) {
          try {
            let response = await axios.get(caldavUrl + eventUris[i], reqOptions2)
            let data = response.data
            let calendarItem = icsToJson(data);
            if (calendarItem[0] !== undefined) {
              if (calendarItem[0].endDate == undefined) {
                // for recurring events - so far only solution for yearly recurring
                calendarItem[0].startDate = moment(calendarItem[0].startDate).add(1, "years");
                calendarItem[0].endDate = calendarItem[0].startDate;
                calendarItem[0].recurring = true;
              }
              calendarItem[0].startDate = moment(calendarItem[0].startDate);
              calendarItem[0].year = parseInt(calendarItem[0].startDate.format("YY"));
              calendarItem[0].start_month = calendarItem[0].startDate.format("MMM");
              calendarItem[0].start_month_digits = parseInt(calendarItem[0].startDate.format("MM"));
              calendarItem[0].start_day = parseInt(calendarItem[0].startDate.format("DD"));
              calendarItem[0].start_time = calendarItem[0].startDate.format("HH:mm");
              calendarItem[0].endDate = moment(calendarItem[0].endDate);
              calendarItem[0].end_month = calendarItem[0].endDate.format("MMM");
              calendarItem[0].end_month_digits = parseInt(calendarItem[0].endDate.format("MM"));
              calendarItem[0].end_day = parseInt(calendarItem[0].endDate.format("DD"));
              calendarItem[0].end_time = calendarItem[0].endDate.format("HH:mm");
              if (calendarItem[0].endDate == calendarItem[0].startDate.add(1, "d")) {
                calendarItem[0].whole_day = true;
              }
              if (calendarItem[0].location) {
                calendarItem[0].location = calendarItem[0].location.replace(/\\/g, "");
              }
              allFutureEvents[`${sensorName}`].push(calendarItem[0]);
            }
          }
          catch (error) {
            console.log("error with: " + error.config.url + error.response);
          }
        }
        // sort calendar entries
        allFutureEvents[`${sensorName}`].sort(function (a, b) {
          a = new Date(a.startDate);
          b = new Date(b.startDate);
          return a > b ? 1 : a < b ? -1 : 0;
        });
      }
      catch (error) {
        console.log("axios error: " + error.message + error.response);
      }
    }

    // fetch entries for GOOGLE calendars
    if (options.calendarList[i].calType === "google") {
      const calId = options.calendarList[i].calId;
      const keyfile = options.calendarList[i].googleServiceAccountKeyfile;
      const key = JSON.parse(fs.readFileSync("/share/" + keyfile, "utf-8"));
      const SCOPES = ["https://www.googleapis.com/auth/calendar"];
      var auth = new google.auth.JWT(key.client_email, null, key.private_key, SCOPES, key.client_email);

      let today = now.toISOString();
      let future = userDaterangeEnd.toISOString();
      const api = google.calendar({ version: "v3", auth });
      api.events.list(
        {
          calendarId: calId,
          timeMin: today,
          timeMax: future,
          orderBy: "startTime",
          singleEvents: true,
        },
        function (err, res) {
          if (err) {
            console.log("There was an error loading the gcal data: " + err);
            return;
          }
          if (res.status === 200) {
            allFutureEvents[`${sensorName}`] = [];

            res.data.items.forEach((element) => {
              let calendarItem = {};
              calendarItem.summary = element.summary;
              if (element.location) {
                calendarItem.location = element.location.replace(/\\/g, "");
              }
              if (element.description) {
                calendarItem.label = element.description;
              }
              if (element.start.dateTime) {
                calendarItem.startDate = moment(element.start.dateTime);
                calendarItem.year = parseInt(calendarItem.startDate.format("YY"));
                calendarItem.start_month = calendarItem.startDate.format("MMM");
                calendarItem.start_day = parseInt(calendarItem.startDate.format("DD"));
                calendarItem.start_time = calendarItem.startDate.format("HH:mm");
                calendarItem.start_month_digits = parseInt(calendarItem.startDate.format("MM"));
              }
              if (element.end.dateTime) {
                calendarItem.endDate = moment(element.end.dateTime);
                calendarItem.end_month = calendarItem.endDate.format("MMM");
                calendarItem.end_day = parseInt(calendarItem.endDate.format("DD"));
                calendarItem.end_time = calendarItem.endDate.format("HH:mm");
                calendarItem.end_month_digits = parseInt(calendarItem.endDate.format("MM"));
              }
              if (element.start.date) {
                calendarItem.startDate = moment(element.start.date);
                calendarItem.year = parseInt(calendarItem.startDate.format("YY"));
                calendarItem.start_month = calendarItem.startDate.format("MMM");
                calendarItem.start_day = parseInt(calendarItem.startDate.format("DD"));
                calendarItem.start_month_digits = parseInt(calendarItem.startDate.format("MM"));
                calendarItem.start_time = null;
                calendarItem.whole_day = true;
              }
              if (element.end.date) {
                calendarItem.endDate = moment(element.end.date);
                calendarItem.end_month = calendarItem.endDate.format("MMM");
                calendarItem.end_day = parseInt(calendarItem.endDate.format("DD"));
                calendarItem.end_time = null;
                calendarItem.end_month_digits = parseInt(calendarItem.endDate.format("MM"));
              }
              if (element.recurringEventId) {
                calendarItem.recurring = true;
              }

              allFutureEvents[`${sensorName}`].push(calendarItem);
            });
          }
        }
      );
    }
  }
}

async function postEvents(sensorName) {
  let events = JSON.parse(fs.readFileSync("/data/allFutureEvents.json", "utf-8"));
  let numberOfEvents = events[`${sensorName}`].length;

  try {
    const response = await axios.post(
        "http://supervisor/core/api/states/sensor." + sensorName,
        { state: numberOfEvents, attributes: { data: events[`${sensorName}`] } },
        postReqOptions
      )
  }
  catch (error) {
    console.log("postEvents error with: " + error);
  }
}

async function postEventsAllCalendars() {
  for (let k = 0; k < numberOfCalendars; k++) {
    try {
      await postEvents(options.calendarList[k].calName);
    }
    catch (error) {
      console.log("postEventsAllCalendars error: " + error);
    }
  }
}

//////////////////////////////////////
//Initial fetch or restore of events//
//////////////////////////////////////
let currentOptions = JSON.stringify(options);
var testOptions = storedOptions == currentOptions;

if (testOptions === true) {
  let events = JSON.parse(fs.readFileSync("/data/allFutureEvents.json", "utf-8"));
  if (events !== undefined) {
      postEventsAllCalendars();
      console.log("Previously stored events posted to sensor(s) at: " + new Date());
  }
}
  
else async() => {
  await getEvents();
  fs.writeFileSync("/data/allFutureEvents.json", JSON.stringify(allFutureEvents), (err) => {
    if (err) {
      console.log(err);
      return;
    }
  });
  await postEventsAllCalendars();
  console.log("Initial events posted to sensor(s) at: " + new Date());
}


////////
//CRON//
////////
cron.schedule(fetchCRON, async () => {
  await getEvents();
  console.log("Calendar(s) queried at: " + new Date());
  fs.writeFileSync("/data/allFutureEvents.json", JSON.stringify(allFutureEvents), (err) => {
    if (err) {
      console.log(err);
      return;
    }
  });
  await postEventsAllCalendars();
  console.log("CRON-Task: Events posted to sensor(s) at: " + new Date());
});