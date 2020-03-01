const fs = require("fs");
const express = require("express");
const app = express();
const request = require("request");
const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

const options = require("./options");
app.set("options", options);
const grocyApiUrl = options.grocyApiUrl;
const apiKey = options.apiKey;
let reqOptions = {
  url: "",
  headers: { "GROCY-API-KEY": apiKey }
};

//Fetch data and write to files
function getTasks() {
  reqOptions.url = grocyApiUrl + "/api/tasks";
  function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
      fs.writeFile("./json/tasks.json", JSON.stringify(body, null, 2), error => {
        if (error) console.error(error);
        console.log("file 1 written");
      });
    }
    if (error) console.log(error);
  }
  request(reqOptions, callback);
}
function getTaskCategories() {
  reqOptions.url = grocyApiUrl + "/api/objects/task_categories";
  function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
      fs.writeFile("./json/taskCategories.json", JSON.stringify(body, null, 2), error => {
        if (error) console.error(error);
        console.log("file 2 written");
      });
    }
    if (error) console.log(error);
  }
  request(reqOptions, callback);
}
function getChores() {
  reqOptions.url = grocyApiUrl + "/api/objects/chores";
  function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
      fs.writeFile("./json/chores.json", JSON.stringify(body, null, 2), error => {
        if (error) console.error(error);
        console.log("file 3 written");
      });
    }
    if (error) console.log(error);
  }
  request(reqOptions, callback);
}
function getChoreTrackInfo() {
  reqOptions.url = grocyApiUrl + "/api/chores";
  function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
      fs.writeFile("./json/choreTrackInfo.json", JSON.stringify(body, null, 2), error => {
        if (error) console.error(error);
        console.log("file 4 written");
      });
    }
    if (error) console.log(error);
  }
  request(reqOptions, callback);
}
function getUsers() {
  reqOptions.url = grocyApiUrl + "/api/users";
  function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
      fs.writeFile("./json/users.json", JSON.stringify(body, null, 2), error => {
        if (error) console.error(error);
        console.log("file 5 written");
      });
    }
    if (error) console.log(error);
  }
  request(reqOptions, callback);
}
//Actions
function markTaskDone(taskid) {
  reqOptions.url = grocyApiUrl + "/api/tasks/" + taskid + "/complete";
  let now = new Date();
  let body = '{"done_time": "' + now.toISOString() + '"}';
  reqOptions.body = body;
  reqOptions.json = true;
  function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log('task done action executed');
    }
    if (error) console.log(error);
  }
  request.post(reqOptions, callback);
}
function trackChore(choreid, userid) {
  reqOptions.url = grocyApiUrl + "/api/chores/" + choreid + "/execute";
  let now = new Date();
  let body = '{"tracked_time": "' + now.toISOString() + '", "done_by": ' + userid + "}";
  reqOptions.body = body;
  reqOptions.json = true;
  function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log('chore track action executed');
      return 'ok';
    }
    if (error) console.log(error);
  }
  request.post(reqOptions, callback);
}

//Routes
app.get("/refreshAll", function(req, res) {
  getUsers();
  getChores();
  getTasks();
  getTaskCategories();
  getChoreTrackInfo();
  res.type('html');
  res.status(200).send("<p>Data refreshed - json files written</p>");
});
app.get("/loadTasks", function(req, res) {
  fs.readFile("./json/tasks.json", "utf8", (err, data) => {
    if (err) throw err;
    res.set('Content-Type', 'application/json');
    const json = JSON.parse(data)
    res.status(200).send(json);
  });
});
app.get("/loadChores", function(req, res) {
  fs.readFile("./json/chores.json", "utf8", (err, data) => {
    if (err) throw err;
    res.set('Content-Type', 'application/json');
    const json = JSON.parse(data)
    res.status(200).send(json);
  });
});
app.get("/loadUsers", function(req, res) {
  fs.readFile("./json/users.json", "utf8", (err, data) => {
    if (err) throw err;
    res.set('Content-Type', 'application/json');
    const json = JSON.parse(data)
    res.status(200).send(json);
  });
});
app.get("/loadTaskCategories", function(req, res) {
  fs.readFile("./json/taskCategories.json", "utf8", (err, data) => {
    if (err) throw err;
    res.set('Content-Type', 'application/json');
    const json = JSON.parse(data)
    res.status(200).send(json);
  });
});
app.get("/loadChoreTrackInfo", function(req, res) {
  fs.readFile("./json/choreTrackInfo.json", "utf8", (err, data) => {
    if (err) throw err;
    res.set('Content-Type', 'application/json');
    const json = JSON.parse(data)
    res.status(200).send(json);
  });
});
app.post("/taskDone", function(req, res) {
    markTaskDone(req.query.id);
    res.end()
  });
app.post("/trackChore", function(req, res) {
  trackChore(req.query.id, req.query.user);
  res.end()
});

//Execute api-calls on startup
getUsers();
getChores();
getTasks();
getTaskCategories();
getChoreTrackInfo();
//

app.listen(3003, function() {
  console.log("Grocy API wrapper listening on port 3003");
});
