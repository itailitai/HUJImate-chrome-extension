// Previous JavaScript remains the same
const statusMessages = [
  "עובר על שנות הלימוד",
  "שואב נתוני קורסים",
  "מנתח גרפי התפלגות",
  "אוסף את כלל הנתונים",
  "שולח נתונים ל-StudentInsight",
];

function getRandomFloat(min, max, decimals = 1) {
  const rand = Math.random() * (max - min) + min;
  return Number(rand.toFixed(decimals));
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function updateBars() {
  const bars = document.querySelectorAll(".bar");
  let total = 0;
  const values = [];

  bars.forEach(() => {
    const value = getRandomFloat(1, 100);
    values.push(value);
    total += value;
  });

  bars.forEach((bar, index) => {
    const normalizedValue = ((values[index] / total) * 100).toFixed(1);
    bar.style.height = values[index] + "%";
    bar.setAttribute("data-value", normalizedValue + "%");
    bar.style.transitionDelay = `${Math.random() * 0.2}s`;
  });
}

function updateStats() {
  const score = getRandomInt(65, 95);
  const average = getRandomFloat(60, 96, 2);
  const stddev = getRandomFloat(1, 17, 2);
  const total = getRandomInt(30, 550);
  const rank = getRandomInt(1, total);

  document.getElementById("score").textContent = score;
  document.getElementById("average").textContent = average;
  document.getElementById("stddev").textContent = stddev;
  document.getElementById("rank").textContent = `${rank}/${total}`;
}

function updateStatusMessage() {
  const statusText = document.getElementById("status-text");
  const randomMessage =
    statusMessages[Math.floor(Math.random() * statusMessages.length)];
  statusText.textContent = randomMessage;
}

// Initialize animations after the overlay fades out
setTimeout(() => {
  setInterval(updateBars, 2000);
  setInterval(updateStats, 1500);
  setInterval(updateStatusMessage, 3000);
}, 1500);
window.addEventListener("message", (event) => {
  console.log(event.data);
  if (event.data.type === "SET_TEXT") {
    document.getElementById("year-progress").innerHTML = event.data.text;
  }
});
