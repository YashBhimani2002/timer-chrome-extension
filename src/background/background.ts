let hours = 0;
let minutes = 0;
let seconds = 0;
let timeDetails = {
  readTime: "00:00",
  breakTime: "00:00",
};
// Listen for messages from content or popup scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  let responseMessage = "";
  console.log(request);

  // Handle different message types
  if (request.message === "start") {
    if (request.data) {
      timeDetails = request.data;
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
        timeDetails = request.timeDetails;
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
/**
 * Creates a chrome alarm with the given name and sets it to trigger every second.
 * @param {string} alarm - The name of the alarm to be created.
 */
function createTimerAlarm(alarm: string) {
  chrome.alarms.create(alarm, { periodInMinutes: 1 / 60 });
}

/**
 * Sends a notification to the user with a given title and message.
 * @param {string} title - The title of the notification
 * @param {string} message - The message to be displayed in the notification
 */
function sendNotificationForFinishingTime(title: string, message: string) {
  chrome.notifications.create({
    type: "list",
    iconUrl: "./icon.png",
    title: title,
    message,
    items: [
      {
        title: title,
        message: message,
      },
    ],
  });
}
// Function to handle alarm events
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

  // Send message to content scripts
  if (alarms.name == "timer") {
    console.log(timeDetails);

    chrome.runtime.sendMessage({
      message: "timer",
      data: { hours: hours, minutes: minutes, seconds: seconds },
    });

    //This is to send notification when read timer will be gone to be end.
    if (timeDetails.readTime.split(":").length == 3) {
      if (Number(timeDetails.readTime.split(":")[0]) > 0) {
        if (minutes == 5 && seconds == 0) {
          sendNotificationForFinishingTime(
            "Read Time",
            `Read Time Left 05:00 minute`
          );
        }
      } else if (Number(timeDetails.readTime.split(":")[1]) > 0) {
        if (seconds == 10) {
          sendNotificationForFinishingTime(
            "Read Time",
            `Read Time Left 00:10 second`
          );
        }
      } else if (Number(timeDetails.readTime.split(":")[2]) >= 25) {
        if (seconds == 5) {
          sendNotificationForFinishingTime(
            "Read Time",
            `Read Time Left 00:05 second`
          );
        }
      }
    }
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
      if (
        timeDetails.readTime.split(":").length == 2 &&
        (timeDetails.readTime.split(":")[0] != "00" ||
          timeDetails.readTime.split(":")[1] != "00")
      ) {
        sendNotificationForFinishingTime(
          "Break Time",
          `Break Time Finished, You can start again`
        );
      } else if (
        timeDetails.readTime.split(":").length == 3 &&
        (timeDetails.readTime.split(":")[0] != "00" ||
          timeDetails.readTime.split(":")[1] != "00" ||
          timeDetails.readTime.split(":")[2] != "00")
      ) {
        sendNotificationForFinishingTime(
          "Break Time",
          `Break Time Finished, You can start again`
        );
      }
      chrome.alarms.clear("breakTimer");
    }
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        chrome.scripting.executeScript(
          {
            target: { tabId: tab.id },
            files: ["content.js"],
          },
          () => {
            if (chrome.runtime.lastError) {
              return;
            }
            // Send message only after successful injection
            chrome.tabs.sendMessage(tab.id, {
              action:
                hours == 0 && minutes == 0 && seconds == 0
                  ? "startBreakEnd"
                  : "startBreak",
              data: { hours: hours, minutes: minutes, seconds: seconds },
            });
          }
        );
      });
    });
  }
});
