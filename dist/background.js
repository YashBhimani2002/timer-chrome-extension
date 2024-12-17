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
function createTimerAlarm(alarm) {
    chrome.alarms.create(alarm, { periodInMinutes: 1 / 60 });
}
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
                    <p>Relax for a while. This will end in <span id="breakTimer"></span> time.</p>
                  </div>
                </body>
                `;
                                document.body.appendChild(modal);
                            }
                            const timerElement = document.getElementById("breakTimer");
                            if (timerElement) {
                                timerElement.textContent = `${timeData.hours < 10 ? "0" + timeData.hours : timeData.hours}:${timeData.minutes < 10 ? "0" + timeData.minutes : timeData.minutes}:${timeData.seconds < 10 ? "0" + timeData.seconds : timeData.seconds}`;
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

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUE4RCw0REFBNEQsR0FBRyxrRUFBa0UsR0FBRyxrRUFBa0U7QUFDcFE7QUFDQSx5QkFBeUI7QUFDekIsaUNBQWlDLHlCQUF5QjtBQUMxRCxxQkFBcUI7QUFDckIsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0Esd0JBQXdCLGtEQUFrRDtBQUMxRSxhQUFhO0FBQ2I7QUFDQTtBQUNBLENBQUMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9zcmMvYmFja2dyb3VuZC9iYWNrZ3JvdW5kLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImxldCBob3VycyA9IDA7XG5sZXQgbWludXRlcyA9IDA7XG5sZXQgc2Vjb25kcyA9IDA7XG5sZXQgdGltZURldGFpbHMgPSB7XG4gICAgcmVhZFRpbWU6IFwiMDA6MDBcIixcbiAgICBicmVha1RpbWU6IFwiMDA6MDBcIixcbn07XG4vLyBMaXN0ZW4gZm9yIG1lc3NhZ2VzIGZyb20gY29udGVudCBvciBwb3B1cCBzY3JpcHRzXG5jaHJvbWUucnVudGltZS5vbk1lc3NhZ2UuYWRkTGlzdGVuZXIoKHJlcXVlc3QsIHNlbmRlciwgc2VuZFJlc3BvbnNlKSA9PiB7XG4gICAgbGV0IHJlc3BvbnNlTWVzc2FnZSA9IFwiXCI7XG4gICAgY29uc29sZS5sb2cocmVxdWVzdCk7XG4gICAgLy8gSGFuZGxlIGRpZmZlcmVudCBtZXNzYWdlIHR5cGVzXG4gICAgaWYgKHJlcXVlc3QubWVzc2FnZSA9PT0gXCJzdGFydFwiKSB7XG4gICAgICAgIGlmIChyZXF1ZXN0LmRhdGEpIHtcbiAgICAgICAgICAgIHRpbWVEZXRhaWxzID0gcmVxdWVzdC5kYXRhO1xuICAgICAgICAgICAgc3RvcmVUaW1lclZhbHVlc0xvY2FsbHkocmVxdWVzdC5kYXRhLCBcInJ1bm5pbmdcIik7XG4gICAgICAgICAgICByZXNwb25zZU1lc3NhZ2UgPSBcIlRpbWUgZGF0YSBzdG9yZWQgc3VjY2Vzc2Z1bGx5LlwiO1xuICAgICAgICAgICAgaWYgKHJlcXVlc3QuZGF0YS5yZWFkVGltZS5zcGxpdChcIjpcIilbMF0gIT0gXCIwMFwiIHx8XG4gICAgICAgICAgICAgICAgcmVxdWVzdC5kYXRhLnJlYWRUaW1lLnNwbGl0KFwiOlwiKVsxXSAhPSBcIjAwXCIgfHxcbiAgICAgICAgICAgICAgICByZXF1ZXN0LmRhdGEucmVhZFRpbWUuc3BsaXQoXCI6XCIpWzJdICE9IFwiMDBcIikge1xuICAgICAgICAgICAgICAgIGlmIChyZXF1ZXN0LmRhdGEucmVhZFRpbWUuc3BsaXQoXCI6XCIpLmxlbmd0aCA9PSAzKSB7XG4gICAgICAgICAgICAgICAgICAgIGhvdXJzID0gcGFyc2VJbnQocmVxdWVzdC5kYXRhLnJlYWRUaW1lLnNwbGl0KFwiOlwiKVswXSk7XG4gICAgICAgICAgICAgICAgICAgIG1pbnV0ZXMgPSBwYXJzZUludChyZXF1ZXN0LmRhdGEucmVhZFRpbWUuc3BsaXQoXCI6XCIpWzFdKTtcbiAgICAgICAgICAgICAgICAgICAgc2Vjb25kcyA9IHBhcnNlSW50KHJlcXVlc3QuZGF0YS5yZWFkVGltZS5zcGxpdChcIjpcIilbMl0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbWludXRlcyA9IHBhcnNlSW50KHJlcXVlc3QuZGF0YS5yZWFkVGltZS5zcGxpdChcIjpcIilbMF0pO1xuICAgICAgICAgICAgICAgICAgICBzZWNvbmRzID0gcGFyc2VJbnQocmVxdWVzdC5kYXRhLnJlYWRUaW1lLnNwbGl0KFwiOlwiKVsxXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNyZWF0ZVRpbWVyQWxhcm0oXCJ0aW1lclwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IHRydWUsIG1lc3NhZ2U6IHJlc3BvbnNlTWVzc2FnZSB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IGZhbHNlLCBtZXNzYWdlOiBcIk5vIHRpbWVyIGRhdGEgcHJvdmlkZWQuXCIgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZiAocmVxdWVzdC5tZXNzYWdlID09PSBcInN0b3BcIikge1xuICAgICAgICAvLyBTdG9wIGFjdGlvbiBsb2dpY1xuICAgICAgICByZXNwb25zZU1lc3NhZ2UgPSBcIlRpbWUgZGF0YSBzdG9wcGVkIHN1Y2Nlc3NmdWxseS5cIjtcbiAgICAgICAgY2hyb21lLmFsYXJtcy5jbGVhcihcInRpbWVyXCIpO1xuICAgICAgICBsZXQgZGF0YSA9IHtcbiAgICAgICAgICAgIGhvdXJzOiBob3VycyxcbiAgICAgICAgICAgIG1pbnV0ZXM6IG1pbnV0ZXMsXG4gICAgICAgICAgICBzZWNvbmRzOiBzZWNvbmRzLFxuICAgICAgICB9O1xuICAgICAgICBzdG9yZVN0b3BUaW1lclZhbHVlc0xvY2FsbHkoZGF0YSk7XG4gICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IHRydWUsIG1lc3NhZ2U6IHJlc3BvbnNlTWVzc2FnZSB9KTtcbiAgICB9XG4gICAgZWxzZSBpZiAocmVxdWVzdC5tZXNzYWdlID09PSBcImdldFwiKSB7XG4gICAgICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldChcInRpbWVEZXRhaWxzXCIsIChyZXN1bHQpID0+IHtcbiAgICAgICAgICAgIGlmIChyZXN1bHQudGltZURldGFpbHMpIHtcbiAgICAgICAgICAgICAgICB0aW1lRGV0YWlscyA9IHJlcXVlc3QudGltZURldGFpbHM7XG4gICAgICAgICAgICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogcmVzdWx0LnRpbWVEZXRhaWxzIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogZmFsc2UsIG1lc3NhZ2U6IFwiTm8gdGltZXIgZGF0YSBwcm92aWRlZC5cIiB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKHJlcXVlc3QubWVzc2FnZSA9PT0gXCJnZXRTdG9wXCIpIHtcbiAgICAgICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuZ2V0KFwic3RvcFRpbWVyXCIsIChyZXN1bHQpID0+IHtcbiAgICAgICAgICAgIGlmIChyZXN1bHQuc3RvcFRpbWVyKSB7XG4gICAgICAgICAgICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogcmVzdWx0LnN0b3BUaW1lciB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IGZhbHNlLCBtZXNzYWdlOiBcIk5vIHRpbWVyIGRhdGEgcHJvdmlkZWQuXCIgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIGlmIChyZXF1ZXN0Lm1lc3NhZ2UgPT0gXCJyZXNldFwiKSB7XG4gICAgICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLmNsZWFyKCk7XG4gICAgICAgIGNocm9tZS5hbGFybXMuY2xlYXIoXCJ0aW1lclwiKTtcbiAgICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogdHJ1ZSwgbWVzc2FnZTogXCJUaW1lIGRhdGEgY2xlYXJlZCBzdWNjZXNzZnVsbHkuXCIgfSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKHJlcXVlc3QubWVzc2FnZSA9PSBcInJlc3VtZVwiKSB7XG4gICAgICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldChcInN0b3BUaW1lclwiLCAocmVzdWx0KSA9PiB7XG4gICAgICAgICAgICBpZiAocmVzdWx0LnN0b3BUaW1lcikge1xuICAgICAgICAgICAgICAgIGhvdXJzID0gcmVzdWx0LnN0b3BUaW1lci5ob3VycztcbiAgICAgICAgICAgICAgICBtaW51dGVzID0gcmVzdWx0LnN0b3BUaW1lci5taW51dGVzO1xuICAgICAgICAgICAgICAgIHNlY29uZHMgPSByZXN1bHQuc3RvcFRpbWVyLnNlY29uZHM7XG4gICAgICAgICAgICAgICAgY3JlYXRlVGltZXJBbGFybShcInRpbWVyXCIpO1xuICAgICAgICAgICAgICAgIHNlbmRSZXNwb25zZSh7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IFwiVGltZSBkYXRhIHJlc3VtZWQgc3VjY2Vzc2Z1bGx5LlwiLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogZmFsc2UsIG1lc3NhZ2U6IFwiTm8gdGltZXIgZGF0YSBwcm92aWRlZC5cIiB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiBmYWxzZSwgbWVzc2FnZTogXCJVbmtub3duIG1lc3NhZ2UgdHlwZS5cIiB9KTtcbiAgICB9XG4gICAgLy8gSW5kaWNhdGUgdGhhdCB0aGUgcmVzcG9uc2Ugd2lsbCBiZSBzZW50IGFzeW5jaHJvbm91c2x5XG4gICAgcmV0dXJuIHRydWU7XG59KTtcbi8vIEZ1bmN0aW9uIHRvIHN0b3JlIHRpbWVyIHZhbHVlcyBsb2NhbGx5XG5mdW5jdGlvbiBzdG9yZVRpbWVyVmFsdWVzTG9jYWxseSh0aW1lclZhbHVlcywgc3RhdHVzKSB7XG4gICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KHtcbiAgICAgICAgdGltZURldGFpbHM6IE9iamVjdC5hc3NpZ24oT2JqZWN0LmFzc2lnbih7fSwgdGltZXJWYWx1ZXMpLCB7IHN0YXR1czogc3RhdHVzIH0pLFxuICAgIH0pO1xufVxuLy9GdW5jdGlvbiB0byBzdG9yZSBzdG9wIHRpbWVyIHZhbHVlIGxvY2FsbHlcbmZ1bmN0aW9uIHN0b3JlU3RvcFRpbWVyVmFsdWVzTG9jYWxseSh0aW1lclZhbHVlcykge1xuICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldCh7XG4gICAgICAgIHN0b3BUaW1lcjogdGltZXJWYWx1ZXMsXG4gICAgfSk7XG59XG4vLyBGdW5jdGlvbiB0byB1cGRhdGUgdGltZXIgdmFsdWVzIGxvY2FsbHlcbmZ1bmN0aW9uIHVwZGF0ZVRpbWVyVmFsdWVzTG9jYWxseSh0aW1lclZhbHVlcywgc3RhdHVzKSB7XG4gICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuY2xlYXIoKTtcbiAgICBzdG9yZVRpbWVyVmFsdWVzTG9jYWxseSh0aW1lclZhbHVlcywgc3RhdHVzKTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZVRpbWVyQWxhcm0oYWxhcm0pIHtcbiAgICBjaHJvbWUuYWxhcm1zLmNyZWF0ZShhbGFybSwgeyBwZXJpb2RJbk1pbnV0ZXM6IDEgLyA2MCB9KTtcbn1cbmZ1bmN0aW9uIHNlbmROb3RpZmljYXRpb25Gb3JGaW5pc2hpbmdUaW1lKHRpdGxlLCBtZXNzYWdlKSB7XG4gICAgY2hyb21lLm5vdGlmaWNhdGlvbnMuY3JlYXRlKHtcbiAgICAgICAgdHlwZTogXCJsaXN0XCIsXG4gICAgICAgIGljb25Vcmw6IFwiLi9pY29uLnBuZ1wiLFxuICAgICAgICB0aXRsZTogdGl0bGUsXG4gICAgICAgIG1lc3NhZ2UsXG4gICAgICAgIGl0ZW1zOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IHRpdGxlLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgIH0pO1xufVxuLy8gRnVuY3Rpb24gdG8gaGFuZGxlIGFsYXJtIGV2ZW50c1xuY2hyb21lLmFsYXJtcy5vbkFsYXJtLmFkZExpc3RlbmVyKChhbGFybXMpID0+IHtcbiAgICBpZiAoaG91cnMgPj0gMCkge1xuICAgICAgICBpZiAoc2Vjb25kcyA9PSAwICYmIG1pbnV0ZXMgPT0gMCAmJiBob3VycyA9PSAwKSB7XG4gICAgICAgICAgICBjaHJvbWUuYWxhcm1zLmNsZWFyKGFsYXJtcy5uYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChzZWNvbmRzID09IDAgJiYgbWludXRlcyA9PSAwICYmIGhvdXJzICE9IDApIHtcbiAgICAgICAgICAgIGhvdXJzLS07XG4gICAgICAgICAgICBtaW51dGVzID0gNTk7XG4gICAgICAgICAgICBzZWNvbmRzID0gNTk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoc2Vjb25kcyA9PSAwICYmIG1pbnV0ZXMgIT0gMCkge1xuICAgICAgICAgICAgbWludXRlcy0tO1xuICAgICAgICAgICAgc2Vjb25kcyA9IDU5O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgc2Vjb25kcy0tO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBpZiAoc2Vjb25kcyA9PSAwICYmIG1pbnV0ZXMgPT0gMCkge1xuICAgICAgICAgICAgY2hyb21lLmFsYXJtcy5jbGVhcihhbGFybXMubmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoc2Vjb25kcyA9PSAwICYmIG1pbnV0ZXMgIT0gMCkge1xuICAgICAgICAgICAgbWludXRlcy0tO1xuICAgICAgICAgICAgc2Vjb25kcyA9IDU5O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgc2Vjb25kcy0tO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vIFNlbmQgbWVzc2FnZSB0byBjb250ZW50IHNjcmlwdHNcbiAgICBpZiAoYWxhcm1zLm5hbWUgPT0gXCJ0aW1lclwiKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKHRpbWVEZXRhaWxzKTtcbiAgICAgICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2Uoe1xuICAgICAgICAgICAgbWVzc2FnZTogXCJ0aW1lclwiLFxuICAgICAgICAgICAgZGF0YTogeyBob3VyczogaG91cnMsIG1pbnV0ZXM6IG1pbnV0ZXMsIHNlY29uZHM6IHNlY29uZHMgfSxcbiAgICAgICAgfSk7XG4gICAgICAgIC8vVGhpcyBpcyB0byBzZW5kIG5vdGlmaWNhdGlvbiB3aGVuIHJlYWQgdGltZXIgd2lsbCBiZSBnb25lIHRvIGJlIGVuZC5cbiAgICAgICAgaWYgKHRpbWVEZXRhaWxzLnJlYWRUaW1lLnNwbGl0KFwiOlwiKS5sZW5ndGggPT0gMykge1xuICAgICAgICAgICAgaWYgKE51bWJlcih0aW1lRGV0YWlscy5yZWFkVGltZS5zcGxpdChcIjpcIilbMF0pID4gMCkge1xuICAgICAgICAgICAgICAgIGlmIChtaW51dGVzID09IDUgJiYgc2Vjb25kcyA9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbmROb3RpZmljYXRpb25Gb3JGaW5pc2hpbmdUaW1lKFwiUmVhZCBUaW1lXCIsIGBSZWFkIFRpbWUgTGVmdCAwNTowMCBtaW51dGVgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChOdW1iZXIodGltZURldGFpbHMucmVhZFRpbWUuc3BsaXQoXCI6XCIpWzFdKSA+IDApIHtcbiAgICAgICAgICAgICAgICBpZiAoc2Vjb25kcyA9PSAxMCkge1xuICAgICAgICAgICAgICAgICAgICBzZW5kTm90aWZpY2F0aW9uRm9yRmluaXNoaW5nVGltZShcIlJlYWQgVGltZVwiLCBgUmVhZCBUaW1lIExlZnQgMDA6MTAgc2Vjb25kYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoTnVtYmVyKHRpbWVEZXRhaWxzLnJlYWRUaW1lLnNwbGl0KFwiOlwiKVsyXSkgPj0gMjUpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2Vjb25kcyA9PSA1KSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbmROb3RpZmljYXRpb25Gb3JGaW5pc2hpbmdUaW1lKFwiUmVhZCBUaW1lXCIsIGBSZWFkIFRpbWUgTGVmdCAwMDowNSBzZWNvbmRgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGhvdXJzID09IDAgJiYgbWludXRlcyA9PSAwICYmIHNlY29uZHMgPT0gMCkge1xuICAgICAgICAgICAgY2hyb21lLmFsYXJtcy5jbGVhcihhbGFybXMubmFtZSk7XG4gICAgICAgICAgICAvLyBTdGFydCBicmVhayB0aW1lciBpZiBicmVhayB0aW1lIGV4aXN0c1xuICAgICAgICAgICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuZ2V0KFwidGltZURldGFpbHNcIiwgKHJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQudGltZURldGFpbHMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdC50aW1lRGV0YWlscy5icmVha1RpbWUuc3BsaXQoXCI6XCIpWzBdICE9IFwiMDBcIiB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnRpbWVEZXRhaWxzLmJyZWFrVGltZS5zcGxpdChcIjpcIilbMV0gIT0gXCIwMFwiIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQudGltZURldGFpbHMuYnJlYWtUaW1lLnNwbGl0KFwiOlwiKVsyXSAhPSBcIjAwXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQudGltZURldGFpbHMuYnJlYWtUaW1lLnNwbGl0KFwiOlwiKS5sZW5ndGggPT0gMykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhvdXJzID0gcGFyc2VJbnQocmVzdWx0LnRpbWVEZXRhaWxzLmJyZWFrVGltZS5zcGxpdChcIjpcIilbMF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pbnV0ZXMgPSBwYXJzZUludChyZXN1bHQudGltZURldGFpbHMuYnJlYWtUaW1lLnNwbGl0KFwiOlwiKVsxXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2Vjb25kcyA9IHBhcnNlSW50KHJlc3VsdC50aW1lRGV0YWlscy5icmVha1RpbWUuc3BsaXQoXCI6XCIpWzJdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pbnV0ZXMgPSBwYXJzZUludChyZXN1bHQudGltZURldGFpbHMuYnJlYWtUaW1lLnNwbGl0KFwiOlwiKVswXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2Vjb25kcyA9IHBhcnNlSW50KHJlc3VsdC50aW1lRGV0YWlscy5icmVha1RpbWUuc3BsaXQoXCI6XCIpWzFdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNyZWF0ZVRpbWVyQWxhcm0oXCJicmVha1RpbWVyXCIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZiAoYWxhcm1zLm5hbWUgPT0gXCJicmVha1RpbWVyXCIpIHtcbiAgICAgICAgLy8gSGFuZGxlIGJyZWFrIHRpbWVyIGxvZ2ljXG4gICAgICAgIGlmIChob3VycyA9PSAwICYmIG1pbnV0ZXMgPT0gMCAmJiBzZWNvbmRzID09IDApIHtcbiAgICAgICAgICAgIGlmICh0aW1lRGV0YWlscy5yZWFkVGltZS5zcGxpdChcIjpcIikubGVuZ3RoID09IDIgJiZcbiAgICAgICAgICAgICAgICAodGltZURldGFpbHMucmVhZFRpbWUuc3BsaXQoXCI6XCIpWzBdICE9IFwiMDBcIiB8fFxuICAgICAgICAgICAgICAgICAgICB0aW1lRGV0YWlscy5yZWFkVGltZS5zcGxpdChcIjpcIilbMV0gIT0gXCIwMFwiKSkge1xuICAgICAgICAgICAgICAgIHNlbmROb3RpZmljYXRpb25Gb3JGaW5pc2hpbmdUaW1lKFwiQnJlYWsgVGltZVwiLCBgQnJlYWsgVGltZSBGaW5pc2hlZCwgWW91IGNhbiBzdGFydCBhZ2FpbmApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodGltZURldGFpbHMucmVhZFRpbWUuc3BsaXQoXCI6XCIpLmxlbmd0aCA9PSAzICYmXG4gICAgICAgICAgICAgICAgKHRpbWVEZXRhaWxzLnJlYWRUaW1lLnNwbGl0KFwiOlwiKVswXSAhPSBcIjAwXCIgfHxcbiAgICAgICAgICAgICAgICAgICAgdGltZURldGFpbHMucmVhZFRpbWUuc3BsaXQoXCI6XCIpWzFdICE9IFwiMDBcIiB8fFxuICAgICAgICAgICAgICAgICAgICB0aW1lRGV0YWlscy5yZWFkVGltZS5zcGxpdChcIjpcIilbMl0gIT0gXCIwMFwiKSkge1xuICAgICAgICAgICAgICAgIHNlbmROb3RpZmljYXRpb25Gb3JGaW5pc2hpbmdUaW1lKFwiQnJlYWsgVGltZVwiLCBgQnJlYWsgVGltZSBGaW5pc2hlZCwgWW91IGNhbiBzdGFydCBhZ2FpbmApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gRW5kIGJyZWFrXG4gICAgICAgICAgICBjaHJvbWUudGFicy5xdWVyeSh7fSwgKHRhYnMpID0+IHtcbiAgICAgICAgICAgICAgICB0YWJzLmZvckVhY2goKHRhYikgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjaHJvbWUuc2NyaXB0aW5nLmV4ZWN1dGVTY3JpcHQoe1xuICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0OiB7IHRhYklkOiB0YWIuaWQgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmM6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgX2E7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUmVtb3ZlIHRoZSBtb2RhbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChfYSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYnJlYWtNb2RhbFwiKSkgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKHsgYWN0aW9uOiBcInN0YXJ0QnJlYWtFbmRcIiB9KTtcbiAgICAgICAgICAgIGNocm9tZS5hbGFybXMuY2xlYXIoXCJicmVha1RpbWVyXCIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gVXBkYXRlIGJyZWFrIHRpbWVyIG9yIHN0YXJ0IGlmIG5vdCBpbmplY3RlZFxuICAgICAgICAgICAgY2hyb21lLnRhYnMucXVlcnkoe30sICh0YWJzKSA9PiB7XG4gICAgICAgICAgICAgICAgdGFicy5mb3JFYWNoKCh0YWIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY2hyb21lLnNjcmlwdGluZy5leGVjdXRlU2NyaXB0KHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldDogeyB0YWJJZDogdGFiLmlkIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5jOiAodGltZURhdGEpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgbW9kYWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJyZWFrTW9kYWxcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFtb2RhbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2RhbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZGFsLmlkID0gXCJicmVha01vZGFsXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZGFsLnNldEF0dHJpYnV0ZShcInN0eWxlXCIsIGBcclxuICAgICAgICAgICAgICAgICAgcG9zaXRpb246IGZpeGVkO1xyXG4gICAgICAgICAgICAgICAgICB0b3A6IDA7XHJcbiAgICAgICAgICAgICAgICAgIGxlZnQ6IDA7XHJcbiAgICAgICAgICAgICAgICAgIHdpZHRoOiAxMDB2dztcclxuICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAxMDB2aDtcclxuICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSgwLCAwLCAwLCAwLjgpO1xyXG4gICAgICAgICAgICAgICAgICBjb2xvcjogd2hpdGU7XHJcbiAgICAgICAgICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XHJcbiAgICAgICAgICAgICAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xyXG4gICAgICAgICAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xyXG4gICAgICAgICAgICAgICAgICB6LWluZGV4OiA5OTk5OTk7XHJcbiAgICAgICAgICAgICAgICAgIGZvbnQtc2l6ZTogMjRweDtcclxuICAgICAgICAgICAgICAgICAgcG9pbnRlci1ldmVudHM6IGFsbDtcclxuICAgICAgICAgICAgICAgICAgYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZGFsLmlubmVySFRNTCA9IGBcclxuICAgICAgICAgICAgICAgIDxib2R5PlxyXG4gICAgICAgICAgICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgIDxoMT5CcmVhayBUaW1lITwvaDE+XHJcbiAgICAgICAgICAgICAgICAgICAgPHA+UmVsYXggZm9yIGEgd2hpbGUuIFRoaXMgd2lsbCBlbmQgaW4gPHNwYW4gaWQ9XCJicmVha1RpbWVyXCI+PC9zcGFuPiB0aW1lLjwvcD5cclxuICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8L2JvZHk+XHJcbiAgICAgICAgICAgICAgICBgO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKG1vZGFsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdGltZXJFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJicmVha1RpbWVyXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aW1lckVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGltZXJFbGVtZW50LnRleHRDb250ZW50ID0gYCR7dGltZURhdGEuaG91cnMgPCAxMCA/IFwiMFwiICsgdGltZURhdGEuaG91cnMgOiB0aW1lRGF0YS5ob3Vyc306JHt0aW1lRGF0YS5taW51dGVzIDwgMTAgPyBcIjBcIiArIHRpbWVEYXRhLm1pbnV0ZXMgOiB0aW1lRGF0YS5taW51dGVzfToke3RpbWVEYXRhLnNlY29uZHMgPCAxMCA/IFwiMFwiICsgdGltZURhdGEuc2Vjb25kcyA6IHRpbWVEYXRhLnNlY29uZHN9YDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnczogW3sgaG91cnMsIG1pbnV0ZXMsIHNlY29uZHMgfV0sXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZSh7XG4gICAgICAgICAgICAgICAgYWN0aW9uOiBcInN0YXJ0QnJlYWtcIixcbiAgICAgICAgICAgICAgICBkYXRhOiB7IGhvdXJzOiBob3VycywgbWludXRlczogbWludXRlcywgc2Vjb25kczogc2Vjb25kcyB9LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59KTtcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==