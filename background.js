// This script runs in the background and can listen to browser events
chrome.runtime.onInstalled.addListener(() => {
  setLoggedOutBadge();
  chrome.storage.sync.set({
    moodleCssEnabled: true,
    ajaxEnabled: true,
    darkModeEnabled: false,
  });
  console.log("Extension installed");
});

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "saveToken") {
    const token = request.token;
    setLoggedInBadge();
    // Save the token in chrome.storage
    chrome.storage.local.set({ jwtToken: token }, () => {
      console.log("JWT token saved.");
    });
  }

  if (request.action === "loggedOut") {
    chrome.storage.local.remove("jwtToken");
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
