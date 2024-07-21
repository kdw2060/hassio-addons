//////////
//CONFIG//
//////////
import axios from 'axios';
axios.defaults.withCredentials = true;
import cron from 'node-cron';

// HOME ASSISTANT API REQUEST OPTIONS
const postReqOptions = {headers: {'Authorization': 'Bearer ' + process.env.SUPERVISOR_TOKEN}};

// OMV API REQUEST OPTIONS (set the url, username and password values for your OMV instance here)
const baseUrl = "http://192.168.50.15/rpc.php";
const omvUsername = "";
const omvPass = "";
let cookieJar = [];
let header = {headers: {updatelastaccess: true, cookie: cookieJar}};

///////////////////////
//GETTERS AND SETTERS//
///////////////////////

// API calls
async function login() {
  const postBody = {
    "service": "Session",
    "method": "login",
    "params": {
        "username": omvUsername,
        "password": omvPass
        }
    }
  let loginResponse = await axios.post(baseUrl, postBody)
  .then((response) => {
      cookieJar = response.headers['set-cookie'];
      header.headers.cookie = cookieJar.join('; ');
    }, (error) => {
      console.log('OMV login failed with ' + error);
    });
}


async function getSystemInfo() {
    let sensorData;
    console.log("test1");
    const postBody = {
        "service": "System",
        "method": "getInformation",
        "params": {}
        }
    try {
      let response = await axios.post(baseUrl, postBody, header);
      if (response.status == 200) {
          sensorData = response.data.response;
          
          axios.post('http://supervisor/core/api/states/sensor.omv_info', 
            { state: 'none',
            attributes: {data: sensorData}
            },
            postReqOptions)
          .then((response) => {
          }, (error) => {
            console.log(error);
          });
        }
      else {console.log('OMV getSystemInfo failed with ' + response.statusText);}
    }  
    catch (error) {
      console.log(error);
    }
  }


function getNetworkInfo(){
    let sensorData;
    const postBody = {
        "service": "Network",
        "method": "enumerateDevices",
        "params": {}
        }
    axios.post(baseUrl, postBody, header)
    .then((response) => {
        if (response.status == 200) {
          sensorData = response.data.response;
          // console.log(sensorData);
          axios.post('http://supervisor/core/api/states/sensor.omv_network', 
            { state: 'none',
            attributes: {data: sensorData}
            },
            postReqOptions)
          .then((response) => {
          }, (error) => {
            console.log(error);
          });
        }
        if (response.status !== 200) {
            console.log('OMV getNetworkInfo failed with ' + response.statusText);
        }
    }, (error) => {
      console.log(error);
    });
}

function getServicesInfo(){
    let sensorData;
    const postBody = {
        "service": "Services",
        "method": "getStatus",
        "params": {}
        }
    axios.post(baseUrl, postBody, header)
    .then((response) => {
        if (response.status == 200) {
            sensorData = response.data.response.data;
            let numberOfServices = response.data.response.total;
            // console.log(sensorData);
            axios.post('http://supervisor/core/api/states/sensor.omv_services', 
              { state: numberOfServices,
              attributes: {data: sensorData}
              },
              postReqOptions)
            .then((response) => {
            }, (error) => {
              console.log(error);
            });
        }
        if (response.status !== 200) {
            console.log('OMV getServicesInfo failed with ' + response.statusText);
        }
    }, (error) => {
      console.log(error);
    });
}

function getDiskInfo(){
    let sensorData = [];
    const postBody = {
        "service": "FileSystemMgmt",
        "method": "enumerateMountedFilesystems",
        "params": {}
        }
    axios.post(baseUrl, postBody, header)
    .then((response) => {
        if (response.status == 200) {
          let res = response.data.response.data;
          let numberOfFS = res.length();
          // Transform the data
          for (let i=0; i < numberOfFS; i++) {
            let diskInfo = {};
            diskInfo.devicename = res[i].devicename;
            diskInfo.label = res[i].label;
            diskInfo.used = res[i].used;
            diskInfo.available = res[i].available;
            diskInfo.size = res[i].size;
            diskInfo.percentage = res[i].percentage;
            diskInfo.description = res[i].description;
            sensorData.push(diskInfo);
          }
          // console.log(sensorData);
          // Then post the data to Home Assitant
          axios.post('http://supervisor/core/api/states/sensor.omv_disks', 
            { state: numberOfFS,
            attributes: {data: sensorData}
            },
            postReqOptions)
          .then((response) => {
          }, (error) => {
            console.log(error);
          });
        }
        if (response.status !== 200) {
            console.log('OMV getDiskInfo failed with ' + response.statusText);
        }  
    }, (error) => {
      console.log(error);
    });
}

function getKvmInfo(){
    let sensorData;
    const postBody = {
        "service": "Kvm",
        "method": "getVmNameStateList",
        "params": {}
        }
    axios.post(baseUrl, postBody, header)
    .then((response) => {
        if (response.status == 200) {
          sensorData = response.data.response;
          //console.log(sensorData);
          let numberOfVMs = response.data.response.total;
          // Then post the data to Home Assitant
          axios.post('http://supervisor/core/api/states/sensor.omv_kvm', 
            { state: numberOfVMs,
            attributes: {data: sensorData}
            },
            postReqOptions)
          .then((response) => {
          }, (error) => {
            console.log(error);
          });
        }
        if (response.status !== 200) {
            console.log('OMV getKvmInfo failed with ' + response.statusText);
        }  
    }, (error) => {
      console.log(error);
    });
}

function getComposeInfo(){
    let sensorData = [];
    const postBody = {
        "service": "compose",
        "method": "getContainerList",
        "params": {
          "start": 0, 
          "limit": 999
        }
        }
    axios.post(baseUrl, postBody, header)
    .then((response) => {
        if (response.status == 200) {
          let res = response.data.response.data;
          let numberOfContainers = response.data.response.total;
          // Transform the data
          for (let i=0; i < numberOfContainers; i++) {
            let containerInfo = {};
            containerInfo.name = res[i].name;
            containerInfo.state = res[i].state;
            containerInfo.status = res[i].status;
            containerInfo.running = res[i].running;
            sensorData.push(containerInfo);
          }
          //console.log(sensorData);
          //Then post the data to Home Assitant
          axios.post('http://supervisor/core/api/states/sensor.omv_compose', 
            { state: numberOfContainers,
            attributes: {data: sensorData}
            },
            postReqOptions)
          .then((response) => {
          }, (error) => {
            console.log(error);
          });
        }
        if (response.status !== 200) {
            console.log('OMV getComposeInfo failed with ' + response.statusText);
        }
    }, (error) => {
      console.log(error);
    });
}
////////
//CRON//
////////
login()
  .then(() => getSystemInfo())
  .then(() => getDiskInfo())
  .then(() => getComposeInfo())
  .then(() => getNetworkInfo())
  .then(() => getKvmInfo())
  .then(() => getServicesInfo())
  .catch(error => {
    console.error("OMV intial chain of calls failed with ", error);
  });

// Update sensors every 10 minutes 
cron.schedule('*/10 * * * *', () => {
  getSystemInfo()
    .then(() => getDiskInfo())
    .then(() => getComposeInfo())
    .then(() => getNetworkInfo())
    .then(() => getKvmInfo())
    .then(() => getServicesInfo())
    .catch(error => {
      console.error("OMV chain of calls failed with ", error);
    });
  console.log("OMV info refreshed at: " + new Date() );
});

// Once a month login again to refresh cookies 
cron.schedule('11 06 * 1/1 *', () => {
  login();
  console.log("OMV login cookies refreshed at: " + new Date() );
})
