# Installation

1. In Home Assistant go to Settings > Add-ons > Add-on store
2. Click the 3-dot menu icon > choose _Repositories_ > paste _https://github.com/kdw2060/hassio-addons_ in the pop up then click ADD.
3. Now choose the reload option in the 3-dot menu.
4. The repository and the add-ons it contains should now apppear in the store.
5. Find the 'HASS Calendar' add-on and install it.


# Configuration
Configuration consists of the following parameters:

```
calendarList:
  - calName: someName
    calType: one of caldav|google
    locale: nl-be
    username: username
    password: password
    caldavUrl: https://yourcaldavserver.domain/calendar/
    calId: googleCalendarId
    googleServiceAccountKeyfile: filename.json
  - calName: another calendarName
    ...

``` 

| Name | Type | Required? | Value |
| :--- | :--- | :-------- | :---- |
| calName | string | **always** | any name you prefer, this will also become the sensor-name |
| calType | string | **always** | set to either `caldav` or `google` |
| locale | string | **always** | a locale to get date/time presentation and translation right. Check out the [Locale Support section near the bottom of the MomentJS homepage](https://momentjs.com/). Pick one and use the locale string (the 2 or 4 letter-codes) you can see in the demo frame. |
| username | string | **if caldav** | the username you login with for your caldav-provider |
| password | string | **if caldav** | the password you login with for your caldav-provider |
| caldavUrl | string | **if caldav** | the https address for your caldav-provider. E.g. 'https://caldav.gmx.net/begenda/dav/your-email-adress/calendar/' |
| calId | string | **if google** | the google calendar ID [more info](https://docs.simplecalendar.io/find-google-calendar-id/) |
| googleServiceAccountKeyfile | string | **if google** | filename of your google service-account credentials (more info about this below) |


You can add as many calendars as you wish by repeating the parameters.

## Caldav
I programmed it so that all events from today until the next year are queried and loaded into the sensor.

I only tested against my own e-mail/caldav provider (GMX), it should probably work for other caldav-providers as well, but without testing I'm not sure of that.

## Google Calendar
Just as for the Caldav calendars events from today until the next year are queried.

Because it was easier to implement for me I chose to use the google service account route for authentication and not oAuth (where you get a login pop-up from Google). However, this requires a bit of work on your side:

1. Creating a service account
I suggest you follow [this guide](https://www.webdavsystem.com/server/gsuite/service-account/) that explains how to do this in a more accessible way than [the official google documentation](https://cloud.google.com/iam/docs/creating-managing-service-accounts). 

2. Enable the google calendar api
The guide finishes by telling you how to enable the google drive api, that however is not what is needed here, **make sure to enable the google calendar api instead!**

3. Download service account credentials and store in HA share folder
The guide also describes how to obtain the json file with your service account credentials. You need to place that file in the `/share` folder of your Home Assistant installation. This add-on expects that to be the location. The filename is to be provided as a configuration parameter.

4. Give the service account access to your specific calendar
Finally you need to add the auto-generated e-mail adress of your service account in the google calendar settings under the list of people the calendar is shared with. Repeat this step for all google calendars you want to add in the calendarList.

# First run and data persistence
If you run the add-on for the first time you need to give it some time. I don´t want to overload the google or caldav api's and only query them every 30 minutes. You can see in the addon logs when a query has run and when the data is posted to the sensor(s).

The queried data is saved to a file in persistent storage and this is used upon restarts of the add-on, so after a restart you shouldn't need to wait normally.
