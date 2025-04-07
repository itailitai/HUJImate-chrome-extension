(function () {
  document.addEventListener("DOMContentLoaded", function () {
    const courseNumberElement = document.querySelector(".course-number");
    if (!courseNumberElement) return;

    const courseId = courseNumberElement.textContent.trim();
    const studentInsightLink = `https://studentinsight.co.il/course/${courseId}/reviews?s=1`;

    // Create the button container for hover effects
    const buttonContainer = document.createElement("div");
    buttonContainer.style.display = "inline-block";
    buttonContainer.style.position = "relative";
    buttonContainer.style.transition = "transform 0.2s ease";

    // Add SVG icon for reviews
    const icon = `
<svg viewBox="0 0 640 512" width="26" height="26" xmlns="http://www.w3.org/2000/svg">
  <path fill="white" d="M622.34 153.2L343.4 67.5c-15.2-4.67-31.6-4.67-46.79 0L17.66 153.2c-23.54 7.23-23.54 38.36 0 45.59l48.63 14.94c-10.67 13.19-17.23 29.28-17.88 46.9C38.78 266.15 32 276.11 32 288c0 10.78 5.68 19.85 13.86 25.65L20.33 428.53C18.11 438.52 25.71 448 35.94 448h56.11c10.24 0 17.84-9.48 15.62-19.47L82.14 313.65C90.32 307.85 96 298.78 96 288c0-11.57-6.47-21.25-15.66-26.87.76-15.02 8.44-28.3 20.69-36.72L296.6 284.5c9.06 2.78 26.44 6.25 46.79 0l278.95-85.7c23.55-7.24 23.55-38.36 0-45.6zM352.79 315.09c-28.53 8.76-52.84 3.92-65.59 0l-145.02-44.55L128 384c0 35.35 85.96 64 192 64s192-28.65 192-64l-14.18-113.47-145.03 44.56z"/>
</svg>
`;

    // Create the button
    const button = document.createElement("a");
    button.href = studentInsightLink;
    // Set button content with icon and text
    button.innerHTML = `${icon}<span style='margin-right:5px'>מידע על הקורס ב-StudentInsight</span>`;

    button.target = "_blank";

    // Modern button styling
    Object.assign(button.style, {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "7px 15px",
      margin: "8px",
      backgroundColor: "rgb(68 119 133)", // Modern blue
      color: "white",
      borderRadius: "8px",
      textDecoration: "none",
      fontSize: "14px",
      fontWeight: "500",
      letterSpacing: "0.3px",
      border: "none",
      cursor: "pointer",
      transition: "all 0.2s ease",

      direction: "rtl",
    });

    // Hover effects
    button.addEventListener("mouseenter", () => {
      button.style.backgroundColor = "#2b606f"; // Darker blue on hover
      button.style.transform = "translateY(-1px)";
    });

    button.addEventListener("mouseleave", () => {
      button.style.backgroundColor = "rgb(68 119 133)";
      button.style.transform = "translateY(0)";
    });

    // Active state
    button.addEventListener("mousedown", () => {
      button.style.transform = "translateY(1px)";
    });

    button.addEventListener("mouseup", () => {
      button.style.transform = "translateY(-1px)";
    });

    // Add focus styles for accessibility
    button.addEventListener("focus", () => {
      button.style.outline = "2px solid #60A5FA";
      button.style.outlineOffset = "2px";
    });

    button.addEventListener("blur", () => {
      button.style.outline = "none";
    });

    // Find and append to course-links
    const courseLinksDiv = document.querySelector(".course-links");
    if (courseLinksDiv) {
      courseLinksDiv.style = "align-items: center;";
      buttonContainer.appendChild(button);
      courseLinksDiv.appendChild(buttonContainer);
    }
  });
})();
