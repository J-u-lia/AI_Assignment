// GAME SETUP
// gets the html canvas elemtn where the snake game is drawn
const canvas = document.getElementById("gameCanvas");
// gets the 2D drawing context from the canvas so it is possible to draw shapes and colors
const ctx = canvas.getContext("2d");
const gridSize = 20;
const tileCount = canvas.width / gridSize;

// ===== COLOR PALETTE =====
// Array of the different colors for the snake
const colorPalette = ["#2ecc71", "#3498db", "#e74c3c", "#9b59b6", "#f39c12", "#1abc9c"];
// The color should be randomly selected out of the array
let snakeColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];

// ===== DIFFICULTY CONFIGURATION =====
const DIFFICULTY_CONFIG = {
  easy: { baseSpeed: 160, speedMultiplier: 5, showGrid: true },
  medium: { baseSpeed: 140, speedMultiplier: 10, showGrid: false },
  hard: { baseSpeed: 120, speedMultiplier: 20, showGrid: false },
  ultra: { baseSpeed: 90, speedMultiplier: 15, showGrid: false, ultraMode: true }
};

// ===== DOM REFERENCES =====
const homeScreen = document.getElementById("homeScreen");
const levelSelectScreen = document.getElementById("levelSelectScreen");
const difficultySelectScreen = document.getElementById("difficultySelectScreen");
const gameScreen = document.getElementById("gameScreen");

const goToLevelModeBtn = document.getElementById("goToLevelModeBtn");
const goToDifficultyModeBtn = document.getElementById("goToDifficultyModeBtn");
const backToHomeFromLevel = document.getElementById("backToHomeFromLevel");
const backToHomeFromDiff = document.getElementById("backToHomeFromDiff");
const startDiffGameBtn = document.getElementById("startDiffGameBtn");

const levelGameHeader = document.getElementById("levelGameHeader");
const currentScoreDisplay = document.getElementById("currentScore");
const highScoreDisplay = document.getElementById("highScoreDisplay");
const finalScoreDisplay = document.getElementById("finalScoreDisplay");

const pauseOverlay = document.getElementById("pauseOverlay");
const gameOverOverlay = document.getElementById("gameOverOverlay");

const startBtn = document.getElementById("startBtn");
const backBtn = document.getElementById("backBtn");
const backToModeBtn = document.getElementById("backToModeBtn");
const restartBtn = document.getElementById("restartBtn");
const saveModeBtn = document.getElementById("saveModeBtn");

// ===== INITIAL STATE & GAME VARIABLES =====
let snake = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 }
];
let direction = { x: 1, y: 0 };
let food = { x: 15, y: 15 };
let score = 0;

let highScore = localStorage.getItem("snakeHighScore") || 0;
let activeMode = "difficulty";
let currentLevel = 1;
let targetScore = 10;

let baseSpeed = 150;
let currentSpeed = 150;
let speedIncrementFactor = 0;
let showGrid = true;
let isUltraMode = false;

let foodVisible = true;
let foodTimeout = null;

let gameInterval = null;
let isPaused = true;
let isGameOver = false;
let isChangingDirection = false;

// ===== INITIALIZATION & EVENTS =====
document.addEventListener("DOMContentLoaded", () => {
  highScoreDisplay.textContent = highScore;

  // Screen Switching
  goToLevelModeBtn.addEventListener("click", () => showScreen(levelSelectScreen));
  goToDifficultyModeBtn.addEventListener("click", () => showScreen(difficultySelectScreen));
  backToHomeFromLevel.addEventListener("click", () => showScreen(homeScreen));
  backToHomeFromDiff.addEventListener("click", () => showScreen(homeScreen));
  backBtn.addEventListener("click", () => showScreen(homeScreen));

  // Mode Selection Navigation
  backToModeBtn.addEventListener("click", () => {
    if (activeMode === "level") {
      showScreen(levelSelectScreen);
    } else {
      showScreen(difficultySelectScreen);
    }
  });

  // Level Buttons Setup
  document.querySelectorAll(".btn-level").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      currentLevel = parseInt(e.target.getAttribute("data-level"), 10);
      activeMode = "level";
      targetScore = currentLevel * 10;

      baseSpeed = Math.max(140 - currentLevel * 8, 50);
      speedIncrementFactor = 2;
      showGrid = true;
      isUltraMode = false;

      saveModeBtn.style.display = "inline-block";
      backToModeBtn.textContent = "← Select Level";

      levelGameHeader.textContent = `Level ${currentLevel} (Target: ${targetScore} pts)`;
      showScreen(gameScreen);
      prepareGame();
    });
  });

  // Difficulty Start Button Setup
  startDiffGameBtn.addEventListener("click", () => {
    activeMode = "difficulty";
    const selectedDifficulty = document.querySelector('input[name="gameDifficulty"]:checked').value;

    const config = DIFFICULTY_CONFIG[selectedDifficulty];
    baseSpeed = config.baseSpeed;
    speedIncrementFactor = config.speedMultiplier;
    showGrid = config.showGrid;
    isUltraMode = config.ultraMode || false;

    saveModeBtn.style.display = "none";
    backToModeBtn.textContent = "← Select Difficulty";

    levelGameHeader.textContent = `Difficulty: ${selectedDifficulty.toUpperCase()}`;
    showScreen(gameScreen);
    prepareGame();
  });

  // Action Buttons
  startBtn.addEventListener("click", togglePause);
  restartBtn.addEventListener("click", () => {
    prepareGame();
    togglePause();
  });

  saveModeBtn.addEventListener("click", () => {
    localStorage.setItem("savedSnakeLevel", currentLevel);
    alert(`Progress saved! Level ${currentLevel} recorded.`);
  });
});

// ===== SCREEN SWITCHER =====
function showScreen(screenToShow) {
  stopGame();
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  screenToShow.classList.add("active");
}

// ===== PREPARE & LOOP =====
function prepareGame() {
  stopGame();

  // Pick a random snake color every time a new game is prepared
  snakeColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];

  snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 }
  ];
  direction = { x: 1, y: 0 };
  score = 0;
  currentSpeed = baseSpeed;

  isPaused = true;
  isGameOver = false;
  isChangingDirection = false;

  currentScoreDisplay.textContent = score;
  pauseOverlay.classList.remove("hidden");
  gameOverOverlay.classList.add("hidden");

  spawnFood();
  drawGame();
}

function stopGame() {
  if (gameInterval) clearInterval(gameInterval);
  if (foodTimeout) clearTimeout(foodTimeout);
  gameInterval = null;
  foodTimeout = null;
}

function gameLoop() {
  if (isGameOver || isPaused) return;
  moveSnake();
  drawGame();
}

function moveSnake() {
  const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

  // Collision checks
  if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
    triggerGameOver();
    return;
  }

  for (let segment of snake) {
    if (head.x === segment.x && head.y === segment.y) {
      triggerGameOver();
      return;
    }
  }

  snake.unshift(head);

  // Food eating logic
  if (head.x === food.x && head.y === food.y) {
    score += 1;
    currentScoreDisplay.textContent = score;

    if (score > highScore) {
      highScore = score;
      highScoreDisplay.textContent = highScore;
      localStorage.setItem("snakeHighScore", highScore);
    }

    if (activeMode === "level" && score >= targetScore) {
      stopGame();
      alert(`🎉 Level ${currentLevel} Completed!`);
      showScreen(levelSelectScreen);
      return;
    }

    currentSpeed = Math.max(30, baseSpeed - score * speedIncrementFactor);
    if (!isPaused && !isGameOver) {
      if (gameInterval) clearInterval(gameInterval);
      gameInterval = setInterval(gameLoop, currentSpeed);
    }

    spawnFood();
  } else {
    snake.pop();
  }

  isChangingDirection = false;
}

// ===== DRAWING =====
const drawGame = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Optional background grid
  if (showGrid) {
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1;
    for (let i = 0; i <= tileCount; i++) {
      const pos = i * gridSize;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, canvas.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(canvas.width, pos);
      ctx.stroke();
    }
  }

  // Draw Food (Red fill)
  if (foodVisible) {
    ctx.fillStyle = "red";
    ctx.fillRect(
      food.x * gridSize,
      food.y * gridSize,
      gridSize,
      gridSize
    );
  }

  // Draw Snake (Random color selection)
  ctx.fillStyle = snakeColor;
  for (const segment of snake) {
    ctx.fillRect(
      segment.x * gridSize,
      segment.y * gridSize,
      gridSize,
      gridSize
    );
  }
};

function spawnFood() {
  if (foodTimeout) clearTimeout(foodTimeout);

  let x, y, overlapping;
  do {
    overlapping = false;
    x = Math.floor(Math.random() * tileCount);
    y = Math.floor(Math.random() * tileCount);

    for (let segment of snake) {
      if (segment.x === x && segment.y === y) {
        overlapping = true;
        break;
      }
    }
  } while (overlapping);

  food = { x, y };
  foodVisible = true;

  if (isUltraMode) {
    foodTimeout = setTimeout(() => {
      foodVisible = false;
      drawGame();
    }, 2000);
  }
}

function triggerGameOver() {
  isGameOver = true;
  stopGame();
  finalScoreDisplay.textContent = score;
  gameOverOverlay.classList.remove("hidden");
}

function togglePause() {
  if (isGameOver) return;

  isPaused = !isPaused;

  if (isPaused) {
    stopGame();
    pauseOverlay.classList.remove("hidden");
  } else {
    pauseOverlay.classList.add("hidden");
    gameInterval = setInterval(gameLoop, currentSpeed);
  }
}

// ===== KEYBOARD CONTROLS =====
document.addEventListener("keydown", (e) => {
  if (!gameScreen.classList.contains("active")) return;

  if (e.key === " " || e.code === "Space") {
    e.preventDefault();
    togglePause();
    return;
  }

  if (isGameOver || isPaused || isChangingDirection) return;

  if ((e.key === "ArrowUp" || e.key === "w" || e.key === "W") && direction.y !== 1) {
    direction = { x: 0, y: -1 };
    isChangingDirection = true;
  } else if ((e.key === "ArrowDown" || e.key === "s" || e.key === "S") && direction.y !== -1) {
    direction = { x: 0, y: 1 };
    isChangingDirection = true;
  } else if ((e.key === "ArrowLeft" || e.key === "a" || e.key === "A") && direction.x !== 1) {
    direction = { x: -1, y: 0 };
    isChangingDirection = true;
  } else if ((e.key === "ArrowRight" || e.key === "d" || e.key === "D") && direction.x !== -1) {
    direction = { x: 1, y: 0 };
    isChangingDirection = true;
  }
});