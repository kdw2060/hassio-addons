# Grocy API wrapper

Because the Grocy API is pretty slow (at least when running the Grocy Hass.io addon on a Raspberry Pi), this wrapper caches the api data in json files.

Currently **only the Tasks and Chores** you have entered in Grocy are exposed through this api wrapper as that is the only data I need for my custom card that displays this info.


## Installation and configuration

1. First make sure you have installed Grocy. I use the [official add-on](https://github.com/hassio-addons/addon-grocy), but a standalone installation should work too.
Consult the Grocy-documentation to find out how to generate a api key.
2. Copy all project files to a folder in the *Addons* folder of Home Assistant
3. Navigate to Supervisor > Add-on store and click the refresh icon
4. The add-on shoud show up under 'Local add-ons', select and install
5. Set the configuration:
```
grocyApiUrl: *the ip-adress + port of your Grocy instance* e.g. 'http://192.168.1.5:9192' 
apiKey: *the api key you got from Grocy*
```
6. Save your configuration and restart the add-on

The add-on is up and running when the log shows that the json files have been written.

I made this add-on to feed my accompanying [Tasks & Chores custom lovelace card](https://github.com/kdw2060/hassio-custom-cards/tree/master/grocy-chores-tasks). If you wish to make your own card or otherwhise consume the wrapper api, this are the endpoints:

| GET | /refreshAll | reload data from Grocy
| GET | /loadTasks | exposes the json-file that contains the tasks
| GET | /loadChores | exposes the json-file that contains the chores
| GET | /loadUsers | exposes the json-file that contains the user names and user id's
| GET | /loadTaskCategories | exposes the json-file that contains the task categories
| GET | /loadChoreTrackInfo | exposes the json-file that contains extra chore information
| POST | /taskDone?id=x | mark a Task as done by providing its id
| POST | /trackChore?id=x%user=y| track a chore for a given user (adds execution timestamp)
