const sticksEl = document.getElementById("sticks");
const stickTemplate = document.getElementById("stick");
const controlsEl = document.getElementById("controls");

function resetSticks() {
  sticksEl.innerHTML = "";
  controlsEl.style.display = "none";

  for (let i = 0; i < 5; i++) {
    const newStickEl = stickTemplate.content.cloneNode(true);
    newStickEl.querySelector("img").style.animationDelay = `${i * 0.25}s`;
    sticksEl.appendChild(newStickEl);
  }
}

resetSticks();

function onClickStick(e) {
  const audio = new Audio("./sound/crunch.mp3");
  audio.play();

  e.target.remove();

  const remainingSticks = sticksEl.querySelectorAll(".stick");
  if (remainingSticks.length === 0) {
    controlsEl.style.display = "block";
  }
}
