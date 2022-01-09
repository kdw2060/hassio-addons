import moment from "moment";

const NEW_LINE = /\r\n|\n|\r/;
const DATEFORMAT = 'YYYYMMDD[T]HHmmss'

const EVENT = "VEVENT";
const EVENT_START = "BEGIN";
const EVENT_END = "END";
const START_DATE = "DTSTART";
const END_DATE = "DTEND";
const DESCRIPTION = "DESCRIPTION";
const SUMMARY = "SUMMARY";
const LOCATION = "LOCATION";
const ALARM = "VALARM";
const RULE = "RRULE";

const keyMap = {
  [START_DATE]: "startDate",
  [END_DATE]: "endDate",
  [DESCRIPTION]: "description",
  [SUMMARY]: "summary",
  [LOCATION]: "location"
};

const frequencyMap = {
  DAILY: 1,
  WEEKLY: 7,
  MONTHLY: 30,
}

const clean = string => unescape(string).trim();

const addScheduledEvent = (currentEvent, val) => {
  const conditions = val.split(';').reduce((acc, cur) => {
    const [k,v] = cur.split('=')
    acc[k] = v
    return acc
  }, {});

  const { FREQ, UNTIL, INTERVAL } = conditions
  if(!UNTIL)return [];
  
  const freq = frequencyMap[FREQ];
  const until = moment(UNTIL, DATEFORMAT);
  const endDate = moment(until).clone().add(1, 'days');
  const interval = parseInt(INTERVAL, 10);
  const originalStartDate = moment(currentEvent.startDate, DATEFORMAT);
  const originalEndDate = moment(currentEvent.endDate, DATEFORMAT);

  if(!originalStartDate.isBefore(until)){
    return [];
  }

  let currentStartDate = originalStartDate.clone()
  let currentEndDate = originalEndDate.clone()
  let i = 0;
  const dateToAddSchedule = []
  while(currentStartDate.isBefore(endDate, 'day')){
    if(i % interval === 0){
      dateToAddSchedule.push({
        startDate: currentStartDate.clone().format(DATEFORMAT), 
        endDate: currentEndDate.clone().format(DATEFORMAT), 
      })
    }
    currentStartDate = currentStartDate.clone().add(freq, 'days')
    currentEndDate = currentEndDate.clone().add(freq, 'days')
    i++
  }

  const schedules = dateToAddSchedule.reduce((acc, cur) => {
    acc.push({
      ...currentEvent,
      startDate: cur.startDate,
      endDate: cur.endDate,
    })
    return acc
  }, [])
  return schedules
}


const icsToJson = icsData => {
  const array = [];
  let currentObj = {};
  let lastKey = "";

  const lines = icsData.split(NEW_LINE);

  let isAlarm = false;
  let hasRule = false;
  let ruleValue = '';
  for (let i = 0, iLen = lines.length; i < iLen; ++i) {
    const line = lines[i];
    const lineData = line.split(":");

    let key = lineData[0];
    const value = lineData[1];

    if (key.indexOf(";") !== -1) {
      const keyParts = key.split(";");
      key = keyParts[0];
      // Maybe do something with that second part later
    }

    if (lineData.length < 2) {
      if (key.startsWith(" ") && lastKey !== undefined && lastKey.length) {
        currentObj[lastKey] += clean(line.substr(1));
      }
      continue;
    } else {
      lastKey = keyMap[key];
    }

    switch (key) {
      case EVENT_START:
        if (value === EVENT) {
          currentObj = {};
        } else if (value === ALARM) {
          isAlarm = true;
        }
        break;
      case EVENT_END:
        isAlarm = false;
        if(value === EVENT){
          if(hasRule){
            addScheduledEvent(currentObj, ruleValue).forEach(sche => array.push(sche))
            hasRule = false;
          } else {
            array.push(currentObj)
          }
        }
        break;
      case START_DATE:
        currentObj[keyMap[START_DATE]] = value;
        break;
      case END_DATE:
        currentObj[keyMap[END_DATE]] = value;
        break;
      case DESCRIPTION:
        if (!isAlarm) currentObj[keyMap[DESCRIPTION]] = clean(value);
        break;
      case SUMMARY:
        currentObj[keyMap[SUMMARY]] = clean(value);
        break;
      case LOCATION:
        currentObj[keyMap[LOCATION]] = clean(value);
        break;
      case RULE:
        hasRule = true;
        ruleValue = clean(value);
      default:
        continue;
    }
  }
  return array;
};

export default icsToJson;
