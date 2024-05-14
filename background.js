// This script runs in the background and can listen to browser events
chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
});

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "saveToken") {
    const token = request.token;

    // Save the token in chrome.storage
    chrome.storage.local.set({ jwtToken: token }, () => {
      console.log("JWT token saved.");
    });
  }
});
