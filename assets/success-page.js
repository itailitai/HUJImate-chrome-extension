// Create sparkles
function createSparkles() {
  const sparklesContainer = document.getElementById("sparkles");
  const numberOfSparkles = 20;

  for (let i = 0; i < numberOfSparkles; i++) {
    const sparkle = document.createElement("div");
    sparkle.className = "sparkle";
    sparkle.style.left = Math.random() * 100 + "%";
    sparkle.style.top = Math.random() * 100 + "%";
    sparkle.style.animation = `sparkle ${1 + Math.random()}s ease-in-out ${
      Math.random() * 2
    }s infinite`;
    sparklesContainer.appendChild(sparkle);
  }
}

// Initialize animations
window.onload = () => {
  createSparkles();
};
