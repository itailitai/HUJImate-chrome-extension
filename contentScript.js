// content.js

/**
 * Logging utility to track operations and errors for debugging
 */

const browser = window.browser || window.chrome;

const Logger = {
  logs: [],
  startTime: Date.now(),

  log: function (message, data = null) {
    const entry = {
      timestamp: new Date().toISOString(),
      elapsedMs: Date.now() - this.startTime,
      message,
      data: data ? JSON.parse(JSON.stringify(data)) : null,
    };
    this.logs.push(entry);
    console.log(`[${entry.elapsedMs}ms] ${message}`, data || "");
  },

  error: function (message, error = null, data = null) {
    const entry = {
      timestamp: new Date().toISOString(),
      elapsedMs: Date.now() - this.startTime,
      type: "ERROR",
      message,
      errorMessage: error ? error.message : null,
      errorStack: error ? error.stack : null,
      data: data ? JSON.parse(JSON.stringify(data)) : null,
    };
    this.logs.push(entry);
    console.error(
      `[ERROR] [${entry.elapsedMs}ms] ${message}`,
      error || "",
      data || ""
    );
  },

  warn: function (message, data = null) {
    const entry = {
      timestamp: new Date().toISOString(),
      elapsedMs: Date.now() - this.startTime,
      type: "WARNING",
      message,
      data: data ? JSON.parse(JSON.stringify(data)) : null,
    };
    this.logs.push(entry);
    console.warn(`[WARNING] [${entry.elapsedMs}ms] ${message}`, data || "");
  },

  getLogText: function () {
    return JSON.stringify(this.logs, null, 2);
  },

  // Modified downloadLogs to include any collected "allResults" if available
  downloadLogs: function (additionalData = {}) {
    // Merge the additionalData with the allResults (if any)
    const mergedData = {
      ...additionalData,
      allResults: window.lastAllResults || {},
    };

    const finalLogs = {
      logs: this.logs,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      additionalData: mergedData,
    };

    const blob = new Blob([JSON.stringify(finalLogs, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `student-insight-logs-${new Date()
      .toISOString()
      .replace(/:/g, "-")}.json`;
    document.body.appendChild(a);
    a.click();

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  },
};
function collectFormFields(form) {
  const out = {};
  try {
    const fd = new FormData(form);
    if (typeof fd.forEach === "function") {
      fd.forEach((value, key) => {
        out[key] = value;
      });
      return out;
    }
  } catch (e) {
    Logger.warn("FormData(form) failed, falling back to manual collection", {
      error: e?.message,
    });
  }

  // Fallback (just in case)
  const els = form?.querySelectorAll("input, select, textarea") || [];
  for (const el of els) {
    if (!el.name) continue;
    if ((el.type === "checkbox" || el.type === "radio") && !el.checked)
      continue;
    out[el.name] = el.value;
  }
  return out;
}

/**
 * Shows a year selection overlay before starting the scraping process
 * @param {Array} availableYears - List of available academic years
 * @returns {Promise<Array>} - Promise resolving to array of selected years
 */
async function showYearSelectionOverlay(availableYears) {
  Logger.log("Showing year selection overlay", { availableYears });

  return new Promise((resolve) => {
    // Create the overlay container
    const overlay = document.createElement("div");
    overlay.id = "yearSelectionOverlay";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    overlay.style.zIndex = "10000";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";

    // Create the selection box
    const selectionBox = document.createElement("div");
    selectionBox.style.backgroundColor = "#fff";
    selectionBox.style.borderRadius = "12px";
    selectionBox.style.padding = "30px";
    selectionBox.style.width = "500px";
    selectionBox.style.maxWidth = "90%";
    selectionBox.style.maxHeight = "80vh";
    selectionBox.style.overflowY = "auto";
    selectionBox.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.2)";
    selectionBox.style.direction = "rtl"; // RTL for Hebrew

    // Add title
    const title = document.createElement("h2");
    title.textContent = "בחר שנים לשיתוף";
    title.style.margin = "0 0 20px 0";
    title.style.fontSize = "24px";
    title.style.fontWeight = "bold";
    title.style.color = "#333";
    title.style.textAlign = "center";
    selectionBox.appendChild(title);

    // Add description
    const description = document.createElement("p");
    description.textContent = "בחר את השנים שברצונך לשתף סטטיסטיקות עבורן";
    description.style.margin = "0 0 25px 0";
    description.style.textAlign = "center";
    description.style.color = "#666";
    selectionBox.appendChild(description);

    // Create "Select All" checkbox
    const selectAllContainer = document.createElement("div");
    selectAllContainer.style.display = "flex";
    selectAllContainer.style.alignItems = "center";
    selectAllContainer.style.marginBottom = "15px";
    selectAllContainer.style.padding = "10px";
    selectAllContainer.style.borderRadius = "8px";
    selectAllContainer.style.backgroundColor = "#f5f7fa";

    const selectAllCheckbox = document.createElement("input");
    selectAllCheckbox.type = "checkbox";
    selectAllCheckbox.id = "selectAllYears";
    selectAllCheckbox.checked = true;
    selectAllCheckbox.style.margin = "0 0 0 10px";
    selectAllCheckbox.style.width = "18px";
    selectAllCheckbox.style.height = "18px";

    const selectAllLabel = document.createElement("label");
    selectAllLabel.setAttribute("for", "selectAllYears");
    selectAllLabel.textContent = "בחר הכל";
    selectAllLabel.style.fontWeight = "bold";
    selectAllLabel.style.flex = "1";

    selectAllContainer.appendChild(selectAllCheckbox);
    selectAllContainer.appendChild(selectAllLabel);
    selectionBox.appendChild(selectAllContainer);

    // Create checkboxes for each year
    const checkboxContainer = document.createElement("div");
    checkboxContainer.style.display = "flex";
    checkboxContainer.style.flexDirection = "column";
    checkboxContainer.style.gap = "10px";
    checkboxContainer.style.marginBottom = "25px";

    const yearCheckboxes = [];

    availableYears.forEach((year) => {
      const container = document.createElement("div");
      container.style.display = "flex";
      container.style.alignItems = "center";
      container.style.padding = "12px";
      container.style.borderRadius = "8px";
      container.style.backgroundColor = "#f9f9f9";
      container.style.transition = "background-color 0.2s ease";
      container.style.cursor = "pointer";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = `year-${year}`;
      checkbox.value = year;
      checkbox.checked = true;
      checkbox.style.margin = "0 0 0 10px";
      checkbox.style.width = "18px";
      checkbox.style.height = "18px";

      const label = document.createElement("label");
      label.setAttribute("for", `year-${year}`);
      label.textContent = `שנה אקדמית ${parseInt(year) - 1}-${year}`;
      label.style.flex = "1";

      container.addEventListener("click", (e) => {
        if (e.target !== checkbox) {
          checkbox.checked = !checkbox.checked;
          updateSelectAllCheckbox();
        }
      });

      container.appendChild(checkbox);
      container.appendChild(label);
      checkboxContainer.appendChild(container);
      yearCheckboxes.push(checkbox);
    });

    selectionBox.appendChild(checkboxContainer);

    // Select/deselect all functionality
    selectAllCheckbox.addEventListener("change", () => {
      const isChecked = selectAllCheckbox.checked;
      yearCheckboxes.forEach((cb) => {
        cb.checked = isChecked;
      });
    });

    function updateSelectAllCheckbox() {
      const allChecked = yearCheckboxes.every((cb) => cb.checked);
      const someChecked = yearCheckboxes.some((cb) => cb.checked);

      selectAllCheckbox.checked = allChecked;
      selectAllCheckbox.indeterminate = someChecked && !allChecked;
    }

    // Add buttons
    const buttonContainer = document.createElement("div");
    buttonContainer.style.display = "flex";
    buttonContainer.style.justifyContent = "center";
    buttonContainer.style.gap = "15px";

    const cancelButton = document.createElement("button");
    cancelButton.textContent = "ביטול";
    cancelButton.style.padding = "12px 24px";
    cancelButton.style.border = "1px solid #d1d5db";
    cancelButton.style.borderRadius = "8px";
    cancelButton.style.backgroundColor = "#fff";
    cancelButton.style.color = "#374151";
    cancelButton.style.fontSize = "16px";
    cancelButton.style.cursor = "pointer";
    cancelButton.style.transition = "background-color 0.2s ease";

    cancelButton.addEventListener("mouseenter", () => {
      cancelButton.style.backgroundColor = "#f9fafb";
    });

    cancelButton.addEventListener("mouseleave", () => {
      cancelButton.style.backgroundColor = "#fff";
    });

    const continueButton = document.createElement("button");
    continueButton.textContent = "המשך";
    continueButton.style.padding = "12px 24px";
    continueButton.style.border = "none";
    continueButton.style.borderRadius = "8px";
    continueButton.style.backgroundColor = "#8b5cf6";
    continueButton.style.color = "#fff";
    continueButton.style.fontSize = "16px";
    continueButton.style.cursor = "pointer";
    continueButton.style.transition = "background-color 0.2s ease";

    continueButton.addEventListener("mouseenter", () => {
      continueButton.style.backgroundColor = "#7c3aed";
    });

    continueButton.addEventListener("mouseleave", () => {
      continueButton.style.backgroundColor = "#8b5cf6";
    });

    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(continueButton);
    selectionBox.appendChild(buttonContainer);

    // Handle button clicks
    cancelButton.addEventListener("click", () => {
      overlay.remove();
      resolve([]);
    });

    continueButton.addEventListener("click", () => {
      const selectedYears = yearCheckboxes
        .filter((cb) => cb.checked)
        .map((cb) => parseInt(cb.value));

      Logger.log("User selected years", { selectedYears });
      overlay.remove();
      resolve(selectedYears);
    });

    // Add the overlay to the page
    overlay.appendChild(selectionBox);
    document.body.appendChild(overlay);
  });
}

/**
 * Retrieve the shared courses object from local storage
 * @returns {Promise<Object>} An object where each key is a course ID and value is `true` if shared
 */
function getSharedCourses() {
  Logger.log("Getting shared courses from storage");
  return new Promise((resolve) => {
    chrome.storage.local.get("sharedCourses", (result) => {
      // If sharedCourses doesn't exist yet, default to an empty object
      const sharedCourses = result.sharedCourses || {};
      Logger.log(
        `Retrieved ${Object.keys(sharedCourses).length} shared courses`
      );
      resolve(sharedCourses);
    });
  });
}

/**
 * Save (or update) the shared courses object in local storage
 * @param {Object} courses
 */
function setSharedCourses(courses) {
  Logger.log(`Saving ${Object.keys(courses).length} courses to storage`);
  chrome.storage.local.set({ sharedCourses: courses });
}

/**
 * Mark a single course as shared
 * @param {string} courseId - A unique identifier for the course (e.g., "67925" or "67925-1-01")
 */
async function markCourseAsShared(courseId) {
  Logger.log(`Marking course as shared: ${courseId}`);
  try {
    const sharedCourses = await getSharedCourses();
    sharedCourses[courseId] = true;
    setSharedCourses(sharedCourses);
  } catch (error) {
    Logger.error(`Failed to mark course ${courseId} as shared`, error);
  }
}

/**
 * Checks if a course is already shared
 * @param {string} courseId
 * @returns {Promise<boolean>} true if already shared
 */
async function isCourseShared(courseId) {
  try {
    const sharedCourses = await getSharedCourses();
    return !!sharedCourses[courseId];
  } catch (error) {
    Logger.error(`Failed to check if course is shared: ${courseId}`, error);
    return false; // Conservative approach - if error, assume not shared
  }
}

/**
 * Fetches an image from the given URL and converts it to a Base64 string.
 * @param {string} url - The URL of the image to convert.
 * @returns {Promise<string>} - A promise that resolves to the Base64 string of the image.
 */
async function getBase64Image(url) {
  Logger.log(`Getting base64 image from: ${url}`);
  try {
    const response = await fetch(url, { mode: "cors" });
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]); // Remove prefix
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    Logger.error("Error converting image to Base64", error, { url });
    return null;
  }
}

// Wait for the DOM to fully load
document.addEventListener("DOMContentLoaded", () => {
  Logger.log("DOM content loaded, adding scrape button");
  addScrapeButton();
});

function showCustomOverlay(
  overlay_name,
  errorData = null,
  errorfunction = null
) {
  Logger.log(`Showing custom overlay: ${overlay_name}`, { errorData });

  // Only inject if not already present
  if (document.getElementById("myCustomOverlayIframe")) {
    return;
  }

  const iframe = document.createElement("iframe");
  iframe.id = "myCustomOverlayIframe";
  iframe.src = chrome.runtime.getURL("assets/" + overlay_name);
  // Style it to cover the entire page
  iframe.style.position = "fixed";
  iframe.style.top = 0;
  iframe.style.left = 0;
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.border = "none";
  iframe.style.zIndex = "999999"; // On top of everything
  iframe.style.backgroundColor = "rgba(0, 0, 0, 0.5)";

  // Store error data to potentially pass to the iframe later
  if (errorData) {
    iframe.dataset.errorData = JSON.stringify(errorData);
  }

  // add a more info button to the iframe that will call the errorfunction
  const moreInfoButton = document.createElement("button");
  moreInfoButton.innerText = "More Info";
  moreInfoButton.style.position = "absolute";
  moreInfoButton.style.top = "10px";
  moreInfoButton.style.right = "10px";
  moreInfoButton.style.zIndex = "1000000"; // On top of the iframe
  moreInfoButton.style.backgroundColor = "#fff";
  moreInfoButton.style.border = "none";
  moreInfoButton.style.padding = "10px";
  moreInfoButton.style.cursor = "pointer";
  moreInfoButton.addEventListener("click", () => {
    if (errorfunction) {
      errorfunction();
    } else {
      Logger.log("No error function provided");
    }
    // Optionally, you can remove the overlay after clicking
    hideCustomOverlay();
  });

  document.body.appendChild(iframe);

  // Listen for messages from the iframe
  window.addEventListener("message", handleIframeMessages);
}

/**
 * Handle messages from overlay iframes
 */
function handleIframeMessages(event) {
  // Only process messages from our iframes
  if (event.data && event.data.action === "downloadLogs") {
    Logger.log("Received request to download logs");

    // Get the additional data that was passed when showing the overlay
    const iframe = document.getElementById("myCustomOverlayIframe");
    let errorData = null;
    if (iframe && iframe.dataset.errorData) {
      try {
        errorData = JSON.parse(iframe.dataset.errorData);
      } catch (e) {
        Logger.error("Failed to parse errorData from iframe", e);
      }
    }

    Logger.downloadLogs(errorData);
  }
}

/**
 * Removes the iframe overlay (if present).
 */
function hideCustomOverlay() {
  Logger.log("Hiding custom overlay");
  const iframe = document.getElementById("myCustomOverlayIframe");
  if (iframe) {
    iframe.remove();
  }
}

/************************************************
 * showErrorModal:
 * Display an overlay modal with error details for the user,
 * and include an option to download the detailed log file.
 ************************************************/
function showErrorModal(error, additionalData = {}) {
  Logger.log("Displaying error modal", { error });

  // Create overlay for the modal
  const modalOverlay = document.createElement("div");
  modalOverlay.style.position = "fixed";
  modalOverlay.style.top = "0";
  modalOverlay.style.left = "0";
  modalOverlay.style.width = "100%";
  modalOverlay.style.height = "100%";
  modalOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  modalOverlay.style.zIndex = "1000000";
  modalOverlay.style.display = "flex";
  modalOverlay.style.flexDirection = "column";
  modalOverlay.style.justifyContent = "center";
  modalOverlay.style.alignItems = "center";

  // Create modal content container
  const modalContent = document.createElement("div");
  modalContent.style.backgroundColor = "#fff";
  modalContent.style.padding = "20px";
  modalContent.style.borderRadius = "8px";
  modalContent.style.maxWidth = "600px";
  modalContent.style.width = "90%";
  modalContent.style.textAlign = "center";
  modalContent.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.2)";

  // Error message
  const errorMessage = document.createElement("p");
  errorMessage.style.fontWeight = "bold";
  errorMessage.style.marginBottom = "10px";
  errorMessage.textContent = "אירעה שגיאה: " + error.message;
  modalContent.appendChild(errorMessage);

  // Error stack (if available)
  if (error.stack) {
    const errorStack = document.createElement("pre");
    errorStack.style.maxHeight = "200px";
    errorStack.style.overflow = "auto";
    errorStack.style.backgroundColor = "#f0f0f0";
    errorStack.style.padding = "10px";
    errorStack.style.borderRadius = "4px";
    errorStack.style.textAlign = "left";
    errorStack.textContent = error.stack;
    modalContent.appendChild(errorStack);
  }

  // Download log file button updated to include allResults
  const downloadButton = document.createElement("button");
  downloadButton.textContent = "הורד קובץ יומן שגיאות";
  downloadButton.style.marginTop = "10px";
  downloadButton.style.padding = "10px 20px";
  downloadButton.style.border = "none";
  downloadButton.style.borderRadius = "4px";
  downloadButton.style.background = "#ef4444";
  downloadButton.style.color = "#fff";
  downloadButton.style.cursor = "pointer";
  downloadButton.addEventListener("click", () => {
    // Pass additionalData; Logger.downloadLogs will merge in window.lastAllResults (if any)
    Logger.downloadLogs(additionalData);
  });
  modalContent.appendChild(downloadButton);

  // Close modal button
  const closeButton = document.createElement("button");
  closeButton.textContent = "סגור";
  closeButton.style.marginTop = "10px";
  closeButton.style.padding = "10px 20px";
  closeButton.style.border = "none";
  closeButton.style.borderRadius = "4px";
  closeButton.style.background = "#1e40af";
  closeButton.style.color = "#fff";
  closeButton.style.cursor = "pointer";
  closeButton.addEventListener("click", () => {
    modalOverlay.remove();
  });
  modalContent.appendChild(closeButton);

  modalOverlay.appendChild(modalContent);
  document.body.appendChild(modalOverlay);
}

/**
 * Adds the "Scrape Grades" button to the page.
 */
function addScrapeButton() {
  Logger.log("Adding scrape button to the page");

  // Create button and loader elements
  const button = document.createElement("button");
  const buttonContent = document.createElement("span");
  const loader = document.createElement("div");

  // Add CSS styles
  const styles = document.createElement("style");
  styles.textContent = `
    #scrapeGradesButton {
      position: fixed;
      bottom: 24px;
      left: 24px;
      padding: 14px 28px;
      background: linear-gradient(135deg, #8b5cf6, #d946ef);
      color: #fff;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-weight: 500;
      font-size: 15px;
      letter-spacing: -0.01em;
      z-index: 1000;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
                  0 2px 4px -1px rgba(0, 0, 0, 0.06),
                  0 0 0 3px rgba(37, 99, 235, 0);
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 160px;
      justify-content: center;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
    }

    #scrapeGradesButton:hover {
      transform: translateY(-2px);
      background:linear-gradient(66deg, #7d56d5, #b724cd);
      box-shadow: 0 8px 15px -3px rgba(0, 0, 0, 0.1),
                  0 4px 6px -2px rgba(0, 0, 0, 0.05),
                  0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    #scrapeGradesButton:focus {
      outline: none;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.3);
    }

    #scrapeGradesButton:active {
      transform: translateY(1px);
      background: linear-gradient(135deg, #1e40af, #1e3a8a);
    }

    #scrapeGradesButton.loading {
      background: #1e40af;
      cursor: wait;
      pointer-events: none;
      opacity: 0.9;
    }

    #scrapeGradesButton .loader {
      width: 18px;
      height: 18px;
      border: 2.5px solid rgba(255, 255, 255, 0.3);
      border-top-color: #ffffff;
      border-radius: 50%;
      display: none;
      animation: rotate 0.8s linear infinite;
    }

    #scrapeGradesButton.loading .loader {
      display: inline-block;
    }

    #scrapeGradesButton .button-content {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 500;
    }

    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    @keyframes successPulse {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.03); opacity: 0.9; }
      100% { transform: scale(1); opacity: 1; }
    }

    #scrapeGradesButton.success {
      background: linear-gradient(135deg, #059669, #047857);
      animation: successPulse 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Add subtle text shadow for better contrast */
    #scrapeGradesButton span {
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    /* Add smooth transition for icon */
    #scrapeGradesButton .button-content span {
      transition: transform 0.2s ease;
    }

    #scrapeGradesButton:hover .button-content span:first-child {
      transform: scale(1.1);
    }
  `;
  document.head.appendChild(styles);

  // Set up button structure
  button.id = "scrapeGradesButton";
  buttonContent.className = "button-content";
  loader.className = "loader";

  // Add icon (you can replace this with an SVG if preferred)
  const icon = document.createElement("span");
  icon.innerHTML = "📊";
  buttonContent.appendChild(icon);

  const text = document.createElement("span");
  text.innerText = "שתף סטטיסטיקות";
  buttonContent.appendChild(text);

  button.appendChild(loader);
  button.appendChild(buttonContent);

  // Add click handler with loading state and error handling
  button.addEventListener("click", async (e) => {
    try {
      Logger.log("Scrape button clicked");

      // Show loading state
      button.classList.add("loading");
      text.innerText = "שואב נתונים...";

      // Call the handler and await its completion
      let results = null;
      try {
        results = await handleScrapeButtonClick(e);
        Logger.log("Scraping completed successfully", {
          courseCount: countCourses(results),
        });
      } catch (error) {
        // Re-throw with additional context for our error handling below
        throw error;
      }

      // Upon success, show success overlay
      showCustomOverlay("success-page.html");

      // Wait for 5 seconds before removing the overlay
      setTimeout(() => {
        hideCustomOverlay();
        // Reset button state
        button.classList.remove("loading");
        button.classList.add("success");
        text.innerText = "נתונים נשלחו";
        icon.innerHTML = "✅";

        // Reset after 2 seconds
        // setTimeout(() => {
        //   // Reload the page
        //   location.reload();
        // }, 2000);
      }, 7000);
    } catch (error) {
      Logger.error("Scraping failed", error);
      window.lastAllResults = window.lastAllResults || {};
      // Prepare error data for the error page and modal
      const errorData = {
        message: error.message,
        timestamp: new Date().toISOString(),
        stack: error.stack,
        type: error.name,
      };

      if (error.message === "auth-error") {
        // Show auth error overlay
        showCustomOverlay("error-auth.html", errorData);
      } else {
        // Upon error, show error overlay with error data
        showErrorModal(error, errorData);
      }

      // Wait for 5 seconds before removing the overlay and resetting the button state
      setTimeout(() => {
        hideCustomOverlay();
        button.classList.remove("loading");
        text.innerText = "תקלה - נסה שוב";
        icon.innerHTML = "⚠️";

        // Reset after 3 seconds
        setTimeout(() => {
          text.innerText = "שתף סטטיסטיקות";
          icon.innerHTML = "📊";
        }, 3000);
      }, 5000);
    }
  });

  // Append the button to the body
  document.body.appendChild(button);
  Logger.log("Scrape button added to page");
}

/**
 * Count the total number of courses across all years
 */
function countCourses(results) {
  if (!results) return 0;

  let count = 0;
  for (const year in results) {
    if (Array.isArray(results[year])) {
      count += results[year].length;
    }
  }
  return count;
}

/************************************************
 * Initialize hidden fields for a given year
 ************************************************/
async function initializeFields(year) {
  Logger.log(`Initializing fields for year ${year}`);

  try {
    // Step 1: Do a GET to retrieve the fresh form and hidden fields
    const getResponse = await fetch(
      "https://orbitlive.huji.ac.il/StudentGradesList.aspx",
      {
        credentials: "include",
      }
    );

    if (!getResponse.ok) {
      throw new Error(
        `Failed to get initial page: ${getResponse.status} ${getResponse.statusText}`
      );
    }

    const getHtml = await getResponse.text();
    Logger.log(`Retrieved initial page HTML, length: ${getHtml.length}`);

    const parser = new DOMParser();
    const doc = parser.parseFromString(getHtml, "text/html");
    const form = doc.querySelector("form#form1");
    if (!form) {
      Logger.error("Form not found on GET request");
      return null;
    }

    // Extract all hidden fields from the form
    const freshFields = collectFormFields(form);
    Logger.log(`Extracted ${Object.keys(freshFields).length} form fields`);

    // Step 2: Update the fields to simulate a year change.
    // In ASP.NET, changing the dropdown typically triggers a postback by setting __EVENTTARGET
    freshFields["ctl00$cmbActiveYear"] = year;
    freshFields["__EVENTTARGET"] = "ctl00$cmbActiveYear";
    freshFields["__EVENTARGUMENT"] = "";

    // Step 3: POST with the updated fields to get the page for the correct year
    Logger.log(`Fetching grade list for year ${year}, page 1`);
    const initialResponse = await fetchGradeList(freshFields, year, 1);
    if (!initialResponse) {
      Logger.error(`Failed to fetch grade list for year ${year}`);
      return null;
    }

    const { html, updatedFields } = initialResponse;
    Logger.log(`Successfully initialized fields for year ${year}`);
    return { html, fields: updatedFields };
  } catch (error) {
    Logger.error(`Error initializing fields for year ${year}`, error);
    throw new Error(`Failed to initialize year ${year}: ${error.message}`);
  }
}

/************************************************
 * Utility: parse the number of pages from HTML
 ************************************************/
function parseNumberOfPagesFromHtml(html) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Example: find <a href="javascript:__doPostBack('ctl00$ContentPlaceHolder1$gvGradesList','Page$2')">2</a>
    const pageLinks = Array.from(
      doc.querySelectorAll(
        '.pagination-table a[href^="javascript:__doPostBack"]'
      )
    );

    // If no pagination found, assume only 1 page
    if (pageLinks.length === 0) {
      Logger.log("No pagination found, assuming 1 page");
      return 1;
    }

    let maxPage = 1;
    for (const link of pageLinks) {
      // Try parsing the link text (e.g. "2")
      const num = parseInt(link.textContent.trim(), 10);
      if (!isNaN(num) && num > maxPage) {
        maxPage = num;
      }
    }

    Logger.log(`Found ${maxPage} total pages`);
    return maxPage;
  } catch (error) {
    Logger.error("Error parsing number of pages", error, {
      htmlLength: html?.length,
    });
    return 1; // Default to 1 page on error
  }
}

/************************************************
 * Utility: parse the TR rows to gather basic
 *    data (course code, final grade, etc.) and
 *    detect distribution button name.
 ************************************************/
async function parseGradeListPage(html) {
  Logger.log("Parsing grade list page");
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Each row with class="GridRow" or "GridRowAlternate" might be your table row
    const rows = Array.from(
      doc.querySelectorAll(
        "#ContentPlaceHolder1_gvGradesList tr.GridRow, #ContentPlaceHolder1_gvGradesList tr.GridRowAlternate"
      )
    );

    Logger.log(`Found ${rows.length} course rows`);
    const results = [];

    // We'll process each row asynchronously
    for (const row of rows) {
      try {
        const userCodeEl = row.querySelector("span[id*='lblUserCode_']");
        const finalGradeEl = row.querySelector("span[id*='lblRowFinalGrade_']");
        const courseNameEl = row.querySelector("td:nth-of-type(2)");
        const semesterEl = row.querySelector("td:nth-of-type(4)");
        const distributionBtnEl = row.querySelector(
          "input[type='image'][name*='imgShowGradeDistribution']"
        );

        const userCode = userCodeEl?.textContent.trim() || "";
        const courseNumber = userCode.split("-")[0] || "";
        const finalGrade = finalGradeEl?.textContent.trim() || "";
        const courseName = courseNameEl?.textContent.trim() || "";
        const semesterName = semesterEl?.textContent.trim() || "";
        const distributionBtnName = distributionBtnEl?.name || null;

        // Check local storage to see if this courseNumber has been shared
        const alreadyShared = await isCourseShared(courseNumber);

        // Optionally push row data even if shared, or skip.
        // If you want to skip re-sharing courses:
        if (!alreadyShared) {
          results.push({
            courseNumber,
            courseName,
            finalGrade,
            semesterName,
            distributionBtnName,
          });
        }
      } catch (rowError) {
        Logger.error("Error parsing row", rowError);
        // Continue with other rows even if one fails
      }
    }

    Logger.log(
      `Parsed ${results.length} valid course rows (not previously shared)`
    );
    return results;
  } catch (error) {
    Logger.error("Error parsing grade list page", error);
    throw new Error(`Failed to parse grade list: ${error.message}`);
  }
}

/************************************************
 * Modified fetchGradeList: Returns HTML and updated hidden fields
 ************************************************/
async function fetchGradeList(currentFields, year, pageNumber) {
  Logger.log(`Fetching grade list for year ${year}, page ${pageNumber}`);

  try {
    const response = await fetch(
      "https://orbitlive.huji.ac.il/StudentGradesList.aspx",
      {
        method: "POST",
        headers: {
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
          "Content-Type": "application/x-www-form-urlencoded",
          "Cache-Control": "max-age=0",
          "Upgrade-Insecure-Requests": "1",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
        body: new URLSearchParams(currentFields).toString(),
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch grade list: ${response.status} ${response.statusText}`
      );
    }

    const html = await response.text();
    Logger.log(`Retrieved grade list HTML, length: ${html.length}`);

    // Parse the response HTML to extract hidden fields
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const form = doc.querySelector("form#form1");

    if (!form) {
      throw new Error("Form element not found in response HTML");
    }

    const updatedFields = collectFormFields(form);
    Logger.log(
      `Extracted ${Object.keys(updatedFields).length} updated form fields`
    );

    return { html, updatedFields };
  } catch (err) {
    Logger.error("Error fetching grade list", err, { year, pageNumber });
    throw new Error(
      `Failed to fetch grade list for year ${year} page ${pageNumber}: ${err.message}`
    );
  }
}

/************************************************
 * scrape: calls the distribution popup for a
 *    specific row's button. Returns the raw HTML.
 ************************************************/
/**
 * Performs the first distribution request.
 * Returns the HTML for the "first mode" (which contains stdev, etc.).
 */
async function scrapeDistributionFirstStep(distributionBtnName, currentFields) {
  Logger.log(
    `Scraping first distribution step for button: ${distributionBtnName}`
  );

  try {
    // Clone fields so we don't mutate the original reference
    const fields = { ...currentFields };

    // Setup for the distribution popup as you do now
    fields["__EVENTTARGET"] = "";
    fields["__EVENTARGUMENT"] = "";
    fields[`${distributionBtnName}.x`] = "9";
    fields[`${distributionBtnName}.y`] = "8";

    const response = await fetch(
      "https://orbitlive.huji.ac.il/StudentGradesList.aspx",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(fields).toString(),
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error(
        `Distribution request failed: ${response.status} ${response.statusText}`
      );
    }

    const html = await response.text();
    Logger.log(
      `Retrieved first step distribution HTML, length: ${html.length}`
    );

    // Update the hidden fields from the response
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const form = doc.querySelector("form#form1");

    if (!form) {
      throw new Error(
        "Form element not found in first step distribution response"
      );
    }

    const updatedFields = collectFormFields(form);
    Logger.log(
      `Extracted ${
        Object.keys(updatedFields).length
      } updated form fields from first step`
    );

    // Merge back
    Object.assign(currentFields, updatedFields);

    return html;
  } catch (err) {
    Logger.error("Error fetching first-step distribution data", err, {
      btnName: distributionBtnName,
    });
    throw new Error(`Failed to fetch first-step distribution: ${err.message}`);
  }
}

/**
 * Performs the second distribution request ("rdbCourseData" mode).
 * Returns the HTML that contains average, outOf, chart, etc.
 */
async function scrapeDistributionSecondStep(currentFields) {
  Logger.log("Scraping second distribution step");

  try {
    // Clone fields so we don't mutate the original reference
    const fields = { ...currentFields };

    // These are the critical fields you mentioned
    fields["__EVENTTARGET"] =
      "ctl00$ContentPlaceHolder1$ucLessonGradeDistribution$rdbCourseData";
    // Some pages also require setting __EVENTARGUMENT to "" or to something else
    fields["__EVENTARGUMENT"] = "";
    fields["ctl00$ContentPlaceHolder1$ucLessonGradeDistribution$a"] =
      "rdbCourseData";

    const response = await fetch(
      "https://orbitlive.huji.ac.il/StudentGradesList.aspx",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(fields).toString(),
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error(
        `Second step distribution request failed: ${response.status} ${response.statusText}`
      );
    }

    const html = await response.text();
    Logger.log(
      `Retrieved second step distribution HTML, length: ${html.length}`
    );

    // Update the hidden fields from the response
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const form = doc.querySelector("form#form1");

    if (!form) {
      throw new Error(
        "Form element not found in second step distribution response"
      );
    }

    const updatedFields = collectFormFields(form);
    Logger.log(
      `Extracted ${
        Object.keys(updatedFields).length
      } updated form fields from second step`
    );

    // Merge back
    Object.assign(currentFields, updatedFields);

    return html;
  } catch (err) {
    Logger.error("Error fetching second-step distribution data", err, {
      fields: currentFields,
    });
    throw new Error(`Failed to fetch second-step distribution: ${err.message}`);
  }
}

/************************************************
 * 6. parseDistributionStats: from the returned
 *    distribution HTML, gather stats (score,
 *    average, stdev, rank, chart URL, etc.).
 ************************************************/
/**
 * parseDistributionStatsFirst:
 * From the "first-step" distribution HTML, gather the data you already
 * get by clicking the distribution button (e.g. stdev, userScore, rank).
 *
 * @param {string} firstHtml - The HTML response from the first distribution request.
 * @returns {Object} - An object containing data from the first step (e.g. { userScore, stdev, rank, outOf }).
 */
function parseDistributionStatsFirst(firstHtml) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(firstHtml, "text/html");

  // Example: if the stats are in a table inside #ContentPlaceHolder1_ucLessonGradeDistribution_lblStatData
  const statTable = doc.querySelector(
    "#ContentPlaceHolder1_ucLessonGradeDistribution_lblStatData table"
  );
  const rows = statTable ? Array.from(statTable.querySelectorAll("tr")) : [];

  let userScore = null;
  let stdev = null;
  let rank = null;
  let outOf = null;

  for (const tr of rows) {
    const tds = tr.querySelectorAll("td");
    if (tds.length < 2) continue;
    const label = tds[0].textContent.trim();
    const value = tds[1].textContent.trim();

    // Adjust conditions per your Hebrew strings, e.g. "ציונך", "ס.ת", etc.
    if (label.includes("ציונך")) {
      userScore = value;
    } else if (label.includes("ס.ת")) {
      stdev = value;
    } else if (label.includes("דירוג")) {
      // Sometimes you also get "דירוג: 5 מתוך 30" in the first step
      const match = value.match(/^(\d+)\s+מתוך\s+(\d+)$/);
      if (match) {
        rank = match[1];
        outOf = match[2];
      }
    }
  }

  return {
    userScore,
    stdev,
    rank, // optional if you prefer it here
    outOf, // sometimes you might see outOf in the first step as well
  };
}

/**
 * parseDistributionStatsSecond:
 * From the “second-step” distribution HTML (after sending the special fields
 * __EVENTTARGET=ctl00$ContentPlaceHolder1$ucLessonGradeDistribution$rdbCourseData),
 * gather the additional data: average, outOf, chart, etc.
 *
 * @param {string} secondHtml - The HTML response from the second distribution request.
 * @returns {Promise<Object>} - An object containing data from the second step (e.g. { average, outOf, chartBase64 }).
 */
async function parseDistributionStatsSecond(secondHtml) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(secondHtml, "text/html");

  // Re-query the same stats container or wherever the extra stats appear
  const statTable = doc.querySelector(
    "#ContentPlaceHolder1_ucLessonGradeDistribution_lblStatData table"
  );
  const rows = statTable ? Array.from(statTable.querySelectorAll("tr")) : [];

  let average = null;
  let outOf = null; // If in second step or you want to overwrite from step1
  // If they also show stdev again here, you could parse it. Or skip if it’s only needed once.
  // let stdev = null; // (Optional) if the second step re-shows stdev?

  for (const tr of rows) {
    const tds = tr.querySelectorAll("td");
    if (tds.length < 2) continue;
    const label = tds[0].textContent.trim();
    const value = tds[1].textContent.trim();

    if (label.includes("ממוצע")) {
      average = value;
    } else if (label.includes("דירוג")) {
      // second step might also show rank/outOf more explicitly
      const match = value.match(/^(\d+)\s+מתוך\s+(\d+)$/);
      if (match) {
        // rank = match[1];
        outOf = match[2];
      }
    }
  }

  // Handle chart extraction
  let chartBase64 = null;
  const chartImg = doc.querySelector(
    "#ContentPlaceHolder1_ucLessonGradeDistribution_dvLessonChart img"
  );
  if (chartImg?.src) {
    try {
      // Re-use your existing getBase64Image(url)
      chartBase64 = await getBase64Image(chartImg.src);
    } catch (error) {
      console.error("Error converting chart image to Base64:", error);
      chartBase64 = null;
    }
  }

  return {
    average,
    outOf, // Possibly set from second step if needed
    chartBase64, // Optional if you only get the chart in the second step
  };
}

function setOverlayText(text) {
  const iframe = document.getElementById("myCustomOverlayIframe");
  // Send a message to the iframe
  iframe.contentWindow.postMessage({ type: "SET_TEXT", text }, "*");
}

/************************************************
 * Main Data Orchestration:
 *  - For each year:
 *      • Initialize by fetching the initial page and form fields.
 *      • Determine the total number of pages.
 *      • For each page, fetch and parse grade list rows.
 *      • For each row with a distribution button, execute the two-step distribution data fetch.
 *  - Save the aggregated results and then send them to the backend.
 ************************************************/
// Adding year selection functionality to the overlay.html file

/**
 * Modified handleScrapeButtonClick to include year selection
 */
async function handleScrapeButtonClick() {
  Logger.log("Starting scrape process");
  const button = document.getElementById("scrapeGradesButton");
  button.disabled = true;
  button.innerText = "משתף...";

  return new Promise((resolve, reject) => {
    getJwtToken(async (token) => {
      if (token) {
        Logger.log("JWT token retrieved successfully");

        try {
          // Get available years first
          const yearsSelect = document.querySelector("#cmbActiveYear");
          if (!yearsSelect) {
            throw new Error("Year selection element not found");
          }

          const availableYears = Array.from(yearsSelect.options).map((option) =>
            Number(option.value)
          );

          // Show year selection overlay
          const selectedYears = await showYearSelectionOverlay(availableYears);

          // If user cancelled (empty array), abort
          if (!selectedYears || selectedYears.length === 0) {
            button.disabled = false;
            button.innerText = "שתף סטטיסטיקות 📊";

            return;
          }

          // Show loading overlay after years are selected
          showCustomOverlay("overlay.html");

          const results = await fetchAllYearsData(token, selectedYears);
          Logger.log("Successfully fetched selected years data", {
            yearCount: Object.keys(results).length,
          });
          window.lastAllResults = results;
          resolve(results); // Indicate success
        } catch (error) {
          Logger.error("Error during scraping", error);
          window.lastAllResults = window.lastAllResults || {};
          reject(error); // Indicate failure
        } finally {
          hideCustomOverlay(); // Hide loading overlay
          button.disabled = false;
          button.classList.remove("loading");
          button.innerHTML = "שתף סטטיסטיקות 📊";
        }
      } else {
        Logger.error("Failed to get JWT token");
        const authError = new Error("auth-error");
        authError.name = "AuthenticationError";
        // show auth error overlay for 5 seconds
        reject(authError);
      }
    });
  });
}

/**
 * Modified fetchAllYearsData to accept a list of years to fetch
 * @param {string} token - JWT token
 * @param {Array} selectedYears - Array of years to fetch data for
 */
async function fetchAllYearsData(token, selectedYears) {
  Logger.log("Starting fetchAllYearsData process", { selectedYears });
  const allResults = {};

  // Get list of years from a <select> element with id "cmbActiveYear"
  const yearsSelect = document.querySelector("#cmbActiveYear");
  if (!yearsSelect) {
    Logger.error("Year selection element (#cmbActiveYear) not found on page");
    throw new Error("Year selection element not found");
  }

  // Filter to only include selected years
  const allYears =
    selectedYears ||
    Array.from(yearsSelect.options).map((option) => Number(option.value));

  Logger.log(`Processing ${allYears.length} selected years`, { allYears });

  // Check connection with backend server
  try {
    const pingResponse = await new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { action: "pingBackend", token: token },
        resolve
      );
    });

    if (!pingResponse.ok) {
      Logger.error("Ping to backend server failed", {
        status: pingResponse.status,
        statusText: pingResponse.statusText,
      });
      throw new Error("auth-error");
    }
    Logger.log("Backend server ping successful");
  } catch (error) {
    Logger.error("Error during backend ping", error);
    throw new Error("auth-error");
  }

  // Iterate over each selected year
  for (const [index, year] of allYears.entries()) {
    Logger.log(
      `Fetching data for year ${year} (${index + 1} of ${allYears.length})`
    );
    setOverlayText(
      `משיג נתונים משנת ${year}... (${index + 1}/${allYears.length})`
    );

    // Initialize fields for the given year
    let initial;
    try {
      initial = await initializeFields(year);
    } catch (initError) {
      Logger.error(
        `Skipping year ${year} due to initialization error`,
        initError
      );
      continue;
    }
    if (!initial) {
      Logger.warn(`No initial data for year ${year}, skipping`);
      continue;
    }
    const { html: firstPageHtml, fields: initialFields } = initial;

    // Determine total pages available
    let totalPages;
    try {
      totalPages = parseNumberOfPagesFromHtml(firstPageHtml);
    } catch (parseError) {
      Logger.error(`Error parsing page count for year ${year}`, parseError);
      totalPages = 1;
    }

    Logger.log(`Year ${year} has ${totalPages} pages`);
    const yearResults = [];
    let currentFields = { ...initialFields };

    // Process each page for the year
    for (let page = 1; page <= totalPages; page++) {
      Logger.log(`Fetching year ${year} page ${page}`);
      // Set fields for pagination
      currentFields["__EVENTTARGET"] = "ctl00$ContentPlaceHolder1$gvGradesList";
      currentFields["__EVENTARGUMENT"] = `Page$${page}`;
      currentFields["ctl00$cmbActiveYear"] = year;

      let pageResponse;
      try {
        pageResponse = await fetchGradeList(currentFields, year, page);
      } catch (pageError) {
        Logger.error(`Error fetching page ${page} for year ${year}`, pageError);
        continue;
      }
      if (!pageResponse) {
        Logger.warn(`No response for year ${year} page ${page}, skipping`);
        continue;
      }
      const { html: pageHtml, updatedFields } = pageResponse;
      currentFields = { ...updatedFields };

      let gradeRows = [];
      try {
        gradeRows = await parseGradeListPage(pageHtml);
      } catch (rowParseError) {
        Logger.error(
          `Error parsing rows for year ${year} page ${page}`,
          rowParseError
        );
        continue;
      }

      // Process each course row (only those not yet shared)
      for (const row of gradeRows) {
        if (!row.distributionBtnName) {
          Logger.log(
            `No distribution button for course ${row.courseNumber}, skipping distribution fetch`
          );
          continue;
        }
        Logger.log(`Fetching distribution data for course ${row.courseNumber}`);
        let distributionData = null;
        try {
          const firstHtml = await scrapeDistributionFirstStep(
            row.distributionBtnName,
            currentFields
          );
          if (!firstHtml) {
            Logger.warn(
              `First distribution fetch failed for course ${row.courseNumber}`
            );
            continue;
          }
          const firstStats = parseDistributionStatsFirst(firstHtml);

          const secondHtml = await scrapeDistributionSecondStep(currentFields);
          if (!secondHtml) {
            Logger.warn(
              `Second distribution fetch failed for course ${row.courseNumber}`
            );
            continue;
          }
          const secondStats = await parseDistributionStatsSecond(secondHtml);

          distributionData = {
            userScore: firstStats.userScore,
            stdev: firstStats.stdev,
            outOf: secondStats.outOf ?? firstStats.outOf,
            average: secondStats.average,
            chartBase64: secondStats.chartBase64,
          };
        } catch (distError) {
          Logger.error(
            `Error fetching distribution data for course ${row.courseNumber}`,
            distError
          );
          continue;
        }

        if (distributionData) {
          yearResults.push({
            courseNumber: row.courseNumber,
            courseName: row.courseName,
            finalGrade: row.finalGrade,
            semester: row.semesterName,
            distribution: distributionData,
          });
        }
      }
    }
    allResults[year] = yearResults;
    window.lastAllResults = allResults;
  }

  Logger.log("Completed fetching all years data", {
    totalYears: allYears.length,
    allResults,
  });

  // Attempt to send the data to the backend server
  try {
    hideCustomOverlay();
    showCustomOverlay("ocr-loading-page.html");

    const sendResponse = await new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          action: "sendDataToBackend",
          token: token,
          data: allResults,
        },
        resolve
      );
    });

    if (!sendResponse.ok) {
      throw new Error(`Failed to send data: ${sendResponse.error}`);
    }

    Logger.log("Data successfully sent to backend", sendResponse.data);

    // Mark each course as shared in local storage
    for (const year in allResults) {
      for (const course of allResults[year]) {
        await markCourseAsShared(course.courseNumber);
      }
    }
  } catch (sendError) {
    Logger.error("Error sending data to backend", sendError);
    throw sendError;
  }

  return allResults;
}
/************************************************
 * Utility Functions for UI
 ************************************************/

/**
 * Displays the scraped results in a modal.
 * @param {Object} data - The scraped data.
 */
function displayResults(data) {
  Logger.log("Displaying scraped results", { resultCount: countCourses(data) });
  const modal = document.createElement("div");
  modal.id = "scrapeModal";
  modal.innerHTML = `
    <div class="scrape-modal-content">
      <span class="close-button">&times;</span>
      <h2>Scraped Grades Data</h2>
      <div class="scrape-data-container"></div>
    </div>
  `;
  document.body.appendChild(modal);

  const container = modal.querySelector(".scrape-data-container");
  for (const [year, courses] of Object.entries(data)) {
    const yearSection = document.createElement("div");
    yearSection.className = "year-section";

    const yearHeader = document.createElement("h3");
    yearHeader.innerText = `Year: ${year}`;
    yearSection.appendChild(yearHeader);

    const table = document.createElement("table");
    table.className = "grades-table";

    const thead = document.createElement("thead");
    thead.innerHTML = `
      <tr>
        <th>Course Number</th>
        <th>Course Name</th>
        <th>Average</th>
        <th>Std Dev</th>
        <th>Total Students</th>
        <th>Chart</th>
      </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    courses.forEach((course) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${course.courseNumber}</td>
        <td>${course.courseName}</td>
        <td>${course.distribution.average || "N/A"}</td>
        <td>${course.distribution.stdev || "N/A"}</td>
        <td>${course.distribution.outOf || "N/A"}</td>
        <td>
          ${
            course.distribution.chartBase64
              ? `<img src="data:image/png;base64,${course.distribution.chartBase64}" alt="Chart" width="100">`
              : "N/A"
          }
        </td>
      `;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    yearSection.appendChild(table);
    container.appendChild(yearSection);
  }

  modal.style.display = "block";

  const closeButton = modal.querySelector(".close-button");
  closeButton.addEventListener("click", () => {
    modal.remove();
  });

  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.remove();
    }
  });
}

const getJwtToken = (callback) => {
  chrome.storage.local.get(["jwtToken"], (result) => {
    if (result.jwtToken) {
      callback(result.jwtToken);
    } else {
      Logger.warn("No JWT token found in local storage");
      callback(null);
    }
  });
};
// --------------------
// Initialize: ensure the scrape button is added after DOM is loaded.
// --------------------
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    Logger.log("DOM content loaded, initializing scrape button");
    addScrapeButton();
  });
} else {
  addScrapeButton();
}
