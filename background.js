// background.js
chrome.runtime.onInstalled.addListener(() => {
  initializeBadgeState();
  chrome.storage.sync.set({
    moodleCssEnabled: true,
    ajaxEnabled: true,
    darkModeEnabled: false,
  });
  console.log("Extension installed");
});

// Initialize badge state on startup
chrome.runtime.onStartup.addListener(() => {
  initializeBadgeState();
});

function initializeBadgeState() {
  chrome.storage.local.get("jwtToken", (result) => {
    if (result.jwtToken) {
      setLoggedInBadge();
    } else {
      setLoggedOutBadge();
    }
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "saveToken") {
    const token = request.token;
    const name = request.name;
    setLoggedInBadge();
    // Save the token in chrome.storage
    chrome.storage.local.set({ jwtToken: token, name: name });
  }

  if (request.action === "loggedOut") {
    chrome.storage.local.remove("jwtToken");
    chrome.storage.local.remove("name");
    setLoggedOutBadge();
  }
});

function setLoggedInBadge() {
  chrome.action.setBadgeBackgroundColor({ color: "#4CAF50" });
  chrome.action.setBadgeText({ text: "✓" }); // We have 10+ unread items.
}

function setLoggedOutBadge() {
  chrome.action.setBadgeText({ text: "?" });
  chrome.action.setBadgeBackgroundColor({ color: "#ffbf8a" });
}
