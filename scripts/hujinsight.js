// Function to retrieve token from local storage
const getJwtTokenWithDelay = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        token: localStorage.getItem("jwtToken"),
        name: JSON.parse(localStorage.getItem("user")).displayName,
      });
    }, 2000); // 2-second delay
  });
};
const setupToken = async () => {
  const { token, name } = await getJwtTokenWithDelay();

  if (token) {
    chrome.storage.local.get(["jwtToken"], (result) => {
      if (result.jwtToken !== token || !result.jwtToken) {
        chrome.runtime.sendMessage({
          action: "saveToken",
          token: token,
          name: name,
        });
        // show success popup
        setTimeout(() => {
          createSuccessToast();
        }, 500);
      }
    });
  }
};

if (document.readyState === "loading") {
  // Loading hasn't finished yet
  document.addEventListener("DOMContentLoaded", setupToken);
} else {
  // `DOMContentLoaded` has already fired
  setupToken();
}

// Modal creation

const createSuccessToast = () => {
  // Create the toast container
  const toast = document.createElement("div");
  toast.id = "success-toast";

  toast.style.position = "fixed";
  toast.style.zIndex = "5000001";
  toast.style.bottom = "20px";
  toast.style.left = "20px";
  toast.style.width = "300px";
  toast.style.padding = "15px 20px";
  toast.style.backgroundColor = "#ffffff";
  toast.style.color = "#333333";
  toast.style.borderRadius = "8px";
  toast.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
  toast.style.opacity = "0";
  toast.style.transition = "opacity 0.3s ease-in-out";
  toast.style.fontFamily = "Arial, sans-serif";
  toast.style.border = "1px solid #e0e0e0";

  // Create the success icon
  const successIcon = document.createElement("div");
  successIcon.innerHTML = "✅";
  successIcon.style.fontSize = "24px";
  successIcon.style.marginBottom = "10px";

  // Create the success message
  const successMessage = document.createElement("div");
  successMessage.textContent = "מעולה!";
  successMessage.style.fontWeight = "bold";
  successMessage.style.marginBottom = "5px";
  successMessage.style.fontSize = "18px";

  const successDescription = document.createElement("div");
  successDescription.textContent =
    "התוסף חובר בהצלחה למשתמש StudentInsight שלך!";
  successDescription.style.fontSize = "14px";
  successDescription.style.color = "#666666";

  // Create the progress bar container
  const progressBarContainer = document.createElement("div");
  progressBarContainer.style.width = "100%";
  progressBarContainer.style.height = "4px";
  progressBarContainer.style.backgroundColor = "#e0e0e0";
  progressBarContainer.style.position = "absolute";
  progressBarContainer.style.bottom = "0";
  progressBarContainer.style.left = "0";
  progressBarContainer.style.borderRadius = "0 0 8px 8px";
  progressBarContainer.style.overflow = "hidden";

  // Create the progress bar
  const progressBar = document.createElement("div");
  progressBar.style.width = "100%";
  progressBar.style.height = "100%";
  progressBar.style.backgroundColor = "#4CAF50";
  progressBar.style.transition = "width 5s linear";

  // Append elements to the toast
  progressBarContainer.appendChild(progressBar);
  toast.appendChild(successIcon);
  toast.appendChild(successMessage);
  toast.appendChild(successDescription);
  toast.appendChild(progressBarContainer);

  // Append the toast to the body
  document.body.appendChild(toast);

  // Function to show the toast
  const showToast = () => {
    toast.style.opacity = "1";

    setTimeout(() => {
      progressBar.style.width = "0";
    }, 50);

    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 5000);
  };

  // Show the toast
  showToast();
};
