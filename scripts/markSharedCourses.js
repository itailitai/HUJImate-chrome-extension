// Constants
const STORAGE_KEY = "sharedCourses";
const SELECTORS = {
  GRADE_ROWS:
    "#ContentPlaceHolder1_gvGradesList tr.GridRow, #ContentPlaceHolder1_gvGradesList tr.GridRowAlternate",
  USER_CODE: 'span[id*="lblUserCode_"]',
  COURSE_NAME_CELL: "td:nth-of-type(2)",
  PIE_CHART: 'input[type="image"][title="הצג התפלגות ציונים"]',
};

const STYLES = {
  SHARED_ROW: {
    backgroundColor: "#eaffea",
    transition: "background-color 0.3s ease",
  },
  SHARED_LABEL: {
    color: "rgb(223 255 224)",
    marginLeft: "6px",
    fontSize: "0.85em",
    padding: "2px 6px",
    borderRadius: "4px",
    backgroundColor: "rgb(46, 125, 50)",
    display: "inline-block",
  },
  UNSHARED_ROW: {
    backgroundColor: "#fff3e0",
    transition: "background-color 0.3s ease",
  },
  UNSHARED_LABEL: {
    color: "#fff3e0",
    marginLeft: "6px",
    fontSize: "0.85em",
    padding: "2px 6px",
    borderRadius: "4px",
    backgroundColor: "#ef6c00",
    display: "inline-block",
  },
};

/**
 * Retrieves shared courses from chrome.storage.local
 * @returns {Promise<Object>} Object containing shared course data
 * @throws {Error} If storage access fails
 */
async function getSharedCourses() {
  try {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(STORAGE_KEY, (result) => {
        if (chrome.runtime.lastError) {
          reject(
            new Error(`Storage error: ${chrome.runtime.lastError.message}`)
          );
          return;
        }
        resolve(result[STORAGE_KEY] || {});
      });
    });
  } catch (error) {
    console.error("Failed to retrieve shared courses:", error);
    throw error;
  }
}

/**
 * Creates a label element
 * @param {string} text - The label text
 * @param {Object} styles - The styles to apply
 * @returns {HTMLElement} Configured label element
 */
function createLabel(text, styles) {
  const label = document.createElement("span");
  label.textContent = text;
  Object.assign(label.style, styles);
  return label;
}

/**
 * Creates a shared course label element
 * @returns {HTMLElement} Configured label element
 */
function createSharedLabel() {
  return createLabel("שותף", STYLES.SHARED_LABEL);
}

/**
 * Creates an unshared course label element
 * @returns {HTMLElement} Configured label element
 */
function createUnsharedLabel() {
  return createLabel("לא שותף", STYLES.UNSHARED_LABEL);
}

/**
 * Applies row styling and hover effects
 * @param {HTMLElement} row - The row to style
 * @param {Object} baseStyle - The base style to apply
 * @param {string} hoverColor - The hover background color
 */
function applyRowStyling(row, baseStyle, hoverColor) {
  Object.assign(row.style, baseStyle);

  row.addEventListener("mouseenter", () => {
    row.style.backgroundColor = hoverColor;
  });
  row.addEventListener("mouseleave", () => {
    row.style.backgroundColor = baseStyle.backgroundColor;
  });
}

/**
 * Applies shared course styling to a table row
 * @param {HTMLElement} row - The table row element to style
 * @param {HTMLElement} courseNameCell - The cell containing the course name
 */
function applySharedStyling(row, courseNameCell) {
  applyRowStyling(row, STYLES.SHARED_ROW, "#d5f5d5");
  const label = createSharedLabel();
  courseNameCell.insertBefore(label, courseNameCell.firstChild);
}

/**
 * Applies unshared course styling to a table row
 * @param {HTMLElement} row - The table row element to style
 * @param {HTMLElement} courseNameCell - The cell containing the course name
 */
function applyUnsharedStyling(row, courseNameCell) {
  applyRowStyling(row, STYLES.UNSHARED_ROW, "#ffe0b2");
  const label = createUnsharedLabel();
  courseNameCell.insertBefore(label, courseNameCell.firstChild);
}

/**
 * Extracts course number from user code
 * @param {string} userCode - The full user code (e.g., "67925-1-01")
 * @returns {string|null} The course number or null if invalid format
 */
function extractCourseNumber(userCode) {
  const match = userCode.match(/^(\d+)/);
  return match ? match[1] : null;
}

/**
 * Marks rows in the grades table that correspond to shared courses
 * @param {Object} sharedCourses - Object containing shared course data
 */
function markSharedCourseRows(sharedCourses) {
  const rows = document.querySelectorAll(SELECTORS.GRADE_ROWS);

  rows.forEach((row) => {
    const userCodeEl = row.querySelector(SELECTORS.USER_CODE);
    if (!userCodeEl) return;

    const courseNumber = extractCourseNumber(userCodeEl.textContent.trim());
    if (!courseNumber) {
      console.warn("Invalid course number format:", userCodeEl.textContent);
      return;
    }

    const courseNameCell = row.querySelector(SELECTORS.COURSE_NAME_CELL);
    if (!courseNameCell) return;

    if (sharedCourses[courseNumber]) {
      applySharedStyling(row, courseNameCell);
    } else {
      // Check if the row has a pie chart input
      const hasPieChart = row.querySelector(SELECTORS.PIE_CHART);
      if (hasPieChart) {
        applyUnsharedStyling(row, courseNameCell);
      }
    }
  });
}

/**
 * Initializes the course sharing functionality
 */
async function initializeCourseSharing() {
  try {
    const sharedCourses = await getSharedCourses();
    markSharedCourseRows(sharedCourses);
  } catch (error) {
    console.error("Failed to initialize course sharing:", error);
    // Optionally show user-friendly error message
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", initializeCourseSharing);
