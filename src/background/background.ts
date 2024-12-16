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
        createTimerAlarm();
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
  } else if(request.message == "reset"){
    chrome.storage.local.clear();
    chrome.alarms.clear("timer");
    sendResponse({ success: true, message: "Time data cleared successfully." });
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
function createTimerAlarm() {
  chrome.alarms.create("timer", { periodInMinutes: 1 / 60 });
}
chrome.alarms.onAlarm.addListener((alarms) => {
  if (alarms.name == "timer") {
    if (hours >= 0) {
      if (seconds == 0 && minutes == 0 && hours == 0) {
        chrome.alarms.clear("timer");
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
        chrome.alarms.clear("timer");
      } else if (seconds == 0 && minutes != 0) {
        minutes--;
        seconds = 59;
      } else {
        seconds--;
      }
    }
  }
  chrome.runtime.sendMessage({
    message: "timer",
    data: { hours: hours, minutes: minutes, seconds: seconds },
  });
});
