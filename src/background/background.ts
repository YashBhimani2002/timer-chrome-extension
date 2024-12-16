let hours = 0;
let minutes = 0;
let seconds = 0;

// Listen for messages from content or popup scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  let responseMessage = "";
  console.log(request);

  // Handle different message types
  if (request.message === "start") {
    if (request.data) {
      storeTimerValuesLocally(request.data, "running");
      responseMessage = "Time data stored successfully.";
      if (
        request.data.readTime.split(":")[0] != "00" ||
        request.data.readTime.split(":")[1] != "00" ||
        request.data.readTime.split(":")[2] != "00"
      ) {
        if (request.data.readTime.split(":").length == 3) {
          hours = parseInt(request.data.readTime.split(":")[0]);
          minutes = parseInt(request.data.readTime.split(":")[1]);
          seconds = parseInt(request.data.readTime.split(":")[2]);
        } else {
          minutes = parseInt(request.data.readTime.split(":")[0]);
          seconds = parseInt(request.data.readTime.split(":")[1]);
        }
        createTimerAlarm("timer");
      }
      sendResponse({ success: true, message: responseMessage });
    } else {
      sendResponse({ success: false, message: "No timer data provided." });
    }
  } else if (request.message === "stop") {
    // Stop action logic
    responseMessage = "Time data stopped successfully.";
    chrome.alarms.clear("timer");
    let data = {
      hours: hours,
      minutes: minutes,
      seconds: seconds,
    };
    storeStopTimerValuesLocally(data);
    sendResponse({ success: true, message: responseMessage });
  } else if (request.message === "get") {
    chrome.storage.local.get("timeDetails", (result) => {
      if (result.timeDetails) {
        sendResponse({ success: true, data: result.timeDetails });
      } else {
        sendResponse({ success: false, message: "No timer data provided." });
      }
    });
  } else if (request.message === "getStop") {
    chrome.storage.local.get("stopTimer", (result) => {
      if (result.stopTimer) {
        sendResponse({ success: true, data: result.stopTimer });
      } else {
        sendResponse({ success: false, message: "No timer data provided." });
      }
    });
  } else if (request.message == "reset") {
    chrome.storage.local.clear();
    chrome.alarms.clear("timer");
    sendResponse({ success: true, message: "Time data cleared successfully." });
  } else if (request.message == "resume") {
    chrome.storage.local.get("stopTimer", (result) => {
      if (result.stopTimer) {
        hours = result.stopTimer.hours;
        minutes = result.stopTimer.minutes;
        seconds = result.stopTimer.seconds;
        createTimerAlarm("timer");
        sendResponse({
          success: true,
          message: "Time data resumed successfully.",
        });
      } else {
        sendResponse({ success: false, message: "No timer data provided." });
      }
    });
  } else {
    sendResponse({ success: false, message: "Unknown message type." });
  }
  // Indicate that the response will be sent asynchronously
  return true;
});

// Function to store timer values locally
function storeTimerValuesLocally(
  timerValues: {
    readTime: string;
    breakTime: string;
  },
  status: string
) {
  chrome.storage.local.set({
    timeDetails: { ...timerValues, status: status },
  });
}

//Function to store stop timer value locally
function storeStopTimerValuesLocally(timerValues: {
  hours: number;
  minutes: number;
  seconds: number;
}) {
  chrome.storage.local.set({
    stopTimer: timerValues,
  });
}

// Function to update timer values locally
function updateTimerValuesLocally(
  timerValues: {
    readTime: string;
    breakTime: string;
  },
  status: string
) {
  chrome.storage.local.clear();
  storeTimerValuesLocally(timerValues, status);
}
function createTimerAlarm(alarm: string) {
  chrome.alarms.create(alarm, { periodInMinutes: 1 / 60 });
}

chrome.alarms.onAlarm.addListener((alarms) => {
   if (hours >= 0) {
     if (seconds == 0 && minutes == 0 && hours == 0) {
       chrome.alarms.clear(alarms.name);
     } else if (seconds == 0 && minutes == 0 && hours != 0) {
       hours--;
       minutes = 59;
       seconds = 59;
     } else if (seconds == 0 && minutes != 0) {
       minutes--;
       seconds = 59;
     } else {
       seconds--;
     }
   } else {
     if (seconds == 0 && minutes == 0) {
       chrome.alarms.clear(alarms.name);
     } else if (seconds == 0 && minutes != 0) {
       minutes--;
       seconds = 59;
     } else {
       seconds--;
     }
   }
 
   if (alarms.name == "timer") {
     chrome.runtime.sendMessage({
       message: "timer",
       data: { hours: hours, minutes: minutes, seconds: seconds },
     });
 
     if (hours == 0 && minutes == 0 && seconds == 0) {
       chrome.alarms.clear(alarms.name);
 
       // Start break timer if break time exists
       chrome.storage.local.get("timeDetails", (result) => {
         if (result.timeDetails) {
           if (
             result.timeDetails.breakTime.split(":")[0] != "00" ||
             result.timeDetails.breakTime.split(":")[1] != "00" ||
             result.timeDetails.breakTime.split(":")[2] != "00"
           ) {
             if (result.timeDetails.breakTime.split(":").length == 3) {
               hours = parseInt(result.timeDetails.breakTime.split(":")[0]);
               minutes = parseInt(result.timeDetails.breakTime.split(":")[1]);
               seconds = parseInt(result.timeDetails.breakTime.split(":")[2]);
             } else {
               minutes = parseInt(result.timeDetails.breakTime.split(":")[0]);
               seconds = parseInt(result.timeDetails.breakTime.split(":")[1]);
             }
             createTimerAlarm("breakTimer");
           }
         }
       });
     }
   } else if (alarms.name == "breakTimer") {
     // Handle break timer logic
     if (hours == 0 && minutes == 0 && seconds == 0) {
       // End break
       chrome.tabs.query({}, (tabs) => {
         tabs.forEach((tab) => {
           chrome.scripting.executeScript({
             target: { tabId: tab.id },
             func: () => {
               // Remove the modal
               document.getElementById("breakModal")?.remove();
             },
           });
         });
       });
 
       chrome.runtime.sendMessage({ action: "startBreakEnd" });
       chrome.alarms.clear("breakTimer");
     } else {
       // Update break timer or start if not injected
       chrome.tabs.query({}, (tabs) => {
         tabs.forEach((tab) => {
           chrome.scripting.executeScript({
             target: { tabId: tab.id },
             files: ["content.js"],
           });
         });
       });
 
       chrome.runtime.sendMessage({
         action: "startBreak",
         data: { hours: hours, minutes: minutes, seconds: seconds },
       });
     }
   }
 });
 


// chrome.alarms.onAlarm.addListener((alarms) => {
//   if (hours >= 0) {
//     if (seconds == 0 && minutes == 0 && hours == 0) {
//       chrome.alarms.clear(alarms.name);
//     } else if (seconds == 0 && minutes == 0 && hours != 0) {
//       hours--;
//       minutes = 59;
//       seconds = 59;
//     } else if (seconds == 0 && minutes != 0) {
//       minutes--;
//       seconds = 59;
//     } else {
//       seconds--;
//     }
//   } else {
//     if (seconds == 0 && minutes == 0) {
//       chrome.alarms.clear(alarms.name);
//     } else if (seconds == 0 && minutes != 0) {
//       minutes--;
//       seconds = 59;
//     } else {
//       seconds--;
//     }
//   }
//   if (alarms.name == "timer") {
//     chrome.runtime.sendMessage({
//       message: "timer",
//       data: { hours: hours, minutes: minutes, seconds: seconds },
//     });
//     if (hours == 0 && minutes == 0 && seconds == 0) {
//       chrome.alarms.clear(alarms.name);
//       chrome.storage.local.get("timeDetails", (result) => {
//         if (result.timeDetails) {
//           if (
//             result.timeDetails.breakTime.split(":")[0] != "00" ||
//             result.timeDetails.breakTime.split(":")[1] != "00" ||
//             result.timeDetails.breakTime.split(":")[2] != "00"
//           ) {
//             if (result.timeDetails.breakTime.split(":").length == 3) {
//               hours = parseInt(result.timeDetails.breakTime.split(":")[0]);
//               minutes = parseInt(result.timeDetails.breakTime.split(":")[1]);
//               seconds = parseInt(result.timeDetails.breakTime.split(":")[2]);
//             } else {
//               minutes = parseInt(result.timeDetails.breakTime.split(":")[0]);
//               seconds = parseInt(result.timeDetails.breakTime.split(":")[1]);
//             }
//             createTimerAlarm("breakTimer");
//           }
//         }
//       });
//     }
//   } else if (alarms.name == "breakTimer") {
//     chrome.tabs.query({}, (tabs) => {
//       tabs.forEach((tabs) => {
//         chrome.scripting.executeScript({
//           target: { tabId: tabs.id },
//           files: ["content.js"],
//         });
//       });
//     });
//     chrome.runtime.sendMessage({
//       action:
//         hours == 0 && minutes == 0 && seconds == 0
//           ? "startBreakEnd"
//           : "startBreak",
//       data: { hours: hours, minutes: minutes, seconds: seconds },
//     });
//   }
// });
