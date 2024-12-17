/******/ (() => { // webpackBootstrap
/*!********************************!*\
  !*** ./src/content/content.ts ***!
  \********************************/
// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "startBreak") {
        createOrUpdateBreakModal(message.data);
    }
    else if (message.action === "startBreakEnd") {
        removeBreakModal();
    }
});
// Function to create or update the break modal
function createOrUpdateBreakModal(timeData) {
    let modal = document.getElementById("breakModal");
    if (!modal) {
        // Create the modal if it doesn't exist
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
    // Update the timer in the modal
    const timerElement = document.getElementById("breakTimer");
    if (timerElement) {
        timerElement.textContent = `${timeData.hours}:${timeData.minutes}:${timeData.seconds}`;
    }
}
// Function to remove the break modal
function removeBreakModal() {
    const modal = document.getElementById("breakModal");
    if (modal) {
        modal.remove();
    }
}

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGVudC5qcyIsIm1hcHBpbmdzIjoiOzs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0NBQXNDLGVBQWUsR0FBRyxpQkFBaUIsR0FBRyxpQkFBaUI7QUFDN0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vLy4vc3JjL2NvbnRlbnQvY29udGVudC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBMaXN0ZW4gZm9yIG1lc3NhZ2VzIGZyb20gdGhlIGJhY2tncm91bmQgc2NyaXB0XG5jaHJvbWUucnVudGltZS5vbk1lc3NhZ2UuYWRkTGlzdGVuZXIoKG1lc3NhZ2UsIHNlbmRlciwgc2VuZFJlc3BvbnNlKSA9PiB7XG4gICAgaWYgKG1lc3NhZ2UuYWN0aW9uID09PSBcInN0YXJ0QnJlYWtcIikge1xuICAgICAgICBjcmVhdGVPclVwZGF0ZUJyZWFrTW9kYWwobWVzc2FnZS5kYXRhKTtcbiAgICB9XG4gICAgZWxzZSBpZiAobWVzc2FnZS5hY3Rpb24gPT09IFwic3RhcnRCcmVha0VuZFwiKSB7XG4gICAgICAgIHJlbW92ZUJyZWFrTW9kYWwoKTtcbiAgICB9XG59KTtcbi8vIEZ1bmN0aW9uIHRvIGNyZWF0ZSBvciB1cGRhdGUgdGhlIGJyZWFrIG1vZGFsXG5mdW5jdGlvbiBjcmVhdGVPclVwZGF0ZUJyZWFrTW9kYWwodGltZURhdGEpIHtcbiAgICBsZXQgbW9kYWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJyZWFrTW9kYWxcIik7XG4gICAgaWYgKCFtb2RhbCkge1xuICAgICAgICAvLyBDcmVhdGUgdGhlIG1vZGFsIGlmIGl0IGRvZXNuJ3QgZXhpc3RcbiAgICAgICAgbW9kYWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICBtb2RhbC5pZCA9IFwiYnJlYWtNb2RhbFwiO1xuICAgICAgICBtb2RhbC5zZXRBdHRyaWJ1dGUoXCJzdHlsZVwiLCBgXHJcbiAgICAgICAgcG9zaXRpb246IGZpeGVkO1xyXG4gICAgICAgIHRvcDogMDtcclxuICAgICAgICBsZWZ0OiAwO1xyXG4gICAgICAgIHdpZHRoOiAxMDB2dztcclxuICAgICAgICBoZWlnaHQ6IDEwMHZoO1xyXG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEoMCwgMCwgMCwgMC44KTtcclxuICAgICAgICBjb2xvcjogd2hpdGU7XHJcbiAgICAgICAgZGlzcGxheTogZmxleDtcclxuICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcclxuICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xyXG4gICAgICAgIHotaW5kZXg6IDk5OTk5OTtcclxuICAgICAgICBmb250LXNpemU6IDI0cHg7XHJcbiAgICAgICAgcG9pbnRlci1ldmVudHM6IGFsbDtcclxuICAgICAgICBgKTtcbiAgICAgICAgbW9kYWwuaW5uZXJIVE1MID0gYFxyXG4gICAgICA8Ym9keT5cclxuICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgPGgxPkJyZWFrIFRpbWUhPC9oMT5cclxuICAgICAgICAgIDxwPlJlbGF4IGZvciBhIHdoaWxlLiBUaGlzIHdpbGwgZW5kIGluIDxzcGFuIGlkPVwiYnJlYWtUaW1lclwiPjwvc3Bhbj4gc2Vjb25kcy48L3A+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgIDwvYm9keT5cclxuICAgICAgYDtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChtb2RhbCk7XG4gICAgfVxuICAgIC8vIFVwZGF0ZSB0aGUgdGltZXIgaW4gdGhlIG1vZGFsXG4gICAgY29uc3QgdGltZXJFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJicmVha1RpbWVyXCIpO1xuICAgIGlmICh0aW1lckVsZW1lbnQpIHtcbiAgICAgICAgdGltZXJFbGVtZW50LnRleHRDb250ZW50ID0gYCR7dGltZURhdGEuaG91cnN9OiR7dGltZURhdGEubWludXRlc306JHt0aW1lRGF0YS5zZWNvbmRzfWA7XG4gICAgfVxufVxuLy8gRnVuY3Rpb24gdG8gcmVtb3ZlIHRoZSBicmVhayBtb2RhbFxuZnVuY3Rpb24gcmVtb3ZlQnJlYWtNb2RhbCgpIHtcbiAgICBjb25zdCBtb2RhbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYnJlYWtNb2RhbFwiKTtcbiAgICBpZiAobW9kYWwpIHtcbiAgICAgICAgbW9kYWwucmVtb3ZlKCk7XG4gICAgfVxufVxuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9