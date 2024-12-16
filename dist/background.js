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
                createTimerAlarm();
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
                createTimerAlarm();
                sendResponse({ success: true, message: "Time data resumed successfully." });
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
function createTimerAlarm() {
    chrome.alarms.create("timer", { periodInMinutes: 1 / 60 });
}
chrome.alarms.onAlarm.addListener((alarms) => {
    if (alarms.name == "timer") {
        if (hours >= 0) {
            if (seconds == 0 && minutes == 0 && hours == 0) {
                chrome.alarms.clear("timer");
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
                chrome.alarms.clear("timer");
            }
            else if (seconds == 0 && minutes != 0) {
                minutes--;
                seconds = 59;
            }
            else {
                seconds--;
            }
        }
    }
    chrome.runtime.sendMessage({
        message: "timer",
        data: { hours: hours, minutes: minutes, seconds: seconds },
    });
});

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2dyb3VuZC5qcyIsIm1hcHBpbmdzIjoiOzs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJCQUEyQix5Q0FBeUM7QUFDcEU7QUFDQTtBQUNBLDJCQUEyQixvREFBb0Q7QUFDL0U7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUJBQXVCLHlDQUF5QztBQUNoRTtBQUNBO0FBQ0E7QUFDQTtBQUNBLCtCQUErQix5Q0FBeUM7QUFDeEU7QUFDQTtBQUNBLCtCQUErQixvREFBb0Q7QUFDbkY7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQSwrQkFBK0IsdUNBQXVDO0FBQ3RFO0FBQ0E7QUFDQSwrQkFBK0Isb0RBQW9EO0FBQ25GO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUJBQXVCLDJEQUEyRDtBQUNsRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsK0JBQStCLDJEQUEyRDtBQUMxRjtBQUNBO0FBQ0EsK0JBQStCLG9EQUFvRDtBQUNuRjtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsdUJBQXVCLGtEQUFrRDtBQUN6RTtBQUNBO0FBQ0E7QUFDQSxDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0EsbURBQW1ELGtCQUFrQixnQkFBZ0I7QUFDckYsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvQ0FBb0MseUJBQXlCO0FBQzdEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnQkFBZ0Isa0RBQWtEO0FBQ2xFLEtBQUs7QUFDTCxDQUFDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vLy4vc3JjL2JhY2tncm91bmQvYmFja2dyb3VuZC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJsZXQgaG91cnMgPSAwO1xubGV0IG1pbnV0ZXMgPSAwO1xubGV0IHNlY29uZHMgPSAwO1xuLy8gTGlzdGVuIGZvciBtZXNzYWdlcyBmcm9tIGNvbnRlbnQgb3IgcG9wdXAgc2NyaXB0c1xuY2hyb21lLnJ1bnRpbWUub25NZXNzYWdlLmFkZExpc3RlbmVyKChyZXF1ZXN0LCBzZW5kZXIsIHNlbmRSZXNwb25zZSkgPT4ge1xuICAgIGxldCByZXNwb25zZU1lc3NhZ2UgPSBcIlwiO1xuICAgIGNvbnNvbGUubG9nKHJlcXVlc3QpO1xuICAgIC8vIEhhbmRsZSBkaWZmZXJlbnQgbWVzc2FnZSB0eXBlc1xuICAgIGlmIChyZXF1ZXN0Lm1lc3NhZ2UgPT09IFwic3RhcnRcIikge1xuICAgICAgICBpZiAocmVxdWVzdC5kYXRhKSB7XG4gICAgICAgICAgICBzdG9yZVRpbWVyVmFsdWVzTG9jYWxseShyZXF1ZXN0LmRhdGEsIFwicnVubmluZ1wiKTtcbiAgICAgICAgICAgIHJlc3BvbnNlTWVzc2FnZSA9IFwiVGltZSBkYXRhIHN0b3JlZCBzdWNjZXNzZnVsbHkuXCI7XG4gICAgICAgICAgICBpZiAocmVxdWVzdC5kYXRhLnJlYWRUaW1lLnNwbGl0KFwiOlwiKVswXSAhPSBcIjAwXCIgfHxcbiAgICAgICAgICAgICAgICByZXF1ZXN0LmRhdGEucmVhZFRpbWUuc3BsaXQoXCI6XCIpWzFdICE9IFwiMDBcIiB8fFxuICAgICAgICAgICAgICAgIHJlcXVlc3QuZGF0YS5yZWFkVGltZS5zcGxpdChcIjpcIilbMl0gIT0gXCIwMFwiKSB7XG4gICAgICAgICAgICAgICAgaWYgKHJlcXVlc3QuZGF0YS5yZWFkVGltZS5zcGxpdChcIjpcIikubGVuZ3RoID09IDMpIHtcbiAgICAgICAgICAgICAgICAgICAgaG91cnMgPSBwYXJzZUludChyZXF1ZXN0LmRhdGEucmVhZFRpbWUuc3BsaXQoXCI6XCIpWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgbWludXRlcyA9IHBhcnNlSW50KHJlcXVlc3QuZGF0YS5yZWFkVGltZS5zcGxpdChcIjpcIilbMV0pO1xuICAgICAgICAgICAgICAgICAgICBzZWNvbmRzID0gcGFyc2VJbnQocmVxdWVzdC5kYXRhLnJlYWRUaW1lLnNwbGl0KFwiOlwiKVsyXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBtaW51dGVzID0gcGFyc2VJbnQocmVxdWVzdC5kYXRhLnJlYWRUaW1lLnNwbGl0KFwiOlwiKVswXSk7XG4gICAgICAgICAgICAgICAgICAgIHNlY29uZHMgPSBwYXJzZUludChyZXF1ZXN0LmRhdGEucmVhZFRpbWUuc3BsaXQoXCI6XCIpWzFdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY3JlYXRlVGltZXJBbGFybSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogdHJ1ZSwgbWVzc2FnZTogcmVzcG9uc2VNZXNzYWdlIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogZmFsc2UsIG1lc3NhZ2U6IFwiTm8gdGltZXIgZGF0YSBwcm92aWRlZC5cIiB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmIChyZXF1ZXN0Lm1lc3NhZ2UgPT09IFwic3RvcFwiKSB7XG4gICAgICAgIC8vIFN0b3AgYWN0aW9uIGxvZ2ljXG4gICAgICAgIHJlc3BvbnNlTWVzc2FnZSA9IFwiVGltZSBkYXRhIHN0b3BwZWQgc3VjY2Vzc2Z1bGx5LlwiO1xuICAgICAgICBjaHJvbWUuYWxhcm1zLmNsZWFyKFwidGltZXJcIik7XG4gICAgICAgIGxldCBkYXRhID0ge1xuICAgICAgICAgICAgaG91cnM6IGhvdXJzLFxuICAgICAgICAgICAgbWludXRlczogbWludXRlcyxcbiAgICAgICAgICAgIHNlY29uZHM6IHNlY29uZHMsXG4gICAgICAgIH07XG4gICAgICAgIHN0b3JlU3RvcFRpbWVyVmFsdWVzTG9jYWxseShkYXRhKTtcbiAgICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogdHJ1ZSwgbWVzc2FnZTogcmVzcG9uc2VNZXNzYWdlIH0pO1xuICAgIH1cbiAgICBlbHNlIGlmIChyZXF1ZXN0Lm1lc3NhZ2UgPT09IFwiZ2V0XCIpIHtcbiAgICAgICAgY2hyb21lLnN0b3JhZ2UubG9jYWwuZ2V0KFwidGltZURldGFpbHNcIiwgKHJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgaWYgKHJlc3VsdC50aW1lRGV0YWlscykge1xuICAgICAgICAgICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IHJlc3VsdC50aW1lRGV0YWlscyB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IGZhbHNlLCBtZXNzYWdlOiBcIk5vIHRpbWVyIGRhdGEgcHJvdmlkZWQuXCIgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIGlmIChyZXF1ZXN0Lm1lc3NhZ2UgPT09IFwiZ2V0U3RvcFwiKSB7XG4gICAgICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldChcInN0b3BUaW1lclwiLCAocmVzdWx0KSA9PiB7XG4gICAgICAgICAgICBpZiAocmVzdWx0LnN0b3BUaW1lcikge1xuICAgICAgICAgICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IHJlc3VsdC5zdG9wVGltZXIgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiBmYWxzZSwgbWVzc2FnZTogXCJObyB0aW1lciBkYXRhIHByb3ZpZGVkLlwiIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgZWxzZSBpZiAocmVxdWVzdC5tZXNzYWdlID09IFwicmVzZXRcIikge1xuICAgICAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5jbGVhcigpO1xuICAgICAgICBjaHJvbWUuYWxhcm1zLmNsZWFyKFwidGltZXJcIik7XG4gICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IHRydWUsIG1lc3NhZ2U6IFwiVGltZSBkYXRhIGNsZWFyZWQgc3VjY2Vzc2Z1bGx5LlwiIH0pO1xuICAgIH1cbiAgICBlbHNlIGlmIChyZXF1ZXN0Lm1lc3NhZ2UgPT0gXCJyZXN1bWVcIikge1xuICAgICAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoXCJzdG9wVGltZXJcIiwgKHJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgaWYgKHJlc3VsdC5zdG9wVGltZXIpIHtcbiAgICAgICAgICAgICAgICBob3VycyA9IHJlc3VsdC5zdG9wVGltZXIuaG91cnM7XG4gICAgICAgICAgICAgICAgbWludXRlcyA9IHJlc3VsdC5zdG9wVGltZXIubWludXRlcztcbiAgICAgICAgICAgICAgICBzZWNvbmRzID0gcmVzdWx0LnN0b3BUaW1lci5zZWNvbmRzO1xuICAgICAgICAgICAgICAgIGNyZWF0ZVRpbWVyQWxhcm0oKTtcbiAgICAgICAgICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiB0cnVlLCBtZXNzYWdlOiBcIlRpbWUgZGF0YSByZXN1bWVkIHN1Y2Nlc3NmdWxseS5cIiB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IGZhbHNlLCBtZXNzYWdlOiBcIk5vIHRpbWVyIGRhdGEgcHJvdmlkZWQuXCIgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogZmFsc2UsIG1lc3NhZ2U6IFwiVW5rbm93biBtZXNzYWdlIHR5cGUuXCIgfSk7XG4gICAgfVxuICAgIC8vIEluZGljYXRlIHRoYXQgdGhlIHJlc3BvbnNlIHdpbGwgYmUgc2VudCBhc3luY2hyb25vdXNseVxuICAgIHJldHVybiB0cnVlO1xufSk7XG4vLyBGdW5jdGlvbiB0byBzdG9yZSB0aW1lciB2YWx1ZXMgbG9jYWxseVxuZnVuY3Rpb24gc3RvcmVUaW1lclZhbHVlc0xvY2FsbHkodGltZXJWYWx1ZXMsIHN0YXR1cykge1xuICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldCh7XG4gICAgICAgIHRpbWVEZXRhaWxzOiBPYmplY3QuYXNzaWduKE9iamVjdC5hc3NpZ24oe30sIHRpbWVyVmFsdWVzKSwgeyBzdGF0dXM6IHN0YXR1cyB9KSxcbiAgICB9KTtcbn1cbi8vRnVuY3Rpb24gdG8gc3RvcmUgc3RvcCB0aW1lciB2YWx1ZSBsb2NhbGx5XG5mdW5jdGlvbiBzdG9yZVN0b3BUaW1lclZhbHVlc0xvY2FsbHkodGltZXJWYWx1ZXMpIHtcbiAgICBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoe1xuICAgICAgICBzdG9wVGltZXI6IHRpbWVyVmFsdWVzLFxuICAgIH0pO1xufVxuLy8gRnVuY3Rpb24gdG8gdXBkYXRlIHRpbWVyIHZhbHVlcyBsb2NhbGx5XG5mdW5jdGlvbiB1cGRhdGVUaW1lclZhbHVlc0xvY2FsbHkodGltZXJWYWx1ZXMsIHN0YXR1cykge1xuICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLmNsZWFyKCk7XG4gICAgc3RvcmVUaW1lclZhbHVlc0xvY2FsbHkodGltZXJWYWx1ZXMsIHN0YXR1cyk7XG59XG5mdW5jdGlvbiBjcmVhdGVUaW1lckFsYXJtKCkge1xuICAgIGNocm9tZS5hbGFybXMuY3JlYXRlKFwidGltZXJcIiwgeyBwZXJpb2RJbk1pbnV0ZXM6IDEgLyA2MCB9KTtcbn1cbmNocm9tZS5hbGFybXMub25BbGFybS5hZGRMaXN0ZW5lcigoYWxhcm1zKSA9PiB7XG4gICAgaWYgKGFsYXJtcy5uYW1lID09IFwidGltZXJcIikge1xuICAgICAgICBpZiAoaG91cnMgPj0gMCkge1xuICAgICAgICAgICAgaWYgKHNlY29uZHMgPT0gMCAmJiBtaW51dGVzID09IDAgJiYgaG91cnMgPT0gMCkge1xuICAgICAgICAgICAgICAgIGNocm9tZS5hbGFybXMuY2xlYXIoXCJ0aW1lclwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHNlY29uZHMgPT0gMCAmJiBtaW51dGVzID09IDAgJiYgaG91cnMgIT0gMCkge1xuICAgICAgICAgICAgICAgIGhvdXJzLS07XG4gICAgICAgICAgICAgICAgbWludXRlcyA9IDU5O1xuICAgICAgICAgICAgICAgIHNlY29uZHMgPSA1OTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHNlY29uZHMgPT0gMCAmJiBtaW51dGVzICE9IDApIHtcbiAgICAgICAgICAgICAgICBtaW51dGVzLS07XG4gICAgICAgICAgICAgICAgc2Vjb25kcyA9IDU5O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgc2Vjb25kcy0tO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaWYgKHNlY29uZHMgPT0gMCAmJiBtaW51dGVzID09IDApIHtcbiAgICAgICAgICAgICAgICBjaHJvbWUuYWxhcm1zLmNsZWFyKFwidGltZXJcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChzZWNvbmRzID09IDAgJiYgbWludXRlcyAhPSAwKSB7XG4gICAgICAgICAgICAgICAgbWludXRlcy0tO1xuICAgICAgICAgICAgICAgIHNlY29uZHMgPSA1OTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHNlY29uZHMtLTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZSh7XG4gICAgICAgIG1lc3NhZ2U6IFwidGltZXJcIixcbiAgICAgICAgZGF0YTogeyBob3VyczogaG91cnMsIG1pbnV0ZXM6IG1pbnV0ZXMsIHNlY29uZHM6IHNlY29uZHMgfSxcbiAgICB9KTtcbn0pO1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9