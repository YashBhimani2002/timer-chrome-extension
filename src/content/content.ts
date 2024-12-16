// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "startBreak") {
      createOrUpdateBreakModal(message.data);
    } else if (message.action === "startBreakEnd") {
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
      modal.setAttribute(
        "style",
        `
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
        `
      );
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
  