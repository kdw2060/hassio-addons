# API Consumer

This add-on provides a reusable template that can be used to consume any (web-)api with a custom Node.js script and post the data this api provides to the Home Assistant state machine using the internal Home Assistant api. 

### Why use this
It's useful when you're trying to achieve something that hits the limits of the Home Assistant built in [rest sensor](https://www.home-assistant.io/integrations/rest/) platform or when an existing component/integration is not providing you all the data that you would like even though the underlying service is able to provide it. 

Essentialy the pattern used here is another way to write a custom component. I made it because I'm more comfortable writing Javascript than Python and because I came to the conclusion that it's better to stuff data in the state machine than making custom cards. 



---

## Installation

1. In Home Assistant go to Supervisor > Add-on store
2. Click the 3-dot menu icon > choose _Repositories_ > paste _https://github.com/kdw2060/hassio-addons_ in the pop up then click ADD.
3. Now choose the reload option in the 3-dot menu
4. The repository and the add-ons it contains should now apppear in the store.
5. Find the 'API Consumer' add-on and install it


## Configuration
The add-on will create a _consumers_ folder inside the /share folder of your HA instance and my example consumers will be copied there. **When you create consumers yourself, you should also place them in this folder.**

On the Configuration tab just enter the filenames (minus the .js) of the consumerJS files you've written and uploaded to the /share/consumers folder. One of my example consumers is set as the standard config.

Upon saving and restarting the add-on will load the files and your new sensor will be running in the background, hooray.

![afbeelding](https://github.com/kdw2060/hassio-addons/raw/master/hassio-addon-api-consumer/config-api-consumer.png)


## Example consumers and making your own consumer
Most of the actual configuration is consumer-specific and done inside the respective `consumerName.js` files. Have a look at the irail and Grocy consumers that are included. If you're already familiar with Node.js and http requests it should speak for itself.

These Node packages are automatically installed with this add-on: 
- Axios (to handle the http requests)
- Node-cron (to schedule the sensor updates)
- Moment (because handling dates is going to be very likely, even though the included example consumers don't use it)

If you need extra libraries/packages, you'll either have to fork this add-on or install it locally, so you can alter the dependencies in `package.json`. Or you could copy those over to the /share/consumers folder too and refer to that path when you require them in your `consumerName.js` file.


I've written pretty extensive comments inside the included `example-grocyConsumer.js` file that should hopefully help people with basic javascript skills and the willingness to learn more themselves to get going and start experimenting too. Just copy one of the demo consumer files and alter as needed. If you want to learn more about Node.js, these are some good tutorials:
https://www.tutorialkart.com/nodejs/nodejs-tutorial/ 
https://flaviocopes.com/tags/node/

I suggest you test your consumer locally on your pc before uploading it, just put in a lot of `console.log` statements that display the data you're working with and run the file with `node consumerName.js` in your terminal.


---
_logo attribution: [Noun Project 2086401 by Ahmad ID]( https://thenounproject.com/term/api/2086401/)_
