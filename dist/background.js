/******/ (() => { // webpackBootstrap
/*!**************************************!*\
  !*** ./src/background/background.ts ***!
  \**************************************/
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
function createTimerAlarm(alarm) {
    chrome.alarms.create(alarm, { periodInMinutes: 1 / 60 });
}
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
            // End break
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach((tab) => {
                    chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: () => {
                            var _a;
                            // Remove the modal
                            (_a = document.getElementById("breakModal")) === null || _a === void 0 ? void 0 : _a.remove();
                        },
                    });
                });
            });
            chrome.runtime.sendMessage({ action: "startBreakEnd" });
            chrome.alarms.clear("breakTimer");
        }
        else {
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

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2dyb3VuZC5qcyIsIm1hcHBpbmdzIjoiOzs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJCQUEyQix5Q0FBeUM7QUFDcEU7QUFDQTtBQUNBLDJCQUEyQixvREFBb0Q7QUFDL0U7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUJBQXVCLHlDQUF5QztBQUNoRTtBQUNBO0FBQ0E7QUFDQTtBQUNBLCtCQUErQix5Q0FBeUM7QUFDeEU7QUFDQTtBQUNBLCtCQUErQixvREFBb0Q7QUFDbkY7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQSwrQkFBK0IsdUNBQXVDO0FBQ3RFO0FBQ0E7QUFDQSwrQkFBK0Isb0RBQW9EO0FBQ25GO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUJBQXVCLDJEQUEyRDtBQUNsRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQSwrQkFBK0Isb0RBQW9EO0FBQ25GO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSx1QkFBdUIsa0RBQWtEO0FBQ3pFO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQSxtREFBbUQsa0JBQWtCLGdCQUFnQjtBQUNyRixLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtDQUFrQyx5QkFBeUI7QUFDM0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvQkFBb0Isa0RBQWtEO0FBQ3RFLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdDQUFnQztBQUNoQztBQUNBO0FBQ0Esa0NBQWtDLGVBQWU7QUFDakQ7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5QkFBeUI7QUFDekIscUJBQXFCO0FBQ3JCLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2IseUNBQXlDLHlCQUF5QjtBQUNsRTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdDQUFnQztBQUNoQztBQUNBO0FBQ0Esa0NBQWtDLGVBQWU7QUFDakQ7QUFDQSxxQkFBcUI7QUFDckIsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0Esd0JBQXdCLGtEQUFrRDtBQUMxRSxhQUFhO0FBQ2I7QUFDQTtBQUNBLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUIsa0RBQWtEO0FBQ25FLFFBQVE7QUFDUjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQSxPQUFPO0FBQ1AsMkJBQTJCO0FBQzNCO0FBQ0E7QUFDQSx1QkFBdUIsZ0JBQWdCO0FBQ3ZDO0FBQ0EsWUFBWTtBQUNaLFVBQVU7QUFDVixRQUFRO0FBQ1I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQixrREFBa0Q7QUFDbkUsUUFBUTtBQUNSO0FBQ0EsSUFBSSIsInNvdXJjZXMiOlsid2VicGFjazovLy8uL3NyYy9iYWNrZ3JvdW5kL2JhY2tncm91bmQudHMiXSwic291cmNlc0NvbnRlbnQiOlsibGV0IGhvdXJzID0gMDtcbmxldCBtaW51dGVzID0gMDtcbmxldCBzZWNvbmRzID0gMDtcbi8vIExpc3RlbiBmb3IgbWVzc2FnZXMgZnJvbSBjb250ZW50IG9yIHBvcHVwIHNjcmlwdHNcbmNocm9tZS5ydW50aW1lLm9uTWVzc2FnZS5hZGRMaXN0ZW5lcigocmVxdWVzdCwgc2VuZGVyLCBzZW5kUmVzcG9uc2UpID0+IHtcbiAgICBsZXQgcmVzcG9uc2VNZXNzYWdlID0gXCJcIjtcbiAgICBjb25zb2xlLmxvZyhyZXF1ZXN0KTtcbiAgICAvLyBIYW5kbGUgZGlmZmVyZW50IG1lc3NhZ2UgdHlwZXNcbiAgICBpZiAocmVxdWVzdC5tZXNzYWdlID09PSBcInN0YXJ0XCIpIHtcbiAgICAgICAgaWYgKHJlcXVlc3QuZGF0YSkge1xuICAgICAgICAgICAgc3RvcmVUaW1lclZhbHVlc0xvY2FsbHkocmVxdWVzdC5kYXRhLCBcInJ1bm5pbmdcIik7XG4gICAgICAgICAgICByZXNwb25zZU1lc3NhZ2UgPSBcIlRpbWUgZGF0YSBzdG9yZWQgc3VjY2Vzc2Z1bGx5LlwiO1xuICAgICAgICAgICAgaWYgKHJlcXVlc3QuZGF0YS5yZWFkVGltZS5zcGxpdChcIjpcIilbMF0gIT0gXCIwMFwiIHx8XG4gICAgICAgICAgICAgICAgcmVxdWVzdC5kYXRhLnJlYWRUaW1lLnNwbGl0KFwiOlwiKVsxXSAhPSBcIjAwXCIgfHxcbiAgICAgICAgICAgICAgICByZXF1ZXN0LmRhdGEucmVhZFRpbWUuc3BsaXQoXCI6XCIpWzJdICE9IFwiMDBcIikge1xuICAgICAgICAgICAgICAgIGlmIChyZXF1ZXN0LmRhdGEucmVhZFRpbWUuc3BsaXQoXCI6XCIpLmxlbmd0aCA9PSAzKSB7XG4gICAgICAgICAgICAgICAgICAgIGhvdXJzID0gcGFyc2VJbnQocmVxdWVzdC5kYXRhLnJlYWRUaW1lLnNwbGl0KFwiOlwiKVswXSk7XG4gICAgICAgICAgICAgICAgICAgIG1pbnV0ZXMgPSBwYXJzZUludChyZXF1ZXN0LmRhdGEucmVhZFRpbWUuc3BsaXQoXCI6XCIpWzFdKTtcbiAgICAgICAgICAgICAgICAgICAgc2Vjb25kcyA9IHBhcnNlSW50KHJlcXVlc3QuZGF0YS5yZWFkVGltZS5zcGxpdChcIjpcIilbMl0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbWludXRlcyA9IHBhcnNlSW50KHJlcXVlc3QuZGF0YS5yZWFkVGltZS5zcGxpdChcIjpcIilbMF0pO1xuICAgICAgICAgICAgICAgICAgICBzZWNvbmRzID0gcGFyc2VJbnQocmVxdWVzdC5kYXRhLnJlYWRUaW1lLnNwbGl0KFwiOlwiKVsxXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNyZWF0ZVRpbWVyQWxhcm0oXCJ0aW1lclwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IHRydWUsIG1lc3NhZ2U6IHJlc3BvbnNlTWVzc2FnZSB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IGZhbHNlLCBtZXNzYWdlOiBcIk5vIHRpbWVyIGRhdGEgcHJvdmlkZWQuXCIgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZiAocmVxdWVzdC5tZXNzYWdlID09PSBcInN0b3BcIikge1xuICAgICAgICAvLyBTdG9wIGFjdGlvbiBsb2dpY1xuICAgICAgICByZXNwb25zZU1lc3NhZ2UgPSBcIlRpbWUgZGF0YSBzdG9wcGVkIHN1Y2Nlc3NmdWxseS5cIjtcbiAgICAgICAgY2hyb21lLmFsYXJtcy5jbGVhcihcInRpbWVyXCIpO1xuICAgICAgICBsZXQgZGF0YSA9IHtcbiAgICAgICAgICAgIGhvdXJzOiBob3VycyxcbiAgICAgICAgICAgIG1pbnV0ZXM6IG1pbnV0ZXMsXG4gICAgICAgICAgICBzZWNvbmRzOiBzZWNvbmRzLFxuICAgICAgICB9O1xuICAgICAgICBzdG9yZVN0b3BUaW1lclZhbHVlc0xvY2FsbHkoZGF0YSk7XG4gICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IHRydWUsIG1lc3NhZ2U6IHJlc3BvbnNlTWVzc2FnZSB9KTtcbiAgICB9XG4gICAgZWxzZSBpZiAocmVxdWVzdC5tZXNzYWdlID09PSBcImdldFwiKSB7XG4gICAgICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldChcInRpbWVEZXRhaWxzXCIsIChyZXN1bHQpID0+IHtcbiAgICAgICAgICAgIGlmIChyZXN1bHQudGltZURldGFpbHMpIHtcbiAgICAgICAgICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiB0cnVlLCBkYXRhOiByZXN1bHQudGltZURldGFpbHMgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiBmYWxzZSwgbWVzc2FnZTogXCJObyB0aW1lciBkYXRhIHByb3ZpZGVkLlwiIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgZWxzZSBpZiAocmVxdWVzdC5tZXNzYWdlID09PSBcImdldFN0b3BcIikge1xuICAgICAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoXCJzdG9wVGltZXJcIiwgKHJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgaWYgKHJlc3VsdC5zdG9wVGltZXIpIHtcbiAgICAgICAgICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiB0cnVlLCBkYXRhOiByZXN1bHQuc3RvcFRpbWVyIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogZmFsc2UsIG1lc3NhZ2U6IFwiTm8gdGltZXIgZGF0YSBwcm92aWRlZC5cIiB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKHJlcXVlc3QubWVzc2FnZSA9PSBcInJlc2V0XCIpIHtcbiAgICAgICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuY2xlYXIoKTtcbiAgICAgICAgY2hyb21lLmFsYXJtcy5jbGVhcihcInRpbWVyXCIpO1xuICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiB0cnVlLCBtZXNzYWdlOiBcIlRpbWUgZGF0YSBjbGVhcmVkIHN1Y2Nlc3NmdWxseS5cIiB9KTtcbiAgICB9XG4gICAgZWxzZSBpZiAocmVxdWVzdC5tZXNzYWdlID09IFwicmVzdW1lXCIpIHtcbiAgICAgICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuZ2V0KFwic3RvcFRpbWVyXCIsIChyZXN1bHQpID0+IHtcbiAgICAgICAgICAgIGlmIChyZXN1bHQuc3RvcFRpbWVyKSB7XG4gICAgICAgICAgICAgICAgaG91cnMgPSByZXN1bHQuc3RvcFRpbWVyLmhvdXJzO1xuICAgICAgICAgICAgICAgIG1pbnV0ZXMgPSByZXN1bHQuc3RvcFRpbWVyLm1pbnV0ZXM7XG4gICAgICAgICAgICAgICAgc2Vjb25kcyA9IHJlc3VsdC5zdG9wVGltZXIuc2Vjb25kcztcbiAgICAgICAgICAgICAgICBjcmVhdGVUaW1lckFsYXJtKFwidGltZXJcIik7XG4gICAgICAgICAgICAgICAgc2VuZFJlc3BvbnNlKHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogXCJUaW1lIGRhdGEgcmVzdW1lZCBzdWNjZXNzZnVsbHkuXCIsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiBmYWxzZSwgbWVzc2FnZTogXCJObyB0aW1lciBkYXRhIHByb3ZpZGVkLlwiIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IGZhbHNlLCBtZXNzYWdlOiBcIlVua25vd24gbWVzc2FnZSB0eXBlLlwiIH0pO1xuICAgIH1cbiAgICAvLyBJbmRpY2F0ZSB0aGF0IHRoZSByZXNwb25zZSB3aWxsIGJlIHNlbnQgYXN5bmNocm9ub3VzbHlcbiAgICByZXR1cm4gdHJ1ZTtcbn0pO1xuLy8gRnVuY3Rpb24gdG8gc3RvcmUgdGltZXIgdmFsdWVzIGxvY2FsbHlcbmZ1bmN0aW9uIHN0b3JlVGltZXJWYWx1ZXNMb2NhbGx5KHRpbWVyVmFsdWVzLCBzdGF0dXMpIHtcbiAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoe1xuICAgICAgICB0aW1lRGV0YWlsczogT2JqZWN0LmFzc2lnbihPYmplY3QuYXNzaWduKHt9LCB0aW1lclZhbHVlcyksIHsgc3RhdHVzOiBzdGF0dXMgfSksXG4gICAgfSk7XG59XG4vL0Z1bmN0aW9uIHRvIHN0b3JlIHN0b3AgdGltZXIgdmFsdWUgbG9jYWxseVxuZnVuY3Rpb24gc3RvcmVTdG9wVGltZXJWYWx1ZXNMb2NhbGx5KHRpbWVyVmFsdWVzKSB7XG4gICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KHtcbiAgICAgICAgc3RvcFRpbWVyOiB0aW1lclZhbHVlcyxcbiAgICB9KTtcbn1cbi8vIEZ1bmN0aW9uIHRvIHVwZGF0ZSB0aW1lciB2YWx1ZXMgbG9jYWxseVxuZnVuY3Rpb24gdXBkYXRlVGltZXJWYWx1ZXNMb2NhbGx5KHRpbWVyVmFsdWVzLCBzdGF0dXMpIHtcbiAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5jbGVhcigpO1xuICAgIHN0b3JlVGltZXJWYWx1ZXNMb2NhbGx5KHRpbWVyVmFsdWVzLCBzdGF0dXMpO1xufVxuZnVuY3Rpb24gY3JlYXRlVGltZXJBbGFybShhbGFybSkge1xuICAgIGNocm9tZS5hbGFybXMuY3JlYXRlKGFsYXJtLCB7IHBlcmlvZEluTWludXRlczogMSAvIDYwIH0pO1xufVxuY2hyb21lLmFsYXJtcy5vbkFsYXJtLmFkZExpc3RlbmVyKChhbGFybXMpID0+IHtcbiAgICBpZiAoaG91cnMgPj0gMCkge1xuICAgICAgICBpZiAoc2Vjb25kcyA9PSAwICYmIG1pbnV0ZXMgPT0gMCAmJiBob3VycyA9PSAwKSB7XG4gICAgICAgICAgICBjaHJvbWUuYWxhcm1zLmNsZWFyKGFsYXJtcy5uYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChzZWNvbmRzID09IDAgJiYgbWludXRlcyA9PSAwICYmIGhvdXJzICE9IDApIHtcbiAgICAgICAgICAgIGhvdXJzLS07XG4gICAgICAgICAgICBtaW51dGVzID0gNTk7XG4gICAgICAgICAgICBzZWNvbmRzID0gNTk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoc2Vjb25kcyA9PSAwICYmIG1pbnV0ZXMgIT0gMCkge1xuICAgICAgICAgICAgbWludXRlcy0tO1xuICAgICAgICAgICAgc2Vjb25kcyA9IDU5O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgc2Vjb25kcy0tO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBpZiAoc2Vjb25kcyA9PSAwICYmIG1pbnV0ZXMgPT0gMCkge1xuICAgICAgICAgICAgY2hyb21lLmFsYXJtcy5jbGVhcihhbGFybXMubmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoc2Vjb25kcyA9PSAwICYmIG1pbnV0ZXMgIT0gMCkge1xuICAgICAgICAgICAgbWludXRlcy0tO1xuICAgICAgICAgICAgc2Vjb25kcyA9IDU5O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgc2Vjb25kcy0tO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChhbGFybXMubmFtZSA9PSBcInRpbWVyXCIpIHtcbiAgICAgICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2Uoe1xuICAgICAgICAgICAgbWVzc2FnZTogXCJ0aW1lclwiLFxuICAgICAgICAgICAgZGF0YTogeyBob3VyczogaG91cnMsIG1pbnV0ZXM6IG1pbnV0ZXMsIHNlY29uZHM6IHNlY29uZHMgfSxcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChob3VycyA9PSAwICYmIG1pbnV0ZXMgPT0gMCAmJiBzZWNvbmRzID09IDApIHtcbiAgICAgICAgICAgIGNocm9tZS5hbGFybXMuY2xlYXIoYWxhcm1zLm5hbWUpO1xuICAgICAgICAgICAgLy8gU3RhcnQgYnJlYWsgdGltZXIgaWYgYnJlYWsgdGltZSBleGlzdHNcbiAgICAgICAgICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldChcInRpbWVEZXRhaWxzXCIsIChyZXN1bHQpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0LnRpbWVEZXRhaWxzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQudGltZURldGFpbHMuYnJlYWtUaW1lLnNwbGl0KFwiOlwiKVswXSAhPSBcIjAwXCIgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC50aW1lRGV0YWlscy5icmVha1RpbWUuc3BsaXQoXCI6XCIpWzFdICE9IFwiMDBcIiB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnRpbWVEZXRhaWxzLmJyZWFrVGltZS5zcGxpdChcIjpcIilbMl0gIT0gXCIwMFwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0LnRpbWVEZXRhaWxzLmJyZWFrVGltZS5zcGxpdChcIjpcIikubGVuZ3RoID09IDMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBob3VycyA9IHBhcnNlSW50KHJlc3VsdC50aW1lRGV0YWlscy5icmVha1RpbWUuc3BsaXQoXCI6XCIpWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaW51dGVzID0gcGFyc2VJbnQocmVzdWx0LnRpbWVEZXRhaWxzLmJyZWFrVGltZS5zcGxpdChcIjpcIilbMV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlY29uZHMgPSBwYXJzZUludChyZXN1bHQudGltZURldGFpbHMuYnJlYWtUaW1lLnNwbGl0KFwiOlwiKVsyXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaW51dGVzID0gcGFyc2VJbnQocmVzdWx0LnRpbWVEZXRhaWxzLmJyZWFrVGltZS5zcGxpdChcIjpcIilbMF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlY29uZHMgPSBwYXJzZUludChyZXN1bHQudGltZURldGFpbHMuYnJlYWtUaW1lLnNwbGl0KFwiOlwiKVsxXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjcmVhdGVUaW1lckFsYXJtKFwiYnJlYWtUaW1lclwiKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKGFsYXJtcy5uYW1lID09IFwiYnJlYWtUaW1lclwiKSB7XG4gICAgICAgIC8vIEhhbmRsZSBicmVhayB0aW1lciBsb2dpY1xuICAgICAgICBpZiAoaG91cnMgPT0gMCAmJiBtaW51dGVzID09IDAgJiYgc2Vjb25kcyA9PSAwKSB7XG4gICAgICAgICAgICAvLyBFbmQgYnJlYWtcbiAgICAgICAgICAgIGNocm9tZS50YWJzLnF1ZXJ5KHt9LCAodGFicykgPT4ge1xuICAgICAgICAgICAgICAgIHRhYnMuZm9yRWFjaCgodGFiKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNocm9tZS5zY3JpcHRpbmcuZXhlY3V0ZVNjcmlwdCh7XG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQ6IHsgdGFiSWQ6IHRhYi5pZCB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgZnVuYzogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBfYTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBSZW1vdmUgdGhlIG1vZGFsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKF9hID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJicmVha01vZGFsXCIpKSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2UoeyBhY3Rpb246IFwic3RhcnRCcmVha0VuZFwiIH0pO1xuICAgICAgICAgICAgY2hyb21lLmFsYXJtcy5jbGVhcihcImJyZWFrVGltZXJcIik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyBVcGRhdGUgYnJlYWsgdGltZXIgb3Igc3RhcnQgaWYgbm90IGluamVjdGVkXG4gICAgICAgICAgICBjaHJvbWUudGFicy5xdWVyeSh7fSwgKHRhYnMpID0+IHtcbiAgICAgICAgICAgICAgICB0YWJzLmZvckVhY2goKHRhYikgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjaHJvbWUuc2NyaXB0aW5nLmV4ZWN1dGVTY3JpcHQoe1xuICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0OiB7IHRhYklkOiB0YWIuaWQgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVzOiBbXCJjb250ZW50LmpzXCJdLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2Uoe1xuICAgICAgICAgICAgICAgIGFjdGlvbjogXCJzdGFydEJyZWFrXCIsXG4gICAgICAgICAgICAgICAgZGF0YTogeyBob3VyczogaG91cnMsIG1pbnV0ZXM6IG1pbnV0ZXMsIHNlY29uZHM6IHNlY29uZHMgfSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxufSk7XG4vLyBjaHJvbWUuYWxhcm1zLm9uQWxhcm0uYWRkTGlzdGVuZXIoKGFsYXJtcykgPT4ge1xuLy8gICBpZiAoaG91cnMgPj0gMCkge1xuLy8gICAgIGlmIChzZWNvbmRzID09IDAgJiYgbWludXRlcyA9PSAwICYmIGhvdXJzID09IDApIHtcbi8vICAgICAgIGNocm9tZS5hbGFybXMuY2xlYXIoYWxhcm1zLm5hbWUpO1xuLy8gICAgIH0gZWxzZSBpZiAoc2Vjb25kcyA9PSAwICYmIG1pbnV0ZXMgPT0gMCAmJiBob3VycyAhPSAwKSB7XG4vLyAgICAgICBob3Vycy0tO1xuLy8gICAgICAgbWludXRlcyA9IDU5O1xuLy8gICAgICAgc2Vjb25kcyA9IDU5O1xuLy8gICAgIH0gZWxzZSBpZiAoc2Vjb25kcyA9PSAwICYmIG1pbnV0ZXMgIT0gMCkge1xuLy8gICAgICAgbWludXRlcy0tO1xuLy8gICAgICAgc2Vjb25kcyA9IDU5O1xuLy8gICAgIH0gZWxzZSB7XG4vLyAgICAgICBzZWNvbmRzLS07XG4vLyAgICAgfVxuLy8gICB9IGVsc2Uge1xuLy8gICAgIGlmIChzZWNvbmRzID09IDAgJiYgbWludXRlcyA9PSAwKSB7XG4vLyAgICAgICBjaHJvbWUuYWxhcm1zLmNsZWFyKGFsYXJtcy5uYW1lKTtcbi8vICAgICB9IGVsc2UgaWYgKHNlY29uZHMgPT0gMCAmJiBtaW51dGVzICE9IDApIHtcbi8vICAgICAgIG1pbnV0ZXMtLTtcbi8vICAgICAgIHNlY29uZHMgPSA1OTtcbi8vICAgICB9IGVsc2Uge1xuLy8gICAgICAgc2Vjb25kcy0tO1xuLy8gICAgIH1cbi8vICAgfVxuLy8gICBpZiAoYWxhcm1zLm5hbWUgPT0gXCJ0aW1lclwiKSB7XG4vLyAgICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2Uoe1xuLy8gICAgICAgbWVzc2FnZTogXCJ0aW1lclwiLFxuLy8gICAgICAgZGF0YTogeyBob3VyczogaG91cnMsIG1pbnV0ZXM6IG1pbnV0ZXMsIHNlY29uZHM6IHNlY29uZHMgfSxcbi8vICAgICB9KTtcbi8vICAgICBpZiAoaG91cnMgPT0gMCAmJiBtaW51dGVzID09IDAgJiYgc2Vjb25kcyA9PSAwKSB7XG4vLyAgICAgICBjaHJvbWUuYWxhcm1zLmNsZWFyKGFsYXJtcy5uYW1lKTtcbi8vICAgICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldChcInRpbWVEZXRhaWxzXCIsIChyZXN1bHQpID0+IHtcbi8vICAgICAgICAgaWYgKHJlc3VsdC50aW1lRGV0YWlscykge1xuLy8gICAgICAgICAgIGlmIChcbi8vICAgICAgICAgICAgIHJlc3VsdC50aW1lRGV0YWlscy5icmVha1RpbWUuc3BsaXQoXCI6XCIpWzBdICE9IFwiMDBcIiB8fFxuLy8gICAgICAgICAgICAgcmVzdWx0LnRpbWVEZXRhaWxzLmJyZWFrVGltZS5zcGxpdChcIjpcIilbMV0gIT0gXCIwMFwiIHx8XG4vLyAgICAgICAgICAgICByZXN1bHQudGltZURldGFpbHMuYnJlYWtUaW1lLnNwbGl0KFwiOlwiKVsyXSAhPSBcIjAwXCJcbi8vICAgICAgICAgICApIHtcbi8vICAgICAgICAgICAgIGlmIChyZXN1bHQudGltZURldGFpbHMuYnJlYWtUaW1lLnNwbGl0KFwiOlwiKS5sZW5ndGggPT0gMykge1xuLy8gICAgICAgICAgICAgICBob3VycyA9IHBhcnNlSW50KHJlc3VsdC50aW1lRGV0YWlscy5icmVha1RpbWUuc3BsaXQoXCI6XCIpWzBdKTtcbi8vICAgICAgICAgICAgICAgbWludXRlcyA9IHBhcnNlSW50KHJlc3VsdC50aW1lRGV0YWlscy5icmVha1RpbWUuc3BsaXQoXCI6XCIpWzFdKTtcbi8vICAgICAgICAgICAgICAgc2Vjb25kcyA9IHBhcnNlSW50KHJlc3VsdC50aW1lRGV0YWlscy5icmVha1RpbWUuc3BsaXQoXCI6XCIpWzJdKTtcbi8vICAgICAgICAgICAgIH0gZWxzZSB7XG4vLyAgICAgICAgICAgICAgIG1pbnV0ZXMgPSBwYXJzZUludChyZXN1bHQudGltZURldGFpbHMuYnJlYWtUaW1lLnNwbGl0KFwiOlwiKVswXSk7XG4vLyAgICAgICAgICAgICAgIHNlY29uZHMgPSBwYXJzZUludChyZXN1bHQudGltZURldGFpbHMuYnJlYWtUaW1lLnNwbGl0KFwiOlwiKVsxXSk7XG4vLyAgICAgICAgICAgICB9XG4vLyAgICAgICAgICAgICBjcmVhdGVUaW1lckFsYXJtKFwiYnJlYWtUaW1lclwiKTtcbi8vICAgICAgICAgICB9XG4vLyAgICAgICAgIH1cbi8vICAgICAgIH0pO1xuLy8gICAgIH1cbi8vICAgfSBlbHNlIGlmIChhbGFybXMubmFtZSA9PSBcImJyZWFrVGltZXJcIikge1xuLy8gICAgIGNocm9tZS50YWJzLnF1ZXJ5KHt9LCAodGFicykgPT4ge1xuLy8gICAgICAgdGFicy5mb3JFYWNoKCh0YWJzKSA9PiB7XG4vLyAgICAgICAgIGNocm9tZS5zY3JpcHRpbmcuZXhlY3V0ZVNjcmlwdCh7XG4vLyAgICAgICAgICAgdGFyZ2V0OiB7IHRhYklkOiB0YWJzLmlkIH0sXG4vLyAgICAgICAgICAgZmlsZXM6IFtcImNvbnRlbnQuanNcIl0sXG4vLyAgICAgICAgIH0pO1xuLy8gICAgICAgfSk7XG4vLyAgICAgfSk7XG4vLyAgICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2Uoe1xuLy8gICAgICAgYWN0aW9uOlxuLy8gICAgICAgICBob3VycyA9PSAwICYmIG1pbnV0ZXMgPT0gMCAmJiBzZWNvbmRzID09IDBcbi8vICAgICAgICAgICA/IFwic3RhcnRCcmVha0VuZFwiXG4vLyAgICAgICAgICAgOiBcInN0YXJ0QnJlYWtcIixcbi8vICAgICAgIGRhdGE6IHsgaG91cnM6IGhvdXJzLCBtaW51dGVzOiBtaW51dGVzLCBzZWNvbmRzOiBzZWNvbmRzIH0sXG4vLyAgICAgfSk7XG4vLyAgIH1cbi8vIH0pO1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9