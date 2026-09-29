// GAME SETUP
// gets the html canvas elemtn where the snake game is drawn
const canvas = document.getElementById("gameCanvas");
// gets the 2D drawing context from the canvas so it is possible to draw shapes and colors
const ctx = canvas.getContext("2d");
//sets the size of each grid square to 20 pixels
const gridSize = 20;
// calculates how many grid squares fit across the canvas
const tileCount = canvas.width / gridSize; // 400px / 20 = 20 tiles

// load the apple image for the game
const foodImage = new Image();

foodImage.onload = () => drawGame();

foodImage.src = "assets/apple.png";

// COLOR PALETTE - it's a variable holding an arrray
// array of the different colors for the snake
// green, blue, red, purple, orange, turqoise
const colorPalette = ["#2ecc71", "#3498db", "#e74c3c", "#9b59b6", "#f39c12", "#1abc9c"];
// the color should be randomly selected out of the array
let snakeColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];

// Web Audio API Setup - a variable to hold the result
// it builts a new object from the blueprint class AudioContext
// it says that it should use the standard AudioContext blueprint or if the browser is older then webkitAudioContext so it does work on also older browsers
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// DIFFICULTY CONFIGURATION - its a variable that holds an object

// creates an object containing the settings for each difficulty
// instead of writing seperate code for every difficulty the settings are stored here and the correct one is selected later
const DIFFICULTY_CONFIG = {
    // the basespeed controls how otfen the snake moves
    // the speed multimplier controls how quickly the game gets faster
    // the showGrid determines whether te grid is visible or nit
  easy: { baseSpeed: 160, speedMultiplier: 5, showGrid: true },
  medium: { baseSpeed: 140, speedMultiplier: 10, showGrid: false },
  hard: { baseSpeed: 120, speedMultiplier: 20, showGrid: false },
  ultra: { baseSpeed: 90, speedMultiplier: 15, showGrid: false, ultraMode: true }
};

// Global variables for moving block mechanics in the levels
let movingBlockX = 2;   // stores the current horizontal position of the moving obsitacl and it starts at 2
let movingBlockDir = 1; // stores the direction which the obstical is travelling 1 means right/-1 left

// LEVEL CONFIGURATIONS - a variable that holds the object with the settings for hte levels

// it creates an object containing the settings for all 10 levels
const LEVEL_CONFIGS = {
  // it has 10 keys (from level 1 to 10) with nested objects and they have all the same attributes just different values assigned to them
    // level 1
  1: {
    name: "Open Field", // named open field
    targetScore: 10,    // player needs 10 points to complete the level
    wrapScreen: false,  // the snake cant teleport throuigh the walls
    // is an arrow function which returns an empty array
    getObstacles: () => [], // 1 has no obsticals so the array is empty
    portals: [],    // there are also no portals
    speedTraps: []  // and no speed traps
  },
  // level 2
  2: {
    name: "The Four Pillars",   // the title
    targetScore: 15,    // player needs to get 15 points
    wrapScreen: false,  // still no teleporting
    getObstacles: () => [   // but there are 4 symetrical obsticals which are created here
      // Top-Left 2x2
      { x: 3, y: 3 }, { x: 4, y: 3 }, { x: 3, y: 4 }, { x: 4, y: 4 },
      // Top-Right 2x2
      { x: 15, y: 3 }, { x: 16, y: 3 }, { x: 15, y: 4 }, { x: 16, y: 4 },
      // Bottom-Left 2x2
      { x: 3, y: 15 }, { x: 4, y: 15 }, { x: 3, y: 16 }, { x: 4, y: 16 },
      // Bottom-Right 2x2
      { x: 15, y: 15 }, { x: 16, y: 15 }, { x: 15, y: 16 }, { x: 16, y: 16 }
    ],
    portals: [],    // noi portals
    speedTraps: []  // no speed traps
  },
  // level 3
  3: {
    name: "Center Box",     // title
    targetScore: 20,    // needs 20 points
    wrapScreen: false,  // no teleporting
    getObstacles: () => {   // one obstical
      const obs = [];
      // x starts at 8 and continues till 11
      for (let x = 8; x <= 11; x++) {
        // y satrts at 4 and continues till 7
        for (let y = 4; y <= 7; y++) {
            // adds one obstical square to the array
          obs.push({ x, y });
        }
      }
      return obs;
    },
    portals: [],    // no portal
    speedTraps: []  // no speedtrap
  },
  // level 4
  4: {
    name: "Screen Wrap",
    targetScore: 25,    // needs 25 points
    wrapScreen: true,   // snake can portal now thorugh walls
    getObstacles: () => [], // there are no obsticals
    portals: [],    // no portals
    speedTraps: []  // no speedtraps
  },
  // level 5
  5: {
    name: "The Portal Pair",
    targetScore: 30,    // neds 30 points
    wrapScreen: false,  // no traveling through walls
    getObstacles: () => [], // no obsticals
    portals: [  // but portals at (2,2) - (17,17)
      { entry: { x: 2, y: 2 }, exit: { x: 17, y: 17 }, color: "#3b82f6" },
      { entry: { x: 17, y: 17 }, exit: { x: 2, y: 2 }, color: "#f97316" }
    ],
    speedTraps: []  // no speedtraps
  },
  // level 6
  6: {
    name: "The Maze / Cross",
    targetScore: 35,
    wrapScreen: false,
    getObstacles: () => {
      const obs = [];
      // Horizontal bar leaving a middle gap
      for (let x = 3; x <= 16; x++) {
        if (x < 8 || x > 11) obs.push({ x, y: 10 });
      }
      // Vertical bar leaving a middle gap
      for (let y = 3; y <= 16; y++) {
        if (y < 8 || y > 11) obs.push({ x: 10, y });
      }
      return obs;
    },
    portals: [],
    speedTraps: []
  },
  // level 7
  7: {
    name: "Moving Obstacle",
    targetScore: 40,
    wrapScreen: false,
    hasMovingObstacle: true,    // has obsticals that move
    getObstacles: () => [
        // movingBlockX is a variable that changes while the game is running - the obstical doesn always have the same x position
      { x: movingBlockX, y: 14 },   // top left square
      { x: movingBlockX + 1, y: 14 },   // top right square
      { x: movingBlockX, y: 15 },   // bottom left
      { x: movingBlockX + 1, y: 15 }    // bottom right
    ],
    portals: [],
    speedTraps: []
  },
  // level 8
  8: {
    name: "Double Portals",
    targetScore: 45,
    wrapScreen: false,  // no going through walls
    getObstacles: () => [   // there are obsticals as vertical walls
      { x: 10, y: 6 }, { x: 10, y: 7 }, { x: 10, y: 8 },
      { x: 10, y: 11 }, { x: 10, y: 12 }, { x: 10, y: 13 }
    ],
    portals: [  // there are 4 portals
      // Pair A
      { entry: { x: 3, y: 3 }, exit: { x: 16, y: 16 }, color: "#3b82f6" },
      { entry: { x: 16, y: 16 }, exit: { x: 3, y: 3 }, color: "#3b82f6" },
      // Pair B
      { entry: { x: 16, y: 3 }, exit: { x: 3, y: 16 }, color: "#a855f7" },
      { entry: { x: 3, y: 16 }, exit: { x: 16, y: 3 }, color: "#a855f7" }
    ],
    speedTraps: []  // no speedtraps
  },
  // level 9
  9: {
    name: "Speed Trap Corridor",
    targetScore: 50,
    wrapScreen: false,
    getObstacles: () => {   // has two walls like a corridor
      const obs = [];
      for (let y = 2; y <= 17; y++) obs.push({ x: 6, y });
      for (let y = 2; y <= 17; y++) obs.push({ x: 13, y });
      return obs;
    },
    portals: [],
    speedTraps: [   // but there are two speed traps so when the snake enters the corridor it changes the speed
      // minX is the smalles X coordinate in the area maxX the largest, the same with y - it draws a vertical corridor
      { minX: 7, maxX: 7, minY: 2, maxY: 17 },
      { minX: 12, maxX: 12, minY: 2, maxY: 17 }
    ]
  },
  // level 10
  10: {
    name: "The Gauntlet",
    targetScore: 60,
    wrapScreen: true,   // can go through walls
    hasMovingObstacle: true,    // has moving obsticals
    getObstacles: () => [   // it has moving and not moving obsticals
      { x: 5, y: 5 }, { x: 6, y: 5 }, 
      { x: 14, y: 14 }, { x: 15, y: 14 },
      { x: movingBlockX, y: 2 }, { x: movingBlockX + 1, y: 2 }
    ],
    portals: [  // has also portals
      { entry: { x: 1, y: 18 }, exit: { x: 18, y: 1 }, color: "#ef4444" },
      { entry: { x: 18, y: 1 }, exit: { x: 1, y: 18 }, color: "#ef4444" }
    ],
    speedTraps: [   // and a speed trap
      { minX: 9, maxX: 10, minY: 0, maxY: 19 }
    ]
  }
};

// DOM REFERENCES - variables that connect the javascript to elements in my html
// the elements are found by there ID and stored to use them later
// const because the value will/shoukd not change later
// different screens in the game
const homeScreen = document.getElementById("homeScreen");
const levelSelectScreen = document.getElementById("levelSelectScreen");
const difficultySelectScreen = document.getElementById("difficultySelectScreen");
const gameScreen = document.getElementById("gameScreen");

// Buttons used to move between the screens
const goToLevelModeBtn = document.getElementById("goToLevelModeBtn");
const goToDifficultyModeBtn = document.getElementById("goToDifficultyModeBtn");
const backToHomeFromLevel = document.getElementById("backToHomeFromLevel");
const backToHomeFromDiff = document.getElementById("backToHomeFromDiff");
const startDiffGameBtn = document.getElementById("startDiffGameBtn");

// Elements that display information during the game
const levelGameHeader = document.getElementById("levelGameHeader");
const currentScoreDisplay = document.getElementById("currentScore");   // displayes the current score
const highScoreDisplay = document.getElementById("highScoreDisplay");   // displays the highest score
const finalScoreDisplay = document.getElementById("finalScoreDisplay"); //final score is displayed after losing

const pauseOverlay = document.getElementById("pauseOverlay");   // pause overlay that appears when the game is paused
const gameOverOverlay = document.getElementById("gameOverOverlay"); // game-overlay that appears when the player loses

// gets the different buttons from the html - game buttons
const startBtn = document.getElementById("startBtn");   // start button
const backBtn = document.getElementById("backBtn"); //a button to go back
const backToModeBtn = document.getElementById("backToModeBtn"); // button to go back
const restartBtn = document.getElementById("restartBtn");   // restart button
const saveModeBtn = document.getElementById("saveModeBtn"); //button for saving the game settings

// INITIAL STATE & GAME VARIABLES
// let becasue the value will change later
let snake = []; // makes an empty array that will later contain the parts of the snake
let direction = { x: 1, y: 0 }; // sets the starting direction of the snake to right
let food = { x: 15, y: 15 };   //creates the food objects with a starting position
let score = 0;  // stores the current score and it is at the beginning 0

let highScore = localStorage.getItem("snakeHighScore") || 0;    // gets the saved high score from the browsers storage and if its not safed then its 0
let activeMode = "difficulty";  //stores which game mode is currently being played starts as difficulty can become level
let currentLevel = 1;   // level starts at 1
let targetScore = 10;   // the score that the player needs to get to complete the level

let baseSpeed = 150;    // staring speed of snake - smaller is faster
let currentSpeed = 150; // stores the current speed of the snake - how often the gameInterval timer runs
let speedIncrementFactor = 0;   //controls how much the snake's speed changes as the game gets on
let showGrid = true;    // the grid for easy mode
let isUltraMode = false;    // setting the ultra hard mode on false

let foodVisible = true; // the food should be visible at the beginning
let foodTimeout = null; //stores the timer that controls how long the food stays visible but the timer doesn't exist yet so null

let gameInterval = null;    // Stores the timer/interval that repeatedly updates the game - tiemr to tell when to do the next step
let isPaused = true;    // variable for is game paused or not
let isGameOver = false; // variable for is game over or not
let isChangingDirection = false; // player cant change direction multiple times during one game tick so there are no self collision 180-turns

// INITIALIZATION AND EVENT LISTENERS
// this means it shoudl wait until the html page has completely loaded before running this code to make sure the html elements actually exist before it tries to use it
// it is an arrow function (=>), arrow functions tell JS to take the inputs in the () and put them into the code in the {}
// arrow functions are shorter and easier to read
document.addEventListener("DOMContentLoaded", () => {
  // arrow function makes more sense here becasue the function only exists for the click events
  highScoreDisplay.textContent = highScore; // put the saved highscore into the html element with the id highScoreDisplay

  // Screen Switching Navigation - when a button is clicked the screen is changed
  goToLevelModeBtn.addEventListener("click", () => showScreen(levelSelectScreen));
  goToDifficultyModeBtn.addEventListener("click", () => showScreen(difficultySelectScreen));
  backToHomeFromLevel.addEventListener("click", () => showScreen(homeScreen));
  backToHomeFromDiff.addEventListener("click", () => showScreen(homeScreen));
  backBtn.addEventListener("click", () => showScreen(homeScreen));

  // when the back to mode button is clicked it should be chekced which game mode the player is currently using
  backToModeBtn.addEventListener("click", () => {
    // if its in level mode go back to the level selection screen
    if (activeMode === "level") {
      showScreen(levelSelectScreen);
    }
    // if not then the player is in difficulty mode
    else {
      showScreen(difficultySelectScreen);
    }
  });

  // Level Selection Buttons
  // it should find every HTML element that has the class ".btn-level"
  // it then goes through each button one after another and adds a clkc event to the curren tlevel button
  document.querySelectorAll(".btn-level").forEach((btn) => {
    btn.addEventListener("click", (e) => {
        // the data is then get from the bittom and it is converted from a string into a number
      currentLevel = parseInt(e.target.getAttribute("data-level"), 10);
      activeMode = "level"; // tell the current mode
        // get the configuration for the selected level
      const config = LEVEL_CONFIGS[currentLevel] || LEVEL_CONFIGS[1];
      targetScore = config.targetScore; // get the required score to complete this level
        // calculate the starting speed based on the level
      baseSpeed = Math.max(140 - currentLevel * 6, 60);
      speedIncrementFactor = 1.5;   // set how much the snakes speed increases during the game
      showGrid = true;  // to make the grid visible
      isUltraMode = false;  // and it is not in ultra hard mode
        // the save button is visible and change the text on the back button
      saveModeBtn.style.display = "inline-block";
      backToModeBtn.textContent = "← Select Level";
      // to make it the right color
      backToModeBtn.classList.remove("btn-difficulty-mode");
      backToModeBtn.classList.add("btn-level-mode");
        // the game header should be changed according to the level currently in
      levelGameHeader.textContent = `Level ${currentLevel}: ${config.name} (Target: ${targetScore} pts)`;
      showScreen(gameScreen);   // the game screen should be on
      prepareGame();    // prepare the game before it starts
    });
  });

  // Difficulty Start Button
  // when the player clicks the start difficulty game button then the difficulty mode is being used
  startDiffGameBtn.addEventListener("click", () => {
    activeMode = "difficulty";  // set to difficulty mode
    // it needs to be read what radio button is selected
    const selectedDifficulty = document.querySelector('input[name="gameDifficulty"]:checked').value;
    // the configuration for the selected difficulty
    const config = DIFFICULTY_CONFIG[selectedDifficulty];
    baseSpeed = config.baseSpeed;   // the starting speed from the difficulty settings
    speedIncrementFactor = config.speedMultiplier;  // multiplier from the difficulty settings
    showGrid = config.showGrid; // find out if the grid should be displayed or not 
    isUltraMode = config.ultraMode || false;    // find out if the ultra hard mode is on or not

    saveModeBtn.style.display = "none"; // the save button should be hidden becasue here there is no opportunity to safe where you are
    backToModeBtn.textContent = "← Select Difficulty";  // the back button text is chanegd
    // to give the button the right color
    backToModeBtn.classList.remove("btn-level-mode");
    backToModeBtn.classList.add("btn-difficulty-mode");

    // the game header must been changed to show the selected difficulty
    levelGameHeader.textContent = `Difficulty: ${selectedDifficulty.toUpperCase()}`;
    // change the game screen and prepare for the game
    showScreen(gameScreen);
    prepareGame();
  });

  // Control Buttons
  // when the start button is clicked:
  startBtn.addEventListener("click", togglePause);
  // when the restart button is clicked reset and prepare the game
  restartBtn.addEventListener("click", () => {
    prepareGame();
    togglePause();
  });

  // when the save button is clicked save the current level in the browsers localStorage
  saveModeBtn.addEventListener("click", () => {
    localStorage.setItem("savedSnakeLevel", currentLevel);
    // show a popup message telling the player that the progress has been saved
    alert(`Progress saved! Level ${currentLevel} recorded.`);
  });
});

// normal functions now because these need to be called often in other functions to be executed there

// TO SWITCH SCREENS

// a function that changes which screen should be visible right now - can switch between menu, game, game-over screen
function showScreen(screenToShow) {
  stopGame(); // game needs to be stopped before screen switches
  // first all screens need to be hidden so the active class needs to be removed and then added to the screen we want to show
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  screenToShow.classList.add("active");
}

// PREPARE GAME and SPAWN LOGIC

// a function that resets everything that should be when starting a new game
function prepareGame() {
  stopGame(); // the game should be topped
  // the color of the snake is chosen randomly every game
  snakeColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];

  // if the game mode is level (?) then get the configuration data for the specific level
  // if not (:) in level mode then there is no level configuration needed
  const currentConfig = activeMode === "level" ? LEVEL_CONFIGS[currentLevel] : null;
  // the obstivales variable is set to the current level's obstacels if a level configuration exists
  // if not then it is set aas an empty list
  const obstacles = currentConfig ? currentConfig.getObstacles() : [];  // gets the obstacles
  // the portals variable is set to the levels portal if a level configuration exists and it contains portals (&&)
  // if not then it is a empty list
  const portals = currentConfig && currentConfig.portals ? currentConfig.portals : [];  // gets the portals for the current level
    

  // an arrow function that takes x and y to check if on a specific grid position is already sth
  // to prevent spawning the snake inside an obstical or portal 
  const isOccupied = (x, y) => {
    // first check for obsticales: 
    for (let obs of obstacles) { // loops through every obstacle object in the obstacles array
      // obs.x and obs.y ... coordinate properties from current obstacle object
      // with Math.floor it rounds decimal numbers down to nearest whole integer incase there is sub-pixel floating-point position
      // so if the x/y positoon of the current object is the same as the x, y the function tests than that cell is occupied and the snake cant spawn here
      if (Math.floor(obs.x) === x && Math.floor(obs.y) === y) return true;
    }
    // does the same but with every portal pair object in the portals array
    for (let p of portals) {
      // it needs to check both coordinates of the entry and exit portal
      if ((p.entry.x === x && p.entry.y === y) || (p.exit.x === x && p.exit.y === y)) return true;
    }
    return false;
  };

  // initial position for the snake to spawn it to (liek a first guess)
  let spawnX = 10;
  let spawnY = 10;

  // puts the spawnX and spawnY guesses in the isOccupied function and looks if these and the two cells behind it are occupied
  // the snake is 3 cells long
  // if they are occupied then run the code
  if (isOccupied(spawnX, spawnY) || isOccupied(spawnX - 1, spawnY) || isOccupied(spawnX - 2, spawnY)) {
    // it is occupied so no safe spot guessed
    let foundSafeSpot = false;  // to track if a position thats not occupied is found
    // this searches through the game board
    // first the y axis - it starts at 2 because 0 and 1 are to close to the wall
    for (let y = 2; y < tileCount - 2; y++) {   // it starts at 2 and then increases the y by 1 so it goes from cell to cell until it is at the cell before the wall
      // for each y it goes through the columns and tries every x if it has reached the end of the row then the y is getting increased by 1
      // it starts at 3 becasue the snake needs 3 horizntal cells
      for (let x = 3; x < tileCount - 2; x++) {
        // checks if the three positions are all free
        // 1: the head so (x,y) 2: the body so one cell behind the x horizontally 3: the tail so two cells behind the head horizontally
        if (!isOccupied(x, y) && !isOccupied(x - 1, y) && !isOccupied(x - 2, y)) {
          // if all these are not occupied then the coordinates spawnX and spawnY become the x and y
          spawnX = x;
          spawnY = y;
          foundSafeSpot = true; // a safe spot is found
          break;
        }
      }
      // if there is a spafe spot found then it doesn't need to keep trying it can take this spot
      if (foundSafeSpot) break;
    }
  }

  // then the snake can be put activly in the safe spot that has been calculated before
  snake = [
    { x: spawnX, y: spawnY },
    { x: spawnX - 1, y: spawnY },
    { x: spawnX - 2, y: spawnY }
  ];

  direction = { x: 1, y: 0 }; // snake initially starts moving to the right
  score = 0;  // the score starts at 0
  currentSpeed = baseSpeed; // the starting speed is set
  movingBlockX = 2; // starting position of the moving obsticale
  movingBlockDir = 1; // initial direction of the moving obsticale

  isPaused = true;  // but the game should still be paused so that it doesnt start directly when coming to the game screen
  isGameOver = false; // the game is not over
  isChangingDirection = false;  // snake hasn't changed direction yet

  currentScoreDisplay.textContent = score;  // updates the score on the display
  pauseOverlay.classList.remove("hidden");  // the pause/start display shoult be hidden
  gameOverOverlay.classList.add("hidden");  // the game isn't over so no game-over display

  spawnFood();  // the first food can be created
  drawGame(); // the initial game board is drawn
}

// function stops the game
function stopGame() {
  // it stops the main game loop if it exists
  if (gameInterval) clearInterval(gameInterval);
  // and stops food timer if it exists
  if (foodTimeout) clearTimeout(foodTimeout);
  // resetting the timer variables so they can be used later
  gameInterval = null;
  foodTimeout = null;
}

// the main loop for the game - it needs to be called repedetly while game is running
function gameLoop() {
  // if the game is over or paused then it shouldn't update the game so stop here
  if (isGameOver || isPaused) return;
  
  updateMovingObstacles();  // update the moving obsticales before the snake moves
  moveSnake();  // move the snake
  drawGame(); // redraw the board - important that this is after everything has been updated or else the updates are always one behing
}

// a function to controll the movement for the obsticales
// my obstacles only move horizontally
function updateMovingObstacles() {
  // becasue the obsticales are only available in the level mode if the player is in the difficulty mode then stop
  if (activeMode !== "level") return;
  // the function needs to know on which level the player currently is so the settings for this level are got
  const config = LEVEL_CONFIGS[currentLevel];
  // if the level doesnt exist or the level doesnt have a moving obsticle then nothing to do
  if (!config || !config.hasMovingObstacle) return;
  // if there is a level with an obstacle move it according to its current direction
  // so it takes the current positon of x and then adds 0.25 or subtracts 0.25 (depends if he moves right or left)
  // the bigger the number the less smooth the block moves
  movingBlockX += movingBlockDir * 0.25;
  // the borders for the obstical where it can move - if it reaches either side the direction is changed
  if (movingBlockX >= 16 || movingBlockX <= 1) {  // can move from 1 - 16
    movingBlockDir *= -1; // changing direction
  }
}

// the brain behind letting the snake move the way the player wants
// it happens everytime the snake moves
function moveSnake() {
  // if the game is in the level mode then get the settings for the current level if not then the configs are null
  const currentConfig = activeMode === "level" ? LEVEL_CONFIGS[currentLevel] : null;
  // calculate the position of the snake's head where it will move to so it adds the direction in x and y to the current x and y positoon of the head
  let head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

  // in some levels the snake is allowed to go thorugh walls and then appear on the other side so teleporting
  // if there is a level cofiguration and that level allows the screen wrapping then do the following if statements
  if (currentConfig && currentConfig.wrapScreen) {
    // head.x .. horizontal position of head / tileCount - 1 the coordinate of the last tile
    if (head.x < 0) head.x = tileCount - 1; // if the snake goes past the left edge then the head needs to be moved to the last tile of the right side
    if (head.x >= tileCount) head.x = 0;  // if the snake head is outside the board (right side) than it should appear on the left side
    // head.y .. vertical position of head
    if (head.y < 0) head.y = tileCount - 1; // if the snake goes outside the board (top) it should appear at the bottom
    if (head.y >= tileCount) head.y = 0;  // if snake goes out the board at the bottom it should appear at the top
  }
  // if screen wrapping is not allowed then check if the snake hits the wall
  else {
    // left wall || right wall || top || bottom
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
      // if the wall is hit then the game is over
      triggerGameOver();
      return;
    }
  }

  // checks if the current level exists and if it has portals in it
  if (currentConfig && currentConfig.portals) {
    // it then goes through every portal in the portal list one after another 
    for (const p of currentConfig.portals) {
      // and checks if the head of the snake is on the entry portal position
      if (head.x === p.entry.x && head.y === p.entry.y) {
        playSound('teleport');  // if so play the teleport sound
        head = { x: p.exit.x, y: p.exit.y };  // and put the coordinates of the head to the coordinates of the exit portal
        break;  // then it stops looking through the portals list
      }
    }
  }

  // checks if there are level configurations
  if (currentConfig) {
    // gets the obstacles for this level and stores them on obstacles
    const obstacles = currentConfig.getObstacles();
    // iterates over the list of obstacles one obstacle after another
    for (const obs of obstacles) {
      // and chekcs if the head is on one of those obstavles
      if (Math.floor(head.x) === Math.floor(obs.x) && Math.floor(head.y) === Math.floor(obs.y)) {
        // if yes then stop the game
        triggerGameOver();
        return;
      }
    }
  }

  // go thorugh every piece of the snake
  for (let segment of snake) {
    // and check if the head and a body element have the same x and y coordinate
    if (head.x === segment.x && head.y === segment.y) {
      // if so then the game is over
      triggerGameOver();
      return;
    }
  }


  // snake is the array with all the snakes body parts
  // unshift adds sth to the beginning of an array
  // in this case the new head is added in the front of the snake so the old head is now a body piece
  // this is befroe the check if the snake ate a food because if it doesn't eat a food the last element is removed
  snake.unshift(head);

  // checks if the position of the head is on the same position as the food
  if (head.x === food.x && head.y === food.y) {
    // if so the snake ate the food and the eat sound is displayed, the score goes up by 1 and the new score is displayed
    playSound('eat');
    score += 1;
    currentScoreDisplay.textContent = score;
    // if the new score is now bigger then the highscore the new score becomes the highscore
    if (score > highScore) {
      highScore = score;
      highScoreDisplay.textContent = highScore; // the highscore is displayed
      localStorage.setItem("snakeHighScore", highScore);  // and also saved in the browsers local storage
    }
    // if the mode is in level and the score the player got is higher then the score the player needs to get to complete the level
    if (activeMode === "level" && score >= targetScore) {
      // the game is stopped because he completed the level
      stopGame();
      // a little message that he completed that level
      alert(`Yay, Level ${currentLevel} Completed!`);
      showScreen(levelSelectScreen);  // automatically gets the player back to the level screen
      return;
    }

    // the speed shpuld increase the longer the snake gets to make the game harder
    // the increase is based on the score and a constant factor
    // so from the current speed the calculateed number is substracted every time the snake ate sth but it can't go lower then 30
    currentSpeed = Math.max(30, baseSpeed - score * speedIncrementFactor);
    
    // Check speed trap corridors
    // is the current level existing and does it have speed traps
    if (currentConfig && currentConfig.speedTraps) {
      // if so then go through every speed trap of that level
      for (const trap of currentConfig.speedTraps) {
        // if the snakes head is inside the speed trap area - needs to fulfill everything to be considerd inside
        if (head.x >= trap.minX && head.x <= trap.maxX && head.y >= trap.minY && head.y <= trap.maxY) {
          // the current speed is divided by 2 so the snake gets double so fast
          currentSpeed = Math.floor(currentSpeed / 2);
          break;
        }
      }
    }

    // if the game is not paused and not over so it is running
    if (!isPaused && !isGameOver) {
      // then if there is a game timer on stop it because the speed has changed
      if (gameInterval) clearInterval(gameInterval);
      // start the game loop again but with the new speed
      gameInterval = setInterval(gameLoop, currentSpeed);
    }
    // because the old food was eaten make a new one
    spawnFood();
  }
  // if the snake did not eat the food then the snake wont get longer
  else {
    // with pop the last item from an array is removed so the tail
    snake.pop();
  }
  // resets the direction change lock becasue the snake now has finished the movement and now the player can again change a new direction
  isChangingDirection = false;
}

// DRAWING GAME ELEMENTS
const drawGame = () => {
  // everything that was on the canvas before needs to be cleared so old positions dissappear
  // baisicly reste the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw a subtle grass pattern on the game board
  for (let y = 0; y < tileCount; y++) {
      for (let x = 0; x < tileCount; x++) {
          ctx.fillStyle = (x + y) % 2 === 0 ? "#5b9b45" : "#639f4c";
          ctx.fillRect(x * gridSize, y * gridSize, gridSize, gridSize);
      }
  }

  // get the settings for the current level if the level mode is on if not it will be null
  const currentConfig = activeMode === "level" ? LEVEL_CONFIGS[currentLevel] : null;

  // if the showGrid is true dwar the grid - so difficulty Easy
  if (showGrid) {
    ctx.strokeStyle = "#1b331b";  // color of grid lines
    ctx.lineWidth = 1;  // how big the lines are (1 pixel)
    // go trough every row and column
    for (let i = 0; i <= tileCount; i++) {
      const pos = i * gridSize; // calculated the place of the current grid line
      ctx.beginPath();  // starts making a new line
      ctx.moveTo(pos, 0); // starts the vertical line at the top of the canvas
      ctx.lineTo(pos, canvas.height); // go down the vertical line to the bottom of the canvas
      ctx.stroke(); // and then actually draw the line from where you started to the end

      ctx.beginPath();  //start another line for the horizontal grid
      ctx.moveTo(0, pos); // start horizontal line on the left side
      ctx.lineTo(canvas.width, pos);  // do with the line to the right side of the canvas
      ctx.stroke(); //draw the line
    }
  }

  // drawing of the Speed Trap Corridors
  // check if the current level configurations exist and if it has speed traps
  if (currentConfig && currentConfig.speedTraps) {
    // if so fill the speedtrap with this color
    ctx.fillStyle = "rgba(234, 179, 8, 0.15)";
    // go through every speed trap in the level
    for (const trap of currentConfig.speedTraps) {
      // from min to max (both included)
      const width = (trap.maxX - trap.minX + 1) * gridSize; // calculates the width
      const height = (trap.maxY - trap.minY + 1) * gridSize;  // calculates the height
      // make the speed trap a rectangle
      ctx.fillRect(trap.minX * gridSize, trap.minY * gridSize, width, height);
    }
  }

  // draw the obsticales if the curren level exists
  if (currentConfig) {
    // make them this color
    ctx.fillStyle = "#64748b";
    // get all the obsticals of the current level
    const obstacles = currentConfig.getObstacles();
    // iterate over every obstical found
    for (const obs of obstacles) {
      // and draw each obstical as one grid-sized square 
      ctx.fillRect(
        Math.floor(obs.x) * gridSize,
        Math.floor(obs.y) * gridSize,
        gridSize,
        gridSize
      );
    }
  }

  // checks if current level exists and has portals in it
  if (currentConfig && currentConfig.portals) {
    // iterates over every portal in the level
    for (const p of currentConfig.portals) {
      // take the initial color of the portal and if it doesnt have one take blue (so the portals have two diffeent colors)
      ctx.fillStyle = p.color || "#3b82f6";
      // start drawing the portal shape
      ctx.beginPath();
      // it should be a circle
      ctx.arc(
        p.entry.x * gridSize + gridSize / 2,  // x position of center of portal
        p.entry.y * gridSize + gridSize / 2,  // y position of center of portal
        gridSize / 2 - 2, // set the radius a little bit smaler then the grid tile is big so you can see it is a circle
        0,  // starting angle to draw the circle from
        Math.PI * 2 // make one full round
      );
      ctx.fill(); // fill the circle with the color
    }
  }

  // If the food is visible, draw the apple
  if (foodVisible) {

      // Use the PNG apple if it has loaded
      if (foodImage.complete && foodImage.naturalWidth > 0) {
          ctx.drawImage(
              foodImage,
              food.x * gridSize,
              food.y * gridSize,
              gridSize,
              gridSize
          );
      } 
      
      // If the PNG cannot be loaded, use a red square instead
      else {
          ctx.fillStyle = "red";
          ctx.fillRect(
              food.x * gridSize,
              food.y * gridSize,
              gridSize,
              gridSize
          );
      }
  }

  // draw the snake with the array snakeColor so every game there is a new color
  ctx.fillStyle = snakeColor;
  // iterates over every element of the snake and makes it one square
  // Draw each part of the snake

  snake.forEach((segment, index) => {
    // Get the position of this snake segment
    const x = segment.x * gridSize;
    const y = segment.y * gridSize;

    ctx.beginPath();

    // Round only the outside corners of the head
    // its [top-left, top-right, bottom-right, bottom-left]
    if (index === 0) {
        // the bigger the number the rounder
        if (direction.x === 1) {
            // Snake is moving right, so round the right corners
            ctx.roundRect(x, y, gridSize, gridSize, [0, 10, 10, 0]);

        } else if (direction.x === -1) {
            // Snake is moving left, so round the left corners
            ctx.roundRect(x, y, gridSize, gridSize, [10, 0, 0, 10]);

        } else if (direction.y === 1) {
            // Snake is moving down, so round the bottom corners
            ctx.roundRect(x, y, gridSize, gridSize, [0, 0, 10, 10]);

        } else if (direction.y === -1) {
            // Snake is moving up, so round the top corners
            ctx.roundRect(x, y, gridSize, gridSize, [10, 10, 0, 0]);
        }

    // Round only the outside corners of the tail
    } else if (index === snake.length - 1) {

        // Find the segment directly before the tail
        const previous = snake[index - 1];

        if (previous.x < segment.x) {
            // Tail extends to the right, so round the right corners
            ctx.roundRect(x, y, gridSize, gridSize, [0, 6, 6, 0]);

        } else if (previous.x > segment.x) {
            // Tail extends to the left, so round the left corners
            ctx.roundRect(x, y, gridSize, gridSize, [6, 0, 0, 6]);

        } else if (previous.y < segment.y) {
            // Tail extends downward, so round the bottom corners
            ctx.roundRect(x, y, gridSize, gridSize, [0, 0, 6, 6]);

        } else {
            // Tail extends upward, so round the top corners
            ctx.roundRect(x, y, gridSize, gridSize, [6, 6, 0, 0]);
        }

    } else {
        // Keep all middle segments completely square
        ctx.rect(x, y, gridSize, gridSize);
    }

    // Draw the current segment
    ctx.fill();
});


};

// function to make the food appear and disappear randomly
function spawnFood() {
  // if there is a timer for the food disappearing then stop that before making a new food
  if (foodTimeout) clearTimeout(foodTimeout);
  // if the player is in the level mode get the level configurations for the current level and if not then its null
  const currentConfig = activeMode === "level" ? LEVEL_CONFIGS[currentLevel] : null;
  // if the configurations for the current level have obstavles in it then get those if not then an empty list
  const obstacles = currentConfig ? currentConfig.getObstacles() : [];

  let x, y, overlapping;  // variables to store the food's position and to check if the position is already used
  // keep generating new positions until there is one that doesnt overlap with the snake or an obsticle
  do {
    // to start with the loop assumes the new position is a safe posiiton becasue the possibility is not so big
    overlapping = false;
    // then generate random (Math.random makes random number between 0 and 1) X and Y coordinates on the grid (multiplying with the tileCount)
    x = Math.floor(Math.random() * tileCount); 
    y = Math.floor(Math.random() * tileCount);

    // iterate over every part of the snake to check that the food oesnt spwn on top of the snake
    for (let segment of snake) {
      // if the snake occupies the position then this position is marked as overlapping
      if (segment.x === x && segment.y === y) {
        overlapping = true;
        break; // the rest of the snake doesn't need to be checked because it is already clear that this position cant be used
      }
    }

    // if the food position did not overlap with the snake then it checks for obsticals
    if (!overlapping) {
      // iterates through every obstacle
      for (let obs of obstacles) {
        // and chekcs if the position is the same as the food position
        if (Math.floor(obs.x) === x && Math.floor(obs.y) === y) {
          // if so then it can stop check the obstacles and the overlapping is true
          overlapping = true;
          break;
        }
      }
    }
  }
  // the whole do loop is runed through as long as overlapping is true
  while (overlapping);
  // if a safe position has been found these coordinates become the food position
  food = { x, y };
  foodVisible = true; // the food can be seen

  // if the player is in the ultra hard mode the food should disappear after 2 secodns so 2000 ms
  if (isUltraMode) {
    // the timer that runs for 2000 ms is started
    foodTimeout = setTimeout(() => {
      // makes the food invisivle
      foodVisible = false;
      // and redraws the game so the food will disappear
      drawGame();
    }, 2000);
  }
}

// this function handles if the game is over - so wall, snake or obstacl crash
function triggerGameOver() {
  isGameOver = true;  // game is over
  playSound('die'); // die sound played
  stopGame(); // game is stopped
  finalScoreDisplay.textContent = score;  // final score is displayed
  gameOverOverlay.classList.remove("hidden"); // the game-over overlay becomes visible now because the hidden class is removed so it is aktive now
}

// for pausing and unpausing the game
function togglePause() {
  // if the game is over no possibility to pause the game
  if (isGameOver) return;
  // if the game is paused now the game should not be paused and if it isn't paused the game should be paused
  // so the variable isPaused takes the oppostie state it is currently in
  isPaused = !isPaused;
  // if the game is paused
  if (isPaused) {
    stopGame(); // game is stopped
    pauseOverlay.classList.remove("hidden");  // the class hidden is removed so the pause-overlay cann now be seen
  }
  // if the game is not paused
  else {
    pauseOverlay.classList.add("hidden"); // the pause-overlay should not be visible so the hidden class is added
    gameInterval = setInterval(gameLoop, currentSpeed); // the game loop is started again using the current speed so the snake continues moving from where it stopped with the same speed
  }
}

// KEYBOARD CONTROLING
// the evenListener listens for a key beeing pressed on the board
document.addEventListener("keydown", (e) => {
  // because some browsers keep the audio context suspended until the user interacts with the page it should be resumed when a key is pressed
  if (audioCtx.state === 'suspended') audioCtx.resume();
  // when the game screen is not active then nothing should happen
  // so controlling the game with the arrows can only happen when the game screen is on
  if (!gameScreen.classList.contains("active")) return;

  // checks for the spacekey - pause/unpause
  // if the spacekey is pressed
  if (e.key === " " || e.code === "Space") {
    // the browser should stop doing the normal response to a press of the space key - it normally scrolls down
    e.preventDefault();
    togglePause();  // pause or resume the game
    return;
  }

  // if the game is over, paused or the player has already changed direction during this gametic then nothing should happen if the keys are pressde
  if (isGameOver || isPaused || isChangingDirection) return;
  // if not then the snake should respond the following way to the keys:
  // the directions that are checked need to be directly the oposite because else there could be the posibility to run through the snake
  if ((e.key === "ArrowUp" || e.key === "w" || e.key === "W") && direction.y !== 1) {
    // if the arrowup or the W/w key is pressed and the current direction of the snake is not down
    direction = { x: 0, y: -1 };  // the snake moves upwards ad the x stays 0
    isChangingDirection = true; // preventing another direction change before the snake moves again
  } else if ((e.key === "ArrowDown" || e.key === "s" || e.key === "S") && direction.y !== -1) {
    // if the arrowdown or S/s key is pressed and the direction of the snake is not up
    direction = { x: 0, y: 1 }; // the snake moves down and the x stays 0
    isChangingDirection = true; // preventing another direction change before the snake moves again
  } else if ((e.key === "ArrowLeft" || e.key === "a" || e.key === "A") && direction.x !== 1) {
    // if the ArrowLeft or A/a key is pressed and the direction of the snake is not right
    direction = { x: -1, y: 0 };  // the snake moves left and the y stays 0
    isChangingDirection = true; // preventing another direction change before the snake moves again
  } else if ((e.key === "ArrowRight" || e.key === "d" || e.key === "D") && direction.x !== -1) {
    // if the ArrwRight or the D/d key is pressed and the current direction of the snake is not left
    direction = { x: 1, y: 0 }; // the snake moves rigt and the y stays 0
    isChangingDirection = true; // preventing another direction change before the snake moves again
  }
});

// function for the audio sounds
// with the type parameter it can be decided what sound to play
function playSound(type) {
  // checks if the browsers audio system is paused and if it is it shoud turn on
  // checks the audioCtx.state if its suspended (means it is paused), the other possibility is running then the audio is working
  if (audioCtx.state === 'suspended') {
    // if it is then it should start running again
    audioCtx.resume();
  }
  // creates an oscillator which generates the soudn wave
  const oscillator = audioCtx.createOscillator();
  // generates a gain node which controls the volume of the sound
  const gainNode = audioCtx.createGain();
  // connect them together
  oscillator.connect(gainNode);
  // connect the volume control to the computer's speaking audio
  gainNode.connect(audioCtx.destination);
  // store the time of the audio system to control when the sound changes
  const now = audioCtx.currentTime;

  // if the snake eats the food this sound is played
  if (type === 'eat') {
    oscillator.type = 'sine'; // a sine wave
    oscillator.frequency.setValueAtTime(800, now);  // start the sound at 800 Hz
    oscillator.frequency.exponentialRampToValueAtTime(1200, now + 0.1); // increase the frequency to 1200 Hz so the sound gets higher
    gainNode.gain.setValueAtTime(0.3, now); // the volume should start at 0.3
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);  // the volume should lower
    oscillator.start(now);  // start the sound
    oscillator.stop(now + 0.1); // the sound hsould only play 0.1 seconds
  }
  // if the snake dies then this sound
  else if (type === 'die') {
    oscillator.type = 'sawtooth'; // the sawtooth sound is played
    oscillator.frequency.setValueAtTime(300, now);  // start the sound at 300 Hz
    oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.5); // decrease it to 50 Hz so it gets deeper
    gainNode.gain.setValueAtTime(0.3, now); // start with a volume of 0.3
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);  // make it fade over half a second
    oscillator.start(now);  // start the sound
    oscillator.stop(now + 0.5); // stop it after half a second
  }
  // if the snake teleports itself there should be this sound
  else if (type === 'teleport') {
    oscillator.type = 'triangle'; // triangle sound type
    oscillator.frequency.setValueAtTime(400, now);  // start at 400 Hz
    oscillator.frequency.exponentialRampToValueAtTime(1000, now + 0.2); // increase to 1000 Hz making the sound rise in the pitch
    gainNode.gain.setValueAtTime(0.2, now); // start with a slightly lower volume of 0.2
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);  // fade sound over 0.2 seconds
    oscillator.start(now);  // start the sound
    oscillator.stop(now + 0.2); // stop it after 0.2 seconds
  }
}