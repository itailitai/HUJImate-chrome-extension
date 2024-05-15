// Check if JWT token is present in local storage
function getJwtToken(callback) {
  chrome.storage.local.get(["jwtToken"], (result) => {
    callback(result.jwtToken);
  });
}

// Update the message and color based on JWT token presence
getJwtToken((token) => {
  const messageElement = document.querySelector("p");
  if (token) {
    messageElement.textContent =
      "את/ה מחובר/ת למשתמש ה-HUJInsight שלך! ניתן לשתף ציונים מהמידע האישי.";
    messageElement.style.color = "green";
  } else {
    messageElement.textContent =
      "אינך מחובר/ת למשתמש ה-HUJInsight שלך. יש להתחבר על מנת לשתף ציונים.";
    messageElement.style.color = "red";
  }
});

// Function to refresh the current tab
function refreshCurrentTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.reload(tabs[0].id);
    }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  const cssToggle = document.getElementById("cssToggle");
  const ajaxToggle = document.getElementById("ajaxToggle");
  const darkModeToggle = document.getElementById("darkModeToggle");

  // Load the saved setting for CSS injection
  chrome.storage.sync.get(["moodleCssEnabled"], (result) => {
    cssToggle.checked = result.moodleCssEnabled !== false; // Default is true

    // Load dark mode setting only if CSS is enabled
    if (cssToggle.checked) {
      chrome.storage.sync.get(["darkModeEnabled"], (result) => {
        darkModeToggle.checked = result.darkModeEnabled === true; // Default is true
      });
    } else {
      darkModeToggle.disabled = true; // Disable dark mode toggle if CSS is not enabled
    }
  });

  // Save the setting and refresh the current tab when CSS checkbox is changed
  cssToggle.addEventListener("change", function () {
    chrome.storage.sync.set({ moodleCssEnabled: cssToggle.checked }, () => {
      refreshCurrentTab(); // Refresh the current tab

      // Enable/disable dark mode toggle based on CSS toggle state
      if (cssToggle.checked) {
        darkModeToggle.disabled = false;
        // Load dark mode setting if CSS is enabled
        chrome.storage.sync.get(["darkModeEnabled"], (result) => {
          darkModeToggle.checked = result.darkModeEnabled === true;
        });
      } else {
        darkModeToggle.checked = false;
        darkModeToggle.disabled = true;
        chrome.storage.sync.set({ darkModeEnabled: false });
      }
    });
  });

  // Load the saved setting for AJAX
  chrome.storage.sync.get(["ajaxEnabled"], (result) => {
    ajaxToggle.checked = result.ajaxEnabled !== false; // Default is true
  });

  // Save the setting and refresh the current tab when AJAX checkbox is changed
  ajaxToggle.addEventListener("change", function () {
    chrome.storage.sync.set({ ajaxEnabled: ajaxToggle.checked }, () => {
      refreshCurrentTab(); // Refresh the current tab
    });
  });

  // Save the setting and refresh the current tab when dark mode checkbox is changed
  darkModeToggle.addEventListener("change", function () {
    chrome.storage.sync.set({ darkModeEnabled: darkModeToggle.checked }, () => {
      refreshCurrentTab(); // Refresh the current tab
    });
  });
});
