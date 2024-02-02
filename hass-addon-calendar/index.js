// Prerequisites //
const options = require("./options"); 
const fs = require("fs");
const axios = require("axios");
const cron = require("node-cron");
const cheerio = require("cheerio");
const ical = require('node-ical');
const { google } = require("googleapis");
const { DateTime, Settings } = require("luxon");
const { get } = require("http");


//Helper functions
async function writeEventsFile(data) {
  return new Promise((resolve, reject) => {
  fs.writeFileSync("/data/allFutureEvents.json", JSON.stringify(data));
  resolve(true);
  })
}
function addDays(date, days) {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

//Read options and set as constants
const fetchCRON = options.fetchCRON
const fetchDays = options.fetchDays;
const fetchDaysPast = options.fetchDaysPast;
console.log('System locale: ' + DateTime.now().locale);
Settings.defaultLocale = options.locale;
console.log('Luxon locale set to: ' + Settings.defaultLocale);
console.log('System timeZone: ' + Intl.DateTimeFormat().resolvedOptions().timeZone);
if (options.timeZone) {
  Settings.defaultZone = options.timeZone;
  console.log('Luxon timezone set to: ' + Settings.defaultZone.zoneName);
}

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


//////////////////////////
// Processing calendars //
//////////////////////////
let allFutureEvents = {};
const numberOfCalendars = options.calendarList.length;
console.log('Number of calendars: ' + numberOfCalendars);

async function getEvents() {
  return new Promise(async (resolve, reject) => {
    try {
      for (let calendar of options.calendarList) {
        let sensorName = calendar.calName;
        let username = calendar.username;
        let pass = calendar.password;
    
        // create date objects for google and caldav fetch calls
        let now = new Date();
        if (fetchDaysPast < 0) {now = addDays(now, fetchDaysPast);}
        let startDTSTRING =
          now.getFullYear() +
          ("0" + (now.getMonth() + 1)).slice(-2) +
          ("0" + now.getDate()).slice(-2) +
          "T" +
          ("0" + now.getHours()).slice(-2) +
          ("0" + now.getMinutes()).slice(-2) +
          "00Z";
    
        let userDaterangeEnd = addDays(now, fetchDays);
        if (fetchDaysPast < 0) {
          userDaterangeEnd = addDays(userDaterangeEnd, Math.abs(fetchDaysPast));
        }
    
        let endDTSTRING =
          userDaterangeEnd.getFullYear() +
          ("0" + (userDaterangeEnd.getMonth() + 1)).slice(-2) +
          ("0" + userDaterangeEnd.getDate()).slice(-2) +
          "T" +
          ("0" + userDaterangeEnd.getHours()).slice(-2) +
          ("0" + userDaterangeEnd.getMinutes()).slice(-2) +
          "00Z";
        var caldavReportBody = `<c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">\n\t<d:prop>\n\t\t<d:getetag />\n\t</d:prop>\n\t<c:filter>\n\t\t<c:comp-filter name="VCALENDAR">\n\t\t\t<c:comp-filter name="VEVENT">\n\t\t\t\t<c:time-range  start="${startDTSTRING}" end="${endDTSTRING}"/>\n\t\t\t</c:comp-filter>\n\t\t</c:comp-filter>\n\t</c:filter>\n</c:calendar-query>`;
    
        //////////////////
        // CALDAV fetch //
        //////////////////
        if (calendar.calType === "caldav") {
          let eventUris = [];
          const caldavUrl = calendar.caldavUrl;
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
    
          // Retrieve list of ics file links for the events
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
            console.log(counter + ' entries found in caldav calendar')
            allFutureEvents[`${sensorName}`] = [];
    
            // Download and parse ics data of events
            let eventsCounter = 0;
            let fetchPromises = eventUris.map(async (uri) => {
              try {
                let calendarItem = {};
                console.log("Fetching caldav calendar entry " + uri);
                let response = await axios.get(caldavUrl + uri, reqOptions2);
                let icsData = response.data;
    
                ical.async.parseICS(icsData, function(err, data) {
                  if (err) {
                      console.error(err);
                      process.exit(1);
                  }
    
                for (const k in data) {
                  if (!{}.hasOwnProperty.call(data, k)) 
                  continue;
                  let event = data[k];
                  if (data[k].type === 'VEVENT') {
                    // Parse all the basic event fields
                    //console.log("Parsing event " + JSON.stringify(event.summary) ); 
                    if (event.summary) {
                      let tempString = (typeof event.summary === 'string') ? event.summary : event.summary.val.toString();
                      calendarItem.summary = tempString.replace(/(\r\n|\n|\r)/gm, ", ");
                    }
    
                    if (event.location) {
                      let tempString = (typeof event.location === 'string') ? event.location : event.location.val.toString();
                      calendarItem.location = tempString.replace(/(\r\n|\n|\r)/gm, ", ");
                    }
    
                    if (event.categories) {
                        calendarItem.label = event.categories[0];
                    }
    
                    if (event.description) {
                      let tempString = (typeof event.description === 'string') ? event.description : event.description.val.toString();
                      calendarItem.description = tempString;
                    }
    
                    calendarItem.startDate = DateTime.fromISO(event.start.toISOString()).toLocaleString(DateTime.DATETIME_SHORT);
                    let startDateISO = DateTime.fromISO(event.start.toISOString());
                    calendarItem.startDateISO = DateTime.fromISO(event.start.toISOString()).toString();
                    calendarItem.year = parseInt(startDateISO.toFormat("y"));
                    calendarItem.yearShort = parseInt(startDateISO.toFormat("yy"));
                    calendarItem.startMonth = startDateISO.toFormat("LLL");
                    calendarItem.startMonthDigits = parseInt(startDateISO.toFormat("LL"));
                    calendarItem.startDay = parseInt(startDateISO.toFormat("dd"));
                    calendarItem.startTime = startDateISO.toFormat("HH:mm");
                    if (event.end !== undefined) {
                      calendarItem.endDate = DateTime.fromISO(event.end.toISOString()).toLocaleString(DateTime.DATETIME_SHORT);
                      let endDateISO = DateTime.fromISO(event.end.toISOString());
                      calendarItem.endDateISO = DateTime.fromISO(event.end.toISOString()).toString();
                      calendarItem.endMonth = endDateISO.toFormat("LLL");
                      calendarItem.endMonthDigits = parseInt(endDateISO.toFormat("LL"));
                      calendarItem.endDay = parseInt(endDateISO.toFormat("dd"));
                      calendarItem.endTime = endDateISO.toFormat("HH:mm");
                    }
                    calendarItem.wholeDay = false;
                    calendarItem.recurring = false;          
    
                    // Check if full day event and alter date parts accordingly
                    if (event.end.hasOwnProperty('dateOnly') || event.datetype == 'date') {
                      calendarItem.wholeDay = true;
                      calendarItem.startDate = DateTime.fromISO(event.start.toISOString()).toLocaleString();
                      calendarItem.startTime = null;
                      calendarItem.endTime = null;
                      calendarItem.endDate = DateTime.fromISO(event.end.toISOString()).toLocaleString(DateTime.DATETIME_SHORT);
                      // check if multiday event
                      let start = DateTime.fromISO(event.start.toISOString());
                      let end = DateTime.fromISO(event.end.toISOString());
                      let diff = end.diff(start, 'days').toObject();
                      if (diff.days > 1) {
                        calendarItem.multiDay = true;
                        calendarItem.endDateISO = DateTime.fromISO(event.end.toISOString()).toString();
                        let endDateISO = DateTime.fromISO(event.end.toISOString());
                        calendarItem.endMonth = endDateISO.toFormat("LLL");
                        calendarItem.endMonthDigits = parseInt(endDateISO.toFormat("LL"));
                        calendarItem.endDay = parseInt(endDateISO.toFormat("dd"));
                      }
                      if (diff.days == 1) {
                        calendarItem.endDate = null;
                        calendarItem.endDateISO = null;
                        calendarItem.endMonth = null;
                        calendarItem.endMonthDigits = null;
                        calendarItem.endDay = null;
                      }
                    }
                    
                    // Recurring events logic starts here //
                    if (event.type !== 'VEVENT' || !event.rrule) 
                      continue;
                    
                    let now = new Date();
                    let future =  addDays(now, fetchDays);
                    const dates = event.rrule.between(now, future);
                    if (dates.length === 0) 
                    continue;
                    
                    switch (event.rrule.origOptions.freq) {
                        case 0: 
                            calendarItem.recurring = "yearly";
                            break;
                        case 1: 
                            calendarItem.recurring ="monthly";
                            break;
                        case 2: 
                            calendarItem.recurring = "weekly";
                            break;
                        case 3: 
                            calendarItem.recurring = "daily";
                    }      
                    calendarItem.nextOccurences = dates;
                    // Rewrite start/end dates to nextOccurence + daylight savings time check
                    let nextOccurence = DateTime.fromISO(dates[0].toISOString());
                    let originalDate = DateTime.fromISO(event.rrule.origOptions.dtstart.toISOString());
                    if (originalDate.isInDST !== nextOccurence.isInDST) {
                        nextOccurence = nextOccurence.plus({hours: 1});
                    }
                    calendarItem.originalStartDate = originalDate.toString();
                    calendarItem.startDate = nextOccurence.toLocaleString();
                    calendarItem.startDateISO = nextOccurence.toString();
                    calendarItem.year = parseInt(nextOccurence.toFormat("y"));
                    calendarItem.yearShort = parseInt(nextOccurence.toFormat("yy"));
                    calendarItem.startMonth = nextOccurence.toFormat("LLL");
                    calendarItem.startMonthDigits = parseInt(nextOccurence.toFormat("LL"));
                    calendarItem.startDay = parseInt(nextOccurence.toFormat("dd"));
                
                    if (calendarItem.recurring == "yearly") {
                      calendarItem.originalStartYear = parseInt(originalDate.toFormat("y"));
                    }
    
                    if (calendarItem.wholeDay == false) {
                        calendarItem.startDate = nextOccurence.toLocaleString(DateTime.DATETIME_SHORT);
                        calendarItem.startTime = nextOccurence.toFormat("HH:mm");
                        // Determine time diff between original start and enddate
                        let start = DateTime.fromISO(event.start.toISOString());
                        let end =  DateTime.fromISO(event.end.toISOString())
                        let diff = end.diff(start, 'minutes').toObject().minutes;
                        // Update endDate fields
                        let newEndDate = nextOccurence.plus({minutes: diff});
                        calendarItem.endDate = newEndDate.toLocaleString();
                        endDateISO = DateTime.fromISO(newEndDate.toString());
                        calendarItem.endDateISO = newEndDate.toString();
                        calendarItem.endMonth = newEndDate.toFormat("LLL");
                        calendarItem.endMonthDigits = parseInt(newEndDate.toFormat("LL"));
                        calendarItem.endDay = parseInt(newEndDate.toFormat("dd"));
                        calendarItem.endTime = newEndDate.toFormat("HH:mm");
                    }
                  }    
                };
                allFutureEvents[`${sensorName}`].push(calendarItem);
                eventsCounter++;
              })
              }
              catch (error) {
                console.log("Error fetching uri: " + error.request + error.message);
              } 
            })
            // Sort calendar entries
            await Promise.all(fetchPromises);
            console.log('Sorting events of calendar: ' + sensorName);
            allFutureEvents[`${sensorName}`].sort(function (a, b) {
              a = new Date(a.startDateISO);
              b = new Date(b.startDateISO);
              return a > b ? 1 : a < b ? -1 : 0;
              });
          }
          catch (error) {
            console.log("Error in caldav fetch block: " + error + error.response);
          }
        }//END of Caldav fetch
    
        //////////////////
        // GOOGLE fetch //
        //////////////////
        if (calendar.calType === "google") {
          const calId = calendar.calId;
          const keyfile = calendar.googleServiceAccountKeyfile;
          const key = JSON.parse(fs.readFileSync("/config/" + keyfile, "utf-8"));
          const SCOPES = ["https://www.googleapis.com/auth/calendar"];
          var auth = new google.auth.JWT(key.client_email, null, key.private_key, SCOPES, key.client_email);
          let today = now.toISOString();
          let future = userDaterangeEnd.toISOString();
          const api = google.calendar({ version: "v3", auth });
          try {
            let res = await new Promise((resolve, reject) => {
              api.events.list(
                {
                  calendarId: calId,
                  timeMin: today,
                  timeMax: future,
                  orderBy: "startTime",
                  singleEvents: true,
                }, (err, res) => {
                  if (err) {
                    reject(err)
                  }
                  else {
                    resolve(res)
                  }
                }
              );
            })
            if (res.status === 200) {
              allFutureEvents[`${sensorName}`] = [];
              console.log(res.data.items.length  + ' entries found in google calendar');
              res.data.items.forEach((element) => {
                console.log('Fetching google calendar entry ' + element.id);
                let calendarItem = {};
                calendarItem.summary = element.summary;
                if (element.location) {
                  calendarItem.location = element.location.replace(/\\/g, "");
                }
                if (element.description) {
                  calendarItem.label = element.description;
                }
                if (element.start.dateTime) {
                  calendarItem.startDate = DateTime.fromISO(element.start.dateTime).toLocaleString(DateTime.DATETIME_SHORT);
                  calendarItem.startDateISO = DateTime.fromISO(element.start.dateTime);
                  calendarItem.year = parseInt(calendarItem.startDateISO.toFormat("y"));
                  calendarItem.yearShort = parseInt(calendarItem.startDateISO.toFormat("yy"));
                  calendarItem.startMonth = calendarItem.startDateISO.toFormat("LLL");
                  calendarItem.startMonthDigits = parseInt(calendarItem.startDateISO.toFormat("LL"));
                  calendarItem.startDay = parseInt(calendarItem.startDateISO.toFormat("dd"));
                  calendarItem.startTime = calendarItem.startDateISO.toFormat("HH:mm");
                }
                if (element.end.dateTime) {
                  calendarItem.endDate = DateTime.fromISO(element.end.dateTime).setLocale(Settings.defaultLocale).toLocaleString(DateTime.DATETIME_SHORT);
                  calendarItem.endDateISO = DateTime.fromISO(element.end.dateTime);
                  calendarItem.endMonth = calendarItem.endDateISO.toFormat("LLL");
                  calendarItem.endMonthDigits = parseInt(calendarItem.endDateISO.toFormat("LL"));
                  calendarItem.endDay = parseInt(calendarItem.endDateISO.toFormat("dd"));
                  calendarItem.endTime = calendarItem.endDateISO.toFormat("HH:mm");
                }
                if (element.start.date) {
                  calendarItem.startDate = DateTime.fromISO(element.start.date).toLocaleString();
                  calendarItem.startDateISO = DateTime.fromISO(element.start.date);
                  calendarItem.year = parseInt(calendarItem.startDateISO.toFormat("y"));
                  calendarItem.yearShort = parseInt(calendarItem.startDateISO.toFormat("yy"));
                  calendarItem.startMonth = calendarItem.startDateISO.toFormat("LLL");
                  calendarItem.startMonthDigits = parseInt(calendarItem.startDateISO.toFormat("LL"));
                  calendarItem.startDay = parseInt(calendarItem.startDateISO.toFormat("dd"));
                  calendarItem.startTime = null;
                  calendarItem.wholeDay = true;
                }
                if (element.end.date) {
                  calendarItem.endDate = DateTime.fromISO(element.end.date).toLocaleString();
                  calendarItem.endDateISO = DateTime.fromISO(element.end.date);
                  calendarItem.endMonth = calendarItem.endDateISO.toFormat("LLL");
                  calendarItem.endMonthDigits = parseInt(calendarItem.endDateISO.toFormat("LL"));
                  calendarItem.endDay = parseInt(calendarItem.endDateISO.toFormat("dd"));
                  calendarItem.endTime = null;
                }
                if (element.recurringEventId) {
                  calendarItem.recurring = true;
                }
                allFutureEvents[`${sensorName}`].push(calendarItem);
              });
            }
          }
          catch (error){
            console.log("There was an error loading the gcal data: " + err);
          }          
        } //END of GOOGLE fetch block
      } //END of for loop
      resolve(true);
    } //END of try block
    catch(error) {
      console.error("Error in getEvents:", error);
      reject(error);
    }
  }) //END of promise
} //END of getEvents function


//////////////////////////////////////////////
// Functions to post data to Home Assistant //
//////////////////////////////////////////////
async function postEvents(sensorName) {
  let fileContent = await fs.promises.readFile('/data/allFutureEvents.json', 'utf-8');
  let events = JSON.parse(fileContent);
  let numberOfEvents = events[`${sensorName}`].length;
  try {
    const response = await axios.post(
        "http://supervisor/core/api/states/sensor." + sensorName,
        { state: numberOfEvents, attributes: { data: events[`${sensorName}`] } },
        postReqOptions
      )
      console.log("Events posted for " + sensorName + " to sensor at: " + new Date());
  }
  catch (error) {
    console.log("postEvents error with: " + error);
  }
}

async function postEventsAllCalendars() {
  calendarsProcessed = 0;
  for (let k = 0; k < options.calendarList.length; k++) {
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

async function initalFetch() {
  if (testOptions === true) {
    fs.access("/data/allFutureEvents.json", fs.constants.F_OK, (err) => {
      if (err) {
        console.log("No previously stored events found");
        return;
      }
      if (!err) {
        let events = JSON.parse(fs.readFileSync("/data/allFutureEvents.json", "utf-8"));
        if (events !== undefined) {
          console.log("Previously stored events found");
          postEventsAllCalendars();
       }
      }
    })
  }
  if (testOptions === false) {
    console.log("Addon config has changed.");
    try {
      let allEvents = await getEvents();
      if (allEvents == true) {
        let fileWritten = await writeEventsFile(allFutureEvents);
        console.log("Events written to file: " + fileWritten + ". At: " + new Date());
        postEventsAllCalendars();
      }
    }
    catch (error) {
        console.log("Error posting events to sensor(s) at: " + new Date());
        console.log(error);
      };
  };
}
initalFetch();

//////////
// CRON //
//////////
cron.schedule(fetchCRON, async () => {
  try {
    let allEvents = await getEvents();
    console.log("Calendar(s) queried at: " + new Date());
    let fileWritten = await writeEventsFile(allFutureEvents);
    console.log("Events written to file: " + fileWritten + ". At: " + new Date());
    postEventsAllCalendars();
  }
  catch (error) {
      console.log("Error posting events to sensor(s) at: " + new Date());
      console.log(error);
    };
});
