# API Consumer

This addon provides a reusable template that can be used to consume several api's and post the data they provide to the Home Assistant state machine using the internal HA api.



### Why use this
It's useful when you're trying to achieve something that hits the limits of the Home Assistant built in rest sensor platform. Essentialy it's another way to write a custom component. I made it because I'm more comfortable writing Javascript than Python.

If you like to write Javascript too (it uses Node.js internally), this add-on is for you.

---

## Installation


## Configuration
The add-on itself requires little configuration.
Just enter the filenames (minus the .js) of the consumerJS files you've written and uploaded to the addon folder in the provided config field.

Most of the actual configuration is consumer-specific and done inside the respective ```*consumer.js``` files. If you're already familiar with Node.js and http requests it should speak for itself.


But I've also written extensive comments in the included ```grocyConsumer.js``` that should hopefully help people with basic javascript skills and the willingness to learn more themselves to get going and start experimenting.


---
_logo attribution: [Noun Project 2086401 by Ahmad ID]( https://thenounproject.com/term/api/2086401/)_
