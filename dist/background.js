/******/ (() => { // webpackBootstrap
/*!**************************************!*\
  !*** ./src/background/background.ts ***!
  \**************************************/
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
            if (request.data.readTime.split(":")[0] != "00" ||
                request.data.readTime.split(":")[1] != "00" ||
                request.data.readTime.split(":")[2] != "00") {
                if (request.data.readTime.split(":").length == 3) {
                    hours = parseInt(request.data.readTime.split(":")[0]);
                    minutes = parseInt(request.data.readTime.split(":")[1]);
                    seconds = parseInt(request.data.readTime.split(":")[2]);
                }
                else {
                    minutes = parseInt(request.data.readTime.split(":")[0]);
                    seconds = parseInt(request.data.readTime.split(":")[1]);
                }
                createTimerAlarm("timer");
            }
            sendResponse({ success: true, message: responseMessage });
        }
        else {
            sendResponse({ success: false, message: "No timer data provided." });
        }
    }
    else if (request.message === "stop") {
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
    }
    else if (request.message === "get") {
        chrome.storage.local.get("timeDetails", (result) => {
            if (result.timeDetails) {
                timeDetails = request.timeDetails;
                sendResponse({ success: true, data: result.timeDetails });
            }
            else {
                sendResponse({ success: false, message: "No timer data provided." });
            }
        });
    }
    else if (request.message === "getStop") {
        chrome.storage.local.get("stopTimer", (result) => {
            if (result.stopTimer) {
                sendResponse({ success: true, data: result.stopTimer });
            }
            else {
                sendResponse({ success: false, message: "No timer data provided." });
            }
        });
    }
    else if (request.message == "reset") {
        chrome.storage.local.clear();
        chrome.alarms.clear("timer");
        sendResponse({ success: true, message: "Time data cleared successfully." });
    }
    else if (request.message == "resume") {
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
            }
            else {
                sendResponse({ success: false, message: "No timer data provided." });
            }
        });
    }
    else {
        sendResponse({ success: false, message: "Unknown message type." });
    }
    // Indicate that the response will be sent asynchronously
    return true;
});
// Function to store timer values locally
function storeTimerValuesLocally(timerValues, status) {
    chrome.storage.local.set({
        timeDetails: Object.assign(Object.assign({}, timerValues), { status: status }),
    });
}
//Function to store stop timer value locally
function storeStopTimerValuesLocally(timerValues) {
    chrome.storage.local.set({
        stopTimer: timerValues,
    });
}
// Function to update timer values locally
function updateTimerValuesLocally(timerValues, status) {
    chrome.storage.local.clear();
    storeTimerValuesLocally(timerValues, status);
}
/**
 * Creates a chrome alarm with the given name and sets it to trigger every second.
 * @param {string} alarm - The name of the alarm to be created.
 */
function createTimerAlarm(alarm) {
    chrome.alarms.create(alarm, { periodInMinutes: 1 / 60 });
}
/**
 * Sends a notification to the user with a given title and message.
 * @param {string} title - The title of the notification
 * @param {string} message - The message to be displayed in the notification
 */
function sendNotificationForFinishingTime(title, message) {
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
        }
        else if (seconds == 0 && minutes == 0 && hours != 0) {
            hours--;
            minutes = 59;
            seconds = 59;
        }
        else if (seconds == 0 && minutes != 0) {
            minutes--;
            seconds = 59;
        }
        else {
            seconds--;
        }
    }
    else {
        if (seconds == 0 && minutes == 0) {
            chrome.alarms.clear(alarms.name);
        }
        else if (seconds == 0 && minutes != 0) {
            minutes--;
            seconds = 59;
        }
        else {
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
                    sendNotificationForFinishingTime("Read Time", `Read Time Left 05:00 minute`);
                }
            }
            else if (Number(timeDetails.readTime.split(":")[1]) > 0) {
                if (seconds == 10) {
                    sendNotificationForFinishingTime("Read Time", `Read Time Left 00:10 second`);
                }
            }
            else if (Number(timeDetails.readTime.split(":")[2]) >= 25) {
                if (seconds == 5) {
                    sendNotificationForFinishingTime("Read Time", `Read Time Left 00:05 second`);
                }
            }
        }
        if (hours == 0 && minutes == 0 && seconds == 0) {
            chrome.alarms.clear(alarms.name);
            // Start break timer if break time exists
            chrome.storage.local.get("timeDetails", (result) => {
                if (result.timeDetails) {
                    if (result.timeDetails.breakTime.split(":")[0] != "00" ||
                        result.timeDetails.breakTime.split(":")[1] != "00" ||
                        result.timeDetails.breakTime.split(":")[2] != "00") {
                        if (result.timeDetails.breakTime.split(":").length == 3) {
                            hours = parseInt(result.timeDetails.breakTime.split(":")[0]);
                            minutes = parseInt(result.timeDetails.breakTime.split(":")[1]);
                            seconds = parseInt(result.timeDetails.breakTime.split(":")[2]);
                        }
                        else {
                            minutes = parseInt(result.timeDetails.breakTime.split(":")[0]);
                            seconds = parseInt(result.timeDetails.breakTime.split(":")[1]);
                        }
                        createTimerAlarm("breakTimer");
                    }
                }
            });
        }
    }
    else if (alarms.name == "breakTimer") {
        // Handle break timer logic
        if (hours == 0 && minutes == 0 && seconds == 0) {
            if (timeDetails.readTime.split(":").length == 2 &&
                (timeDetails.readTime.split(":")[0] != "00" ||
                    timeDetails.readTime.split(":")[1] != "00")) {
                sendNotificationForFinishingTime("Break Time", `Break Time Finished, You can start again`);
            }
            else if (timeDetails.readTime.split(":").length == 3 &&
                (timeDetails.readTime.split(":")[0] != "00" ||
                    timeDetails.readTime.split(":")[1] != "00" ||
                    timeDetails.readTime.split(":")[2] != "00")) {
                sendNotificationForFinishingTime("Break Time", `Break Time Finished, You can start again`);
            }
            chrome.alarms.clear("breakTimer");
        }
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach((tab) => {
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ["content.js"],
                }, () => {
                    if (chrome.runtime.lastError) {
                        return;
                    }
                    // Send message only after successful injection
                    chrome.tabs.sendMessage(tab.id, {
                        action: hours == 0 && minutes == 0 && seconds == 0
                            ? "startBreakEnd"
                            : "startBreak",
                        data: { hours: hours, minutes: minutes, seconds: seconds },
                    });
                });
            });
        });
    }
});

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2dyb3VuZC5qcyIsIm1hcHBpbmdzIjoiOzs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyQkFBMkIseUNBQXlDO0FBQ3BFO0FBQ0E7QUFDQSwyQkFBMkIsb0RBQW9EO0FBQy9FO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVCQUF1Qix5Q0FBeUM7QUFDaEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLCtCQUErQix5Q0FBeUM7QUFDeEU7QUFDQTtBQUNBLCtCQUErQixvREFBb0Q7QUFDbkY7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQSwrQkFBK0IsdUNBQXVDO0FBQ3RFO0FBQ0E7QUFDQSwrQkFBK0Isb0RBQW9EO0FBQ25GO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUJBQXVCLDJEQUEyRDtBQUNsRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQSwrQkFBK0Isb0RBQW9EO0FBQ25GO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSx1QkFBdUIsa0RBQWtEO0FBQ3pFO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQSxtREFBbUQsa0JBQWtCLGdCQUFnQjtBQUNyRixLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBVyxRQUFRO0FBQ25CO0FBQ0E7QUFDQSxrQ0FBa0MseUJBQXlCO0FBQzNEO0FBQ0E7QUFDQTtBQUNBLFdBQVcsUUFBUTtBQUNuQixXQUFXLFFBQVE7QUFDbkI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9CQUFvQixrREFBa0Q7QUFDdEUsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNEJBQTRCO0FBQzVCO0FBQ0E7QUFDQSw4QkFBOEIsZUFBZTtBQUM3QztBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0NBQWdDLGtEQUFrRDtBQUNsRixxQkFBcUI7QUFDckIsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYixTQUFTO0FBQ1Q7QUFDQSxDQUFDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vLy4vc3JjL2JhY2tncm91bmQvYmFja2dyb3VuZC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJsZXQgaG91cnMgPSAwO1xubGV0IG1pbnV0ZXMgPSAwO1xubGV0IHNlY29uZHMgPSAwO1xubGV0IHRpbWVEZXRhaWxzID0ge1xuICAgIHJlYWRUaW1lOiBcIjAwOjAwXCIsXG4gICAgYnJlYWtUaW1lOiBcIjAwOjAwXCIsXG59O1xuLy8gTGlzdGVuIGZvciBtZXNzYWdlcyBmcm9tIGNvbnRlbnQgb3IgcG9wdXAgc2NyaXB0c1xuY2hyb21lLnJ1bnRpbWUub25NZXNzYWdlLmFkZExpc3RlbmVyKChyZXF1ZXN0LCBzZW5kZXIsIHNlbmRSZXNwb25zZSkgPT4ge1xuICAgIGxldCByZXNwb25zZU1lc3NhZ2UgPSBcIlwiO1xuICAgIGNvbnNvbGUubG9nKHJlcXVlc3QpO1xuICAgIC8vIEhhbmRsZSBkaWZmZXJlbnQgbWVzc2FnZSB0eXBlc1xuICAgIGlmIChyZXF1ZXN0Lm1lc3NhZ2UgPT09IFwic3RhcnRcIikge1xuICAgICAgICBpZiAocmVxdWVzdC5kYXRhKSB7XG4gICAgICAgICAgICB0aW1lRGV0YWlscyA9IHJlcXVlc3QuZGF0YTtcbiAgICAgICAgICAgIHN0b3JlVGltZXJWYWx1ZXNMb2NhbGx5KHJlcXVlc3QuZGF0YSwgXCJydW5uaW5nXCIpO1xuICAgICAgICAgICAgcmVzcG9uc2VNZXNzYWdlID0gXCJUaW1lIGRhdGEgc3RvcmVkIHN1Y2Nlc3NmdWxseS5cIjtcbiAgICAgICAgICAgIGlmIChyZXF1ZXN0LmRhdGEucmVhZFRpbWUuc3BsaXQoXCI6XCIpWzBdICE9IFwiMDBcIiB8fFxuICAgICAgICAgICAgICAgIHJlcXVlc3QuZGF0YS5yZWFkVGltZS5zcGxpdChcIjpcIilbMV0gIT0gXCIwMFwiIHx8XG4gICAgICAgICAgICAgICAgcmVxdWVzdC5kYXRhLnJlYWRUaW1lLnNwbGl0KFwiOlwiKVsyXSAhPSBcIjAwXCIpIHtcbiAgICAgICAgICAgICAgICBpZiAocmVxdWVzdC5kYXRhLnJlYWRUaW1lLnNwbGl0KFwiOlwiKS5sZW5ndGggPT0gMykge1xuICAgICAgICAgICAgICAgICAgICBob3VycyA9IHBhcnNlSW50KHJlcXVlc3QuZGF0YS5yZWFkVGltZS5zcGxpdChcIjpcIilbMF0pO1xuICAgICAgICAgICAgICAgICAgICBtaW51dGVzID0gcGFyc2VJbnQocmVxdWVzdC5kYXRhLnJlYWRUaW1lLnNwbGl0KFwiOlwiKVsxXSk7XG4gICAgICAgICAgICAgICAgICAgIHNlY29uZHMgPSBwYXJzZUludChyZXF1ZXN0LmRhdGEucmVhZFRpbWUuc3BsaXQoXCI6XCIpWzJdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG1pbnV0ZXMgPSBwYXJzZUludChyZXF1ZXN0LmRhdGEucmVhZFRpbWUuc3BsaXQoXCI6XCIpWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgc2Vjb25kcyA9IHBhcnNlSW50KHJlcXVlc3QuZGF0YS5yZWFkVGltZS5zcGxpdChcIjpcIilbMV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjcmVhdGVUaW1lckFsYXJtKFwidGltZXJcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiB0cnVlLCBtZXNzYWdlOiByZXNwb25zZU1lc3NhZ2UgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiBmYWxzZSwgbWVzc2FnZTogXCJObyB0aW1lciBkYXRhIHByb3ZpZGVkLlwiIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKHJlcXVlc3QubWVzc2FnZSA9PT0gXCJzdG9wXCIpIHtcbiAgICAgICAgLy8gU3RvcCBhY3Rpb24gbG9naWNcbiAgICAgICAgcmVzcG9uc2VNZXNzYWdlID0gXCJUaW1lIGRhdGEgc3RvcHBlZCBzdWNjZXNzZnVsbHkuXCI7XG4gICAgICAgIGNocm9tZS5hbGFybXMuY2xlYXIoXCJ0aW1lclwiKTtcbiAgICAgICAgbGV0IGRhdGEgPSB7XG4gICAgICAgICAgICBob3VyczogaG91cnMsXG4gICAgICAgICAgICBtaW51dGVzOiBtaW51dGVzLFxuICAgICAgICAgICAgc2Vjb25kczogc2Vjb25kcyxcbiAgICAgICAgfTtcbiAgICAgICAgc3RvcmVTdG9wVGltZXJWYWx1ZXNMb2NhbGx5KGRhdGEpO1xuICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiB0cnVlLCBtZXNzYWdlOiByZXNwb25zZU1lc3NhZ2UgfSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKHJlcXVlc3QubWVzc2FnZSA9PT0gXCJnZXRcIikge1xuICAgICAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoXCJ0aW1lRGV0YWlsc1wiLCAocmVzdWx0KSA9PiB7XG4gICAgICAgICAgICBpZiAocmVzdWx0LnRpbWVEZXRhaWxzKSB7XG4gICAgICAgICAgICAgICAgdGltZURldGFpbHMgPSByZXF1ZXN0LnRpbWVEZXRhaWxzO1xuICAgICAgICAgICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IHJlc3VsdC50aW1lRGV0YWlscyB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IGZhbHNlLCBtZXNzYWdlOiBcIk5vIHRpbWVyIGRhdGEgcHJvdmlkZWQuXCIgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIGlmIChyZXF1ZXN0Lm1lc3NhZ2UgPT09IFwiZ2V0U3RvcFwiKSB7XG4gICAgICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldChcInN0b3BUaW1lclwiLCAocmVzdWx0KSA9PiB7XG4gICAgICAgICAgICBpZiAocmVzdWx0LnN0b3BUaW1lcikge1xuICAgICAgICAgICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IHJlc3VsdC5zdG9wVGltZXIgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiBmYWxzZSwgbWVzc2FnZTogXCJObyB0aW1lciBkYXRhIHByb3ZpZGVkLlwiIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgZWxzZSBpZiAocmVxdWVzdC5tZXNzYWdlID09IFwicmVzZXRcIikge1xuICAgICAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5jbGVhcigpO1xuICAgICAgICBjaHJvbWUuYWxhcm1zLmNsZWFyKFwidGltZXJcIik7XG4gICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IHRydWUsIG1lc3NhZ2U6IFwiVGltZSBkYXRhIGNsZWFyZWQgc3VjY2Vzc2Z1bGx5LlwiIH0pO1xuICAgIH1cbiAgICBlbHNlIGlmIChyZXF1ZXN0Lm1lc3NhZ2UgPT0gXCJyZXN1bWVcIikge1xuICAgICAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoXCJzdG9wVGltZXJcIiwgKHJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgaWYgKHJlc3VsdC5zdG9wVGltZXIpIHtcbiAgICAgICAgICAgICAgICBob3VycyA9IHJlc3VsdC5zdG9wVGltZXIuaG91cnM7XG4gICAgICAgICAgICAgICAgbWludXRlcyA9IHJlc3VsdC5zdG9wVGltZXIubWludXRlcztcbiAgICAgICAgICAgICAgICBzZWNvbmRzID0gcmVzdWx0LnN0b3BUaW1lci5zZWNvbmRzO1xuICAgICAgICAgICAgICAgIGNyZWF0ZVRpbWVyQWxhcm0oXCJ0aW1lclwiKTtcbiAgICAgICAgICAgICAgICBzZW5kUmVzcG9uc2Uoe1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBcIlRpbWUgZGF0YSByZXN1bWVkIHN1Y2Nlc3NmdWxseS5cIixcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IGZhbHNlLCBtZXNzYWdlOiBcIk5vIHRpbWVyIGRhdGEgcHJvdmlkZWQuXCIgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogZmFsc2UsIG1lc3NhZ2U6IFwiVW5rbm93biBtZXNzYWdlIHR5cGUuXCIgfSk7XG4gICAgfVxuICAgIC8vIEluZGljYXRlIHRoYXQgdGhlIHJlc3BvbnNlIHdpbGwgYmUgc2VudCBhc3luY2hyb25vdXNseVxuICAgIHJldHVybiB0cnVlO1xufSk7XG4vLyBGdW5jdGlvbiB0byBzdG9yZSB0aW1lciB2YWx1ZXMgbG9jYWxseVxuZnVuY3Rpb24gc3RvcmVUaW1lclZhbHVlc0xvY2FsbHkodGltZXJWYWx1ZXMsIHN0YXR1cykge1xuICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldCh7XG4gICAgICAgIHRpbWVEZXRhaWxzOiBPYmplY3QuYXNzaWduKE9iamVjdC5hc3NpZ24oe30sIHRpbWVyVmFsdWVzKSwgeyBzdGF0dXM6IHN0YXR1cyB9KSxcbiAgICB9KTtcbn1cbi8vRnVuY3Rpb24gdG8gc3RvcmUgc3RvcCB0aW1lciB2YWx1ZSBsb2NhbGx5XG5mdW5jdGlvbiBzdG9yZVN0b3BUaW1lclZhbHVlc0xvY2FsbHkodGltZXJWYWx1ZXMpIHtcbiAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoe1xuICAgICAgICBzdG9wVGltZXI6IHRpbWVyVmFsdWVzLFxuICAgIH0pO1xufVxuLy8gRnVuY3Rpb24gdG8gdXBkYXRlIHRpbWVyIHZhbHVlcyBsb2NhbGx5XG5mdW5jdGlvbiB1cGRhdGVUaW1lclZhbHVlc0xvY2FsbHkodGltZXJWYWx1ZXMsIHN0YXR1cykge1xuICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLmNsZWFyKCk7XG4gICAgc3RvcmVUaW1lclZhbHVlc0xvY2FsbHkodGltZXJWYWx1ZXMsIHN0YXR1cyk7XG59XG4vKipcbiAqIENyZWF0ZXMgYSBjaHJvbWUgYWxhcm0gd2l0aCB0aGUgZ2l2ZW4gbmFtZSBhbmQgc2V0cyBpdCB0byB0cmlnZ2VyIGV2ZXJ5IHNlY29uZC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBhbGFybSAtIFRoZSBuYW1lIG9mIHRoZSBhbGFybSB0byBiZSBjcmVhdGVkLlxuICovXG5mdW5jdGlvbiBjcmVhdGVUaW1lckFsYXJtKGFsYXJtKSB7XG4gICAgY2hyb21lLmFsYXJtcy5jcmVhdGUoYWxhcm0sIHsgcGVyaW9kSW5NaW51dGVzOiAxIC8gNjAgfSk7XG59XG4vKipcbiAqIFNlbmRzIGEgbm90aWZpY2F0aW9uIHRvIHRoZSB1c2VyIHdpdGggYSBnaXZlbiB0aXRsZSBhbmQgbWVzc2FnZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSB0aXRsZSAtIFRoZSB0aXRsZSBvZiB0aGUgbm90aWZpY2F0aW9uXG4gKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZSAtIFRoZSBtZXNzYWdlIHRvIGJlIGRpc3BsYXllZCBpbiB0aGUgbm90aWZpY2F0aW9uXG4gKi9cbmZ1bmN0aW9uIHNlbmROb3RpZmljYXRpb25Gb3JGaW5pc2hpbmdUaW1lKHRpdGxlLCBtZXNzYWdlKSB7XG4gICAgY2hyb21lLm5vdGlmaWNhdGlvbnMuY3JlYXRlKHtcbiAgICAgICAgdHlwZTogXCJsaXN0XCIsXG4gICAgICAgIGljb25Vcmw6IFwiLi9pY29uLnBuZ1wiLFxuICAgICAgICB0aXRsZTogdGl0bGUsXG4gICAgICAgIG1lc3NhZ2UsXG4gICAgICAgIGl0ZW1zOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IHRpdGxlLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgIH0pO1xufVxuLy8gRnVuY3Rpb24gdG8gaGFuZGxlIGFsYXJtIGV2ZW50c1xuY2hyb21lLmFsYXJtcy5vbkFsYXJtLmFkZExpc3RlbmVyKChhbGFybXMpID0+IHtcbiAgICBpZiAoaG91cnMgPj0gMCkge1xuICAgICAgICBpZiAoc2Vjb25kcyA9PSAwICYmIG1pbnV0ZXMgPT0gMCAmJiBob3VycyA9PSAwKSB7XG4gICAgICAgICAgICBjaHJvbWUuYWxhcm1zLmNsZWFyKGFsYXJtcy5uYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChzZWNvbmRzID09IDAgJiYgbWludXRlcyA9PSAwICYmIGhvdXJzICE9IDApIHtcbiAgICAgICAgICAgIGhvdXJzLS07XG4gICAgICAgICAgICBtaW51dGVzID0gNTk7XG4gICAgICAgICAgICBzZWNvbmRzID0gNTk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoc2Vjb25kcyA9PSAwICYmIG1pbnV0ZXMgIT0gMCkge1xuICAgICAgICAgICAgbWludXRlcy0tO1xuICAgICAgICAgICAgc2Vjb25kcyA9IDU5O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgc2Vjb25kcy0tO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBpZiAoc2Vjb25kcyA9PSAwICYmIG1pbnV0ZXMgPT0gMCkge1xuICAgICAgICAgICAgY2hyb21lLmFsYXJtcy5jbGVhcihhbGFybXMubmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoc2Vjb25kcyA9PSAwICYmIG1pbnV0ZXMgIT0gMCkge1xuICAgICAgICAgICAgbWludXRlcy0tO1xuICAgICAgICAgICAgc2Vjb25kcyA9IDU5O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgc2Vjb25kcy0tO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vIFNlbmQgbWVzc2FnZSB0byBjb250ZW50IHNjcmlwdHNcbiAgICBpZiAoYWxhcm1zLm5hbWUgPT0gXCJ0aW1lclwiKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKHRpbWVEZXRhaWxzKTtcbiAgICAgICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2Uoe1xuICAgICAgICAgICAgbWVzc2FnZTogXCJ0aW1lclwiLFxuICAgICAgICAgICAgZGF0YTogeyBob3VyczogaG91cnMsIG1pbnV0ZXM6IG1pbnV0ZXMsIHNlY29uZHM6IHNlY29uZHMgfSxcbiAgICAgICAgfSk7XG4gICAgICAgIC8vVGhpcyBpcyB0byBzZW5kIG5vdGlmaWNhdGlvbiB3aGVuIHJlYWQgdGltZXIgd2lsbCBiZSBnb25lIHRvIGJlIGVuZC5cbiAgICAgICAgaWYgKHRpbWVEZXRhaWxzLnJlYWRUaW1lLnNwbGl0KFwiOlwiKS5sZW5ndGggPT0gMykge1xuICAgICAgICAgICAgaWYgKE51bWJlcih0aW1lRGV0YWlscy5yZWFkVGltZS5zcGxpdChcIjpcIilbMF0pID4gMCkge1xuICAgICAgICAgICAgICAgIGlmIChtaW51dGVzID09IDUgJiYgc2Vjb25kcyA9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbmROb3RpZmljYXRpb25Gb3JGaW5pc2hpbmdUaW1lKFwiUmVhZCBUaW1lXCIsIGBSZWFkIFRpbWUgTGVmdCAwNTowMCBtaW51dGVgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChOdW1iZXIodGltZURldGFpbHMucmVhZFRpbWUuc3BsaXQoXCI6XCIpWzFdKSA+IDApIHtcbiAgICAgICAgICAgICAgICBpZiAoc2Vjb25kcyA9PSAxMCkge1xuICAgICAgICAgICAgICAgICAgICBzZW5kTm90aWZpY2F0aW9uRm9yRmluaXNoaW5nVGltZShcIlJlYWQgVGltZVwiLCBgUmVhZCBUaW1lIExlZnQgMDA6MTAgc2Vjb25kYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoTnVtYmVyKHRpbWVEZXRhaWxzLnJlYWRUaW1lLnNwbGl0KFwiOlwiKVsyXSkgPj0gMjUpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2Vjb25kcyA9PSA1KSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbmROb3RpZmljYXRpb25Gb3JGaW5pc2hpbmdUaW1lKFwiUmVhZCBUaW1lXCIsIGBSZWFkIFRpbWUgTGVmdCAwMDowNSBzZWNvbmRgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGhvdXJzID09IDAgJiYgbWludXRlcyA9PSAwICYmIHNlY29uZHMgPT0gMCkge1xuICAgICAgICAgICAgY2hyb21lLmFsYXJtcy5jbGVhcihhbGFybXMubmFtZSk7XG4gICAgICAgICAgICAvLyBTdGFydCBicmVhayB0aW1lciBpZiBicmVhayB0aW1lIGV4aXN0c1xuICAgICAgICAgICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuZ2V0KFwidGltZURldGFpbHNcIiwgKHJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQudGltZURldGFpbHMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdC50aW1lRGV0YWlscy5icmVha1RpbWUuc3BsaXQoXCI6XCIpWzBdICE9IFwiMDBcIiB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnRpbWVEZXRhaWxzLmJyZWFrVGltZS5zcGxpdChcIjpcIilbMV0gIT0gXCIwMFwiIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQudGltZURldGFpbHMuYnJlYWtUaW1lLnNwbGl0KFwiOlwiKVsyXSAhPSBcIjAwXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQudGltZURldGFpbHMuYnJlYWtUaW1lLnNwbGl0KFwiOlwiKS5sZW5ndGggPT0gMykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhvdXJzID0gcGFyc2VJbnQocmVzdWx0LnRpbWVEZXRhaWxzLmJyZWFrVGltZS5zcGxpdChcIjpcIilbMF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pbnV0ZXMgPSBwYXJzZUludChyZXN1bHQudGltZURldGFpbHMuYnJlYWtUaW1lLnNwbGl0KFwiOlwiKVsxXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2Vjb25kcyA9IHBhcnNlSW50KHJlc3VsdC50aW1lRGV0YWlscy5icmVha1RpbWUuc3BsaXQoXCI6XCIpWzJdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pbnV0ZXMgPSBwYXJzZUludChyZXN1bHQudGltZURldGFpbHMuYnJlYWtUaW1lLnNwbGl0KFwiOlwiKVswXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2Vjb25kcyA9IHBhcnNlSW50KHJlc3VsdC50aW1lRGV0YWlscy5icmVha1RpbWUuc3BsaXQoXCI6XCIpWzFdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNyZWF0ZVRpbWVyQWxhcm0oXCJicmVha1RpbWVyXCIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZiAoYWxhcm1zLm5hbWUgPT0gXCJicmVha1RpbWVyXCIpIHtcbiAgICAgICAgLy8gSGFuZGxlIGJyZWFrIHRpbWVyIGxvZ2ljXG4gICAgICAgIGlmIChob3VycyA9PSAwICYmIG1pbnV0ZXMgPT0gMCAmJiBzZWNvbmRzID09IDApIHtcbiAgICAgICAgICAgIGlmICh0aW1lRGV0YWlscy5yZWFkVGltZS5zcGxpdChcIjpcIikubGVuZ3RoID09IDIgJiZcbiAgICAgICAgICAgICAgICAodGltZURldGFpbHMucmVhZFRpbWUuc3BsaXQoXCI6XCIpWzBdICE9IFwiMDBcIiB8fFxuICAgICAgICAgICAgICAgICAgICB0aW1lRGV0YWlscy5yZWFkVGltZS5zcGxpdChcIjpcIilbMV0gIT0gXCIwMFwiKSkge1xuICAgICAgICAgICAgICAgIHNlbmROb3RpZmljYXRpb25Gb3JGaW5pc2hpbmdUaW1lKFwiQnJlYWsgVGltZVwiLCBgQnJlYWsgVGltZSBGaW5pc2hlZCwgWW91IGNhbiBzdGFydCBhZ2FpbmApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodGltZURldGFpbHMucmVhZFRpbWUuc3BsaXQoXCI6XCIpLmxlbmd0aCA9PSAzICYmXG4gICAgICAgICAgICAgICAgKHRpbWVEZXRhaWxzLnJlYWRUaW1lLnNwbGl0KFwiOlwiKVswXSAhPSBcIjAwXCIgfHxcbiAgICAgICAgICAgICAgICAgICAgdGltZURldGFpbHMucmVhZFRpbWUuc3BsaXQoXCI6XCIpWzFdICE9IFwiMDBcIiB8fFxuICAgICAgICAgICAgICAgICAgICB0aW1lRGV0YWlscy5yZWFkVGltZS5zcGxpdChcIjpcIilbMl0gIT0gXCIwMFwiKSkge1xuICAgICAgICAgICAgICAgIHNlbmROb3RpZmljYXRpb25Gb3JGaW5pc2hpbmdUaW1lKFwiQnJlYWsgVGltZVwiLCBgQnJlYWsgVGltZSBGaW5pc2hlZCwgWW91IGNhbiBzdGFydCBhZ2FpbmApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2hyb21lLmFsYXJtcy5jbGVhcihcImJyZWFrVGltZXJcIik7XG4gICAgICAgIH1cbiAgICAgICAgY2hyb21lLnRhYnMucXVlcnkoe30sICh0YWJzKSA9PiB7XG4gICAgICAgICAgICB0YWJzLmZvckVhY2goKHRhYikgPT4ge1xuICAgICAgICAgICAgICAgIGNocm9tZS5zY3JpcHRpbmcuZXhlY3V0ZVNjcmlwdCh7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldDogeyB0YWJJZDogdGFiLmlkIH0sXG4gICAgICAgICAgICAgICAgICAgIGZpbGVzOiBbXCJjb250ZW50LmpzXCJdLFxuICAgICAgICAgICAgICAgIH0sICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vIFNlbmQgbWVzc2FnZSBvbmx5IGFmdGVyIHN1Y2Nlc3NmdWwgaW5qZWN0aW9uXG4gICAgICAgICAgICAgICAgICAgIGNocm9tZS50YWJzLnNlbmRNZXNzYWdlKHRhYi5pZCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiBob3VycyA9PSAwICYmIG1pbnV0ZXMgPT0gMCAmJiBzZWNvbmRzID09IDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IFwic3RhcnRCcmVha0VuZFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBcInN0YXJ0QnJlYWtcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHsgaG91cnM6IGhvdXJzLCBtaW51dGVzOiBtaW51dGVzLCBzZWNvbmRzOiBzZWNvbmRzIH0sXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbn0pO1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9