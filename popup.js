// check if jwt token is present in local storage
function getJwtToken(callback) {
  chrome.storage.local.get(["jwtToken"], (result) => {
    callback(result.jwtToken);
  });
}

getJwtToken((token) => {
  if (token) {
    document.querySelector("p").textContent =
      "את/ה מחובר/ת למשתמש ה-HUJInsight שלך! ניתן לשתף ציונים מהמידע האישי.";
    document.querySelector("p").style.color = "green";
  } else {
    document.querySelector("p").textContent =
      "אינך מחובר/ת למשתמש ה-HUJInsight שלך. יש להתחבר על מנת לשתף ציונים.";
    document.querySelector("p").style.color = "red";
  }
});
