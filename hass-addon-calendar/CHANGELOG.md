# Changelog

## 0.400 | 2024-02-02

🚧 BREAKING CHANGES
- **Google calendar:** I followed Home Assistant's new guidelines for addons and moved the location of the Google Service Account keyfile to the new addon_config folder that is the new proper place for files required by an addon. This means existing users will need to move their keyfile from the `share` folder to `addon_configs/hass_calendar_addon` (more info in DOCS).
- **Baikal jcal support deprecated!** If you use this add-on with a Baikal calendar, you can no longer use the 'baikal' type in the config. This option relied on the Baikal jcal plugin to provide data. I have no instance to test against and keep everything working when I introduce new features, so decided to deprecate this option. You can still use the ordinary 'caldav' type to process Baikal calendars. 

🎁 NEW
- Caldav: extra datafields for certain events as requested by some users:
    * yearly recurring events will have an `originalStartYear` field now too
    * full day events (without start or end time) that span multiple days will have a `multiDay = true` field and the endDate fields will contain data as well 

🐛 BUGFIXES
- Async logic fixed, the first fetch run should no longer log an error when posting events to the sensor.
- Should not crash anymore on missing previous events file.



## 0.302 | 2023-06-17

Improved parsing of Outlook 365 ICS files when these contain objects in stead of plain strings for values like the event summary. (contributed by @mika255)

## 0.301 | 2022-11-19

Bugfix for sorting of caldav calendar events.

## 0.300 | 2022-11-15

🎁 NEW
- Now with proper recurring events support for caldav calendars (limited to yearly, monthly, weekly, daily recurring). Check out the docs for more details.
- Added option to fetch calendar items from the past as well.
- Start- and end-dates are presented in localised format as standard. An extra field with the unlocalized ISO-date is also available.

🐛 BUGFIXES
- There should hopefully be no more errors in the date/time offset as the add-on uses new libraries for parsing the ical-data and for formatting dates. I also did some extra testing with sample data and had no more issues myself. If a faulty date/time still appears for you, then open a Github issue and provide a sample ICS file.

🚧 BREAKING CHANGES
- I renamed some of the data fields, they all use camelCase now. You might have to rename them in your YAML code too if you use these fields. The new standard formatting for start- and end-dates might also impact your existing implementation.
- **Baikal support untested!** If you use this add-on with a Baikal calendar and use the 'baikal' type in stead of 'caldav' in the add-on options, then **I'd advise you don't update the add-on immediately and first test out this new version by installing it locally.** Also non of the new features have been applied to the baikal option. If someone wants to volunteer to debug and develop the Baikal part of the add-on feel free to reach out on Github.
