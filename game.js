// first define all DOM Elements and the game Canvas

// gets the html canvas elemtn where the snake game is drawn
const canvas = document.getElementById("gameCanvas");
// gets the 2D drawing context from the canvas so it is possible to draw shapes and colors
const ctx = canvas.getContext("2d");

// gets the different buttons from the html
const startBtn = document.getElementById("startBtn");   // start button
const pauseBtn = document.getElementById("pauseBtn");   // pause button
const restartBtn = document.getElementById("restartBtn");   // restart button
const saveModeBtn = document.getElementById("saveModeBtn"); //button for saving the game settings

// gets the different html elements
const scoreDisplay = document.getElementById("scoreDisplay");   // displayes the current score
const highScoreDisplay = document.getElementById("highScoreDisplay");   // displays the highest score
const pauseOverlay = document.getElementById("pauseOverlay");   // pause overlay that appears when the game is paused
const gameOverOverlay = document.getElementById("gameOverOverlay"); // game-overlay that appears when the player loses
const finalScoreDisplay = document.getElementById("finalScoreDisplay"); //final score is displayed after losing

// gets different settings from the html
const soundToggle = document.getElementById("soundToggle"); // checkbox that controls the game sounds
const speedRange = document.getElementById("speedRange");   // speed slider
const themeSelect = document.getElementById("themeSelect"); // theme selection element
const modeSelect = document.getElementById("modeSelect");   // game mode selection element


// all Game configurations and states

// Game variables & canvas contexts
//let canvas, ctx;

// UI elements (queried after DOM is ready)
//let scoreDisplay, highScoreDisplay, levelGameHeader, targetScoreDisplay;
//let startBtn, diffStartBtn;

const GRID_SIZE = 20;   //sets the size of each grid square to 20 pixels
let tileCount = canvas.width / GRID_SIZE;   // calculates how many grid squares fit across the canvas

let snake = []; // makes an empty array that will later contain the parts of the snake
let direction = { x: 1, y: 0 }; // sets the starting direction of the snake to right
let food = { x: 0, y: 0, visible: true };   //creates the food objects with a starting position and it is initially visible

// array of the different colors for the snake
const colorPalette = ["#2ecc71", "#3498db", "#e74c3c", "#9b59b6", "#f39c12", "#1abc9c"];
// the color should be randomly selected out of the array
let snakeColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];


let score = 0;  // stores the current score and it is at the beginning 0
let highScore = localStorage.getItem("snakeHighScore") || 0;    // gets the saved high score from the browsers storage and if its not safed then its 0
if (highScoreDisplay) highScoreDisplay.textContent = highScore;   // the highscore gets displayed

let gameInterval = null;    // interval to repeatedly run the game loop
let foodTimer = null;   // timer used to making the food disappear in ultra hard mode

let isPaused = false;   // variable for is game paused or not
let isGameOver = false; // variable for is game over or not
let isChangingDirection = false; // player cant change direction multiple times during one game tick so there are no self collision 180-turns

let currentDifficulty = "normal";   // stores current game difficulty "normal" or "ultra"
let gameSpeed = 100;    // Delay in ms between game updates - the smaller the number the faster the snake
let soundEnabled = true;    // controlles the game sounds to on or off





// SCREEN SWITCHING LOGIC

// funtion to switch between diffrent screens in the game
function showScreen(screenId) {
    // finds every html element that has the class screen
    const screens = document.querySelectorAll(".screen");
    // goes through every screen one at a time and removes the active class from each screen so all screens are hidden before showing the selected one
    screens.forEach((screen) => screen.classList.remove("active"));

    // gets the target screen you want
    let targetScreen;
    if (screenId === "home") {  // if the id is hoem then get the screen homeScreen
        targetScreen = document.getElementById("homeScreen");
    } else if (screenId === "levelSelect") {
        targetScreen = document.getElementById("levelSelectScreen");
    } else if (screenId === "difficultySelect") {
        targetScreen = document.getElementById("difficultySelectScreen");
    } else if (screenId === "game") {
        targetScreen = document.getElementById("gameScreen");
    }
    // checks if a matching screen was found so a little error preventer if an invalid screen ID is given
    if (targetScreen) {
        targetScreen.classList.add("active");   // adds then the active class to the selected screen to make it visible
    }
}

// HOME BUTTON EVENT LISTENERS

// finds the button that takes the player to the Level Mode screen
const goToLevelModeBtn = document.getElementById("goToLevelModeBtn");
// finds the button that takes the player to the difficulty mode scree 
const goToDifficultyModeBtn = document.getElementById("goToDifficultyModeBtn");

if (goToLevelModeBtn) { // checks if the level mode button actually exists in html
    // and then adds a click listener to the level mode button - runs whenever the player presses that button
    // the levelSelect screen is showed
    goToLevelModeBtn.addEventListener("click", () => showScreen("levelSelect"));
}

if (goToDifficultyModeBtn) {    // checks if the difficulty mode button exists in html
    // and then adds a click event listener to the difficulty mode button - runs everytime when the player clicks the button
    // the difficultySelect screen is showed
    goToDifficultyModeBtn.addEventListener("click", () => showScreen("difficultySelect"));
}

// LEVEL SELECTION BUTTONS

// finds all the html elements with the class btn-level
const levelButtons = document.querySelectorAll(".btn-level");
// goes then through every level button at once
levelButtons.forEach((btn) => {
    // adds an click eventlistener to the current level button
    btn.addEventListener("click", (e) => {
        // first the value of the data-level attribut from the clicked button is loaded
        const levelNum = e.target.getAttribute("data-level");
        // finds the element that displays the current level in the game header and changes its text to show the selected level
        document.getElementById("levelGameHeader").textContent = `Level ${levelNum}`;
        // it is switched from the level selection screen to the actual game screen
        showScreen("game");
    });
});



// Audio controll section

const playSound = (type) => {
    // a function that creates and plays different sounds
    // the sounds depend on the type given to it
    if (!soundEnabled) return;  // if the sound is not enabled then don't run the rest of the code
    
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();  // this creates a new Web Audio API audio context
    const osc = audioCtx.createOscillator();    // creates a oscillator which generates the actual sound wave
    const gain = audioCtx.createGain(); // creates a gain node. That controls the volume of the sound
    
    osc.connect(gain);  // connect the oscillator to the volume controllers
    gain.connect(audioCtx.destination); // connects the volume controller to the computer's speaker
    
    // if the sound requested is eat then use the smooth sine wave
    if (type === "eat") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);    // start the sound at 600Hz
        osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);    // increase it sloly to 800Hz
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);    //the volumn schould start at 0.1
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);   // lower the volume slowly to nearly 0
        osc.start();    // start playing the sound
        osc.stop(audioCtx.currentTime + 0.1);   // stop the sound after 0.1 second
    }
    // if the requested sound is die then use the sawtooth sound
    else if (type === "die") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);    // start at 150Hz
        osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.3); // lower the frequency to 40 Hz slowly
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);    // the volume should start at 0.2
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);   // lower the volume slowly to nealry 0
        osc.start();    // start the sound
        osc.stop(audioCtx.currentTime + 0.3);   // stop after 0.3 seconds
    }
};

// Generate and Spawn the Food

const generateFood = () => {
    // creating two empty containers
    // outside of the do while block so they are being reused every time the loop tries a new random position
    let x, y;
    let overlapping;    // for overlapping food and snake
    // pick a random x and y spot on the board as long as they match any segment of the snake
    // if they don't match the snake make that x and y position to the new position of the food  
    do {
        overlapping = false;
        x = Math.floor(Math.random() * tileCount);
        y = Math.floor(Math.random() * tileCount);

        for (let segment of snake){
            if (segment.x === x && segment.y === y){
                overlapping = true;
                break;
            }
        }

    } while (overlapping);

    return { x, y, visible: true };
};

function spawnFood() {
    food = generateFood();  // generates a new food position
    if (foodTimer) clearTimeout(foodTimer); // if an old food timer exists it should be canceled

    // In Ultra hard mode, food disappears after 2 seconds
    if (currentDifficulty === "ultra") {
        foodTimer = setTimeout(() => {
            food.visible = false;
            // refresh frame to remove visual food instantly
            drawGame();
        }, 2000);
    }
}

// LET THE SNAKE MOVE

// a function that moves the snake forward by one grid square
// it is called once every game tick by the game loop
const moveSnake = () => {
    // calculates where the new snake head should be 
    const head = {
        x: snake[0].x + direction.x,
        y: snake[0].y + direction.y };

    // checks if the snake has hit a wall (left, right, top, bottom)
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        triggerGameOver(); // if so then the game is over
        return;
    }

    // checks if the snake has run into itslefe 
    for (let segment of snake) {
        // if at the new head position is already a snake
        if (head.x === segment.x && head.y === segment.y) {
            triggerGameOver(); // the game is over
            return;
        }
    }
    // adds the head to the beginning of the snake array
    snake.unshift(head);

    // checks if the snake has eaten food so if the head is at a position where the food is
    if (
        food.visible &&
        head.x === food.x &&
        head.y === food.y
    ) {
        // the score updates by 1 point and is shown on the page
        score += 1;
        scoreDisplay.textContent = score;

        // if the new score is bigger the the highscore the new score gets to be the highscore
        if (score > highScore) {
            highScore = score;
            highScoreDisplay.textContent = highScore;
            localStorage.setItem("snakeHighScore", highScore);
        }
        
        // becasue the food has been eaten the eat sound has to be played
        playSound("eat");
        // and a new food is spawned somewhere
        spawnFood();
    } else {
        // if food is not eaten the last part of the snake is removed
        snake.pop();
    }

    // you can change the direction again before the  next game tick
    isChangingDirection = false;
};

// DRAW THE GAME BOARD AND THE SNAKE

function drawGrid() {
    // first the color and 1 pixel linewidth is defined
    ctx.strokeStyle = "#ccc";
    ctx.lineWidth = 1;
    ctx.beginPath(); // Start one single path

    for (let i = 0; i <= tileCount; i++) {
        const position = i * GRID_SIZE;

        // Vertical line
        // ctx.moveTo() moves the "pencil" to a position but without drawing a line
        ctx.moveTo(position, 0);
        // then with lineTo the line from the current Position to the specified posititon is being drawed
        ctx.lineTo(position, canvas.height);

        // Horizontal line
        ctx.moveTo(0, position);
        ctx.lineTo(canvas.width, position);
    }

    ctx.stroke(); // Draw all lines in one single call
}


// a function that draws the game on the canvas
// called after the game state changes so the screen stays updated
const drawGame = () => {
    // first you want to erase the entire board before drawing a new frame
    ctx.clearRect(0, 0,
        canvas.width, canvas.height);
    
    // for the easy mode the grid lines
    drawGrid()

    // the food should only be drawn if visible
    if (food.visible){
        ctx.fillStyle = "red";
        // this multiplies the grid coordinates by the gridSize to render squares for food and snake segments
        // so for example tile 10 becomes pixel 200
        ctx.fillRect(
            food.x * GRID_SIZE,
            food.y * GRID_SIZE,
            GRID_SIZE, GRID_SIZE
        );
    }
    
    // draw the snake
    ctx.fillStyle = snakeColor;
    for (const segment of snake) {
        ctx.fillRect(
            segment.x * GRID_SIZE,
            segment.y * GRID_SIZE,
            GRID_SIZE, GRID_SIZE
        );
    }
};

// that the snake really moves foreward on the screen the functions need to be called every 150 ms
// it is important to call the drawGame because the array would change internally but the webpage would continue displaying the old frame
const gameLoop = () => {
    if (isGameOver || isPaused){
        return;
    }
    moveSnake();
    drawGame();
};


// GAME FLOW CONTROL

// Resets game variables
// used when starting a new game or restarting it
const resetGameState = () => {
    // this makes an array of coordinate objects. They represent the segments
    // Segment 0 so x:10, y:10 is the head
    snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];
    direction = { x: 1, y: 0 }; // snake initially always moves right
    score = 0;  // the score is resetted
    scoreDisplay.textContent = score; // and also displayed
    isPaused = false;   // the game is not paused
    isGameOver = false; // and notover
    isChangingDirection = false;    // the player can immediately turn if he wants

    gameOverOverlay.classList.remove("active"); // hides the game-over screen when starting a new game because the active class is removed
    pauseOverlay.classList.remove("active");    // this hides the pause scree because the active class is removed

    if (gameInterval) clearInterval(gameInterval);  // checks if the game is already running and stops the existing game loop so there are not multiple game loops running at the same time
    if (foodTimer) clearTimeout(foodTimer); // checks if a food timer is running and if so he stops it - important for ultra hard mode

    spawnFood();    // creates a new piece of food
    drawGame(); // draws the game
};

// Ifunctin for a completely new game
// called when the start button is pressed
const startGame = () => {
    // resetGameState();   // resetts all the game variables to their starting values
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, gameSpeed);    // the game loop is started and runs now repeatedly
};

// function that restarts the game and begins a new round
// called when the restart button is pressed or after game over
const restartGame = () => {
    resetGameState();   // resets the snake, score, direction, overlays and food
    startGame();
    // gameInterval = setInterval(gameLoop, gameSpeed);    // starts game loop again using the current game speed
};

// function to pause the current game but keeps the current game state
const pauseGame = () => {
    if (isGameOver || isPaused) return; // if the game is already over or already paused than nothing should happen
    isPaused = true;    // the game is now paused
    clearInterval(gameInterval);    // the game loop stops because the snake shpuld stop moving
    pauseOverlay.classList.add("active");   // adds the active class to show the pause overlay
};

// function to resume the game after a pause
// continues the game without resetting the snake or score
const resumeGame = () => {
    if (isGameOver || !isPaused) return;    // if the game is over or not in pause then there is nothing to do
    isPaused = false;   // the game should not be in oause
    pauseOverlay.classList.remove("active");    // removes the active class so the pause screen is not displayed
    startGame();
    // gameInterval = setInterval(gameLoop, gameSpeed);    // the current speed is used
};

// Function used to switch between the pasued and running states
// called when the player presses the spacebar
const togglePause = () => {
    if (isPaused) { // if the game is paused then resume it
        resumeGame();
    } else {    // if not then pasue it
        pauseGame();
    }
};

// functiob for the end of the game
// called when snake hits the wall or itselfe
const triggerGameOver = () => {
    isGameOver = true;  // the game is now over
    clearInterval(gameInterval);    // the game loop needs to be stopped
    if (foodTimer) clearTimeout(foodTimer); // the food timer should also stop if he runs
    
    playSound("die");   // the die sound is played
    finalScoreDisplay.textContent = score;  // the final score on teh gameover screen is displayed
    gameOverOverlay.classList.add("active");    // active class is added to make game over overlay visible
};

// EVENT LISTENERS

// the program needs to keep track of the keyboard and which key is pressed. This works the best with an EventListener
// he should listen to the entire webpage (thats the document for)and it is triggered when a key is pressed down (keydown - the other option would be keyup)
// the event is an object that is automatically created by the browser. He holds the metadata about the key press such as event.key
// an eventlistener for the spacebar. if its pressed the pause button is aktivated
document.addEventListener("keydown", (event) => {
    const gameScreen = document.getElementById("gameScreen");
    if (!gameScreen.classList.contains("active")) return;
    
    // it checks if the key pressed was the spacebar
    if (event.key === " " || event.code === "Space"){
        // if so then the default action of the webbrowser is stopped
        event.preventDefault();
        // the fucntion for handling the pasuing and unpausing is called
        togglePause();
        return
    }
    
    
    // the game should ignore every imput when the game is over, paused or ischangingdirection
    if (isGameOver || isPaused || isChangingDirection) return;
    
    // this checks if the key pressed was the Up Arrow and that the snake is not currently moving down
    // if boths true then the direction is updated
    if (event.key === "ArrowUp" && direction.y !== 1){
        direction = {x: 0, y: -1};
    }
    // this checks if the key pressed was Down Arrow and the snake is not currently moving up
    // if boths true then the direction is updated
    else if (event.key === "ArrowDown" && direction.y !== -1){
        direction = {x: 0, y: 1};
    } 
    // this checks if the key pressed was the Lef Arrow and the snake is not moving right
    // if boths true then the drection is updated
    else if (event.key === "ArrowLeft" && direction.x !== 1){
        direction = {x: -1, y: 0};
    }
    // checks if the key pressed down was Right Arrow and the snake is not moving left
    // if boths true the direction is updated
    else if (event.key === "ArrowRight" && direction.x !== -1){
        direction = {x: 1, y: 0};
    }
})

if (startBtn) startBtn.addEventListener("click", startGame);  // when the start button is clicked start the game
if (pauseBtn) pauseBtn.addEventListener("click", togglePause);    // if the pasue button is clicked pause the game
if (restartBtn) restartBtn.addEventListener("click", restartGame);  // when the restart button is clicket start the game again from the beginning

// SAVE SETTINGS CONFIGURATION

// this code is run when the save setting button is clicked
saveModeBtn.addEventListener("click", () => {
    soundEnabled = soundToggle.checked; // gets the current checked or unchecked state of the sound checkbox
    currentDifficulty = modeSelect.value;   // gets the current selected game mode from the dropdown
    
    // converts the speed slider into a number
    const speedVal = parseInt(speedRange.value, 10);
    gameSpeed = 220 - speedVal * 18;    // converts the slider value into a delay between 40ms and 202ms - the higher the slider value the faster the snake

    // checks if a game is currently running and has not ended
    if (gameInterval && !isGameOver && !isPaused) {
        clearInterval(gameInterval);    // stops old game interval
        gameInterval = setInterval(gameLoop, gameSpeed);    // starts new interval using the newly selected speed
    }
});