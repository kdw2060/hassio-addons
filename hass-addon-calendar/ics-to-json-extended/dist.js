"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _moment = _interopRequireDefault(require("moment"));

var _keyMap;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var NEW_LINE = /\r\n|\n|\r/;
var DATEFORMAT = 'YYYYMMDD[T]HHmmss';
var EVENT = "VEVENT";
var EVENT_START = "BEGIN";
var EVENT_END = "END";
var START_DATE = "DTSTART";
var END_DATE = "DTEND";
var DESCRIPTION = "DESCRIPTION";
var SUMMARY = "SUMMARY";
var LOCATION = "LOCATION";
var ALARM = "VALARM";
var RULE = "RRULE";
var CATEGORIES = "CATEGORIES";
var keyMap = (_keyMap = {}, _defineProperty(_keyMap, START_DATE, "startDate"), _defineProperty(_keyMap, END_DATE, "endDate"), _defineProperty(_keyMap, DESCRIPTION, "description"), _defineProperty(_keyMap, SUMMARY, "summary"), _defineProperty(_keyMap, LOCATION, "location"), _defineProperty(_keyMap, CATEGORIES, "label"), _keyMap);
var frequencyMap = {
  DAILY: 1,
  WEEKLY: 7,
  MONTHLY: 30
};

var clean = function clean(string) {
  return unescape(string).trim();
};

var addScheduledEvent = function addScheduledEvent(currentEvent, val) {
  var conditions = val.split(';').reduce(function (acc, cur) {
    var _cur$split = cur.split('='),
        _cur$split2 = _slicedToArray(_cur$split, 2),
        k = _cur$split2[0],
        v = _cur$split2[1];

    acc[k] = v;
    return acc;
  }, {});
  var FREQ = conditions.FREQ,
      UNTIL = conditions.UNTIL,
      INTERVAL = conditions.INTERVAL;
  if (!UNTIL) return [];
  var freq = frequencyMap[FREQ];
  var until = (0, _moment.default)(UNTIL, DATEFORMAT);
  var interval = parseInt(INTERVAL, 10);
  var originalStartDate = (0, _moment.default)(currentEvent.startDate, DATEFORMAT);
  var originalEndDate = (0, _moment.default)(currentEvent.endDate, DATEFORMAT);

  if (!originalStartDate.isBefore(until)) {
    return [];
  }

  var currentStartDate = originalStartDate.clone();
  var currentEndDate = originalEndDate.clone();
  var i = 0;
  var dateToAddSchedule = [];

  while (currentStartDate.isBefore(until)) {
    if (i % interval === 0) {
      dateToAddSchedule.push({
        startDate: currentStartDate.clone().format(DATEFORMAT),
        endDate: currentEndDate.clone().format(DATEFORMAT)
      });
    }

    currentStartDate = currentStartDate.clone().add(freq, 'days');
    currentEndDate = currentEndDate.clone().add(freq, 'days');
    i++;
  }

  var schedules = dateToAddSchedule.reduce(function (acc, cur) {
    acc.push(_objectSpread({}, currentEvent, {
      startDate: cur.startDate,
      endDate: cur.endDate
    }));
    return acc;
  }, []);
  return schedules;
};

var icsToJson = function icsToJson(icsData) {
  var array = [];
  var currentObj = {};
  var lastKey = "";
  var lines = icsData.split(NEW_LINE);
  var isAlarm = false;
  var hasRule = false;
  var ruleValue = '';

  for (var i = 0, iLen = lines.length; i < iLen; ++i) {
    var line = lines[i];
    var lineData = line.split(":");
    var key = lineData[0];
    var value = lineData[1];
    //fix for GMX
    if (key.includes("DTSTART") && key.includes("DTSTART;") == false) {
      key = "";
      //console.log(key);
    }
    if (key.indexOf(";") !== -1) {
      var keyParts = key.split(";");
      key = keyParts[0]; // Maybe do something with that second part later
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

        if (value === EVENT) {
          if (hasRule) {
            addScheduledEvent(currentObj, ruleValue).forEach(function (sche) {
              return array.push(sche);
            });
            hasRule = false;
          } else {
            array.push(currentObj);
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
      
      case CATEGORIES:
        currentObj[keyMap[CATEGORIES]] = clean(value);
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

var _default = icsToJson;
exports.default = _default;
