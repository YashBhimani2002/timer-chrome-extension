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

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUE4RCxlQUFlLEdBQUcsaUJBQWlCLEdBQUcsaUJBQWlCO0FBQ3JIO0FBQ0EseUJBQXlCO0FBQ3pCLGlDQUFpQyx5QkFBeUI7QUFDMUQscUJBQXFCO0FBQ3JCLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBLHdCQUF3QixrREFBa0Q7QUFDMUUsYUFBYTtBQUNiO0FBQ0E7QUFDQSxDQUFDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vLy4vc3JjL2JhY2tncm91bmQvYmFja2dyb3VuZC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJsZXQgaG91cnMgPSAwO1xubGV0IG1pbnV0ZXMgPSAwO1xubGV0IHNlY29uZHMgPSAwO1xubGV0IHRpbWVEZXRhaWxzID0ge1xuICAgIHJlYWRUaW1lOiBcIjAwOjAwXCIsXG4gICAgYnJlYWtUaW1lOiBcIjAwOjAwXCIsXG59O1xuLy8gTGlzdGVuIGZvciBtZXNzYWdlcyBmcm9tIGNvbnRlbnQgb3IgcG9wdXAgc2NyaXB0c1xuY2hyb21lLnJ1bnRpbWUub25NZXNzYWdlLmFkZExpc3RlbmVyKChyZXF1ZXN0LCBzZW5kZXIsIHNlbmRSZXNwb25zZSkgPT4ge1xuICAgIGxldCByZXNwb25zZU1lc3NhZ2UgPSBcIlwiO1xuICAgIGNvbnNvbGUubG9nKHJlcXVlc3QpO1xuICAgIC8vIEhhbmRsZSBkaWZmZXJlbnQgbWVzc2FnZSB0eXBlc1xuICAgIGlmIChyZXF1ZXN0Lm1lc3NhZ2UgPT09IFwic3RhcnRcIikge1xuICAgICAgICBpZiAocmVxdWVzdC5kYXRhKSB7XG4gICAgICAgICAgICB0aW1lRGV0YWlscyA9IHJlcXVlc3QuZGF0YTtcbiAgICAgICAgICAgIHN0b3JlVGltZXJWYWx1ZXNMb2NhbGx5KHJlcXVlc3QuZGF0YSwgXCJydW5uaW5nXCIpO1xuICAgICAgICAgICAgcmVzcG9uc2VNZXNzYWdlID0gXCJUaW1lIGRhdGEgc3RvcmVkIHN1Y2Nlc3NmdWxseS5cIjtcbiAgICAgICAgICAgIGlmIChyZXF1ZXN0LmRhdGEucmVhZFRpbWUuc3BsaXQoXCI6XCIpWzBdICE9IFwiMDBcIiB8fFxuICAgICAgICAgICAgICAgIHJlcXVlc3QuZGF0YS5yZWFkVGltZS5zcGxpdChcIjpcIilbMV0gIT0gXCIwMFwiIHx8XG4gICAgICAgICAgICAgICAgcmVxdWVzdC5kYXRhLnJlYWRUaW1lLnNwbGl0KFwiOlwiKVsyXSAhPSBcIjAwXCIpIHtcbiAgICAgICAgICAgICAgICBpZiAocmVxdWVzdC5kYXRhLnJlYWRUaW1lLnNwbGl0KFwiOlwiKS5sZW5ndGggPT0gMykge1xuICAgICAgICAgICAgICAgICAgICBob3VycyA9IHBhcnNlSW50KHJlcXVlc3QuZGF0YS5yZWFkVGltZS5zcGxpdChcIjpcIilbMF0pO1xuICAgICAgICAgICAgICAgICAgICBtaW51dGVzID0gcGFyc2VJbnQocmVxdWVzdC5kYXRhLnJlYWRUaW1lLnNwbGl0KFwiOlwiKVsxXSk7XG4gICAgICAgICAgICAgICAgICAgIHNlY29uZHMgPSBwYXJzZUludChyZXF1ZXN0LmRhdGEucmVhZFRpbWUuc3BsaXQoXCI6XCIpWzJdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG1pbnV0ZXMgPSBwYXJzZUludChyZXF1ZXN0LmRhdGEucmVhZFRpbWUuc3BsaXQoXCI6XCIpWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgc2Vjb25kcyA9IHBhcnNlSW50KHJlcXVlc3QuZGF0YS5yZWFkVGltZS5zcGxpdChcIjpcIilbMV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjcmVhdGVUaW1lckFsYXJtKFwidGltZXJcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiB0cnVlLCBtZXNzYWdlOiByZXNwb25zZU1lc3NhZ2UgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiBmYWxzZSwgbWVzc2FnZTogXCJObyB0aW1lciBkYXRhIHByb3ZpZGVkLlwiIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKHJlcXVlc3QubWVzc2FnZSA9PT0gXCJzdG9wXCIpIHtcbiAgICAgICAgLy8gU3RvcCBhY3Rpb24gbG9naWNcbiAgICAgICAgcmVzcG9uc2VNZXNzYWdlID0gXCJUaW1lIGRhdGEgc3RvcHBlZCBzdWNjZXNzZnVsbHkuXCI7XG4gICAgICAgIGNocm9tZS5hbGFybXMuY2xlYXIoXCJ0aW1lclwiKTtcbiAgICAgICAgbGV0IGRhdGEgPSB7XG4gICAgICAgICAgICBob3VyczogaG91cnMsXG4gICAgICAgICAgICBtaW51dGVzOiBtaW51dGVzLFxuICAgICAgICAgICAgc2Vjb25kczogc2Vjb25kcyxcbiAgICAgICAgfTtcbiAgICAgICAgc3RvcmVTdG9wVGltZXJWYWx1ZXNMb2NhbGx5KGRhdGEpO1xuICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiB0cnVlLCBtZXNzYWdlOiByZXNwb25zZU1lc3NhZ2UgfSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKHJlcXVlc3QubWVzc2FnZSA9PT0gXCJnZXRcIikge1xuICAgICAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoXCJ0aW1lRGV0YWlsc1wiLCAocmVzdWx0KSA9PiB7XG4gICAgICAgICAgICBpZiAocmVzdWx0LnRpbWVEZXRhaWxzKSB7XG4gICAgICAgICAgICAgICAgdGltZURldGFpbHMgPSByZXF1ZXN0LnRpbWVEZXRhaWxzO1xuICAgICAgICAgICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IHJlc3VsdC50aW1lRGV0YWlscyB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IGZhbHNlLCBtZXNzYWdlOiBcIk5vIHRpbWVyIGRhdGEgcHJvdmlkZWQuXCIgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIGlmIChyZXF1ZXN0Lm1lc3NhZ2UgPT09IFwiZ2V0U3RvcFwiKSB7XG4gICAgICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldChcInN0b3BUaW1lclwiLCAocmVzdWx0KSA9PiB7XG4gICAgICAgICAgICBpZiAocmVzdWx0LnN0b3BUaW1lcikge1xuICAgICAgICAgICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IHJlc3VsdC5zdG9wVGltZXIgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiBmYWxzZSwgbWVzc2FnZTogXCJObyB0aW1lciBkYXRhIHByb3ZpZGVkLlwiIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgZWxzZSBpZiAocmVxdWVzdC5tZXNzYWdlID09IFwicmVzZXRcIikge1xuICAgICAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5jbGVhcigpO1xuICAgICAgICBjaHJvbWUuYWxhcm1zLmNsZWFyKFwidGltZXJcIik7XG4gICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IHRydWUsIG1lc3NhZ2U6IFwiVGltZSBkYXRhIGNsZWFyZWQgc3VjY2Vzc2Z1bGx5LlwiIH0pO1xuICAgIH1cbiAgICBlbHNlIGlmIChyZXF1ZXN0Lm1lc3NhZ2UgPT0gXCJyZXN1bWVcIikge1xuICAgICAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoXCJzdG9wVGltZXJcIiwgKHJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgaWYgKHJlc3VsdC5zdG9wVGltZXIpIHtcbiAgICAgICAgICAgICAgICBob3VycyA9IHJlc3VsdC5zdG9wVGltZXIuaG91cnM7XG4gICAgICAgICAgICAgICAgbWludXRlcyA9IHJlc3VsdC5zdG9wVGltZXIubWludXRlcztcbiAgICAgICAgICAgICAgICBzZWNvbmRzID0gcmVzdWx0LnN0b3BUaW1lci5zZWNvbmRzO1xuICAgICAgICAgICAgICAgIGNyZWF0ZVRpbWVyQWxhcm0oXCJ0aW1lclwiKTtcbiAgICAgICAgICAgICAgICBzZW5kUmVzcG9uc2Uoe1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBcIlRpbWUgZGF0YSByZXN1bWVkIHN1Y2Nlc3NmdWxseS5cIixcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IGZhbHNlLCBtZXNzYWdlOiBcIk5vIHRpbWVyIGRhdGEgcHJvdmlkZWQuXCIgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogZmFsc2UsIG1lc3NhZ2U6IFwiVW5rbm93biBtZXNzYWdlIHR5cGUuXCIgfSk7XG4gICAgfVxuICAgIC8vIEluZGljYXRlIHRoYXQgdGhlIHJlc3BvbnNlIHdpbGwgYmUgc2VudCBhc3luY2hyb25vdXNseVxuICAgIHJldHVybiB0cnVlO1xufSk7XG4vLyBGdW5jdGlvbiB0byBzdG9yZSB0aW1lciB2YWx1ZXMgbG9jYWxseVxuZnVuY3Rpb24gc3RvcmVUaW1lclZhbHVlc0xvY2FsbHkodGltZXJWYWx1ZXMsIHN0YXR1cykge1xuICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldCh7XG4gICAgICAgIHRpbWVEZXRhaWxzOiBPYmplY3QuYXNzaWduKE9iamVjdC5hc3NpZ24oe30sIHRpbWVyVmFsdWVzKSwgeyBzdGF0dXM6IHN0YXR1cyB9KSxcbiAgICB9KTtcbn1cbi8vRnVuY3Rpb24gdG8gc3RvcmUgc3RvcCB0aW1lciB2YWx1ZSBsb2NhbGx5XG5mdW5jdGlvbiBzdG9yZVN0b3BUaW1lclZhbHVlc0xvY2FsbHkodGltZXJWYWx1ZXMpIHtcbiAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoe1xuICAgICAgICBzdG9wVGltZXI6IHRpbWVyVmFsdWVzLFxuICAgIH0pO1xufVxuLy8gRnVuY3Rpb24gdG8gdXBkYXRlIHRpbWVyIHZhbHVlcyBsb2NhbGx5XG5mdW5jdGlvbiB1cGRhdGVUaW1lclZhbHVlc0xvY2FsbHkodGltZXJWYWx1ZXMsIHN0YXR1cykge1xuICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLmNsZWFyKCk7XG4gICAgc3RvcmVUaW1lclZhbHVlc0xvY2FsbHkodGltZXJWYWx1ZXMsIHN0YXR1cyk7XG59XG5mdW5jdGlvbiBjcmVhdGVUaW1lckFsYXJtKGFsYXJtKSB7XG4gICAgY2hyb21lLmFsYXJtcy5jcmVhdGUoYWxhcm0sIHsgcGVyaW9kSW5NaW51dGVzOiAxIC8gNjAgfSk7XG59XG5mdW5jdGlvbiBzZW5kTm90aWZpY2F0aW9uRm9yRmluaXNoaW5nVGltZSh0aXRsZSwgbWVzc2FnZSkge1xuICAgIGNocm9tZS5ub3RpZmljYXRpb25zLmNyZWF0ZSh7XG4gICAgICAgIHR5cGU6IFwibGlzdFwiLFxuICAgICAgICBpY29uVXJsOiBcIi4vaWNvbi5wbmdcIixcbiAgICAgICAgdGl0bGU6IHRpdGxlLFxuICAgICAgICBtZXNzYWdlLFxuICAgICAgICBpdGVtczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRpdGxlOiB0aXRsZSxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICB9KTtcbn1cbi8vIEZ1bmN0aW9uIHRvIGhhbmRsZSBhbGFybSBldmVudHNcbmNocm9tZS5hbGFybXMub25BbGFybS5hZGRMaXN0ZW5lcigoYWxhcm1zKSA9PiB7XG4gICAgaWYgKGhvdXJzID49IDApIHtcbiAgICAgICAgaWYgKHNlY29uZHMgPT0gMCAmJiBtaW51dGVzID09IDAgJiYgaG91cnMgPT0gMCkge1xuICAgICAgICAgICAgY2hyb21lLmFsYXJtcy5jbGVhcihhbGFybXMubmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoc2Vjb25kcyA9PSAwICYmIG1pbnV0ZXMgPT0gMCAmJiBob3VycyAhPSAwKSB7XG4gICAgICAgICAgICBob3Vycy0tO1xuICAgICAgICAgICAgbWludXRlcyA9IDU5O1xuICAgICAgICAgICAgc2Vjb25kcyA9IDU5O1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHNlY29uZHMgPT0gMCAmJiBtaW51dGVzICE9IDApIHtcbiAgICAgICAgICAgIG1pbnV0ZXMtLTtcbiAgICAgICAgICAgIHNlY29uZHMgPSA1OTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHNlY29uZHMtLTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgaWYgKHNlY29uZHMgPT0gMCAmJiBtaW51dGVzID09IDApIHtcbiAgICAgICAgICAgIGNocm9tZS5hbGFybXMuY2xlYXIoYWxhcm1zLm5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHNlY29uZHMgPT0gMCAmJiBtaW51dGVzICE9IDApIHtcbiAgICAgICAgICAgIG1pbnV0ZXMtLTtcbiAgICAgICAgICAgIHNlY29uZHMgPSA1OTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHNlY29uZHMtLTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvLyBTZW5kIG1lc3NhZ2UgdG8gY29udGVudCBzY3JpcHRzXG4gICAgaWYgKGFsYXJtcy5uYW1lID09IFwidGltZXJcIikge1xuICAgICAgICBjb25zb2xlLmxvZyh0aW1lRGV0YWlscyk7XG4gICAgICAgIGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKHtcbiAgICAgICAgICAgIG1lc3NhZ2U6IFwidGltZXJcIixcbiAgICAgICAgICAgIGRhdGE6IHsgaG91cnM6IGhvdXJzLCBtaW51dGVzOiBtaW51dGVzLCBzZWNvbmRzOiBzZWNvbmRzIH0sXG4gICAgICAgIH0pO1xuICAgICAgICAvL1RoaXMgaXMgdG8gc2VuZCBub3RpZmljYXRpb24gd2hlbiByZWFkIHRpbWVyIHdpbGwgYmUgZ29uZSB0byBiZSBlbmQuXG4gICAgICAgIGlmICh0aW1lRGV0YWlscy5yZWFkVGltZS5zcGxpdChcIjpcIikubGVuZ3RoID09IDMpIHtcbiAgICAgICAgICAgIGlmIChOdW1iZXIodGltZURldGFpbHMucmVhZFRpbWUuc3BsaXQoXCI6XCIpWzBdKSA+IDApIHtcbiAgICAgICAgICAgICAgICBpZiAobWludXRlcyA9PSA1ICYmIHNlY29uZHMgPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBzZW5kTm90aWZpY2F0aW9uRm9yRmluaXNoaW5nVGltZShcIlJlYWQgVGltZVwiLCBgUmVhZCBUaW1lIExlZnQgMDU6MDAgbWludXRlYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoTnVtYmVyKHRpbWVEZXRhaWxzLnJlYWRUaW1lLnNwbGl0KFwiOlwiKVsxXSkgPiAwKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNlY29uZHMgPT0gMTApIHtcbiAgICAgICAgICAgICAgICAgICAgc2VuZE5vdGlmaWNhdGlvbkZvckZpbmlzaGluZ1RpbWUoXCJSZWFkIFRpbWVcIiwgYFJlYWQgVGltZSBMZWZ0IDAwOjEwIHNlY29uZGApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKE51bWJlcih0aW1lRGV0YWlscy5yZWFkVGltZS5zcGxpdChcIjpcIilbMl0pID49IDI1KSB7XG4gICAgICAgICAgICAgICAgaWYgKHNlY29uZHMgPT0gNSkge1xuICAgICAgICAgICAgICAgICAgICBzZW5kTm90aWZpY2F0aW9uRm9yRmluaXNoaW5nVGltZShcIlJlYWQgVGltZVwiLCBgUmVhZCBUaW1lIExlZnQgMDA6MDUgc2Vjb25kYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChob3VycyA9PSAwICYmIG1pbnV0ZXMgPT0gMCAmJiBzZWNvbmRzID09IDApIHtcbiAgICAgICAgICAgIGNocm9tZS5hbGFybXMuY2xlYXIoYWxhcm1zLm5hbWUpO1xuICAgICAgICAgICAgLy8gU3RhcnQgYnJlYWsgdGltZXIgaWYgYnJlYWsgdGltZSBleGlzdHNcbiAgICAgICAgICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldChcInRpbWVEZXRhaWxzXCIsIChyZXN1bHQpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0LnRpbWVEZXRhaWxzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQudGltZURldGFpbHMuYnJlYWtUaW1lLnNwbGl0KFwiOlwiKVswXSAhPSBcIjAwXCIgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC50aW1lRGV0YWlscy5icmVha1RpbWUuc3BsaXQoXCI6XCIpWzFdICE9IFwiMDBcIiB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnRpbWVEZXRhaWxzLmJyZWFrVGltZS5zcGxpdChcIjpcIilbMl0gIT0gXCIwMFwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0LnRpbWVEZXRhaWxzLmJyZWFrVGltZS5zcGxpdChcIjpcIikubGVuZ3RoID09IDMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBob3VycyA9IHBhcnNlSW50KHJlc3VsdC50aW1lRGV0YWlscy5icmVha1RpbWUuc3BsaXQoXCI6XCIpWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaW51dGVzID0gcGFyc2VJbnQocmVzdWx0LnRpbWVEZXRhaWxzLmJyZWFrVGltZS5zcGxpdChcIjpcIilbMV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlY29uZHMgPSBwYXJzZUludChyZXN1bHQudGltZURldGFpbHMuYnJlYWtUaW1lLnNwbGl0KFwiOlwiKVsyXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaW51dGVzID0gcGFyc2VJbnQocmVzdWx0LnRpbWVEZXRhaWxzLmJyZWFrVGltZS5zcGxpdChcIjpcIilbMF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlY29uZHMgPSBwYXJzZUludChyZXN1bHQudGltZURldGFpbHMuYnJlYWtUaW1lLnNwbGl0KFwiOlwiKVsxXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjcmVhdGVUaW1lckFsYXJtKFwiYnJlYWtUaW1lclwiKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKGFsYXJtcy5uYW1lID09IFwiYnJlYWtUaW1lclwiKSB7XG4gICAgICAgIC8vIEhhbmRsZSBicmVhayB0aW1lciBsb2dpY1xuICAgICAgICBpZiAoaG91cnMgPT0gMCAmJiBtaW51dGVzID09IDAgJiYgc2Vjb25kcyA9PSAwKSB7XG4gICAgICAgICAgICBpZiAodGltZURldGFpbHMucmVhZFRpbWUuc3BsaXQoXCI6XCIpLmxlbmd0aCA9PSAyICYmXG4gICAgICAgICAgICAgICAgKHRpbWVEZXRhaWxzLnJlYWRUaW1lLnNwbGl0KFwiOlwiKVswXSAhPSBcIjAwXCIgfHxcbiAgICAgICAgICAgICAgICAgICAgdGltZURldGFpbHMucmVhZFRpbWUuc3BsaXQoXCI6XCIpWzFdICE9IFwiMDBcIikpIHtcbiAgICAgICAgICAgICAgICBzZW5kTm90aWZpY2F0aW9uRm9yRmluaXNoaW5nVGltZShcIkJyZWFrIFRpbWVcIiwgYEJyZWFrIFRpbWUgRmluaXNoZWQsIFlvdSBjYW4gc3RhcnQgYWdhaW5gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHRpbWVEZXRhaWxzLnJlYWRUaW1lLnNwbGl0KFwiOlwiKS5sZW5ndGggPT0gMyAmJlxuICAgICAgICAgICAgICAgICh0aW1lRGV0YWlscy5yZWFkVGltZS5zcGxpdChcIjpcIilbMF0gIT0gXCIwMFwiIHx8XG4gICAgICAgICAgICAgICAgICAgIHRpbWVEZXRhaWxzLnJlYWRUaW1lLnNwbGl0KFwiOlwiKVsxXSAhPSBcIjAwXCIgfHxcbiAgICAgICAgICAgICAgICAgICAgdGltZURldGFpbHMucmVhZFRpbWUuc3BsaXQoXCI6XCIpWzJdICE9IFwiMDBcIikpIHtcbiAgICAgICAgICAgICAgICBzZW5kTm90aWZpY2F0aW9uRm9yRmluaXNoaW5nVGltZShcIkJyZWFrIFRpbWVcIiwgYEJyZWFrIFRpbWUgRmluaXNoZWQsIFlvdSBjYW4gc3RhcnQgYWdhaW5gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIEVuZCBicmVha1xuICAgICAgICAgICAgY2hyb21lLnRhYnMucXVlcnkoe30sICh0YWJzKSA9PiB7XG4gICAgICAgICAgICAgICAgdGFicy5mb3JFYWNoKCh0YWIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY2hyb21lLnNjcmlwdGluZy5leGVjdXRlU2NyaXB0KHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldDogeyB0YWJJZDogdGFiLmlkIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5jOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIF9hO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJlbW92ZSB0aGUgbW9kYWxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoX2EgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJyZWFrTW9kYWxcIikpID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZSh7IGFjdGlvbjogXCJzdGFydEJyZWFrRW5kXCIgfSk7XG4gICAgICAgICAgICBjaHJvbWUuYWxhcm1zLmNsZWFyKFwiYnJlYWtUaW1lclwiKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIFVwZGF0ZSBicmVhayB0aW1lciBvciBzdGFydCBpZiBub3QgaW5qZWN0ZWRcbiAgICAgICAgICAgIGNocm9tZS50YWJzLnF1ZXJ5KHt9LCAodGFicykgPT4ge1xuICAgICAgICAgICAgICAgIHRhYnMuZm9yRWFjaCgodGFiKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNocm9tZS5zY3JpcHRpbmcuZXhlY3V0ZVNjcmlwdCh7XG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQ6IHsgdGFiSWQ6IHRhYi5pZCB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgZnVuYzogKHRpbWVEYXRhKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG1vZGFsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJicmVha01vZGFsXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghbW9kYWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kYWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2RhbC5pZCA9IFwiYnJlYWtNb2RhbFwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2RhbC5zZXRBdHRyaWJ1dGUoXCJzdHlsZVwiLCBgXHJcbiAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBmaXhlZDtcclxuICAgICAgICAgICAgICAgICAgdG9wOiAwO1xyXG4gICAgICAgICAgICAgICAgICBsZWZ0OiAwO1xyXG4gICAgICAgICAgICAgICAgICB3aWR0aDogMTAwdnc7XHJcbiAgICAgICAgICAgICAgICAgIGhlaWdodDogMTAwdmg7XHJcbiAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEoMCwgMCwgMCwgMC44KTtcclxuICAgICAgICAgICAgICAgICAgY29sb3I6IHdoaXRlO1xyXG4gICAgICAgICAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xyXG4gICAgICAgICAgICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcclxuICAgICAgICAgICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcclxuICAgICAgICAgICAgICAgICAgei1pbmRleDogOTk5OTk5O1xyXG4gICAgICAgICAgICAgICAgICBmb250LXNpemU6IDI0cHg7XHJcbiAgICAgICAgICAgICAgICAgIHBvaW50ZXItZXZlbnRzOiBhbGw7XHJcbiAgICAgICAgICAgICAgICAgIGApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2RhbC5pbm5lckhUTUwgPSBgXHJcbiAgICAgICAgICAgICAgICA8Ym9keT5cclxuICAgICAgICAgICAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgICAgICAgICA8aDE+QnJlYWsgVGltZSE8L2gxPlxyXG4gICAgICAgICAgICAgICAgICAgIDxwPlJlbGF4IGZvciBhIHdoaWxlLiBUaGlzIHdpbGwgZW5kIGluIDxzcGFuIGlkPVwiYnJlYWtUaW1lclwiPjwvc3Bhbj4gc2Vjb25kcy48L3A+XHJcbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgPC9ib2R5PlxyXG4gICAgICAgICAgICAgICAgYDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChtb2RhbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRpbWVyRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYnJlYWtUaW1lclwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGltZXJFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpbWVyRWxlbWVudC50ZXh0Q29udGVudCA9IGAke3RpbWVEYXRhLmhvdXJzfToke3RpbWVEYXRhLm1pbnV0ZXN9OiR7dGltZURhdGEuc2Vjb25kc31gO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBhcmdzOiBbeyBob3VycywgbWludXRlcywgc2Vjb25kcyB9XSxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKHtcbiAgICAgICAgICAgICAgICBhY3Rpb246IFwic3RhcnRCcmVha1wiLFxuICAgICAgICAgICAgICAgIGRhdGE6IHsgaG91cnM6IGhvdXJzLCBtaW51dGVzOiBtaW51dGVzLCBzZWNvbmRzOiBzZWNvbmRzIH0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbn0pO1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9