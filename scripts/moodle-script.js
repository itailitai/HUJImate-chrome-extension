let isScrolling = false;

let activeCSS = false;
let replacedHeader = false;
document.readyState === "loading"
  ? document.addEventListener("DOMContentLoaded", initMoodle)
  : initMoodle();

function getStorageValue(key) {
  return new Promise((resolve) => {
    chrome.storage.sync.get([key], function (result) {
      resolve(result[key]);
    });
  });
}

function clickEventHandler(e) {
  const parsedUrl = new URL(window.location.href);
  const target =
    e.target.tagName === "A" || e.target.parentElement.tagName === "A"
      ? e.target.tagName === "A"
        ? e.target
        : e.target.parentElement
      : null;
  if (!target) {
    if (e.target.classList.contains("sectionname")) {
      toggleSection(e.target);
      return;
    } else {
      return;
    }
  }
  e.preventDefault();
  const url = target.href;

  if (
    !url.includes("moodle4.cs.huji.ac.il") ||
    url.includes("pluginfile.php")
  ) {
    window.open(url, "_blank");
    return;
  }

  if (
    url.includes("/resource/view.php") ||
    url.includes("/login/logout") ||
    (parsedUrl.hostname === "moodle4.cs.huji.ac.il" &&
      parsedUrl.pathname === "/hu23/mod/assign/view.php" &&
      parsedUrl.searchParams.get("action") === "editsubmission" &&
      !isNaN(parsedUrl.searchParams.get("id")))
  ) {
    window.open(url, "_self");
    return;
  }

  if (window.location.href.split("#")[0] === url.split("#")[0]) return;

  showLoadingScreen(true, fetchAndReplaceContent(url));
}

function fetchAndReplaceContent(url) {
  fetch(url)
    .then((response) => response.text())
    .then((html) => {
      const parser = new DOMParser();
      const newDocument = parser.parseFromString(html, "text/html");
      document.querySelector("#page-content").innerHTML =
        newDocument.querySelector("#page-content").innerHTML;
      document.querySelector("#page-navbar").innerHTML =
        newDocument.querySelector("#page-navbar").innerHTML;
      window.history.pushState(
        {
          path: url,
        },
        "",
        url
      );
      // update title
      const title = newDocument.querySelector("title");
      document.title = title ? title.innerText : "HUJI Moodle";
      if (activeCSS) {
        const scrollingMenu = createScrollingMenu();
        scrollListener();

        replaceImages(document);
      }
      fetchPanoptoContent();
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      hideLoadingScreen(250);
      document.addEventListener("click", clickEventHandler);
    })
    .catch((error) => {
      console.error("Error fetching the data:", error);
      window.location.href = url;
    });
}

async function initMoodle() {
  showLoadingScreen(false, false, true);
  const darkModeEnabled = await getStorageValue("darkModeEnabled");
  const ajaxEnabled = await getStorageValue("ajaxEnabled");
  const moodleCssEnabled = await getStorageValue("moodleCssEnabled");
  if (ajaxEnabled === false) {
    if (moodleCssEnabled) {
      document.querySelector("html").setAttribute("hujinsight", "true");
      activeCSS = true;
      if (darkModeEnabled) {
        document.querySelector("html").setAttribute("darkmode", "true");
      }
      replaceImages(document);
      createScrollingMenu();
      setTimeout(() => {
        scrollListener();
      }, 150);
    }

    hideLoadingScreen(150);
    return; // Return from initMoodle if ajaxEnabled is false
  }

  if (moodleCssEnabled !== false) {
    document.querySelector("html").setAttribute("hujinsight", "true");
    activeCSS = true;
    if (darkModeEnabled) {
      document.querySelector("html").setAttribute("darkmode", "true");
    }
  }

  const welcomeMessage = document.querySelector("#page-header > div > h2");
  if (welcomeMessage) {
    welcomeMessage.remove();
  }

  hideLoadingScreen(150);

  const parsedUrl = new URL(window.location.href);
  if (
    parsedUrl.hostname === "moodle4.cs.huji.ac.il" &&
    parsedUrl.pathname === "/hu23/mod/assign/view.php" &&
    parsedUrl.searchParams.get("action") === "editsubmission" &&
    !isNaN(parsedUrl.searchParams.get("id"))
  ) {
    showLoadingScreen();
    // Function to be called when the element appears
    function onDndSupportedElementFound() {
      const element = document.querySelector(".dndsupported");
      if (element) {
        document.addEventListener("click", clickEventHandler);
        window.addEventListener("popstate", () => window.location.reload());

        if (activeCSS) {
          replaceImages(document);
          const scrollingMenu = createScrollingMenu();
          setTimeout(() => {
            scrollListener();
          }, 150);
        }
        hideLoadingScreen(250);
      }
    }

    // Create a MutationObserver to watch for the element
    const observer = new MutationObserver((mutationsList, observer) => {
      for (const mutation of mutationsList) {
        if (mutation.type === "childList") {
          const element = document.querySelector(".dndsupported");
          if (element) {
            setTimeout(() => {
              onDndSupportedElementFound();
            }, 500);
            observer.disconnect(); // Stop observing once the element is found

            break;
          }
        }
      }
    });

    // Start observing the document for changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Check if the element is already present when the script runs
    onDndSupportedElementFound();
  } else {
    document.addEventListener("click", clickEventHandler);
    window.addEventListener("popstate", () => window.location.reload());
    chrome.storage.sync.get(["moodleCssEnabled"], function (result) {
      if (result.moodleCssEnabled !== false) {
        addFontsToHead();
        replaceImages(document);
        const scrollingMenu = createScrollingMenu();
        fetchPanoptoContent();
        setTimeout(() => {
          scrollListener();
        }, 150);
      }
    });

    hideLoadingScreen(250);
  }
}

function addFontsToHead() {
  const head = document.head;
  head.innerHTML += `
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  `;
  const fonts = [
    "https://fonts.googleapis.com/css2?family=Heebo:wght@100..900&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swaphttps://fonts.googleapis.com/css2?family=Heebo:wght@100..900&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap",
  ];
  fonts.forEach((fontUrl) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = fontUrl;
    head.appendChild(link);
  });
}

function replaceImages(htmlDocument) {
  const headers = htmlDocument.querySelectorAll(".page-header-headings");
  if (!replacedHeader) {
    headers.forEach((header) => {
      header.innerHTML =
        '<a style="text-decoration:none" href="https://moodle4.cs.huji.ac.il/hu23/"><img src="' +
        chrome.runtime.getURL("assets/moodlelogo.png") +
        '" style="width:300px; padding-bottom: 15px; margin-top: 15px;" alt="Page Header"></a>';
      header.style.visibility = "visible";
    });
    replacedHeader = true;
  }

  const images = htmlDocument.querySelectorAll("img");
  images.forEach((img) => {
    if (img.alt.includes("Forum")) {
      img.src =
        "data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMzIgMzIiIHhtbDpzcGFjZT0icHJlc2VydmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZW5hYmxlLWJhY2tncm91bmQ9Im5ldyAwIDAgMzIgMzIiPjxwYXRoIGQ9Ik0yOCA2SDhjLTEuMiAwLTIgLjgtMiAydjE0YzAgMS4yLjggMiAyIDJoOHYtMkg4VjhoMjB2MTRoLTcuMkwxNiAyOC44bDEuNiAxLjIgNC4yLTZIMjhjMS4yIDAgMi0uOCAyLTJWOGMwLTEuMi0uOC0yLTItMnoiIGZpbGw9IiM0MzE4ZmYiIGNsYXNzPSJmaWxsLTAwMDAwMCI+PC9wYXRoPjxwYXRoIGQ9Ik00IDE4SDJWNWMwLTEuNyAxLjMtMyAzLTNoMTN2Mkg1Yy0uNiAwLTEgLjQtMSAxdjEzeiIgZmlsbD0iIzQzMThmZiIgY2xhc3M9ImZpbGwtMDAwMDAwIj48L3BhdGg+PHBhdGggZD0iTTAgMGgzMnYzMkgweiIgZmlsbD0ibm9uZSI+PC9wYXRoPjwvc3ZnPg==";
    }

    if (img.alt.includes("ForumNG")) {
      img.src =
        "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/PjwhRE9DVFlQRSBzdmcgIFBVQkxJQyAnLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4nICAnaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkJz48c3ZnIGVuYWJsZS1iYWNrZ3JvdW5kPSJuZXcgMCAwIDQ4IDQ4IiBoZWlnaHQ9IjQ4cHgiIHZlcnNpb249IjEuMSIgdmlld0JveD0iMCAwIDQ4IDQ4IiB3aWR0aD0iNDhweCIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+PGcgaWQ9IkV4cGFuZGVkIj48Zz48Zz48cGF0aCBkPSJNMzIsMjhjLTAuMTI5LDAtMC4yNTktMC4wMjQtMC4zODMtMC4wNzZDMzEuMjQzLDI3Ljc3LDMxLDI3LjQwNCwzMSwyN3YtN2gtM2MtMC41NTMsMC0xLTAuNDQ3LTEtMXMwLjQ0Ny0xLDEtMWg0ICAgICBjMC41NTMsMCwxLDAuNDQ3LDEsMXY1LjU4Nmw2LjI5My02LjI5M0MzOS40OCwxOC4xMDUsMzkuNzM0LDE4LDQwLDE4aDZWMkgxOHY3YzAsMC41NTMtMC40NDcsMS0xLDFzLTEtMC40NDctMS0xVjEgICAgIGMwLTAuNTUzLDAuNDQ3LTEsMS0xaDMwYzAuNTUzLDAsMSwwLjQ0NywxLDF2MThjMCwwLjU1My0wLjQ0NywxLTEsMWgtNi41ODZsLTcuNzA3LDcuNzA3QzMyLjUxNiwyNy44OTgsMzIuMjYsMjgsMzIsMjh6Ii8+PC9nPjxnPjxwYXRoIGQ9Ik0zMiw0OEgwdi0zLjk3OGMwLTIuNDE4LDEuNTMtNC41ODksMy44MDktNS40MDJsNy4yNDQtMi41ODh2LTMuNTloMnY1TDQuNDgsNDAuNTAzQzIuOTk3LDQxLjAzMywyLDQyLjQ0NywyLDQ0LjAyMlY0NiAgICAgaDI4di0xLjk3OGMwLTEuNTc1LTAuOTk2LTIuOTg5LTIuNDc5LTMuNTJsLTguNTczLTMuMDYxVjMyLjE3aDJ2My44NjJsNy4yNDYsMi41ODhDMzAuNDcxLDM5LjQzNCwzMiw0MS42MDQsMzIsNDQuMDIyVjQ4eiIvPjwvZz48Zz48cGF0aCBkPSJNMTUuODAzLDM0LjU3OWMtNC45MDQsMC04Ljg5NS00LjY5OS04Ljg5NS0xMC40NzVjMC01Ljc3NCwzLjk5LTEwLjQ3Myw4Ljg5NS0xMC40NzNzOC44OTUsNC42OTgsOC44OTUsMTAuNDczICAgICBDMjQuNjk3LDI5Ljg4LDIwLjcwNywzNC41NzksMTUuODAzLDM0LjU3OXogTTE1LjgwMywxNS42MzJjLTMuODAyLDAtNi44OTUsMy44MDEtNi44OTUsOC40NzNjMCw0LjY3MywzLjA5Myw4LjQ3NSw2Ljg5NSw4LjQ3NSAgICAgczYuODk1LTMuODAyLDYuODk1LTguNDc1QzIyLjY5NywxOS40MzMsMTkuNjA0LDE1LjYzMiwxNS44MDMsMTUuNjMyeiIvPjwvZz48Zz48cGF0aCBkPSJNMjEuNTc1LDI0LjQ1M2MtMS44NzgsMC0zLjM3LTAuNzk3LTQuNjM4LTIuNDc1Yy0xLjQxNCwxLjM2My0zLjc0MiwyLjMzNy01Ljg3MSwyLjMzN2MtMS4yOTQsMC0yLjQxMy0wLjI3LTMuNTIxLTAuODUgICAgIGwwLjkyOC0xLjc3MWMwLjgyMSwwLjQzLDEuNjIxLDAuNjIxLDIuNTkzLDAuNjIxYzEuOTYyLDAsNC4zNzMtMS4xOTYsNS4wNTktMi41MWwwLjg0Ny0xLjYyMmwwLjkwOCwxLjU4OSAgICAgYzEuMzExLDIuMjk2LDIuNjI2LDIuOTg2LDQuODM5LDIuNTYyYzAuMjIxLTAuMDQyLDAuNDIzLTAuMDQ0LDAuNjE5LTAuMDQ0YzAuMDY3LDAsMC4xMzUsMC4wMDQsMC4yMDgtMC4wMDVsMC4yNDIsMS45ODQgICAgIGMtMC4xNjMsMC4wMjEtMC4zMTQsMC4wMjItMC40NjksMC4wMjFjLTAuMDctMC4wMDMtMC4xNDYtMC4wMDctMC4yMjUsMC4wMDhDMjIuNTYyLDI0LjQsMjIuMDU2LDI0LjQ1MywyMS41NzUsMjQuNDUzeiIvPjwvZz48Zz48cGF0aCBkPSJNMzcsMTBjLTAuNTUzLDAtMSwwLjQ0OC0xLDFjMCwwLjU1MiwwLjQ0NywxLDEsMWMwLjU1MywwLDEtMC40NDgsMS0xQzM4LDEwLjQ0OCwzNy41NTMsMTAsMzcsMTBMMzcsMTB6Ii8+PC9nPjxnPjxwYXRoIGQ9Ik0zMiwxMGMtMC41NTMsMC0xLDAuNDQ4LTEsMWMwLDAuNTUyLDAuNDQ3LDEsMSwxYzAuNTUzLDAsMS0wLjQ0OCwxLTFDMzMsMTAuNDQ4LDMyLjU1MywxMCwzMiwxMEwzMiwxMHoiLz48L2c+PGc+PHBhdGggZD0iTTI3LDEwYy0wLjU1MywwLTEsMC40NDgtMSwxYzAsMC41NTIsMC40NDcsMSwxLDFjMC41NTMsMCwxLTAuNDQ4LDEtMUMyOCwxMC40NDgsMjcuNTUzLDEwLDI3LDEwTDI3LDEweiIvPjwvZz48L2c+PC9nPjwvc3ZnPg==";
    }

    if (img.alt.includes("Assignment") || img.alt === "Activity event") {
      img.src =
        "data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMzIgMzIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZGF0YS1uYW1lPSIzOC1GaWxlIj48cGF0aCBkPSJtMjguNzEgNi4yOS02LTZBMSAxIDAgMCAwIDIyIDBIMTJ2Mmg5djRhMiAyIDAgMCAwIDIgMmg0djIxYTEgMSAwIDAgMS0xIDFIMTR2MmgxMmEzIDMgMCAwIDAgMy0zVjdhMSAxIDAgMCAwLS4yOS0uNzFaTTcuODYuNDlhMSAxIDAgMCAwLTEuNzEgMGwtMyA1QTEgMSAwIDAgMCAzIDZ2MjVhMSAxIDAgMCAwIDEgMWg2YTEgMSAwIDAgMCAxLTFWNmExIDEgMCAwIDAtLjE0LS41MVpNOSAyNkg1VjYuMjhsMi0zLjM0IDIgMy4zNFoiIGZpbGw9IiM0MzE4ZmYiIGNsYXNzPSJmaWxsLTAwMDAwMCI+PC9wYXRoPjwvZz48L3N2Zz4=";
    }

    if (img.alt.includes("File")) {
      img.src =
        "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/PjxzdmcgaWQ9IkxheWVyXzEiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDEyOCAxMjg7IiB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9IjAgMCAxMjggMTI4IiB4bWw6c3BhY2U9InByZXNlcnZlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIj48Zz48cG9seWdvbiBwb2ludHM9IjEzLDEyNyAxMTMsMTI3IDExMywzMyAxMTMsMjUgODksMjUgODksMSA4MSwxIDEzLDEgMTMsNTcgMjEsNTcgMjEsOSA4MSw5IDgxLDMzIDEwNSwzMyAxMDUsMTE5IDEzLDExOSAgIi8+PHBhdGggZD0iTTI0LjUsOTRDMzAuOCw5NCwzNiw4OC44LDM2LDgyLjVTMzAuOCw3MSwyNC41LDcxSDEzdjM0aDhWOTRIMjQuNXogTTIxLDc5aDMuNWMxLjksMCwzLjUsMS42LDMuNSwzLjVTMjYuNCw4NiwyNC41LDg2SDIxICAgVjc5eiIvPjxwb2x5Z29uIHBvaW50cz0iOTcsNzkgOTcsNzEgNzcsNzEgNzcsMTA1IDg1LDEwNSA4NSw5NCA5MSw5NCA5MSw4NiA4NSw4NiA4NSw3OSAgIi8+PHBhdGggZD0iTTY5LDg4YzAtOS40LTcuNi0xNy0xNy0xN2gtOHYzNGg4QzYxLjQsMTA1LDY5LDk3LjQsNjksODh6IE01Miw5N1Y3OWM1LDAsOSw0LDksOVM1Nyw5Nyw1Miw5N3oiLz48L2c+PC9zdmc+";
    }

    if (img.alt.includes("Quiz")) {
      img.src =
        "data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgODAwIDgwMCIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJtNjc2LjYzNyAxODMuMzg2LjAwNS0uMDA1TDUyMi41NDkgMjkuMjg3YTE5LjkzOSAxOS45MzkgMCAwIDAtMTQuMTQ1LTUuODZIMTM3LjVjLTExLjA0NiAwLTIwIDguOTU0LTIwIDIwdjcxMy4xNDZjMCAxMS4wNDYgOC45NTQgMjAgMjAgMjBoNTI1YzExLjA0NiAwIDIwLTguOTU0IDIwLTIwVjE5Ny41MjJjMC01LjExNS0yLjA3NC0xMC4zMTktNS44NjMtMTQuMTM2ek02NDIuNSA3MzYuNTczaC00ODVWNjMuNDI3aDM0Mi42MmwxMTQuMDk2IDExNC4wOTVoLTg1LjgxMnYtNDEuNzg4YzAtMTEuMDQ2LTguOTU0LTIwLTIwLTIwcy0yMCA4Ljk1NC0yMCAyMHY2MS43ODhjMCAxMS4wNDYgOC45NTQgMjAgMjAgMjBINjQyLjV2NTE5LjA1MXoiIGZpbGw9IiNlMzFhMWEiIGNsYXNzPSJmaWxsLTAwMDAwMCI+PC9wYXRoPjxwYXRoIGQ9Im0yOTUuMjE3IDIyNC40MTctMzkuODU0IDM5Ljg1NS01LjY5Ny01LjY5N2MtNy44MTEtNy44MTEtMjAuNDczLTcuODExLTI4LjI4MyAwLTcuODExIDcuODEtNy44MTEgMjAuNDczIDAgMjguMjg0bDE5Ljg0IDE5Ljg0YTE5Ljk5OCAxOS45OTggMCAwIDAgMjguMjg1IDBsNTMuOTk2LTUzLjk5OWM3LjgxLTcuODExIDcuODEtMjAuNDc0LS4wMDEtMjguMjg0LTcuODEzLTcuODEtMjAuNDc2LTcuODEtMjguMjg2LjAwMXpNNTU3LjgzMSAzMTIuNTU3aDYuNjQ2YzExLjA0NiAwIDIwLTguOTU0IDIwLTIwcy04Ljk1NC0yMC0yMC0yMGgtNi42NDZjLTExLjA0NiAwLTIwIDguOTU0LTIwIDIwczguOTU0IDIwIDIwIDIwek0zNjcuMzg5IDI3Mi41NTdjLTExLjA0NiAwLTIwIDguOTU0LTIwIDIwczguOTU0IDIwIDIwIDIwaDEyOS42MDljMTEuMDQ2IDAgMjAtOC45NTQgMjAtMjBzLTguOTU0LTIwLTIwLTIwSDM2Ny4zODl6TTU1Ny44MzEgNDM1LjU1Mmg2LjY0NmMxMS4wNDYgMCAyMC04Ljk1NCAyMC0yMHMtOC45NTQtMjAtMjAtMjBoLTYuNjQ2Yy0xMS4wNDYgMC0yMCA4Ljk1NC0yMCAyMHM4Ljk1NCAyMCAyMCAyMHpNNDk2Ljk5OCAzOTUuNTUySDM2Ny4zODljLTExLjA0NiAwLTIwIDguOTU0LTIwIDIwczguOTU0IDIwIDIwIDIwaDEyOS42MDljMTEuMDQ2IDAgMjAtOC45NTQgMjAtMjBzLTguOTU0LTIwLTIwLTIwek01NTcuODMxIDU1OC41NDdoNi42NDZjMTEuMDQ2IDAgMjAtOC45NTQgMjAtMjBzLTguOTU0LTIwLTIwLTIwaC02LjY0NmMtMTEuMDQ2IDAtMjAgOC45NTQtMjAgMjBzOC45NTQgMjAgMjAgMjB6TTQ5Ni45OTggNTE4LjU0N0gzNjcuMzg5Yy0xMS4wNDYgMC0yMCA4Ljk1NC0yMCAyMHM4Ljk1NCAyMCAyMCAyMGgxMjkuNjA5YzExLjA0NiAwIDIwLTguOTU0IDIwLTIwcy04Ljk1NC0yMC0yMC0yMHpNNTU3LjgzMSA2ODEuNTQyaDYuNjQ2YzExLjA0NiAwIDIwLTguOTU0IDIwLTIwcy04Ljk1NC0yMC0yMC0yMGgtNi42NDZjLTExLjA0NiAwLTIwIDguOTU0LTIwIDIwczguOTU0IDIwIDIwIDIwek00OTYuOTk4IDY0MS41NDJIMzY3LjM4OWMtMTEuMDQ2IDAtMjAgOC45NTQtMjAgMjBzOC45NTQgMjAgMjAgMjBoMTI5LjYwOWMxMS4wNDYgMCAyMC04Ljk1NCAyMC0yMHMtOC45NTQtMjAtMjAtMjB6TTI1NS4zNjMgNDM1LjU1MmExOS45OTggMTkuOTk4IDAgMCAwIDE0LjE0Mi01Ljg1OGw1My45OTYtNTMuOTk2YzcuODExLTcuODExIDcuODExLTIwLjQ3NSAwLTI4LjI4NXMtMjAuNDczLTcuODExLTI4LjI4MyAwbC0zOS44NTQgMzkuODU1LTUuNjk3LTUuNjk4Yy03LjgxLTcuODEtMjAuNDc0LTcuODEyLTI4LjI4NC0uMDAxcy03LjgxMSAyMC40NzQtLjAwMSAyOC4yODRsMTkuODQgMTkuODQxYTIwIDIwIDAgMCAwIDE0LjE0MSA1Ljg1OHpNMjM0LjIzOSA1MTEuNTQ3bC0xMi44NTYgMTIuODU3Yy03LjgxIDcuODExLTcuODEgMjAuNDc0LjAwMSAyOC4yODQgMy45MDUgMy45MDUgOS4wMjMgNS44NTcgMTQuMTQyIDUuODU3czEwLjIzNy0xLjk1MiAxNC4xNDMtNS44NThsMTIuODU1LTEyLjg1NSAxMi44NTYgMTIuODU1YzMuOTA0IDMuOTA2IDkuMDIzIDUuODU4IDE0LjE0MiA1Ljg1OHMxMC4yMzctMS45NTIgMTQuMTQyLTUuODU4YzcuODExLTcuODExIDcuODExLTIwLjQ3MyAwLTI4LjI4M2wtMTIuODU1LTEyLjg1NyAxMi44NTYtMTIuODU3YzcuODEtNy44MTEgNy44MS0yMC40NzQtLjAwMS0yOC4yODQtNy44MTEtNy44MS0yMC40NzQtNy44MS0yOC4yODQuMDAxbC0xMi44NTYgMTIuODU2LTEyLjg1Ny0xMi44NTZjLTcuODExLTcuODExLTIwLjQ3My03LjgxMS0yOC4yODMgMHMtNy44MTEgMjAuNDc0IDAgMjguMjgzbDEyLjg1NSAxMi44NTd6TTI5NS4yMTcgNTkzLjRsLTM5Ljg1NCAzOS44NTUtNS42OTctNS42OTdjLTcuODExLTcuODExLTIwLjQ3My03LjgxMS0yOC4yODMgMC03LjgxMSA3LjgxLTcuODExIDIwLjQ3MyAwIDI4LjI4M2wxOS44NCAxOS44NGEyMCAyMCAwIDAgMCAyOC4yODUgMGw1My45OTYtNTMuOTk4YzcuODEtNy44MTEgNy44MS0yMC40NzQtLjAwMS0yOC4yODQtNy44MTMtNy44MDktMjAuNDc2LTcuODA5LTI4LjI4Ni4wMDF6IiBmaWxsPSIjZTMxYTFhIiBjbGFzcz0iZmlsbC0wMDAwMDAiPjwvcGF0aD48L3N2Zz4=";
    }

    if (img.alt === "Folder icon") {
      img.src =
        "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/PjxzdmcgY2xhc3M9ImZlYXRoZXIgZmVhdGhlci1mb2xkZXIiIGZpbGw9Im5vbmUiIGhlaWdodD0iMjQiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS13aWR0aD0iMiIgdmlld0JveD0iMCAwIDI0IDI0IiB3aWR0aD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTIyIDE5YTIgMiAwIDAgMS0yIDJINGEyIDIgMCAwIDEtMi0yVjVhMiAyIDAgMCAxIDItMmg1bDIgM2g5YTIgMiAwIDAgMSAyIDJ6Ii8+PC9zdmc+";
    }

    if (img.alt.includes("Attendance")) {
      img.src =
        "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/Pjxzdmcgdmlld0JveD0iMCAwIDMyIDMyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxzdHlsZT4uY2xzLTF7ZmlsbDpub25lO3N0cm9rZTojMDAwO3N0cm9rZS1saW5lY2FwOnJvdW5kO3N0cm9rZS1saW5lam9pbjpyb3VuZDtzdHJva2Utd2lkdGg6MnB4O308L3N0eWxlPjwvZGVmcz48dGl0bGUvPjxnIGRhdGEtbmFtZT0iNzktdXNlcnMiIGlkPSJfNzktdXNlcnMiPjxjaXJjbGUgY2xhc3M9ImNscy0xIiBjeD0iMTYiIGN5PSIxMyIgcj0iNSIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTIzLDI4QTcsNywwLDAsMCw5LDI4WiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTI0LDE0YTUsNSwwLDEsMC00LTgiLz48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0yNSwyNGg2YTcsNywwLDAsMC03LTciLz48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0xMiw2YTUsNSwwLDEsMC00LDgiLz48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik04LDE3YTcsNywwLDAsMC03LDdINyIvPjwvZz48L3N2Zz4=";
    }

    if (img.alt === "Page icon") {
      img.src =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAAAXNSR0IArs4c6QAABeBJREFUeF7tnMmrHFUchb+owWjElaALibhz7U6ICeI8IEmcp4WKEyJqxIX/gJtIRBxxAMF5SqLigAshg+4c8D9IdoIDqNFInPoH5c6uflXddeq0OQVvV/eeU+d87/ar6ltvFf2PtcA2YBOwpv809iOPaa7vaOBP4B3gOnvXKzS4aoXn/ddpO4DNc4xf5qGfABcu8wX8670vAOuA/f+HAOa4hkeBrXOMtxjaF4D1wF6LKxjXxGPA/cDf49ror94XgA3A7v6y/6uRjwP3LisEAWAxLD4J3LOMEAwBwHbg8GJyHXWW84EzOzh4Grh72SAYAoC6Pfy1Q3Cupz7RFNrF3/PAHcBfXQaNeW4AmJ5+HwBqtheA25cFggDQHYCfgBNn/NYuDQQBoDsA7wN7mqegbRy8BtzUPD0cc5Vv1Q4A/QC4HHgAeGRGs683EPzhSkAA6A9AjayHQHXX03a8AdwIWEIQAOYDoEbf10DQluWbwA2OEASA+QGoGe4EngLa8nwLuN4NggCwGABqlrr1e2YGBG83ENg8KAsAiwOgZrqtgeColj8KrCAIAIsFYKUQ1F6Kax0emQeAxQNQM94KPAu0rQQfAFcAv495ixgAhgGgZr0FeG4GBB8CW8aEIAAMB0DNfDNQXxC1rQQfNRAcGmMlCADDAlCz1wbSl4DaVDrt+LjZXymHIAAMD0Ap1B98BUHtMLaCIABoACiVa4CXZ0BQu41rm/1vqo+DAKADoJSuBl5xgiAAaAEotauAV2dAUBtuLwN+GXolCAB6AErxygaC1S0F156DS4eGIACMA0Cp1kOg2jTSBkG9e3HJkBAEgPEAKOVa5uu7gWNbVoJ9DQQ/D/FxEADGBaDUa5mvF07bIPgMuHiyC2nhEASA8QEoB7XM1xdEcggCgAcA5aJ+wwuCtlftP2/Oq53JCzkCgA8A5eQiYOcMCL4A6q2lHxdBQADwAqDc1P8d2LUCCC4AfpgXggDgB0A5qnILguNaCv6yWQnmgiAAeAJQrmqZf3cGBF81533fdyUIAL4AlLPzJm8ovzcDgiq/3mI+0AeCANAdgO8m39h93SfsnmPOmGwqOXXG2G8nm1FP6TN/AOgOQJ+cFWM2Nu8sdtIKANPjeniyV++hTmmOe3JtP3uxq4UAMD2x+tq2XulaluNc4NOuZgPA9MROmGzW/AY4vWuoI52fj4ABgj+reTJ38gBzL3rKALDoRJv5TgLuam61alUY86idxedMMRAAxmxGpH08cDAAiNI2lAkAhqUoLQUAZdqGWgHAsBSlpQCgTNtQKwAYlqK0FACUaRtqBQDDUpSWAoAybUOtAGBYitJSAFCmbagVAAxLUVoKAMq0DbUCgGEpSksBQJm2oVYAMCxFaSkAKNM21AoAhqUoLQUAZdqGWgHAsBSlpQCgTNtQKwAYlqK0FACUaRtqBQDDUpSWAoAybUOtAGBYitJSAFCmbagVAAxLUVoKAMq0DbUCgGEpSksBQJm2oVYAMCxFaSkAKNM21AoAhqUoLQUAZdqGWgHAsBSlpQCgTNtQKwAYlqK0FACUaRtqBQDDUpSWAoAybUOtAGBYitJSAFCmbagVAAxLUVoKAMq0DbUCgGEpSksBQJm2oVYAMCxFaSkAKNM21AoAhqUoLQUAZdqGWgHAsBSlpQCgTNtQKwAYlqK0FACUaRtqBQDDUpSWAoAybUOtAGBYitJSAFCmbagVAAxLUVoKAMq0DbUCgGEpSksBQJm2oVYAMCxFaSkAKNM21AoAhqUoLQUAZdqGWgHAsBSlpQCgTNtQKwAYlqK0FACUaRtqBQDDUpSWAoAybUOtAGBYitJSAFCmbagVAAxLUVpaCgC2A4eVqRxBWquBrVOudyOwp2sWq7oOaM7fAOzuOTbDhkkgAAyT69LMKgVgPbB3aaI5MoyeDezreql9PwLWAfu7iuX8QRM4DTjQVaEvAKWzA9jcVTDnD5LATmBLn5nnAWAtsA3YBKzpI54xcydwCNgFPDj5Odhntn8A819Gn0/OF9QAAAAASUVORK5CYII=";
    }

    if (img.alt.includes("Group choice")) {
      img.src =
        "data:image/png;base64,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";
    }

    if (img.alt === "URL icon") {
      img.src =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAABXhJREFUeF7tm1eoJEUUhr81IcYHV8GIYhbFLOaMmHVNiPjggygoGB8UFDMIRhQfRPHNiBnMoGIOGEFMYABzFhVBBbU+qIa27JmunumZ7tl7Cy7s7dvVfc7f/8m1C5jja8Ec158mALwA7DyjgD0P7FYlexMA/plR5QuxK3UdBYAme/qAWfHh5gFoagJ9tPk3gAOBbxpQa2QG9NXmPwD2Ar7KBGGxA0C9m4Cw2AHwDrA58C6wd4Y5tArALsASwHMJ/dLr/v5i6Z5lgC2BC4GDStcHPW8Yu1cDnmoAQqsAFKEk9Q/p9WGh8n7g8KjhoOcNA8A9q4bE5klgiwxz6BSA4uV/AlcB5wE7AK+MCYDbBSGHCb0AQIF/BVYCVgR+aQGAXBB6AYAMuBI4v0UGFGZSx4ROAaiy5YdjMuPfRvEBFjUWN+U1DIReAGAU2CpGATO5tEBpO+l6HdguvqRzAJYCrgNOqaDDKAzITAD/x67GxVDVV9GJ6cw+A9aKkvjvdYCVgZ8T53ZmuH5tvHYWcAWw5BQYUGVerQCwKFD5gRDGDgBuCpQWpJOAx0JmdgxwV4V3vyV+fR2h9L8jRoNRfUCnDDAH3wn4KZFilZDcvFViRUrtZ4Ejge+B7QMQryZAVSm1a0XGmav8xBjgg6X82QGIx6M0+4fYfnVJeS/rqQVBxYv1MXAssGzpepVHL+73b+X9TZSfKABNBenq/qz0fFjO3nZomjYQ8wBMIg+Y9lcc532tMWDWu8BjZ4LzAIzDww72pl+8cwbIoG2Aw2J+sHqSRn8d4/2DgG3vcVdvAFDxo0PufymwUaZWZpr2DO6NaXbmtv/c1gsA1g9K3x6bH4V03wEnAG8DP8SiyIJqXeDgyJC1480vA8cBn4yAQOcAOLS4G7A+KK8voil8O0Apq0QBuhhYM9YNR4UhyDMNQegUAJW3Rli6RmjL5kdC+XwGIDPKy57hrcEfHApYQe7XEITOAJD2dnvTLz8Mi6fjcCO9x9mDfYTTIhPsJOeaQycA6PC0WwVturT7zys2CYIzBJnwEuAQJac+6QSAcjOkLQB8jubwfmi+rAHoD4wOdWvqAPj1FTI31JUVcLCxT41GJwaneHN8x6Z12pdYMrVaYNsQxl7LEKx8i07Q9rg9w9QJpo8yOnwakycTqjdr3jV1BpjomLzY+dWrT2LdEIA6NYbIi/oGgJ58T+CQ0It/aBLax2aqjMkxmakz4ENgQ2C9SNVJYLBx9AGmypv0jQHOCVYIs7/lgd8noX18vu/5LUaGYa+ZOgOc9Bqu/FHAdGkejsY9IOGUaJxVTJh7BYC0NARuAHyUSOY1i5/lxtG6tLeXJqBjsgZw6vNooui5wOUtKe9jeukErd4uAK4PE6PTJwyAZ4wu6ZsTNDlxHO3EyILor5KAbZvA1nEE1ysfYMr5Xhh6GqpMWx2GlpdO0NMhOsG6MnmYYr5jswxzmnoUUCYLFZsgskBF0+HpMLkHDUENqZ4DvCemwQ5X7+srALLAc4E7xvH5EZmlq/oMGoIaXj2P6LlCzy17X2/LYRUxE3TsvRC4Mebufw/4YirjRFmbrssNLJbsM1gQ5axOTKAQbI/wv0qeADwTJHVPDl2dHxOpbYJ63NXMsW7ZEtu34TmBTgFQIUFQeZngsfZzQv5+J/BH1NYS+Jo6zWOZrN2nx3LrtnYOQGEOt8XTJP5uJ9g2ucfbbG0JwrClzR/fgPblZ/UCAAXSMeoML8uo4AoFDHX2FnK8/SAAewNAWUCdXTEas79XnDCzGfplaTTmOaNx16BIMfIpsVmdDpeB1I/sXoVszhGZWQUgS+55AIYYXE7WNa69TnL/2AzQbszTZ3ENtPlUmSyUZhGBXJnnPAD/Ao0hilAwS0cdAAAAAElFTkSuQmCC";
    }
  });
}

// Creates and appends skeleton loader elements to indicate loading state
function createSkeletonLoader() {
  const skeletonLoader = document.createElement("div");
  skeletonLoader.className = "skeleton-loader";
  document.querySelector(".course-content").innerHTML = "";
  document.querySelector(".course-content").appendChild(skeletonLoader);

  for (let i = 0; i < 20; i++) {
    const skeletonItem = document.createElement("div");
    skeletonItem.className = "skeleton-item";
    skeletonLoader.appendChild(skeletonItem);
  }
}

// Creates a loading screen element with specified styles and content
function createLoadingScreenElement() {
  const loadingScreen = document.createElement("div");
  loadingScreen.id = "loadingScreen";
  loadingScreen.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(255, 255, 255, 1); color: white; text-align: center;
    align-items: center; justify-content: center; z-index: 10000; display: flex;
    opacity: 1; transition: opacity 0.25s ease;
  `;
  loadingScreen.innerHTML = `<div><img src='${chrome.runtime.getURL(
    "assets/loader.gif"
  )}' alt='Loading...'><p style='color:#3210ce;'>Loading...</p></div>`;
  return loadingScreen;
}

// Displays the skeleton loader and scrolls to the top of the page
function showSkeletonLoader(actionFunction) {
  createSkeletonLoader();
  document.querySelector(".scrolling-menu")
    ? (document.querySelector(".scrolling-menu").style.opacity = 0)
    : null;

  setTimeout(actionFunction, 150);
}

// Shows the loading screen with a fade-in effect and executes the action function after transition
function showDelayedLoadingScreen(loadingScreen, actionFunction) {
  loadingScreen.style.opacity = "0";
  document.body.appendChild(loadingScreen);
  setTimeout(() => {
    loadingScreen.style.opacity = "1";
  }, 50);
  loadingScreen.addEventListener("transitionend", actionFunction);
}

// Main function to show either the skeleton loader or loading screen, depending on the presence of course content
function showLoadingScreen(
  withDelay = false,
  actionFunction = null,
  noSkeleton = false
) {
  chrome.storage.sync.set({
    loadingScreen: true,
  });
  if (document.querySelector(".course-content") && !noSkeleton) {
    showSkeletonLoader(actionFunction);
    return;
  }

  const loadingScreen = createLoadingScreenElement();

  if (withDelay) {
    showDelayedLoadingScreen(loadingScreen, actionFunction);
  } else {
    document.body.appendChild(loadingScreen);
  }
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

// Hides the loading screen after a specified delay
function hideLoadingScreen(delay) {
  setTimeout(() => {
    const loadingScreen = document.getElementById("loadingScreen");
    chrome.storage.sync.get("loadingScreen", (result) => {
      if (result.loadingScreen || loadingScreen) {
        loadingScreen.style.opacity = "0";
        loadingScreen.addEventListener("transitionend", () =>
          loadingScreen.remove()
        );
        chrome.storage.sync.set({
          loadingScreen: false,
        });
      }
    });
  }, delay);
}

// Extracts unique course links from the DOM and returns a dictionary of course names and URLs
function extractUniqueCourseLinks() {
  const courseLinks = document.querySelectorAll(
    "li.type_course > .tree_item > a"
  );
  const uniqueUrls = new Set();
  const coursesDict = {};

  courseLinks.forEach((link) => {
    if (
      link.href.includes("/course/view.php") &&
      /^[0-9]/.test(link.innerHTML)
    ) {
      console.log(link.innerHTML);
      console.log(link);
      const url = link.href.split("#")[0];
      uniqueUrls.add(url);
      coursesDict[link.innerHTML] = url;
    }
  });

  return coursesDict;
}

// Main function to create the scrolling menu
function createScrollingMenu() {
  removeScrollEventListener();
  window.addEventListener("scroll", scrollListener);

  const courses = extractUniqueCourseLinks();
  if (!Object.keys(courses).length) return;

  const menuContainer = getMenuContainer();
  const scrollingMenu = createScrollingMenuElement();

  const visibleCourseList = document.createElement("ul");
  const hiddenCourseList = document.createElement("ul");
  hiddenCourseList.style.display = "none";

  const visibleHeader = createMenuHeader("My Courses", "הקורסים שלי");
  const hiddenHeader = createMenuHeader("Hidden Courses", "קורסים מוסתרים");
  const showHiddenButton = createShowHiddenButton(hiddenCourseList);

  const hiddenHeaderContainer = createHiddenHeaderContainer(
    hiddenHeader,
    showHiddenButton
  );

  appendCourseItems(courses, visibleCourseList, hiddenCourseList);

  scrollingMenu.appendChild(visibleHeader);
  scrollingMenu.appendChild(visibleCourseList);
  scrollingMenu.appendChild(hiddenHeaderContainer);
  scrollingMenu.appendChild(hiddenCourseList);
  menuContainer.innerHTML = "";
  menuContainer.appendChild(scrollingMenu);
  adjustScrollingMenuPosition(menuContainer);

  return scrollingMenu;
}

// Extracts the appropriate container for the scrolling menu based on the URL
function getMenuContainer() {
  return window.location.href === "https://moodle4.cs.huji.ac.il/hu23/" ||
    window.location.href.includes("https://moodle4.cs.huji.ac.il/hu23/?lang=")
    ? document.querySelector(".columnleft")
    : document.getElementById("frame-column");
}

// Creates the scrolling menu element
function createScrollingMenuElement() {
  const scrollingMenu = document.createElement("div");
  scrollingMenu.className = "scrolling-menu";
  return scrollingMenu;
}

// Creates a header for the menu with text based on the current language
function createMenuHeader(enText, heText) {
  const header = document.createElement("h3");
  header.style.marginTop = "15px";
  header.textContent =
    document.querySelector("html").getAttribute("lang") === "he"
      ? heText
      : enText;
  return header;
}

// Creates the show/hide button for the hidden courses list
function createShowHiddenButton(hiddenCourseList) {
  const button = document.createElement("img");
  button.className = "show-hidden-button";
  button.src = chrome.runtime.getURL("assets/eye_on.png");
  button.style.cssText =
    "width: 20px; height: 20px; cursor: pointer; margin: 10px;";
  button.onclick = () => {
    const isHidden = hiddenCourseList.style.display === "none";
    hiddenCourseList.style.display = isHidden ? "flex" : "none";
    button.src = chrome.runtime.getURL(
      isHidden ? "assets/eye_off.png" : "assets/eye_on.png"
    );
  };
  return button;
}

// Creates the container for the hidden header and show/hide button
function createHiddenHeaderContainer(hiddenHeader, showHiddenButton) {
  const hiddenHeaderContainer = document.createElement("div");
  hiddenHeaderContainer.style.display = "flex";
  hiddenHeaderContainer.style.justifyContent = "space-between";
  hiddenHeaderContainer.style.direction = "ltr";
  hiddenHeaderContainer.appendChild(hiddenHeader);
  hiddenHeaderContainer.appendChild(showHiddenButton);
  return hiddenHeaderContainer;
}

// Appends course items to the appropriate lists and configures visibility toggles
function appendCourseItems(courses, visibleCourseList, hiddenCourseList) {
  for (const courseName in courses) {
    const listItem = createCourseListItem(
      courseName,
      courses[courseName],
      visibleCourseList,
      hiddenCourseList
    );
    const storedVisibility = localStorage.getItem(courseName);

    // add hidden class to course content if course is hidden
    if (storedVisibility === "hidden") {
      listItem.classList.add("hidden");
      hiddenCourseList.appendChild(listItem);
    } else {
      visibleCourseList.appendChild(listItem);
    }
  }
}

// Creates a list item for a course with a link and visibility toggle
function createCourseListItem(
  courseName,
  courseUrl,
  visibleCourseList,
  hiddenCourseList
) {
  const listItem = document.createElement("li");
  const listContainer = document.createElement("div");
  listContainer.className = "list-container";

  const link = document.createElement("a");
  link.href = courseUrl;
  link.textContent = courseName;
  listContainer.appendChild(link);
  listItem.appendChild(listContainer);

  if (window.location.href.includes(courseUrl)) {
    link.classList.add("active");
    const subMenuList = createSubMenu(courseUrl);
    listItem.appendChild(subMenuList);
  }

  createEyeIcon(listItem, courseName, visibleCourseList, hiddenCourseList);
  return listItem;
}

// Adjusts the position of the scrolling menu based on the container's position
function adjustScrollingMenuPosition(menuContainer) {
  const blurDiv = document.createElement("div");
  blurDiv.className = "blur";
  menuContainer.querySelector(".scrolling-menu").appendChild(blurDiv);
}

// Creates a submenu for course-specific actions and content
function createSubMenu(courseUrl) {
  const subMenuList = document.createElement("div");
  subMenuList.className = "sub-menu";
  subMenuList.style.display = "block";

  const gradesContainer = document.createElement("div");
  gradesContainer.className = "grades-container";

  const gradesLink = createGradesLink(courseUrl);
  const gradesImage = createGradesImage();

  gradesContainer.appendChild(gradesImage);
  gradesContainer.appendChild(gradesLink);
  subMenuList.appendChild(gradesContainer);

  document.querySelectorAll(".course-content h3").forEach((h3) => {
    if (!h3.textContent.trim()) return;
    const subMenuItem = document.createElement("span");
    subMenuItem.textContent = h3.textContent;
    subMenuItem.style.cursor = "pointer";
    subMenuItem.onclick = () =>
      h3.scrollIntoView({
        behavior: "smooth",
      });
    subMenuList.appendChild(subMenuItem);
  });

  return subMenuList;
}

// Creates a link for the grades page
function createGradesLink(courseUrl) {
  const gradesLink = document.createElement("a");
  const courseId = courseUrl.split("id=")[1];
  gradesLink.href = `https://moodle4.cs.huji.ac.il/hu23/grade/report/user/index.php?id=${courseId}`;
  gradesLink.textContent =
    document.querySelector("html").getAttribute("lang") === "he"
      ? "ציונים"
      : "Grades";
  return gradesLink;
}

// Creates an image for the grades link
function createGradesImage() {
  const gradesImage = document.createElement("img");
  gradesImage.src =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAABYJJREFUeF7tmlWotUUUhp/f7m5UVGzsLkxExcAujAvRGxUsEATFuBATBb0RL0zU38BCEGyxu7u7u3MeWRu322+f/RXfGTh7wYHDt2dmzbyzZq13rZlpTHGZNsXXzxiAsQVMcQTGR2CKG8DYCdY5AjsDFwJLdWg9fwHPAgcCz7WptyoAMwKfA/O1OYkKY90DbFWh/cimVQFYDPgoRp0T+LFAgyDNM1Lz/xvMAcw6pN8iwEOhe4kaYw/tUhWAxYEPYzQn/FObkxkYawZgW2AfYH1gNeAP4FHgYeAy4Omm+psAMDvgbh8FzF1hIncA/k0kGwIXAWuMaHcLcDjwXgX9/2naBIDZAB3itRWVvwysMkGf/YFLgJmT03sDuAC4HXg7vq0I7BILXwD4FNghfXuy4jz+ad4EAM+rZnoIMFcF5ffFeS7qsh1wW4x7ZjL5E4Ffh4w9P3BpbMKXwDrAOxXm0QoAwyZXdR62nxd4LYXYhYGT0vE6bcQgawPPJ2u6BtgNENgtqipuYgGzAL9VVThBe3f71BTm7o1QZ+zvlx2BT4DHgeXDUk4A7kyO8iVg0eQct4/jUnpaTQDwjP5eWtPohq8CK6Sd3Drt5N0DzWcC3gdejN+vDj/werKCPeP/s1L/K4EDRqv6t0UTAJyUYakNWTrOryRLrjE4rs72ZkCrWC4c4hUpDB8PfBDfdJgfA4bq0tIEAEPgn6U1TdxwM+D+cI6bFDSdHgtbOZGscxNhOn2gjeuQlBmZKvGTXADYJriBpu8R6Bdpt+xTGiwL9OitWgDSV0HRjQ5fl92YJgAYAmVnt1YkQtcnsz10YIKrR7KjH1hp4DfbmnxJdtS5TDBDnWFPpN7fBDPVAkpLEwDsq7m6M+5KWZHU6K37xf6fRSj0jL/V96PhzXO+X3zT4zuGDLQne6TNuC7mUilZqguAzsjdUCZKYopA0TwHQ5ztrgL2TdZ0DnBcX8e7ghA9EN8OC4p8RF8bN0EOcHQ6BueV3Qnb1QVA56cTbFPWBJ4K5rd5JD1lxpeJXhwWpPV8X6ZTr01OADgnd/+YCGc7JZr7xIjF7AVcHmn03jXyktoWYJyWB7Qt+oIbEttz8abaZwPnA18MKHKnZY4HhxWfkn4/uc5k6lqADNDJmo05kUqed8hE9Q0uwrFldUeGnxHsx8IxmoBJg3tpsuZ+bKTOddZf2wLMAcwFdgcMa23JpsCDMZhFEI/DrkFw+nWY/Wn6kqJ3myivawFmge6Gx8AQZCbXVAyDNxZECIHeMkKfC5c1vtIWC20KQNNFl+2/ZBAhGWEWNcFfCsyy7GLqtLMEr6lnA8DPgDXBrqSXLWYDgCFKz+8RMpExAWkqFjukvUUi/5ceZwOAqaf3AhYnb2q68r7+G6UC5yMF4y0LvJkjAJahLF62cRy+DS7/XQEAEh8LHtlYwA8VK8FNjUTyY8E0GwBkYFUuQ5oCYK3QWkE2AGimde7/6gLhZYjkJxsAPK9tsL+ygFgLtBCSHQDrRgm7jeNgxrdBePtBYLxKsySeDQDW3yxWrhcAVLkaG7br8nwTIMPdoFgEfSEnAExd2yA/ZY+AxVdfhmRjAZagrQV0Jb2qcTYAaK4LdrX6KIA8k5MFdA3AWlEwzcYC9NgLxY3sGS2VxHSsVoCKqLBX4T6AyAYALzG9x+8qGfLxgxXibACwfOXLLdNhHzK1QYp86uLbgCIx3FoYzQYAJ2sm2JXID3wdNmUBkCFaJ8gGAKs3PmToSiyUZPVQsvJLjIZIbRz3BZNuAb2nsjpBd2WYWDKzclxVZJhF4jW8t8OTDsCUfyzt7nhx6YsNS9Vdie8JpMIHTfZz+a4W3JmeqldjnU2sK0VjALpCOlc9YwvIdWe6mtfYArpCOlc9fwNKizJQMIdpiAAAAABJRU5ErkJggg==";
  gradesImage.style.width = "20px";
  return gradesImage;
}

// Creates an eye icon for toggling visibility of course items
function createEyeIcon(
  courseItem,
  courseName,
  visibleCourseList,
  hiddenCourseList
) {
  const eyeIcon = document.createElement("img");
  eyeIcon.className = "eye-icon";
  eyeIcon.src = chrome.runtime.getURL(
    localStorage.getItem(courseName) === "hidden"
      ? "assets/eye_on.png"
      : "assets/eye_off.png"
  );

  eyeIcon.onclick = function () {
    const currentlyHidden =
      eyeIcon.src === chrome.runtime.getURL("assets/eye_on.png");
    if (currentlyHidden) {
      visibleCourseList.appendChild(courseItem);
      courseItem.classList.remove("hidden");
      eyeIcon.src = chrome.runtime.getURL("assets/eye_off.png");
      localStorage.setItem(courseName, "visible");
    } else {
      hiddenCourseList.appendChild(courseItem);
      eyeIcon.src = chrome.runtime.getURL("assets/eye_on.png");
      courseItem.classList.add("hidden");
      localStorage.setItem(courseName, "hidden");
    }
  };

  courseItem.firstChild.appendChild(eyeIcon);
}

// Handles scroll events to update the position of the scrolling menu
function scrollListener() {
  const scrollingMenu = document.querySelector(".scrolling-menu");
  const pageNavbar = document.querySelector("#page-navbar");

  if (!scrollingMenu || !pageNavbar) return;

  const scrollingMenuHeight = scrollingMenu.getBoundingClientRect().height;
  const navbarRect = pageNavbar.getBoundingClientRect();
  const navbarVisible =
    navbarRect.top >= 0 && navbarRect.bottom <= window.innerHeight;

  if (navbarVisible) {
    scrollingMenu.style.top = `${navbarRect.bottom + 30}px`;
    document.querySelector(".blur").style.top = `${
      navbarRect.bottom + scrollingMenuHeight - 10
    }px`;
  } else {
    scrollingMenu.style.top = "70px";
    document.querySelector(".blur").style.top = `${scrollingMenuHeight + 40}px`;

    setTimeout(
      () => (document.querySelector(".blur").style.display = "block"),
      250
    );
  }

  setTimeout(() => {
    document.querySelector(".scrolling-menu").style.opacity = 1;
  }, 150);
}

// Removes the scroll event listener from the document
function removeScrollEventListener() {
  document.removeEventListener("scroll", scrollListener);
}

// Updates the position of the scrolling menu based on the current scroll position
// function updateScrollingMenuPosition(scrollingMenu) {
//   if (!scrollingMenu) return;

//   scrollingMenu.style.top = "70px";
//   setTimeout(() => {
//     document.querySelector(".scrolling-menu").style.opacity = 1;
//   }, 150);
// }

function toggleSection(section) {
  const grandParent = section.parentElement.parentElement;
  const parentElement = section.parentElement;
  const sectionNum = section.dataset.number;
  const sectionContent = document.querySelector(
    `#toggledsection-${sectionNum}`
  );
  if (grandParent.classList.contains("toggle_open")) {
    section.setAttribute("aria-expanded", "false");
    grandParent.classList.remove("toggle_open");
    grandParent.classList.add("toggle_closed");
    parentElement.classList.remove("toggle_open");
    parentElement.classList.add("toggle_closed");
    // set aria-expanded to false
    parentElement.setAttribute("aria-expanded", "false");
    sectionContent.classList.remove("sectionopen");
  } else if (
    grandParent.classList.contains("toggle_closed") ||
    !grandParent.classList.contains("toggle_open")
  ) {
    section.setAttribute("aria-expanded", "true");
    grandParent.classList.remove("toggle_closed");
    grandParent.classList.add("toggle_open");
    parentElement.classList.remove("toggle_closed");
    parentElement.classList.add("toggle_open");
    // set aria-expanded to true
    parentElement.setAttribute("aria-expanded", "true");
    sectionContent.classList.add("sectionopen");
  }
}

function fetchPanoptoContent() {
  try {
    const sesskey = document
      .querySelectorAll(".logininfo a")[1]
      .href.split("sesskey=")[1];
    const courseid = document
      .querySelector("#block_panopto_content")
      .getAttribute("courseid");
    //sesskey=Gv822kcEBQ&courseid=67594
    fetch(
      "https://moodle4.cs.huji.ac.il/hu23/blocks/panopto/panopto_content.php",
      {
        headers: {
          accept: "*/*",
          "accept-language": "en-US,en;q=0.9,he-IL;q=0.8,he;q=0.7",
          "cache-control": "no-cache",
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          pragma: "no-cache",
          priority: "u=1, i",
          "sec-ch-ua":
            '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "x-requested-with": "XMLHttpRequest",
        },
        referrer: window.location.href,
        referrerPolicy: "strict-origin-when-cross-origin",
        body: "sesskey=" + sesskey + "&courseid=" + parseInt(courseid),
        method: "POST",
        mode: "cors",
        credentials: "include",
      }
    ).then((response) => {
      response.text().then((text) => {
        document.querySelector("#block_panopto_content").innerHTML = text;
        document
          .getElementById("showAllToggle")
          .addEventListener("click", () => {
            var showAllToggle = document.getElementById("showAllToggle");
            var hiddenLecturesDiv =
              document.getElementById("hiddenLecturesDiv");
            if (hiddenLecturesDiv.style.display == "block") {
              hiddenLecturesDiv.style.display = "none";
              showAllToggle.innerHTML = "Show all";
            } else {
              hiddenLecturesDiv.style.display = "block";
              showAllToggle.innerHTML = "Show less";
            }
          });
      });
    });
  } catch (e) {
    console.log(e);
  }
}
