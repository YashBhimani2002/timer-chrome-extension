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
                        func: (timeData) => {
                            let modal = document.getElementById("breakModal");
                            if (!modal) {
                                modal = document.createElement("div");
                                modal.id = "breakModal";
                                modal.setAttribute("style", `
                  position: fixed;
                  top: 0;
                  left: 0;
                  width: 100vw;
                  height: 100vh;
                  background-color: rgba(0, 0, 0, 0.8);
                  color: white;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  z-index: 999999;
                  font-size: 24px;
                  pointer-events: all;
                  `);
                                modal.innerHTML = `
                <body>
                  <div>
                    <h1>Break Time!</h1>
                    <p>Relax for a while. This will end in <span id="breakTimer"></span> seconds.</p>
                  </div>
                </body>
                `;
                                document.body.appendChild(modal);
                            }
                            const timerElement = document.getElementById("breakTimer");
                            if (timerElement) {
                                timerElement.textContent = `${timeData.hours}:${timeData.minutes}:${timeData.seconds}`;
                            }
                        },
                        args: [{ hours, minutes, seconds }],
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCLGtEQUFrRDtBQUNuRSxRQUFRO0FBQ1I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0EsT0FBTztBQUNQLDJCQUEyQjtBQUMzQjtBQUNBO0FBQ0EsdUJBQXVCLGdCQUFnQjtBQUN2QztBQUNBLFlBQVk7QUFDWixVQUFVO0FBQ1YsUUFBUTtBQUNSO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUIsa0RBQWtEO0FBQ25FLFFBQVE7QUFDUjtBQUNBLElBQUkiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9zcmMvYmFja2dyb3VuZC9iYWNrZ3JvdW5kLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImxldCBob3VycyA9IDA7XG5sZXQgbWludXRlcyA9IDA7XG5sZXQgc2Vjb25kcyA9IDA7XG4vLyBMaXN0ZW4gZm9yIG1lc3NhZ2VzIGZyb20gY29udGVudCBvciBwb3B1cCBzY3JpcHRzXG5jaHJvbWUucnVudGltZS5vbk1lc3NhZ2UuYWRkTGlzdGVuZXIoKHJlcXVlc3QsIHNlbmRlciwgc2VuZFJlc3BvbnNlKSA9PiB7XG4gICAgbGV0IHJlc3BvbnNlTWVzc2FnZSA9IFwiXCI7XG4gICAgY29uc29sZS5sb2cocmVxdWVzdCk7XG4gICAgLy8gSGFuZGxlIGRpZmZlcmVudCBtZXNzYWdlIHR5cGVzXG4gICAgaWYgKHJlcXVlc3QubWVzc2FnZSA9PT0gXCJzdGFydFwiKSB7XG4gICAgICAgIGlmIChyZXF1ZXN0LmRhdGEpIHtcbiAgICAgICAgICAgIHN0b3JlVGltZXJWYWx1ZXNMb2NhbGx5KHJlcXVlc3QuZGF0YSwgXCJydW5uaW5nXCIpO1xuICAgICAgICAgICAgcmVzcG9uc2VNZXNzYWdlID0gXCJUaW1lIGRhdGEgc3RvcmVkIHN1Y2Nlc3NmdWxseS5cIjtcbiAgICAgICAgICAgIGlmIChyZXF1ZXN0LmRhdGEucmVhZFRpbWUuc3BsaXQoXCI6XCIpWzBdICE9IFwiMDBcIiB8fFxuICAgICAgICAgICAgICAgIHJlcXVlc3QuZGF0YS5yZWFkVGltZS5zcGxpdChcIjpcIilbMV0gIT0gXCIwMFwiIHx8XG4gICAgICAgICAgICAgICAgcmVxdWVzdC5kYXRhLnJlYWRUaW1lLnNwbGl0KFwiOlwiKVsyXSAhPSBcIjAwXCIpIHtcbiAgICAgICAgICAgICAgICBpZiAocmVxdWVzdC5kYXRhLnJlYWRUaW1lLnNwbGl0KFwiOlwiKS5sZW5ndGggPT0gMykge1xuICAgICAgICAgICAgICAgICAgICBob3VycyA9IHBhcnNlSW50KHJlcXVlc3QuZGF0YS5yZWFkVGltZS5zcGxpdChcIjpcIilbMF0pO1xuICAgICAgICAgICAgICAgICAgICBtaW51dGVzID0gcGFyc2VJbnQocmVxdWVzdC5kYXRhLnJlYWRUaW1lLnNwbGl0KFwiOlwiKVsxXSk7XG4gICAgICAgICAgICAgICAgICAgIHNlY29uZHMgPSBwYXJzZUludChyZXF1ZXN0LmRhdGEucmVhZFRpbWUuc3BsaXQoXCI6XCIpWzJdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG1pbnV0ZXMgPSBwYXJzZUludChyZXF1ZXN0LmRhdGEucmVhZFRpbWUuc3BsaXQoXCI6XCIpWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgc2Vjb25kcyA9IHBhcnNlSW50KHJlcXVlc3QuZGF0YS5yZWFkVGltZS5zcGxpdChcIjpcIilbMV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjcmVhdGVUaW1lckFsYXJtKFwidGltZXJcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiB0cnVlLCBtZXNzYWdlOiByZXNwb25zZU1lc3NhZ2UgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiBmYWxzZSwgbWVzc2FnZTogXCJObyB0aW1lciBkYXRhIHByb3ZpZGVkLlwiIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKHJlcXVlc3QubWVzc2FnZSA9PT0gXCJzdG9wXCIpIHtcbiAgICAgICAgLy8gU3RvcCBhY3Rpb24gbG9naWNcbiAgICAgICAgcmVzcG9uc2VNZXNzYWdlID0gXCJUaW1lIGRhdGEgc3RvcHBlZCBzdWNjZXNzZnVsbHkuXCI7XG4gICAgICAgIGNocm9tZS5hbGFybXMuY2xlYXIoXCJ0aW1lclwiKTtcbiAgICAgICAgbGV0IGRhdGEgPSB7XG4gICAgICAgICAgICBob3VyczogaG91cnMsXG4gICAgICAgICAgICBtaW51dGVzOiBtaW51dGVzLFxuICAgICAgICAgICAgc2Vjb25kczogc2Vjb25kcyxcbiAgICAgICAgfTtcbiAgICAgICAgc3RvcmVTdG9wVGltZXJWYWx1ZXNMb2NhbGx5KGRhdGEpO1xuICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiB0cnVlLCBtZXNzYWdlOiByZXNwb25zZU1lc3NhZ2UgfSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKHJlcXVlc3QubWVzc2FnZSA9PT0gXCJnZXRcIikge1xuICAgICAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoXCJ0aW1lRGV0YWlsc1wiLCAocmVzdWx0KSA9PiB7XG4gICAgICAgICAgICBpZiAocmVzdWx0LnRpbWVEZXRhaWxzKSB7XG4gICAgICAgICAgICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogcmVzdWx0LnRpbWVEZXRhaWxzIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogZmFsc2UsIG1lc3NhZ2U6IFwiTm8gdGltZXIgZGF0YSBwcm92aWRlZC5cIiB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKHJlcXVlc3QubWVzc2FnZSA9PT0gXCJnZXRTdG9wXCIpIHtcbiAgICAgICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuZ2V0KFwic3RvcFRpbWVyXCIsIChyZXN1bHQpID0+IHtcbiAgICAgICAgICAgIGlmIChyZXN1bHQuc3RvcFRpbWVyKSB7XG4gICAgICAgICAgICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogcmVzdWx0LnN0b3BUaW1lciB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IGZhbHNlLCBtZXNzYWdlOiBcIk5vIHRpbWVyIGRhdGEgcHJvdmlkZWQuXCIgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIGlmIChyZXF1ZXN0Lm1lc3NhZ2UgPT0gXCJyZXNldFwiKSB7XG4gICAgICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLmNsZWFyKCk7XG4gICAgICAgIGNocm9tZS5hbGFybXMuY2xlYXIoXCJ0aW1lclwiKTtcbiAgICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogdHJ1ZSwgbWVzc2FnZTogXCJUaW1lIGRhdGEgY2xlYXJlZCBzdWNjZXNzZnVsbHkuXCIgfSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKHJlcXVlc3QubWVzc2FnZSA9PSBcInJlc3VtZVwiKSB7XG4gICAgICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldChcInN0b3BUaW1lclwiLCAocmVzdWx0KSA9PiB7XG4gICAgICAgICAgICBpZiAocmVzdWx0LnN0b3BUaW1lcikge1xuICAgICAgICAgICAgICAgIGhvdXJzID0gcmVzdWx0LnN0b3BUaW1lci5ob3VycztcbiAgICAgICAgICAgICAgICBtaW51dGVzID0gcmVzdWx0LnN0b3BUaW1lci5taW51dGVzO1xuICAgICAgICAgICAgICAgIHNlY29uZHMgPSByZXN1bHQuc3RvcFRpbWVyLnNlY29uZHM7XG4gICAgICAgICAgICAgICAgY3JlYXRlVGltZXJBbGFybShcInRpbWVyXCIpO1xuICAgICAgICAgICAgICAgIHNlbmRSZXNwb25zZSh7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IFwiVGltZSBkYXRhIHJlc3VtZWQgc3VjY2Vzc2Z1bGx5LlwiLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogZmFsc2UsIG1lc3NhZ2U6IFwiTm8gdGltZXIgZGF0YSBwcm92aWRlZC5cIiB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiBmYWxzZSwgbWVzc2FnZTogXCJVbmtub3duIG1lc3NhZ2UgdHlwZS5cIiB9KTtcbiAgICB9XG4gICAgLy8gSW5kaWNhdGUgdGhhdCB0aGUgcmVzcG9uc2Ugd2lsbCBiZSBzZW50IGFzeW5jaHJvbm91c2x5XG4gICAgcmV0dXJuIHRydWU7XG59KTtcbi8vIEZ1bmN0aW9uIHRvIHN0b3JlIHRpbWVyIHZhbHVlcyBsb2NhbGx5XG5mdW5jdGlvbiBzdG9yZVRpbWVyVmFsdWVzTG9jYWxseSh0aW1lclZhbHVlcywgc3RhdHVzKSB7XG4gICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KHtcbiAgICAgICAgdGltZURldGFpbHM6IE9iamVjdC5hc3NpZ24oT2JqZWN0LmFzc2lnbih7fSwgdGltZXJWYWx1ZXMpLCB7IHN0YXR1czogc3RhdHVzIH0pLFxuICAgIH0pO1xufVxuLy9GdW5jdGlvbiB0byBzdG9yZSBzdG9wIHRpbWVyIHZhbHVlIGxvY2FsbHlcbmZ1bmN0aW9uIHN0b3JlU3RvcFRpbWVyVmFsdWVzTG9jYWxseSh0aW1lclZhbHVlcykge1xuICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldCh7XG4gICAgICAgIHN0b3BUaW1lcjogdGltZXJWYWx1ZXMsXG4gICAgfSk7XG59XG4vLyBGdW5jdGlvbiB0byB1cGRhdGUgdGltZXIgdmFsdWVzIGxvY2FsbHlcbmZ1bmN0aW9uIHVwZGF0ZVRpbWVyVmFsdWVzTG9jYWxseSh0aW1lclZhbHVlcywgc3RhdHVzKSB7XG4gICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuY2xlYXIoKTtcbiAgICBzdG9yZVRpbWVyVmFsdWVzTG9jYWxseSh0aW1lclZhbHVlcywgc3RhdHVzKTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZVRpbWVyQWxhcm0oYWxhcm0pIHtcbiAgICBjaHJvbWUuYWxhcm1zLmNyZWF0ZShhbGFybSwgeyBwZXJpb2RJbk1pbnV0ZXM6IDEgLyA2MCB9KTtcbn1cbmNocm9tZS5hbGFybXMub25BbGFybS5hZGRMaXN0ZW5lcigoYWxhcm1zKSA9PiB7XG4gICAgaWYgKGhvdXJzID49IDApIHtcbiAgICAgICAgaWYgKHNlY29uZHMgPT0gMCAmJiBtaW51dGVzID09IDAgJiYgaG91cnMgPT0gMCkge1xuICAgICAgICAgICAgY2hyb21lLmFsYXJtcy5jbGVhcihhbGFybXMubmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoc2Vjb25kcyA9PSAwICYmIG1pbnV0ZXMgPT0gMCAmJiBob3VycyAhPSAwKSB7XG4gICAgICAgICAgICBob3Vycy0tO1xuICAgICAgICAgICAgbWludXRlcyA9IDU5O1xuICAgICAgICAgICAgc2Vjb25kcyA9IDU5O1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHNlY29uZHMgPT0gMCAmJiBtaW51dGVzICE9IDApIHtcbiAgICAgICAgICAgIG1pbnV0ZXMtLTtcbiAgICAgICAgICAgIHNlY29uZHMgPSA1OTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHNlY29uZHMtLTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgaWYgKHNlY29uZHMgPT0gMCAmJiBtaW51dGVzID09IDApIHtcbiAgICAgICAgICAgIGNocm9tZS5hbGFybXMuY2xlYXIoYWxhcm1zLm5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHNlY29uZHMgPT0gMCAmJiBtaW51dGVzICE9IDApIHtcbiAgICAgICAgICAgIG1pbnV0ZXMtLTtcbiAgICAgICAgICAgIHNlY29uZHMgPSA1OTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHNlY29uZHMtLTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoYWxhcm1zLm5hbWUgPT0gXCJ0aW1lclwiKSB7XG4gICAgICAgIGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKHtcbiAgICAgICAgICAgIG1lc3NhZ2U6IFwidGltZXJcIixcbiAgICAgICAgICAgIGRhdGE6IHsgaG91cnM6IGhvdXJzLCBtaW51dGVzOiBtaW51dGVzLCBzZWNvbmRzOiBzZWNvbmRzIH0sXG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoaG91cnMgPT0gMCAmJiBtaW51dGVzID09IDAgJiYgc2Vjb25kcyA9PSAwKSB7XG4gICAgICAgICAgICBjaHJvbWUuYWxhcm1zLmNsZWFyKGFsYXJtcy5uYW1lKTtcbiAgICAgICAgICAgIC8vIFN0YXJ0IGJyZWFrIHRpbWVyIGlmIGJyZWFrIHRpbWUgZXhpc3RzXG4gICAgICAgICAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoXCJ0aW1lRGV0YWlsc1wiLCAocmVzdWx0KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdC50aW1lRGV0YWlscykge1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0LnRpbWVEZXRhaWxzLmJyZWFrVGltZS5zcGxpdChcIjpcIilbMF0gIT0gXCIwMFwiIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQudGltZURldGFpbHMuYnJlYWtUaW1lLnNwbGl0KFwiOlwiKVsxXSAhPSBcIjAwXCIgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC50aW1lRGV0YWlscy5icmVha1RpbWUuc3BsaXQoXCI6XCIpWzJdICE9IFwiMDBcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdC50aW1lRGV0YWlscy5icmVha1RpbWUuc3BsaXQoXCI6XCIpLmxlbmd0aCA9PSAzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaG91cnMgPSBwYXJzZUludChyZXN1bHQudGltZURldGFpbHMuYnJlYWtUaW1lLnNwbGl0KFwiOlwiKVswXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWludXRlcyA9IHBhcnNlSW50KHJlc3VsdC50aW1lRGV0YWlscy5icmVha1RpbWUuc3BsaXQoXCI6XCIpWzFdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWNvbmRzID0gcGFyc2VJbnQocmVzdWx0LnRpbWVEZXRhaWxzLmJyZWFrVGltZS5zcGxpdChcIjpcIilbMl0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWludXRlcyA9IHBhcnNlSW50KHJlc3VsdC50aW1lRGV0YWlscy5icmVha1RpbWUuc3BsaXQoXCI6XCIpWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWNvbmRzID0gcGFyc2VJbnQocmVzdWx0LnRpbWVEZXRhaWxzLmJyZWFrVGltZS5zcGxpdChcIjpcIilbMV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY3JlYXRlVGltZXJBbGFybShcImJyZWFrVGltZXJcIik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmIChhbGFybXMubmFtZSA9PSBcImJyZWFrVGltZXJcIikge1xuICAgICAgICAvLyBIYW5kbGUgYnJlYWsgdGltZXIgbG9naWNcbiAgICAgICAgaWYgKGhvdXJzID09IDAgJiYgbWludXRlcyA9PSAwICYmIHNlY29uZHMgPT0gMCkge1xuICAgICAgICAgICAgLy8gRW5kIGJyZWFrXG4gICAgICAgICAgICBjaHJvbWUudGFicy5xdWVyeSh7fSwgKHRhYnMpID0+IHtcbiAgICAgICAgICAgICAgICB0YWJzLmZvckVhY2goKHRhYikgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjaHJvbWUuc2NyaXB0aW5nLmV4ZWN1dGVTY3JpcHQoe1xuICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0OiB7IHRhYklkOiB0YWIuaWQgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmM6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgX2E7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUmVtb3ZlIHRoZSBtb2RhbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChfYSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYnJlYWtNb2RhbFwiKSkgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKHsgYWN0aW9uOiBcInN0YXJ0QnJlYWtFbmRcIiB9KTtcbiAgICAgICAgICAgIGNocm9tZS5hbGFybXMuY2xlYXIoXCJicmVha1RpbWVyXCIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gVXBkYXRlIGJyZWFrIHRpbWVyIG9yIHN0YXJ0IGlmIG5vdCBpbmplY3RlZFxuICAgICAgICAgICAgY2hyb21lLnRhYnMucXVlcnkoe30sICh0YWJzKSA9PiB7XG4gICAgICAgICAgICAgICAgdGFicy5mb3JFYWNoKCh0YWIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY2hyb21lLnNjcmlwdGluZy5leGVjdXRlU2NyaXB0KHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldDogeyB0YWJJZDogdGFiLmlkIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5jOiAodGltZURhdGEpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgbW9kYWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJyZWFrTW9kYWxcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFtb2RhbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2RhbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZGFsLmlkID0gXCJicmVha01vZGFsXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZGFsLnNldEF0dHJpYnV0ZShcInN0eWxlXCIsIGBcclxuICAgICAgICAgICAgICAgICAgcG9zaXRpb246IGZpeGVkO1xyXG4gICAgICAgICAgICAgICAgICB0b3A6IDA7XHJcbiAgICAgICAgICAgICAgICAgIGxlZnQ6IDA7XHJcbiAgICAgICAgICAgICAgICAgIHdpZHRoOiAxMDB2dztcclxuICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAxMDB2aDtcclxuICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSgwLCAwLCAwLCAwLjgpO1xyXG4gICAgICAgICAgICAgICAgICBjb2xvcjogd2hpdGU7XHJcbiAgICAgICAgICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XHJcbiAgICAgICAgICAgICAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xyXG4gICAgICAgICAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xyXG4gICAgICAgICAgICAgICAgICB6LWluZGV4OiA5OTk5OTk7XHJcbiAgICAgICAgICAgICAgICAgIGZvbnQtc2l6ZTogMjRweDtcclxuICAgICAgICAgICAgICAgICAgcG9pbnRlci1ldmVudHM6IGFsbDtcclxuICAgICAgICAgICAgICAgICAgYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZGFsLmlubmVySFRNTCA9IGBcclxuICAgICAgICAgICAgICAgIDxib2R5PlxyXG4gICAgICAgICAgICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgIDxoMT5CcmVhayBUaW1lITwvaDE+XHJcbiAgICAgICAgICAgICAgICAgICAgPHA+UmVsYXggZm9yIGEgd2hpbGUuIFRoaXMgd2lsbCBlbmQgaW4gPHNwYW4gaWQ9XCJicmVha1RpbWVyXCI+PC9zcGFuPiBzZWNvbmRzLjwvcD5cclxuICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8L2JvZHk+XHJcbiAgICAgICAgICAgICAgICBgO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKG1vZGFsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdGltZXJFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJicmVha1RpbWVyXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aW1lckVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGltZXJFbGVtZW50LnRleHRDb250ZW50ID0gYCR7dGltZURhdGEuaG91cnN9OiR7dGltZURhdGEubWludXRlc306JHt0aW1lRGF0YS5zZWNvbmRzfWA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3M6IFt7IGhvdXJzLCBtaW51dGVzLCBzZWNvbmRzIH1dLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2Uoe1xuICAgICAgICAgICAgICAgIGFjdGlvbjogXCJzdGFydEJyZWFrXCIsXG4gICAgICAgICAgICAgICAgZGF0YTogeyBob3VyczogaG91cnMsIG1pbnV0ZXM6IG1pbnV0ZXMsIHNlY29uZHM6IHNlY29uZHMgfSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxufSk7XG4vLyBjaHJvbWUuYWxhcm1zLm9uQWxhcm0uYWRkTGlzdGVuZXIoKGFsYXJtcykgPT4ge1xuLy8gICBpZiAoaG91cnMgPj0gMCkge1xuLy8gICAgIGlmIChzZWNvbmRzID09IDAgJiYgbWludXRlcyA9PSAwICYmIGhvdXJzID09IDApIHtcbi8vICAgICAgIGNocm9tZS5hbGFybXMuY2xlYXIoYWxhcm1zLm5hbWUpO1xuLy8gICAgIH0gZWxzZSBpZiAoc2Vjb25kcyA9PSAwICYmIG1pbnV0ZXMgPT0gMCAmJiBob3VycyAhPSAwKSB7XG4vLyAgICAgICBob3Vycy0tO1xuLy8gICAgICAgbWludXRlcyA9IDU5O1xuLy8gICAgICAgc2Vjb25kcyA9IDU5O1xuLy8gICAgIH0gZWxzZSBpZiAoc2Vjb25kcyA9PSAwICYmIG1pbnV0ZXMgIT0gMCkge1xuLy8gICAgICAgbWludXRlcy0tO1xuLy8gICAgICAgc2Vjb25kcyA9IDU5O1xuLy8gICAgIH0gZWxzZSB7XG4vLyAgICAgICBzZWNvbmRzLS07XG4vLyAgICAgfVxuLy8gICB9IGVsc2Uge1xuLy8gICAgIGlmIChzZWNvbmRzID09IDAgJiYgbWludXRlcyA9PSAwKSB7XG4vLyAgICAgICBjaHJvbWUuYWxhcm1zLmNsZWFyKGFsYXJtcy5uYW1lKTtcbi8vICAgICB9IGVsc2UgaWYgKHNlY29uZHMgPT0gMCAmJiBtaW51dGVzICE9IDApIHtcbi8vICAgICAgIG1pbnV0ZXMtLTtcbi8vICAgICAgIHNlY29uZHMgPSA1OTtcbi8vICAgICB9IGVsc2Uge1xuLy8gICAgICAgc2Vjb25kcy0tO1xuLy8gICAgIH1cbi8vICAgfVxuLy8gICBpZiAoYWxhcm1zLm5hbWUgPT0gXCJ0aW1lclwiKSB7XG4vLyAgICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2Uoe1xuLy8gICAgICAgbWVzc2FnZTogXCJ0aW1lclwiLFxuLy8gICAgICAgZGF0YTogeyBob3VyczogaG91cnMsIG1pbnV0ZXM6IG1pbnV0ZXMsIHNlY29uZHM6IHNlY29uZHMgfSxcbi8vICAgICB9KTtcbi8vICAgICBpZiAoaG91cnMgPT0gMCAmJiBtaW51dGVzID09IDAgJiYgc2Vjb25kcyA9PSAwKSB7XG4vLyAgICAgICBjaHJvbWUuYWxhcm1zLmNsZWFyKGFsYXJtcy5uYW1lKTtcbi8vICAgICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldChcInRpbWVEZXRhaWxzXCIsIChyZXN1bHQpID0+IHtcbi8vICAgICAgICAgaWYgKHJlc3VsdC50aW1lRGV0YWlscykge1xuLy8gICAgICAgICAgIGlmIChcbi8vICAgICAgICAgICAgIHJlc3VsdC50aW1lRGV0YWlscy5icmVha1RpbWUuc3BsaXQoXCI6XCIpWzBdICE9IFwiMDBcIiB8fFxuLy8gICAgICAgICAgICAgcmVzdWx0LnRpbWVEZXRhaWxzLmJyZWFrVGltZS5zcGxpdChcIjpcIilbMV0gIT0gXCIwMFwiIHx8XG4vLyAgICAgICAgICAgICByZXN1bHQudGltZURldGFpbHMuYnJlYWtUaW1lLnNwbGl0KFwiOlwiKVsyXSAhPSBcIjAwXCJcbi8vICAgICAgICAgICApIHtcbi8vICAgICAgICAgICAgIGlmIChyZXN1bHQudGltZURldGFpbHMuYnJlYWtUaW1lLnNwbGl0KFwiOlwiKS5sZW5ndGggPT0gMykge1xuLy8gICAgICAgICAgICAgICBob3VycyA9IHBhcnNlSW50KHJlc3VsdC50aW1lRGV0YWlscy5icmVha1RpbWUuc3BsaXQoXCI6XCIpWzBdKTtcbi8vICAgICAgICAgICAgICAgbWludXRlcyA9IHBhcnNlSW50KHJlc3VsdC50aW1lRGV0YWlscy5icmVha1RpbWUuc3BsaXQoXCI6XCIpWzFdKTtcbi8vICAgICAgICAgICAgICAgc2Vjb25kcyA9IHBhcnNlSW50KHJlc3VsdC50aW1lRGV0YWlscy5icmVha1RpbWUuc3BsaXQoXCI6XCIpWzJdKTtcbi8vICAgICAgICAgICAgIH0gZWxzZSB7XG4vLyAgICAgICAgICAgICAgIG1pbnV0ZXMgPSBwYXJzZUludChyZXN1bHQudGltZURldGFpbHMuYnJlYWtUaW1lLnNwbGl0KFwiOlwiKVswXSk7XG4vLyAgICAgICAgICAgICAgIHNlY29uZHMgPSBwYXJzZUludChyZXN1bHQudGltZURldGFpbHMuYnJlYWtUaW1lLnNwbGl0KFwiOlwiKVsxXSk7XG4vLyAgICAgICAgICAgICB9XG4vLyAgICAgICAgICAgICBjcmVhdGVUaW1lckFsYXJtKFwiYnJlYWtUaW1lclwiKTtcbi8vICAgICAgICAgICB9XG4vLyAgICAgICAgIH1cbi8vICAgICAgIH0pO1xuLy8gICAgIH1cbi8vICAgfSBlbHNlIGlmIChhbGFybXMubmFtZSA9PSBcImJyZWFrVGltZXJcIikge1xuLy8gICAgIGNocm9tZS50YWJzLnF1ZXJ5KHt9LCAodGFicykgPT4ge1xuLy8gICAgICAgdGFicy5mb3JFYWNoKCh0YWJzKSA9PiB7XG4vLyAgICAgICAgIGNocm9tZS5zY3JpcHRpbmcuZXhlY3V0ZVNjcmlwdCh7XG4vLyAgICAgICAgICAgdGFyZ2V0OiB7IHRhYklkOiB0YWJzLmlkIH0sXG4vLyAgICAgICAgICAgZmlsZXM6IFtcImNvbnRlbnQuanNcIl0sXG4vLyAgICAgICAgIH0pO1xuLy8gICAgICAgfSk7XG4vLyAgICAgfSk7XG4vLyAgICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2Uoe1xuLy8gICAgICAgYWN0aW9uOlxuLy8gICAgICAgICBob3VycyA9PSAwICYmIG1pbnV0ZXMgPT0gMCAmJiBzZWNvbmRzID09IDBcbi8vICAgICAgICAgICA/IFwic3RhcnRCcmVha0VuZFwiXG4vLyAgICAgICAgICAgOiBcInN0YXJ0QnJlYWtcIixcbi8vICAgICAgIGRhdGE6IHsgaG91cnM6IGhvdXJzLCBtaW51dGVzOiBtaW51dGVzLCBzZWNvbmRzOiBzZWNvbmRzIH0sXG4vLyAgICAgfSk7XG4vLyAgIH1cbi8vIH0pO1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9