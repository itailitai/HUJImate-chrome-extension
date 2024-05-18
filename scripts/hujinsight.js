// Function to retrieve token from local storage
const getJwtTokenWithDelay = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(localStorage.getItem("jwtToken"));
    }, 2000); // 2-second delay
  });
};

const setupToken = async () => {
  const token = await getJwtTokenWithDelay();

  if (token) {
    chrome.storage.local.get(["jwtToken"], (result) => {
      if (result.jwtToken !== token || !result.jwtToken) {
        chrome.runtime.sendMessage({ action: "saveToken", token: token });
        // show success popup
        setTimeout(() => {
          createSuccessModal();
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

const createSuccessModal = () => {
  // Create the modal container
  const modal = document.createElement("div");
  modal.id = "success-modal";

  modal.style.position = "fixed";
  modal.style.zIndex = "1000";
  modal.style.left = "0";
  modal.style.top = "0";
  modal.style.width = "100%";
  modal.style.height = "100%";
  modal.style.overflow = "auto";
  modal.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  modal.style.opacity = "0";
  modal.style.transition = "opacity 0.5s";

  // Create the modal content
  const modalContent = document.createElement("div");
  modalContent.style.backgroundColor = "#fff";
  modalContent.style.margin = "15% auto";
  modalContent.style.padding = "20px";
  modalContent.style.border = "1px solid #888";
  modalContent.style.width = "80%";
  modalContent.style.maxWidth = "500px";
  modalContent.style.borderRadius = "10px";

  modalContent.style.textAlign = "center";

  // Create the close button
  const closeButton = document.createElement("span");
  closeButton.innerHTML = "&times;";
  closeButton.style.color = "#aaa";
  closeButton.style.float = "left";
  closeButton.style.marginTop = "-10px";
  closeButton.style.fontSize = "28px";
  closeButton.style.fontWeight = "bold";
  closeButton.style.cursor = "pointer";

  closeButton.onmouseover = function () {
    closeButton.style.color = "#000";
  };

  closeButton.onmouseout = function () {
    closeButton.style.color = "#aaa";
  };

  closeButton.onclick = function () {
    modal.style.display = "none";
  };

  // Create the success message
  const successMessage = document.createElement("h2");
  successMessage.textContent = "מעולה!";
  successMessage.style.color = "#4CAF50";
  successMessage.style.marginBottom = "10px";

  const successDescription = document.createElement("p");
  successDescription.textContent =
    "התוסף חובר בהצלחה למשתמש HUJInsight שלך! ניתן לשתף ציונים מהמידע האישי.";
  successDescription.style.color = "#333";

  // Append elements to the modal content
  modalContent.appendChild(closeButton);
  modalContent.appendChild(successMessage);
  modalContent.appendChild(successDescription);

  // Append the modal content to the modal
  modal.appendChild(modalContent);

  // Append the modal to the body
  document.body.appendChild(modal);

  // Function to show the modal
  const showModal = () => {
    setTimeout(() => {
      modal.style.opacity = "1";
    }, 250);
  };

  // Close the modal when clicking outside the modal content
  window.onclick = function (event) {
    if (event.target == modal) {
      // remove modal
      modal.style.display = "none";
      modal.remove();
    }
  };

  // Show the modal
  showModal();
};
