# Installation

1. Click this button: [![Open your Home Assistant instance and show the add add-on repository dialog with a specific repository URL pre-filled.](https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg)](https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https://github.com/kdw2060/hassio-addons) to add my add-on repository to your Home Assistant add-on store. If that doesn´t work then add _https://github.com/kdw2060/hassio-addons_  manually as a repository in the HA add-on store.
3. Now choose the check for updates option in the 3-dot menu in the add-on store.
4. The repository and the add-ons it contains should now apppear. If not, try to restart Home Assistant and check again.
5. Find the 'HASS Calendar' add-on and install it.

# Configuration

Configuration consists of the following parameters:

```
fetchDays: 365
fetchDaysPast: -7
fetchCRON: '*/30 * * * *'
locale: nl-BE
timeZone: Europe/Brussels
calendarList:
  - calName: someName
    calType: one of caldav|google
    username: username
    password: password
    caldavUrl: https://yourcaldavserver.domain/somePath/calendarName/
    calId: googleCalendarId
    googleServiceAccountKeyfile: filename.json
  - calName: another calendarName
    ...

```

| Name  | Type   | Required? | Value  |
| :---- | :----- | :-------- | :----- |
| fetchDays | integer | **always**| number of days from today to fetch events for in the calendar(s) | 
| fetchDaysPast | integer (negative) | optional| number of days counting back from today to also fetch events for in the calendar(s), Defaults to zero, **enter a negative number** if you're gonna use this option| 
| fetchCRON | string | **always** | CRON-pattern that determines when/how often the calendar data should be fetched. [Help for generating a pattern](https://crontab.guru/)|     
| locale   | string | **always**  | a locale to get date/time presentation and translation right. Locales must be supported by [Luxon](https://moment.github.io/luxon/#/intl?id=how-locales-work) |
| timeZone | string | optional   | will default to system timeZone. If you want to override, then enter a timezone like [Luxon expects it](https://moment.github.io/luxon/#/zones?id=specifying-a-zone). I suggest you enter a IANA timezone string. |
| calName  | string | **always**    | any name you prefer, this will also become the sensor-name|
| calType  | string | **always**    | set to either `caldav` or `google` |
| username | string | **if caldav** | the username you login with for your caldav-provider|
| password | string | **if caldav** | the password you login with for your caldav-provider |
| caldavUrl | string | **if caldav** | the https address for your caldav-calendar.<br> **make sure to include the slash at the end**     E.g. 'https://caldav.gmx.net/begenda/dav/your-email-adress/calendar/' <br> |
| calId | string | **if google** | the google calendar ID [more info](https://docs.simplecalendar.io/find-google-calendar-id/) |
| googleServiceAccountKeyfile | string | **if google** | filename of your google service-account credentials (more info about this below) |

You can add as many calendars as you wish by repeating the calendarList parameters.

## Caldav

I tested against my own e-mail/caldav provider (GMX) and a set of test ICS files. If you hit an issue with your caldav provider or selfhosted server check out the closed issues first and feel free to open a new issue if that doesn't help, best to include an example ICS file as delivered by your provider and/or example caldav requests.

### Apple icloud caldav

To obtain the caldavUrl for your icloud calendar, follow the explanation in [the highest voted answer on this forum](https://askubuntu.com/questions/911567/how-to-sync-icloud-calendar). Your url should look like https://**\*\*\***.icloud.com/{dsid}/calendars/{calendarName}/ (Don’t forget to include the trailing forward slash). 

Also make sure to generate an app-specific password like explained there and use this as the password you set in the add-on config.

Apple is not making it easy to obtain this info, you're strongly advised to also take a look at the solution in [this closed issue](https://github.com/kdw2060/hassio-addons/issues/10#issuecomment-1300317085) if you're having trouble to get things working for your icloud calendar.

## Google Calendar

Because it was easier to implement for me I chose to use the google service account route for authentication and not oAuth (where you get a login pop-up from Google). However, this requires a bit of work on your side:

1. Creating a service account:
   I suggest you follow [this guide](https://www.webdavsystem.com/server/gsuite/service-account/) that explains how to do this in a more accessible way than [the official google documentation](https://cloud.google.com/iam/docs/creating-managing-service-accounts).

2. Enable the google calendar api:
   The guide finishes by telling you how to enable the google drive api, that however is not what is needed here, **make sure to enable the google calendar api instead!**

3. Download service account credentials and store in the addon's config folder:
   The guide also describes how to obtain the json file with your service account credentials. You need to place that file in the `addon_configs/hass_calendar_addon` folder of your Home Assistant installation. This add-on expects that to be the location. You can get easy access to this folder with the samba add-on. The filename is to be provided as a configuration parameter.

4. Give the service account access to your specific calendar:
   Finally you need to add the auto-generated e-mail adress of your service account in the google calendar settings under the list of people the calendar is shared with. Repeat this step for all google calendars you want to add in the calendarList.



# First run and data persistence
If you run the add-on for the very first time it will try to fetch the data for all your calendards immediately. It will do so too when the add-on config has been changed.

Depending on the CRON-schedule you configured the data will be refreshed. I advise not to overload the google or caldav api's. I choose to only query them every 30 or 60 minutes. You can see in the addon logs when a query has run and when the data is posted to the sensor(s).

The queried data is saved to a file in persistent storage and this is used upon restarts of the add-on, so after a system restart you should immediately see the calendar sensor.
