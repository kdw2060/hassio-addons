# Changelog

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
