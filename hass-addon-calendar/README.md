# HASS Calendar Addon

This add-on can be used to load caldav and google calendar data and makes future calendar events available as sensordata in Home Assistant.

There's one sensor per calendar, the sensor state equals the number of future events in your calendar and the data attribute of the sensor contains the events information.

Example:

```
entity: sensor.my-calendar
state: 2
data:
  - startDate: '2022-01-08T20:00:00.000Z'
    endDate: '2022-01-08T23:30:00.000Z'
    summary: Event example one
    location: Some street, Some place
    label: 🎉 party-time
    year: '22'
    start_month: jan
    start_day: 8
    start_time: '21:00'
    end_month: jan
    end_day: 9
    end_time: '00:30'
  - startDate: '2022-01-14T17:30:00.000Z'
    endDate: '2022-01-14T20:30:00.000Z'
    summary: Event example 2
    location: My house
    year: '22'
    start_month: jan
    start_day: 14
    start_time: '18:30'
    end_month: jan
    end_day: 14
    end_time: '21:30'
    recurring: true
```

You can then do anything you want with the data and have a lot more versatility than with the standard binary sensor that Home Assistant's standard calendar integration provides. E.g. use the sensor to display the calendar data anywhere you want by using Home Assistant's [templating syntax](https://www.home-assistant.io/docs/configuration/templating/).

For instance `{{state_attr("sensor.my-calendar", "data")[0].summary}}` will render the summary of the first event in the list inside the data-attribute. 

If you want inspiration have a look at the [cards](/card-examples) I built with the data.

Another common use would off course be to use the data in automation scripts.

As you can see the start- and end-dates of the events are also available in split up form to make it easier to work with the data.

For installation and configuration information see the DOCS.md file (on github) or click the docs tab (when reading this in Home Assistant.)

### To Do's
- [ ] Caldav: better support for recurring events (now only yearly recurring will be correct)
- [ ] Better detection of changed configuration

---

_logo attribution: [Noun Project 4485373 by Riyan Resdian]( https://thenounproject.com/icon/calendar-4485373/)_
