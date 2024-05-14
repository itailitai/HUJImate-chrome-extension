// check if jwt token is present in local storage
function getJwtToken(callback) {
  chrome.storage.local.get(["jwtToken"], (result) => {
    callback(result.jwtToken);
  });
}

getJwtToken((token) => {
  if (token) {
    document.querySelector("p").textContent =
      "את/ה מחובר/ת למשתמש ה-HUJInsight שלך! ניתן לשתף ציונים מהמידע האישי.";
    document.querySelector("p").style.color = "green";
  } else {
    document.querySelector("p").textContent =
      "אינך מחובר/ת למשתמש ה-HUJInsight שלך. יש להתחבר על מנת לשתף ציונים.";
    document.querySelector("p").style.color = "red";
  }
});

// Function to refresh the current tab
function refreshCurrentTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs[0]) {
      chrome.tabs.reload(tabs[0].id);
    }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  const cssToggle = document.getElementById("cssToggle");

  // Load the saved setting for CSS injection
  chrome.storage.sync.get(["moodleCssEnabled"], function (result) {
    cssToggle.checked = result.moodleCssEnabled !== false; // Default is true
  });

  // Save the setting and refresh the current tab when checkbox is changed
  cssToggle.addEventListener("change", function () {
    chrome.storage.sync.set(
      { moodleCssEnabled: cssToggle.checked },
      function () {
        refreshCurrentTab(); // Refresh the current tab
      }
    );
  });

  // Option for ajax loading
  const ajaxToggle = document.getElementById("ajaxToggle");

  // Load the saved setting for AJAX
  chrome.storage.sync.get(["ajaxEnabled"], function (result) {
    ajaxToggle.checked = result.ajaxEnabled !== false; // Default is true
  });

  // Save the setting and refresh the current tab when checkbox is changed
  ajaxToggle.addEventListener("change", function () {
    chrome.storage.sync.set({ ajaxEnabled: ajaxToggle.checked }, function () {
      refreshCurrentTab(); // Refresh the current tab
    });
  });
});
