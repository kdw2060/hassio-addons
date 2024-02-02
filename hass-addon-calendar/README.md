# HASS Calendar Addon

This add-on can be used to load caldav and google calendar data and makes your calendar events available as sensordata in Home Assistant.

There's one sensor per calendar, the sensor state equals the number of events in your calendar and the data attribute of the sensor contains the events information.

Example:

```
entity: sensor.my-calendar
state: 2
data:
  - startDate: '08-01-2022 21:00'
    startDateISO: '2022-01-08T20:00:00.000Z'
    endDate: '09-01-2022 00:30' 
    endDateISO: '2022-01-08T23:30:00.000Z'
    summary: Event example one
    location: Some street, Some place
    label: 🎉 party-time
    year: 2022
    yearShort: 22
    startMonth: jan
    startMonthDigits: 01
    startDay: 8
    startTime: '21:00'
    endMonth: jan
    endMonthDigits: 01
    endDay: 9
    endTime: '00:30'
    wholeDay: false
    recurring: false
  - startDate: '14-01-2022 18:30'
    startDateISO: '2022-01-14T17:30:00.000Z'
    endDate: '14-01-2022 21:30'
    endDateISO: '2022-01-14T20:30:00.000Z'
    summary: Event example 2
    description: This is a longer text describing the event.
    year: 2022
    yearShort: 22
    startMonth: jan
    startMonthDigits: 01
    startDay: 14
    startTime: '18:30'
    endMonth: jan
    endMonthDigits: 01
    endDay: 14
    endTime: '21:30'
    wholeDay: false
    recurring: 'weekly'
    nextOccurences: []
    originalStartDate: '2022-01-01T17:30:00.000Z'
```

You can then do anything you want with the data and have a lot more versatility than with the standard binary sensor that Home Assistant's standard calendar integration provides. E.g. use the sensor to display the calendar data anywhere you want by using Home Assistant's [templating syntax](https://www.home-assistant.io/docs/configuration/templating/).

For instance `{{state_attr("sensor.my-calendar", "data")[0].summary}}` will render the summary of the first event in the list inside the data-attribute. 

If you want inspiration have a look at the [cards](https://github.com/kdw2060/hassio-addons/tree/master/hass-addon-calendar/card-examples) I built with the data.

Another common use would off course be to use the data in automation scripts.

As you can see the start- and end-dates of the events are also available in split up form to make it easier to work with the data.

### Some more info about recurring and whole day events
For caldav calendars the `recurring` field will return *false* or one of *yearly | monthly | weekly | daily*. The `nextOccurences` field will contain an array of future dates (as date objects) within the fetched period. There will only be one calendar entry for the event, with the firstcoming startDate. An extra field `originalStartDate` will also be present with the initial date of the first ever occurence of the event.

For google calendars the `recurring` field will simply return *true* or *false* and no `nextOccurences` field will be present. The google api should however return seperate events for all next occurences within the fetched period.

Wholeday events are labeled as such with the `wholeDay` field returning *true*. All endDate information is then stripped from the calendar entry. It may still appear accidentally if the data was formatted unexpectedly.

### Installation
**For installation and configuration information see the DOCS.md file (on github) or click the docs tab (when reading this in Home Assistant's add-on store.)**

### Roadmap
- [x] ~~Fix async fetching issue on first fetch run~~
- [x] ~~Add handling of multiday events that don't have a specic start/end time~~
- [x] ~~Caldav: better support for recurring events~~
- [x] ~~Better detection of changed configuration~~
- [ ] Maybe add support for todo's
- [ ] Maybe add support for public calendars

---

_logo attribution: [Noun Project 4485373 by Riyan Resdian]( https://thenounproject.com/icon/calendar-4485373/)_
