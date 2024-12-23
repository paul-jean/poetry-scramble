let originalOrder = [];
let shuffledOrder = [];
let allLines = [];
let orderedLines = [];
let currentIndex = 0;
const linesPerRound = 3;
let touchStartIndex = null;

async function loadRandomPoem() {
  try {
    const randomId = Math.floor(Math.random() * 67) + 1;
    const response = await fetch(`/poem/${randomId}`);
    if (!response.ok) {
      throw new Error("Failed to load poem");
    }
    const poem = await response.json();
    allLines = poem.lines;
    orderedLines = [];
    currentIndex = 0;
    displayNextLines();
    updateProgressBar();
  } catch (error) {
    document.getElementById("poemDisplay").textContent =
      "Error loading poem: " + error.message;
  }
}

function displayNextLines() {
  const poemDisplay = document.getElementById("poemDisplay");
  const orderedLinesDisplay = document.getElementById("orderedLines");

  if (currentIndex >= allLines.length) {
    poemDisplay.innerHTML =
      "<h2>Congratulations! You've completed the poem!</h2>";
    updateProgressBar();
    return;
  }

  originalOrder = allLines.slice(currentIndex, currentIndex + linesPerRound);
  shuffledOrder = [...originalOrder];

  for (let i = shuffledOrder.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = shuffledOrder[i];
    shuffledOrder[i] = shuffledOrder[j];
    shuffledOrder[j] = temp;
  }

  poemDisplay.innerHTML = `<h2>Reorder these lines:</h2>`;
  shuffledOrder.forEach((line, index) => {
    const lineBox = document.createElement("div");
    lineBox.classList.add("line-box");
    lineBox.draggable = true;
    lineBox.textContent = line;
    lineBox.dataset.index = index;
    addDragAndDropListeners(lineBox);
    poemDisplay.appendChild(lineBox);
  });

  orderedLinesDisplay.innerHTML = orderedLines
    .map((chunk) => `<div class="chunk">${chunk.join("<br>")}</div>`)
    .join("");
  updateProgressBar();
}

function skipToNextVerse() {
  if (originalOrder.length > 0) {
    orderedLines.push(originalOrder);
  }
  currentIndex += linesPerRound;
  displayNextLines();
}

function addDragAndDropListeners(element) {
  // For desktop drag-and-drop
  element.addEventListener("dragstart", (e) => {
    e.target.classList.add("dragging");
    e.dataTransfer.setData("text/plain", e.target.dataset.index);
    e.dataTransfer.effectAllowed = "move";
  });

  element.addEventListener("dragend", (e) => {
    e.target.classList.remove("dragging");
    document
      .querySelectorAll(".line-box.over")
      .forEach((el) => el.classList.remove("over"));
  });

  element.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const dragging = document.querySelector(".dragging");
    if (
      dragging &&
      e.target.classList.contains("line-box") &&
      e.target !== dragging
    ) {
      e.target.classList.add("over");
    }
  });

  element.addEventListener("dragleave", (e) => {
    e.target.classList.remove("over");
  });

  element.addEventListener("drop", (e) => {
    e.preventDefault();
    const dragging = document.querySelector(".dragging");
    if (!dragging) return;

    const draggingIndex = parseInt(dragging.dataset.index);
    const targetIndex = parseInt(e.target.dataset.index);

    if (
      !isNaN(draggingIndex) &&
      !isNaN(targetIndex) &&
      draggingIndex !== targetIndex
    ) {
      const draggedLine = shuffledOrder.splice(draggingIndex, 1)[0];
      shuffledOrder.splice(targetIndex, 0, draggedLine);
    }

    updateDisplay();
    checkCorrectOrder();
  });

  // For mobile touch events
  element.addEventListener("touchstart", (e) => {
    touchStartIndex = parseInt(e.target.dataset.index);
    e.target.classList.add("dragging");
  });

  element.addEventListener("touchend", (e) => {
    const overElement = document.elementFromPoint(
      e.changedTouches[0].clientX,
      e.changedTouches[0].clientY
    );

    if (overElement && overElement.classList.contains("line-box")) {
      const targetIndex = parseInt(overElement.dataset.index);

      if (
        !isNaN(touchStartIndex) &&
        !isNaN(targetIndex) &&
        touchStartIndex !== targetIndex
      ) {
        const draggedLine = shuffledOrder.splice(touchStartIndex, 1)[0];
        shuffledOrder.splice(targetIndex, 0, draggedLine);
      }
    }

    document
      .querySelectorAll(".line-box")
      .forEach((el) => el.classList.remove("dragging"));
    updateDisplay();
    checkCorrectOrder();
  });
}

function updateDisplay() {
  const poemDisplay = document.getElementById("poemDisplay");
  const lineBoxes = Array.from(poemDisplay.querySelectorAll(".line-box"));
  lineBoxes.forEach((box, index) => {
    box.textContent = shuffledOrder[index];
    box.dataset.index = index;
  });
}

function checkCorrectOrder() {
  const poemDisplay = document.getElementById("poemDisplay");
  if (JSON.stringify(originalOrder) === JSON.stringify(shuffledOrder)) {
    poemDisplay.classList.add("correct");
    orderedLines.push(originalOrder);
    currentIndex += linesPerRound;
    setTimeout(() => {
      poemDisplay.classList.remove("correct");
      displayNextLines();
    }, 1000);
  } else {
    poemDisplay.classList.remove("correct");
  }
}

function updateProgressBar() {
  const progressBar = document.getElementById("progressBar");
  const completed = orderedLines.length;
  const total = Math.ceil(allLines.length / linesPerRound);
  progressBar.textContent = `Chunks Ordered: ${completed}/${total}`;
}

window.onload = loadRandomPoem;