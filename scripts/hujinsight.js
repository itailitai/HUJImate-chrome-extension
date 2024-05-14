// Function to retrieve JWT token from local storage
function getJwtToken() {
  return localStorage.getItem("jwtToken");
}

function setupToken() {
  const token = getJwtToken();
  if (token) {
    chrome.runtime.sendMessage({ action: "saveToken", token: token });
  }
}

if (document.readyState === "loading") {
  // Loading hasn't finished yet
  document.addEventListener("DOMContentLoaded", setupToken);
} else {
  // `DOMContentLoaded` has already fired
  setupToken();
}
