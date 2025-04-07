// Check if JWT token is present in local storage
const getJwtTokenAndName = (callback) => {
  chrome.storage.local.get(["jwtToken", "name"], (result) => {
    callback(result.jwtToken, result.name);
  });
};

// Function to create a styled button
const createStyledButton = (text, imageSrc, clickHandler) => {
  const button = document.createElement("button");
  button.className = "action-button";

  if (imageSrc) {
    const img = document.createElement("img");
    img.src = imageSrc;
    img.alt = text;
    button.appendChild(img);
  }

  button.appendChild(document.createTextNode(text));
  button.addEventListener("click", clickHandler);
  return button;
};

// Update the UI based on JWT token presence
getJwtTokenAndName((token, name) => {
  const authSection = document.querySelector(".auth-section");
  console.log(token, name);
  if (token) {
    const messageDiv = document.createElement("div");
    messageDiv.className = "auth-message";
    messageDiv.innerHTML = `<strong>שלום, ${name}!</strong><br>`;
    messageDiv.innerHTML += "את/ה מחובר/ת למשתמש ה-StudentInsight שלך!";
    messageDiv.style.color = "none";
    const button = createStyledButton(
      "שתף ציונים מהמידע האישי",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAABCJJREFUeF7tmlvIjlkUx3+fYw6ZmuRQNFMTqdEkUqJwoZzKMaFmImpqhOQCRbmQ442IHIrkAuFCxIWEppGZ5mIulBwjcopBiHEc+89Wej2Hvd9nP5/3ed9n1dcX39rrWev/rLX3f639NNHg0tTg8VMCUGZAgyNQlkCDJ0C5CZYlUJZA7SLQC+gK/JGni7VaAj8BfwLtgM3AfOBdHkDUKgArgGWfBXwImA78FxqEWgVgHzC1ItiTwETgSUgQahWA/cCUiEDPmdIYBdwOBULRAFDc14CRwOUQIBQRAMV9DxgN/JMVhKICoLifAZOB41lAKDIAivsV8AugPaMqKToACvotMBfYWg0C9QDAp7jXGp6wxBeErw1AF6Af8APQA+gMtAeG23/7xrMFmGezwmltcwPQERhrj7ERQE8nL/2UDgI/Ay9dljUXAEPN0fUbMM6+YRffsug4s8a8AVDAy4H+WaKpcq04griCOEOs5AXAAFPPm4BBVTofatlVW276HSmhAWgLrLbta8tQUWS0cxcYE8caQwLwHXAAGJjR4TyWPwb6ArcqjYcCQDv7buDbPLwPZHNlxYzhg9kQAIiFbQxkK1CskWZ2ArNDZ8Acu9mFADLP4GVbx/AXdDmL40UK/nczXBXxeh0qAzSu2luAtFe8h4FpwIuoFKsmA3obOvs30CnvnA1gXxuz6v5NKB7QwbCrv8xx92MA5/I2oY15gWGi/4dkgrvMTG5G3p5ntK/7g4XABhc7PiUwzLSpp12Meuo8BS6ZNvZf4JH9UTvcx9OO1DUhmmn3J6flrgC0sHUfoqm5ARyx9rSXXIi49YkbiycFVdWM0BWAWaZ33+EEabTSAzu308lxJq0urW7UvUCcC/ftnEGAeokLAJrQXAG6e1n+qHwHWANs97zW8smA6/ay5GIV/jlRYY2YtKP6iN74Ksu8Is/fFGOuAGS+KUrLgNb2BkadnqscNVdXv2a8vnIBQMexmjBtnlVLGgBifLqodBE5omvsPS7KGTMgkd35PD8NgGN2rJRm87x9G6rHEJKUAanszseBJAC6GRp5E2iVYlDcYJI9v32enaQbB4CmTUsdThFnP5IAUB1vS7Gk8hAzFAEJKZWM04vd+TiSBIC+yhifYEyb3YSkRsPHkQpdcfj19v+82Z3Pc+MAaGM2tIeAmp8oOWv76+c+D/PQ/cbMFgXw95banvBY66UaB8Bgy9iijIm36++Zjh8vL3NUjgNgkflCS5eNlaKJyhDL43N0q/lMxwGgs1xfZVXKYnO1ta753Mv/SXEAiPqKAn8up2zd5/K9Xv6hRj8hDgB9oamW9dMlh7os0U51XXUlSceg/qbRl0ZKYnqJo6WiopJGhYsal7PfJQDOUNWpYpkBdfpincMqM8AZqjpVLDOgTl+sc1gNnwHvAbvcqUEgZGVnAAAAAElFTkSuQmCC",
      () =>
        chrome.tabs.create({
          url: "https://orbitlive.huji.ac.il/StudentGradesList.aspx",
        })
    );

    authSection.appendChild(messageDiv);
    authSection.appendChild(button);
  } else {
    const messageDiv = document.createElement("div");
    messageDiv.className = "auth-message";
    messageDiv.textContent = "יש להתחבר על מנת לשתף ציונים";
    messageDiv.style.color = "#ff0000";
    const button = createStyledButton(
      "התחבר ל-StudentInsight",
      "assets/hujinsight.png",
      () => chrome.tabs.create({ url: "https://StudentInsight.co.il" })
    );

    authSection.appendChild(messageDiv);
    authSection.appendChild(button);
  }
});

// Function to refresh the moodle tabs
const refreshTabWithUrl = () => {
  const targetUrl = "https://moodle.huji.ac.il";
  chrome.tabs.query({}, (tabs) => {
    for (let tab of tabs) {
      if (tab.url && tab.url.includes(targetUrl)) {
        chrome.tabs.reload(tab.id);
      }
    }
  });
};
document.addEventListener("DOMContentLoaded", () => {
  // Apply dark mode on initial load
  chrome.storage.sync.get("darkMode", (data) => {
    console.log("dm: ", data.darkMode);
    if (data.darkMode) {
      document.body.classList.add("dark-mode");
    }
  });

  const darkModeToggle = document.getElementById("darkModeToggle");
  if (darkModeToggle) {
    darkModeToggle.addEventListener("change", function () {
      chrome.storage.sync.set({ darkMode: this.checked });
    });
  }
});

// Listen for storage changes and apply dark mode dynamically
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.darkMode && namespace === "sync") {
    const darkModeEnabled = changes.darkMode.newValue;
    document.body.classList.toggle("dark-mode", darkModeEnabled);

    // Update toggle state if present
    const darkModeToggle = document.getElementById("darkModeToggle");
    if (darkModeToggle) {
      darkModeToggle.checked = darkModeEnabled;
    }
  }
});

// Initialize toggle states and add event listeners
// document.addEventListener("DOMContentLoaded", function () {
//   const cssToggle = document.getElementById("cssToggle");
//   const ajaxToggle = document.getElementById("ajaxToggle");
//   const darkModeToggle = document.getElementById("darkModeToggle");

//   const initToggle = (
//     toggle,
//     storageKey,
//     defaultValue = true,
//     dependency = null
//   ) => {
//     chrome.storage.sync.get([storageKey], (result) => {
//       toggle.checked = result[storageKey] !== false;

//       if (dependency) {
//         const dependentToggle = document.getElementById(dependency);
//         if (!toggle.checked) {
//           dependentToggle.checked = false;
//           dependentToggle.disabled = true;
//         }
//       }
//     });
//   };

//   const handleToggleChange = (toggle, storageKey, dependency = null) => {
//     toggle.addEventListener("change", function () {
//       chrome.storage.sync.set({ [storageKey]: toggle.checked }, () => {
//         refreshTabWithUrl();

//         if (dependency) {
//           const dependentToggle = document.getElementById(dependency);
//           if (!toggle.checked) {
//             dependentToggle.checked = false;
//             dependentToggle.disabled = true;
//             chrome.storage.sync.set({ [dependency]: false });
//           } else {
//             dependentToggle.disabled = false;
//           }
//         }
//       });
//     });
//   };

//   // Initialize toggles
//   initToggle(cssToggle, "moodleCssEnabled", true, "darkModeToggle");
//   initToggle(ajaxToggle, "ajaxEnabled");
//   initToggle(darkModeToggle, "darkModeEnabled");

//   // Add event listeners
//   handleToggleChange(cssToggle, "moodleCssEnabled", "darkModeToggle");
//   handleToggleChange(ajaxToggle, "ajaxEnabled");
//   handleToggleChange(darkModeToggle, "darkModeEnabled");
// });
