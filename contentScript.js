// content.js

/**
 * Retrieve the shared courses object from local storage
 * @returns {Promise<Object>} An object where each key is a course ID and value is `true` if shared
 */
function getSharedCourses() {
  return new Promise((resolve) => {
    chrome.storage.local.get("sharedCourses", (result) => {
      // If sharedCourses doesn’t exist yet, default to an empty object
      const sharedCourses = result.sharedCourses || {};
      resolve(sharedCourses);
    });
  });
}

/**
 * Save (or update) the shared courses object in local storage
 * @param {Object} courses
 */
function setSharedCourses(courses) {
  chrome.storage.local.set({ sharedCourses: courses });
}

/**
 * Mark a single course as shared
 * @param {string} courseId - A unique identifier for the course (e.g., "67925" or "67925-1-01")
 */
async function markCourseAsShared(courseId) {
  const sharedCourses = await getSharedCourses();
  sharedCourses[courseId] = true;
  setSharedCourses(sharedCourses);
}

/**
 * Checks if a course is already shared
 * @param {string} courseId
 * @returns {Promise<boolean>} true if already shared
 */
async function isCourseShared(courseId) {
  const sharedCourses = await getSharedCourses();
  return !!sharedCourses[courseId];
}

/**
 * Fetches an image from the given URL and converts it to a Base64 string.
 * @param {string} url - The URL of the image to convert.
 * @returns {Promise<string>} - A promise that resolves to the Base64 string of the image.
 */
async function getBase64Image(url) {
  try {
    const response = await fetch(url, { mode: "cors" });
    if (!response.ok)
      throw new Error(`Failed to fetch image: ${response.status}`);
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]); // Remove prefix
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error converting image to Base64:", error);
    return null;
  }
}

// Wait for the DOM to fully load
document.addEventListener("DOMContentLoaded", () => {
  addScrapeButton();
});

function showCustomOverlay(overlay_name) {
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

  document.body.appendChild(iframe);
}

/**
 * Removes the iframe overlay (if present).
 */
function hideCustomOverlay() {
  const iframe = document.getElementById("myCustomOverlayIframe");
  if (iframe) {
    iframe.remove();
  }
}
/**
 * Adds the "Scrape Grades" button to the page.
 */
function addScrapeButton() {
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

  // Add click handler with loading state
  // Inside addScrapeButton function

  button.addEventListener("click", async (e) => {
    try {
      // Show loading state
      button.classList.add("loading");
      text.innerText = "שואב נתונים...";

      // Call the handler and await its completion
      await handleScrapeButtonClick(e);

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
        setTimeout(() => {
          // reload the page
          location.reload();
        }, 2000);
      }, 7000);
    } catch (error) {
      console.error("Scraping failed:", error);
      if (error.message === "auth-error") {
        // Show auth error overlay
        showCustomOverlay("error-auth.html");
      } else {
        // Upon error, show error overlay
        showCustomOverlay("error-page.html");
      }
      // Wait for 5 seconds before removing the overlay
      setTimeout(() => {
        hideCustomOverlay();
        // Update button to reflect the error state
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
}

/**
 * Handles the click event of the scrape button.
 */

async function handleScrapeButtonClick() {
  const button = document.getElementById("scrapeGradesButton");
  button.disabled = true;
  button.innerText = "משתף...";

  return new Promise((resolve, reject) => {
    getJwtToken(async (token) => {
      if (token) {
        showCustomOverlay("overlay.html"); // Show loading overlay

        try {
          const results = await fetchAllYearsData(token);

          resolve(); // Indicate success
        } catch (error) {
          console.error("Error during scraping:", error);
          reject(error); // Indicate failure
        } finally {
          hideCustomOverlay(); // Hide loading overlay
          button.disabled = false;
          button.innerHTML = "שתף סטטיסטיקות 📊";
        }
      } else {
        const authError = new Error("auth-error");
        // show auth error overlay for 5 seconds

        reject(authError);
      }
    });
  });
}

/************************************************
 * Initialize hidden fields for a given year
 ************************************************/
async function initializeFields(year) {
  // Step 1: Do a GET to retrieve the fresh form and hidden fields
  const getResponse = await fetch(
    "https://orbitlive.huji.ac.il/StudentGradesList.aspx",
    {
      credentials: "include",
    }
  );
  const getHtml = await getResponse.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(getHtml, "text/html");
  const form = doc.querySelector("form#form1");
  if (!form) {
    console.error("Form not found on GET request.");
    return null;
  }

  // Extract all hidden fields from the form
  const formData = new FormData(form);
  const freshFields = {};
  for (const [key, value] of formData.entries()) {
    freshFields[key] = value;
  }

  // Step 2: Update the fields to simulate a year change.
  // In ASP.NET, changing the dropdown typically triggers a postback by setting __EVENTTARGET
  freshFields["ctl00$cmbActiveYear"] = year;
  freshFields["__EVENTTARGET"] = "ctl00$cmbActiveYear";
  freshFields["__EVENTARGUMENT"] = "";

  // Step 3: POST with the updated fields to get the page for the correct year
  const initialResponse = await fetchGradeList(freshFields, year, 1);
  if (!initialResponse) return null;

  const { html, updatedFields } = initialResponse;
  return { html, fields: updatedFields };
}

/************************************************
 * 1. List of all years to iterate over
 ************************************************/

/************************************************
 * 2. Utility: parse the number of pages from HTML
 ************************************************/
function parseNumberOfPagesFromHtml(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // Example: find <a href="javascript:__doPostBack('ctl00$ContentPlaceHolder1$gvGradesList','Page$2')">2</a>
  const pageLinks = Array.from(
    doc.querySelectorAll('.pagination-table a[href^="javascript:__doPostBack"]')
  );

  // If no pagination found, assume only 1 page
  if (pageLinks.length === 0) return 1;

  let maxPage = 1;
  for (const link of pageLinks) {
    // Try parsing the link text (e.g. "2")
    const num = parseInt(link.textContent.trim(), 10);
    if (!isNaN(num) && num > maxPage) {
      maxPage = num;
    }
  }

  return maxPage;
}

/************************************************
 * 3. Utility: parse the TR rows to gather basic
 *    data (course code, final grade, etc.) and
 *    detect distribution button name.
 ************************************************/
async function parseGradeListPage(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // Each row with class="GridRow" or "GridRowAlternate" might be your table row
  // (the example shows <tr id="ContentPlaceHolder1_gvGradesList" class="GridRow">, etc.)
  const rows = Array.from(
    doc.querySelectorAll(
      "#ContentPlaceHolder1_gvGradesList tr.GridRow, #ContentPlaceHolder1_gvGradesList tr.GridRowAlternate"
    )
  );

  const results = [];

  // We’ll process each row asynchronously
  for (const row of rows) {
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
  }

  return results;
}

/************************************************
 * Modified fetchGradeList: Returns HTML and updated hidden fields
 ************************************************/
async function fetchGradeList(currentFields, year, pageNumber) {
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

    const html = await response.text();

    // Parse the response HTML to extract hidden fields
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const form = doc.querySelector("form#form1");
    const formData = new FormData(form);
    const updatedFields = {};
    for (const [key, value] of formData.entries()) {
      updatedFields[key] = value;
    }

    return { html, updatedFields };
  } catch (err) {
    console.error("Error fetching grade list:", err);
    return null;
  }
}

/************************************************
 * 5. scrape: calls the distribution popup for a
 *    specific row's button. Returns the raw HTML.
 ************************************************/
/**
 * Performs the first distribution request.
 * Returns the HTML for the “first mode” (which contains stdev, etc.).
 */
async function scrapeDistributionFirstStep(distributionBtnName, currentFields) {
  try {
    // Clone fields so we don’t mutate the original reference
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

    const html = await response.text();

    // Update the hidden fields from the response
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const form = doc.querySelector("form#form1");
    const formData = new FormData(form);

    const updatedFields = {};
    for (const [key, value] of formData.entries()) {
      updatedFields[key] = value;
    }

    // Merge back
    Object.assign(currentFields, updatedFields);

    return html;
  } catch (err) {
    console.error("Error fetching first-step distribution data:", err);
    return null;
  }
}

/**
 * Performs the second distribution request (“rdbCourseData” mode).
 * Returns the HTML that contains average, outOf, chart, etc.
 */
async function scrapeDistributionSecondStep(currentFields) {
  try {
    // Clone fields so we don’t mutate the original reference
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

    const html = await response.text();

    // Update the hidden fields from the response
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const form = doc.querySelector("form#form1");
    const formData = new FormData(form);

    const updatedFields = {};
    for (const [key, value] of formData.entries()) {
      updatedFields[key] = value;
    }

    // Merge back
    Object.assign(currentFields, updatedFields);

    return html;
  } catch (err) {
    console.error("Error fetching second-step distribution data:", err);
    return null;
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
 * 7. Main Orchestration:
 *    - For each year
 *       - Fetch page1 -> determine total pages
 *       - For each page -> parse rows
 *         - For each row with distribution button
 *           - scrape distribution + parse stats
 ************************************************/
/************************************************
 * Updated fetchAllYearsData: Uses updated hidden fields
 ************************************************/
async function fetchAllYearsData(token) {
  const allResults = {};

  // Get list of years from a <select> element with id="cmbActiveYear"
  const AllYears = Array.from(
    document.querySelector("#cmbActiveYear")?.options || []
  ).map((option) => Number(option.value));

  // first check if we can contact the student insight server
  const response = await fetch("https://api.studentinsight.co.il/stats/ping", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    chrome.runtime.sendMessage({ action: "loggedOut", token: token });

    throw new Error("auth-error");
  }

  for (const [index, year] of AllYears.entries()) {
    console.log("Fetching data for year:", year);
    setOverlayText(
      `משיג נתונים משנת ${year}... (${index + 1}/${AllYears.length})`
    );
    // Step A: Initialize fields by fetching the first page
    const initial = await initializeFields(year);
    if (!initial) continue; // If something went wrong, skip this year

    const { html: firstPageHtml, fields: initialFields } = initial;
    const totalPages = parseNumberOfPagesFromHtml(firstPageHtml);

    const yearResults = [];
    let currentFields = { ...initialFields };

    for (let page = 1; page <= totalPages; page++) {
      console.log(`Fetching year ${year}, page ${page}`);

      // Adjust fields for pagination
      currentFields["__EVENTTARGET"] = "ctl00$ContentPlaceHolder1$gvGradesList";
      currentFields["__EVENTARGUMENT"] = `Page$${page}`;
      currentFields["ctl00$cmbActiveYear"] = year;

      // Fetch the page and get updated hidden fields
      const response = await fetchGradeList(currentFields, year, page);
      if (!response) continue;

      const { html: pageHtml, updatedFields } = response;
      currentFields = { ...updatedFields }; // Update fields for next request

      // Parse rows
      const gradeRows = await parseGradeListPage(pageHtml);

      // For each row, if distributionBtnName is present, do the two-step distribution fetch
      for (const row of gradeRows) {
        let distributionData = null;

        if (row.distributionBtnName) {
          // 1) First-step request
          const firstHtml = await scrapeDistributionFirstStep(
            row.distributionBtnName,
            currentFields
          );
          if (!firstHtml) {
            console.warn("No first-step HTML returned; skipping row.");
            continue;
          }

          const firstStats = parseDistributionStatsFirst(firstHtml);

          // 2) Second-step request
          const secondHtml = await scrapeDistributionSecondStep(currentFields);
          if (!secondHtml) {
            console.warn("No second-step HTML returned; skipping row.");
            continue;
          }

          const secondStats = await parseDistributionStatsSecond(secondHtml);

          // Merge the two sets of stats into a single object
          distributionData = {
            userScore: firstStats.userScore,
            stdev: firstStats.stdev,
            // If outOf appears in both steps, decide which one you trust or use a fallback
            outOf: secondStats.outOf ?? firstStats.outOf,
            average: secondStats.average,
            chartBase64: secondStats.chartBase64,
          };
        }

        // Only push to yearResults if we actually got distribution data
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
  }

  console.log("Done fetching all years data!", allResults);

  // Attempt to send the data to the backend
  try {
    hideCustomOverlay(); // Hide loading overlay
    showCustomOverlay("ocr-loading-page.html"); // Show loading overlay
    const response = await fetch(
      "https://api.studentinsight.co.il/stats/extract-data",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(allResults), // Convert allResults to JSON string
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to send data: ${response.statusText}`);
    }

    const data = await response.json();
    hideCustomOverlay(); // Hide loading overlay
    console.log("Data successfully sent:", data);

    for (const year in allResults) {
      for (const course of allResults[year]) {
        await markCourseAsShared(course.courseNumber);
      }
    }
  } catch (error) {
    console.error("Error sending data:", error);
    // **Re-throw the error to propagate it upwards**
    throw error;
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
  // Create modal container
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

  // Populate data
  const container = modal.querySelector(".scrape-data-container");
  for (const [year, courses] of Object.entries(data)) {
    const yearSection = document.createElement("div");
    yearSection.className = "year-section";

    const yearHeader = document.createElement("h3");
    yearHeader.innerText = `Year: ${year}`;
    yearSection.appendChild(yearHeader);

    const table = document.createElement("table");
    table.className = "grades-table";

    // Table headers
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

    // Table body
    const tbody = document.createElement("tbody");
    courses.forEach((course) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
          <td>${course.courseNumber}</td>
          <td>${course.courseName}</td>
          <td>${course.distribution.average}</td>
          <td>${course.distribution.stdev}</td>
          <td>${course.distribution.outOf}</td>
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

  // Show the modal
  modal.style.display = "block";

  // Add event listener to close button
  const closeButton = modal.querySelector(".close-button");
  closeButton.addEventListener("click", () => {
    modal.remove();
  });

  // Close modal when clicking outside the content
  window.addEventListener("click", (event) => {
    if (event.target == modal) {
      modal.remove();
    }
  });
}

const getJwtToken = (callback) => {
  chrome.storage.local.get(["jwtToken"], (result) => {
    callback(result.jwtToken);
  });
};

// This script runs in the context of the webpage
if (document.readyState === "loading") {
  // Loading hasn't finished yet
  document.addEventListener("DOMContentLoaded", addScrapeButton);
} else {
  // `DOMContentLoaded` has already fired
  addScrapeButton();
}
