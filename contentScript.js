// This script runs in the context of the webpage
if (document.readyState === "loading") {
  // Loading hasn't finished yet
  document.addEventListener("DOMContentLoaded", buttonSetup);
} else {
  // `DOMContentLoaded` has already fired
  buttonSetup();
}
function buttonSetup() {
  console.log("Hujinsight DOMContentLoaded");
  var button = document.createElement("button");
  button.textContent = "שתפו ציונים ב-HUJInsight";
  button.style.position = "relative";
  button.style.border = "none";
  button.style.padding = "10px 20px";
  button.style.fontSize = "16px";
  button.style.backgroundColor = "#0d6efd";
  button.style.color = "white";
  button.style.marginBottom = "10px";
  button.style.cursor = "pointer";
  button.style.borderRadius = "1em";
  button.style.transition = "0.25s ease all";

  // ON HOVER
  button.addEventListener("mouseover", function () {
    button.style.backgroundColor = "#0a58ca";
  });

  // ON MOUSE OUT
  button.addEventListener("mouseout", function () {
    button.style.backgroundColor = "#0d6efd";
  });
  button.addEventListener("click", function (e) {
    e.preventDefault();
    getJwtToken((token) => {
      if (token) {
        hujinsight(token);
      } else {
        alert("Please log in to HUJInsight and try again.");
      }
    });
  });

  const appendAfter =
    document.querySelectorAll("#ziyunim > hr")[
      document.querySelectorAll("#ziyunim > hr").length - 1
    ];
  appendAfter.insertAdjacentElement("afterend", button);
}

class ForbiddenError extends Error {
  constructor(message) {
    super(message);
    this.name = "ForbiddenError";
  }
}

function hujinsight(token) {
  let tokenErrorOccurred = false;
  let importCourses = false;

  function createCustomModal() {
    return new Promise((resolve) => {
      // Create the modal container
      const modal = document.createElement("div");
      modal.style.position = "fixed";
      modal.style.left = "0";
      modal.style.direction = "rtl";
      modal.style.top = "0";
      modal.style.width = "100%";
      modal.style.height = "100%";
      modal.style.backgroundColor = "rgba(0, 0, 0, 0.85)";
      modal.style.display = "flex";
      modal.style.justifyContent = "center";
      modal.style.alignItems = "center";
      modal.style.zIndex = "9999";
      modal.style.fontFamily = "Arial";
      modal.style.direction = "rtl";
      // Create the modal content
      const modalContent = document.createElement("div");
      modalContent.style.backgroundColor = "white";
      modalContent.style.padding = "20px";
      modalContent.style.borderRadius = "5px";
      modalContent.style.textAlign = "center";
      modalContent.innerHTML = `
        <p>האם ברצונך לייבא את הקורסים והציונים שלך למעקב התואר ב-HUJInsight?</p>
        <p style="font-weight:bold"> שימו לב, הייבוא יעבוד רק אצל משתמשי HUJInsight+.</p>
        <button id="confirmButton">כן</button>
        <button id="cancelButton">לא</button>
      `;

      // Append the content to the modal
      modal.appendChild(modalContent);

      // Append the modal to the body
      document.body.appendChild(modal);

      // Event listeners for the buttons
      document.getElementById("confirmButton").onclick = () => {
        resolve(true);
        modal.remove();
      };

      document.getElementById("cancelButton").onclick = () => {
        resolve(false);
        modal.remove();
      };
    });
  }

  // Replace the askImportCourses function with the new modal
  async function askImportCourses() {
    importCourses = await createCustomModal();
  }

  // Function to check if the URL starts with the given pattern and if the element with the given ID exists
  function checkPrerequisites(urlPattern, elementId) {
    const currentURL = window.location.href;
    return (
      currentURL.startsWith(urlPattern) && document.getElementById(elementId)
    );
  }

  async function runScript() {
    try {
      await askImportCourses();
      // Function to update loading overlay progress with more informative UI
      function updateLoadingOverlayProgress(
        progressPercentage,
        currentURL,
        totalURLs
      ) {
        requestAnimationFrame(() => {
          const overlay = document.getElementById("loading-overlay");
          if (overlay) {
            const progress = overlay.querySelector(".progress-inner");
            if (progress) {
              progress.style.width = `${progressPercentage}%`;
            }

            // Add a message to show the current progress and the URL being fetched
            const progressMessage = overlay.querySelector(".progress-message");
            if (progressMessage) {
              progressMessage.textContent = `מייבא... (${urlsFetched} מתוך ${totalURLs})`;
            }
          }
        });
      }

      // Function to create an improved loading overlay with a more detailed design
      function createLoadingOverlay(totalURLs) {
        const existingOverlay = document.getElementById("loading-overlay");
        if (existingOverlay) return; // If overlay already exists, don't recreate it

        const overlay = document.createElement("div");
        overlay.id = "loading-overlay";
        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.backgroundColor = "rgba(0, 0, 0, 0.85)"; // Darker overlay for contrast
        overlay.style.display = "flex";
        overlay.style.justifyContent = "center";
        overlay.style.alignItems = "center";
        overlay.style.transition = "opacity 0.3s"; // Animation
        overlay.style.opacity = "0";
        overlay.style.zIndex = "1000";
        overlay.style.background = "#f6f9ff";
        overlay.style.color = "#444444";
        overlay.style.direction = "rtl";

        // To make sure the overlay is gradually visible
        setTimeout(() => (overlay.style.opacity = "1"), 50);

        const container = document.createElement("div");
        container.id = "plugin-container";
        container.style.width = "400px"; // Increased width for a more spacious design
        container.style.padding = "20px";
        container.style.backgroundColor = "white";
        container.style.borderRadius = "5px";
        container.style.fontFamily = "Arial";
        container.style.textAlign = "center";
        const loadingText = document.createElement("div");
        loadingText.textContent = "מייבא נתונים מ-HUJI...";
        loadingText.style.fontSize = "24px";
        loadingText.style.marginBottom = "15px"; // space for progress bar

        //add logo
        const img = document.createElement("img");
        img.src = "https://i.imgur.com/82WliYO.png";
        img.style.width = "200px";
        // Add a message element to display the current progress
        const progressMessage = document.createElement("div");
        progressMessage.className = "progress-message";
        progressMessage.style.fontSize = "16px";
        progressMessage.style.textAlign = "center";
        progressMessage.textContent = `Fetching 0 of ${totalURLs}`;

        const progressBar = document.createElement("div");
        progressBar.style.height = "20px";
        progressBar.style.backgroundColor = "#f3f3f3";
        progressBar.style.borderRadius = "10px";

        const progress = document.createElement("div");
        progress.style.height = "100%";
        progress.style.width = "0%"; // Initially no progress
        progress.style.backgroundColor = "#3498db"; // Blue color for progress
        progress.style.borderRadius = "10px";
        progress.className = "progress-inner";

        progressBar.appendChild(progress);
        container.appendChild(img);
        container.appendChild(loadingText);
        container.appendChild(progressMessage); // Add the progress message to the container
        container.appendChild(progressBar);
        overlay.appendChild(container);
        document.body.appendChild(overlay);
      }

      // Function to remove the loading overlay
      function removeLoadingOverlay(message) {
        const container = document.getElementById("plugin-container");
        if (container) {
          const messageElement = document.createElement("div");
          messageElement.textContent = message;
          messageElement.style.fontSize = "24px";
          messageElement.style.marginTop = "20px";
          messageElement.style.direction = "rtl";
          container.innerHTML = "";
          container.appendChild(messageElement);

          // Close the overlay after 4 seconds
          setTimeout(() => {
            document.body.removeChild(
              document.getElementById("loading-overlay")
            );
          }, 4000);
        }
      }

      async function postStatsData(
        courseId,
        url,
        semester,
        average,
        sd,
        userGrade
      ) {
        const iframe = document.createElement("iframe");
        iframe.src = "https://hujinsight.com/script-jwt-page";
        iframe.id = "crossOriginIframe";
        iframe.style.display = "none";
        document.body.appendChild(iframe);
        if (!token) {
          const completionMessage =
            "שגיאה בשליחת הקורס, יש להסיר את הקיצור מהמועדפים ולהוסיף מחדש.";
          removeLoadingOverlay(completionMessage);
          return;
        }
        try {
          const response = await fetch(
            "https://hujinsight-backend.onrender.com/stats/extract-data",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                url: url,
                courseId: courseId,
                semester: semester,
                average: average,
                sd: sd,
                import: importCourses,
                userGrade: userGrade,
              }),
            }
          );
          const data = await response.json();
        } catch (error) {
          const completionMessage =
            "שגיאה בשליחת הקורס, יש להסיר את הקיצור מהמועדפים ולהוסיף מחדש.";
          removeLoadingOverlay(completionMessage);

          throw new Error("Error posting data:", error);
        }
      }

      // Function to extract data from a URL
      async function fetchDataFromURL(url) {
        if (tokenErrorOccurred) {
          throw new Error("Token error occurred, stopping data fetch.");
        }

        const response = await fetch(url); // Send a GET request to the URL
        if (response.status === 403) {
          console.error(
            "Access to HUJInsight is forbidden with the current token."
          );
          // Handle 403 Forbidden specifically
          throw new ForbiddenError(
            "Access to HUJInsight is forbidden with the current token."
          );
        }
        const dataBuffer = await response.arrayBuffer(); // Get the response as an array buffer

        // Decode the array buffer with the cp1255 encoding
        const decoder = new TextDecoder("cp1255");
        const data = decoder.decode(dataBuffer);

        // Parse the HTML response into a DOM object
        const parser = new DOMParser();
        const doc = parser.parseFromString(data, "text/html");

        // Use the selector to extract the desired content
        const contentElement = doc.querySelector("body");

        if (contentElement) {
          const content = contentElement.innerHTML;

          // Use regular expressions to extract the desired values
          const gradeMatch = content.match(
            /ממוצע כלל הציונים  בקורס : <\/strong> \s*(\d+\.\d+)/
          );
          const sdMatch = content.match(/סטיית תקו : <\/strong> \s*(\d+\.\d+)/);
          const urlMatch = content.match(
            /src="(https:\/\/www\.huji\.ac\.il\/cgi-bin\/zz\/new\/grafica\.pl[^"]+)"/
          );
          const courseNumberMatch = content.match(
            /<strong>בקורס : <\/strong> (\d+)/
          );

          // date of the grades calculation
          const gradesCalculatedOnMatch = content.match(
            /<strong>הנתונים חושבו ביום : <\/strong> (\d+\/\d+\/\d+)/
          );
          // Extract year and semester from the URL
          const yearlimudMatch = url.match(/yearlimud=(\d+)/);
          const tkufaMatch = url.match(/tkufa=(\d+)/);
          const userGradeMatch = content.match(
            /ציונך : <strong>(\d+)<\/strong>/
          );

          if (
            gradeMatch &&
            sdMatch &&
            urlMatch &&
            yearlimudMatch &&
            tkufaMatch
          ) {
            const grade = parseFloat(gradeMatch[1]);
            const sd = parseFloat(sdMatch[1]);
            const url = urlMatch[1];
            const coursenum = courseNumberMatch[1];
            const yearlimud = parseInt(yearlimudMatch[1]);
            const tkufa = parseInt(tkufaMatch[1]);
            const userGrade = userGradeMatch ? parseInt(userGradeMatch[1]) : 0;
            var semester = "a";
            // Determine the semester based on tkufa (1 or 2)
            if (tkufa === 1) {
              semester = "a";
            } else if (tkufa === 2 || tkufa === 5) {
              semester = "b";
            } else {
              // if (gradesCalculatedOnMatch) {
              //   var date = gradesCalculatedOnMatch[1].split("/");
              //   if (parseInt(date[1]) < 6) {
              //     semester = "a";
              //   } else {
              //     semester = "b";
              //   }
              // }
              semester = null;
            }

            // Create a JSON object with the extracted values, including the semester
            const result = {
              grade: grade,
              SD: sd,
              URL: url,
              yearlimud: yearlimud,
              semester: `${yearlimud}${semester}`,
              coursenum: coursenum,
              userGrade: userGrade,
            };

            const response = await fetch(
              `https://hujinsight-backend.onrender.com/courses/symbol/${coursenum}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            if (response.status === 403) {
              console.error(
                "Access to HUJInsight is forbidden with the current token."
              );
              // Handle 403 Forbidden specifically
              throw new ForbiddenError(
                "Access to HUJInsight is forbidden with the current token."
              );
            }
            const data = await response.json();
            if (data && data._id) {
              try {
                if (!semester) {
                  throw new Error("Semester is null");
                }
                await postStatsData(
                  data._id,
                  result.URL,
                  result.semester,
                  result.grade,
                  result.SD,
                  importCourses ? result.userGrade : null
                );
              } catch (e) {
                throw new Error("Error posting data");
              }
            } else {
              console.error("Unexpected data structure:", data);
            }
          } else {
          }
        } else {
        }
        urlsFetched += 1;
        const progressPercentage = (urlsFetched / totalURLs) * 100;
        updateLoadingOverlayProgress(progressPercentage, url, totalURLs);

        if (urlsFetched === totalURLs) {
          const currentYear = document.querySelector(
            'select[name="yearsafa"]'
          ).value;
          const completionMessage =
            "תודה ששיתפת את הסטטיסטיקות" +
            ", הסטטיסטיקות יעודכנו באתר לאחר אישור.";
          removeLoadingOverlay(completionMessage);
        }
      }

      async function fetchOtherYearsLinks() {
        const currentYear = document.querySelector(
          'select[name="yearsafa"]'
        ).value;
        const otherYears = document.querySelector(
          'select[name="yearsafa"]'
        ).options;
        let allLinks = [];

        for (let i = 0; i < otherYears.length; i++) {
          if (otherYears[i].value !== currentYear) {
            // update overlay message
            setTimeout(() => {
              const overlay = document.getElementById("loading-overlay");
              if (overlay) {
                const progressMessage =
                  overlay.querySelector(".progress-message");
                if (progressMessage) {
                  progressMessage.textContent =
                    "מחפש קורסים בשנה " + otherYears[i].value + "...";
                }
              }
            }, 250);
            const response = await fetch(window.location.href, {
              headers: {
                accept:
                  "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                "accept-language": "en-US,en;q=0.9,he-IL;q=0.8,he;q=0.7",
                "cache-control": "no-cache",
                "content-type": "application/x-www-form-urlencoded",
                pragma: "no-cache",
                "sec-ch-ua":
                  '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": '"Windows"',
                "sec-fetch-dest": "document",
                "sec-fetch-mode": "navigate",
                "sec-fetch-site": "same-origin",
                "sec-fetch-user": "?1",
                "upgrade-insecure-requests": "1",
              },
              referrer: window.location.href,
              referrerPolicy: "strict-origin-when-cross-origin",
              body: "yearsafa=" + otherYears[i].value,
              method: "POST",
              mode: "cors",
              credentials: "include",
            });
            const dataBuffer = await response.arrayBuffer(); // Get the response as an array buffer
            const decoder = new TextDecoder("cp1255");
            const data = decoder.decode(dataBuffer);
            const parser = new DOMParser();
            const doc = parser.parseFromString(data, "text/html");
            const tableRows = doc.querySelectorAll("#ziyunim > table tr"); // Get all table rows
            let links = Array.from(tableRows)
              .map((row) => row.firstElementChild.querySelector("a"))
              .filter(
                (link) =>
                  link &&
                  (link.textContent.trim() === "לחץ כאן" ||
                    link.textContent.trim() === "לחצי כאן")
              );
            allLinks = allLinks.concat(links);
          }
        }
        return allLinks;
      }

      // Get all the links in the last column of the table
      createLoadingOverlay();

      const tableRows = document.querySelectorAll("#ziyunim > table tr"); // Get all table rows

      // Get all the links in the last column of the table rows
      let links = Array.from(tableRows)
        .map((row) => row.firstElementChild.querySelector("a"))
        .filter(
          (link) =>
            link &&
            (link.textContent.trim() === "לחץ כאן" ||
              link.textContent.trim() === "לחצי כאן")
        );

      links = links.concat(await fetchOtherYearsLinks());
      console.log(
        "links",
        links.map((link) => link.href)
      );

      let urlsFetched = 0;
      const totalURLs = links.length; // Set the total URLs to the number of links
      console.log("totalURLs", totalURLs);
      if (totalURLs === 0) {
        removeLoadingOverlay(
          "לא נמצאו קורסים עם ציונים בשנה זו, אנה נסה לשתף שנה אחרת."
        );
        return;
      }

      links.forEach((link) => {
        const url = link.href;
        fetchDataFromURL(url).catch((error) => {
          console.log("Error processing2 URL:", url, error);
          console.log(
            "Instance of ForbiddenError:",
            error instanceof ForbiddenError
          );
          if (error instanceof ForbiddenError) {
            // Handle ForbiddenError specifically
            removeLoadingOverlay(
              "הגישה ל-HUJInsight אסורה עם הטוקן הנוכחי. אנא הסר את הקיצור מהמועדפים והוסף מחדש."
            );
            chrome.storage.local.remove("jwtToken");
            return; // Stop further execution for this URL
          }
          console.error(`Error processing URL: ${url}`, error);
          urlsFetched++;
          updateLoadingOverlayProgress(
            (urlsFetched / totalURLs) * 100,
            url,
            totalURLs
          );
          if (urlsFetched === totalURLs) {
            removeLoadingOverlay(
              "תודה על השיתוף! הסטטיסטיקות יעודכנו באתר לאחר אישור"
            );
          }
        });
      });
    } catch (e) {
      const completionMessage =
        "שגיאה בשליחת הקורס, יש להסיר את הקיצור מהמועדפים ולהוסיף מחדש.";
      removeLoadingOverlay(completionMessage);
      return;
    }
  }

  const urlPattern = "https://www.huji.ac.il/dataj/controller";
  const elementId = "ziyunim";

  if (checkPrerequisites(urlPattern, elementId)) {
    runScript();
  } else {
    alert("נא להפעיל את הסקריפט בדף הציונים");
  }
}

function getJwtToken(callback) {
  chrome.storage.local.get(["jwtToken"], (result) => {
    callback(result.jwtToken);
  });
}
