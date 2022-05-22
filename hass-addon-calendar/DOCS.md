# Installation

1. In Home Assistant go to Settings > Add-ons > Add-on store
2. Click the 3-dot menu icon > choose _Repositories_ > paste _https://github.com/kdw2060/hassio-addons_ in the pop up then click ADD.
3. Now choose the reload option in the 3-dot menu.
4. The repository and the add-ons it contains should now apppear in the store.
5. Find the 'HASS Calendar' add-on and install it.

# Configuration

Configuration consists of the following parameters:

```
fetchDays: 365
fetchCRON: '*/30 * * * *'
locale: nl-be
calendarList:
  - calName: someName
    calType: one of caldav|google|baikal
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
| fetchCRON | string | **always** | CRON-pattern that determines when/how often the calendar data should be fetched. [Help for generating a pattern](https://crontab.guru/)|     
| locale   | string | **always**    | a locale to get date/time presentation and translation right. Check out the [Locale Support section near the bottom of the MomentJS homepage](https://momentjs.com/). Pick one and use the locale string (the 2 or 4 letter-codes) you can see in the demo frame. |
| calName  | string | **always**    | any name you prefer, this will also become the sensor-name|
| calType  | string | **always**    | set to either `caldav`, `baikal` or `google` |
| username | string | **if caldav or baikal** | the username you login with for your caldav-provider|
| password | string | **if caldav or baikal** | the password you login with for your caldav-provider |
| caldavUrl | string | **if caldav or baikal** | the https address for your caldav-calendar.<br> - if caldav: **make sure to include the slash at the end**     E.g. 'https://caldav.gmx.net/begenda/dav/your-email-adress/calendar/' <br> - if baikal: **make sure to NOT include the slash at the end**     E.g. 'https://cal.myserver.net/dav.php/calendars/user/calendarname'|
| calId | string | **if google** | the google calendar ID [more info](https://docs.simplecalendar.io/find-google-calendar-id/) |
| googleServiceAccountKeyfile | string | **if google** | filename of your google service-account credentials (more info about this below) |

You can add as many calendars as you wish by repeating the calendarList parameters.

## Caldav

I only tested against my own e-mail/caldav provider (GMX). If you hit an issue with your caldav provider or selfhosted server check out the closed issues or feel free to open a new issue. Other users might be able to help you.

### Apple icloud caldav

To obtain the caldavUrl for your icloud calendar, follow the explanation in [the highest voted answer on this forum](https://askubuntu.com/questions/911567/how-to-sync-icloud-calendar). Your url should look like https://**\*\*\***.icloud.com/{dsid}/calendars/{calendarName}/ (Don’t forget to include the trailing forward slash). If you have trouble finding the right url, take a look at the solution in [this closed issue](https://github.com/kdw2060/hassio-addons/issues/10).

Also make sure to generate an app-specific password like explained there and use this as the password you set in the add-on config.

## Baikal

The add-on uses the jcal format querying the server. Make sure this plugin is installed in your Baikal instance. See [Baikal Plugin Info](https://sabre.io/dav/ics-export-plugin/) for more information.


## Google Calendar

Because it was easier to implement for me I chose to use the google service account route for authentication and not oAuth (where you get a login pop-up from Google). However, this requires a bit of work on your side:

1. Creating a service account:
   I suggest you follow [this guide](https://www.webdavsystem.com/server/gsuite/service-account/) that explains how to do this in a more accessible way than [the official google documentation](https://cloud.google.com/iam/docs/creating-managing-service-accounts).

2. Enable the google calendar api:
   The guide finishes by telling you how to enable the google drive api, that however is not what is needed here, **make sure to enable the google calendar api instead!**

3. Download service account credentials and store in HA share folder:
   The guide also describes how to obtain the json file with your service account credentials. You need to place that file in the `/share` folder of your Home Assistant installation. This add-on expects that to be the location. You can get easy access to this folder with the samba addon. The filename is to be provided as a configuration parameter.

4. Give the service account access to your specific calendar:
   Finally you need to add the auto-generated e-mail adress of your service account in the google calendar settings under the list of people the calendar is shared with. Repeat this step for all google calendars you want to add in the calendarList.

# First run and data persistence

If you run the add-on for the first time you need to give it some time, depending on the CRON-schedule you configured. I advise not to overload the google or caldav api's. I chose to only query them every 30 minutes. You can see in the addon logs when a query has run and when the data is posted to the sensor(s).

The queried data is saved to a file in persistent storage and this is used upon restarts of the add-on, so after a restart you shouldn't need to wait normally.
