const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('high-score');
const finalScoreEl = document.getElementById('final-score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const pauseBtn = document.getElementById('pause-btn');
const menuBtn = document.getElementById('menu-btn');

const HIGH_SCORE_KEY = 'snakeNeon_highScore';

let gridSize = 20;
let cols = 0;
let rows = 0;
let snake = [];
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let food = { x: 10, y: 10 };
let score = 0;
let isRunning = false;
let isPaused = false;
let accumulator = 0;
let lastTime = 0;
let speed = 8; // moves per second

function resizeCanvas() {
    const { innerWidth, innerHeight } = window;
    canvas.width = innerWidth;
    canvas.height = innerHeight;

    gridSize = Math.max(16, Math.floor(Math.min(innerWidth, innerHeight) / 30));
    cols = Math.floor(innerWidth / gridSize);
    rows = Math.floor(innerHeight / gridSize);
}

window.addEventListener('resize', () => {
    resizeCanvas();
    draw();
});

function initGame() {
    score = 0;
    scoreEl.innerText = score;
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };

    const startX = Math.floor(cols / 2);
    const startY = Math.floor(rows / 2);
    snake = [
        { x: startX, y: startY },
        { x: startX - 1, y: startY },
        { x: startX - 2, y: startY }
    ];

    placeFood();
}

function placeFood() {
    let valid = false;
    while (!valid) {
        food.x = Math.floor(Math.random() * cols);
        food.y = Math.floor(Math.random() * rows);
        valid = !snake.some(segment => segment.x === food.x && segment.y === food.y);
    }
}

function update(delta) {
    accumulator += delta;
    const step = 1 / speed;

    while (accumulator >= step) {
        accumulator -= step;
        direction = nextDirection;
        const head = snake[0];
        const newHead = { x: head.x + direction.x, y: head.y + direction.y };

        if (newHead.x < 0 || newHead.x >= cols || newHead.y < 0 || newHead.y >= rows) {
            endGame();
            return;
        }

        if (snake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
            endGame();
            return;
        }

        snake.unshift(newHead);

        if (newHead.x === food.x && newHead.y === food.y) {
            score += 10;
            scoreEl.innerText = score;
            placeFood();
            speed = Math.min(14, speed + 0.1);
        } else {
            snake.pop();
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(0, 243, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= cols; x++) {
        ctx.beginPath();
        ctx.moveTo(x * gridSize, 0);
        ctx.lineTo(x * gridSize, rows * gridSize);
        ctx.stroke();
    }
    for (let y = 0; y <= rows; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * gridSize);
        ctx.lineTo(cols * gridSize, y * gridSize);
        ctx.stroke();
    }

    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00ff66';
    snake.forEach((segment, index) => {
        ctx.fillStyle = index === 0 ? '#00ff66' : '#00b35a';
        ctx.fillRect(segment.x * gridSize + 2, segment.y * gridSize + 2, gridSize - 4, gridSize - 4);
    });
    ctx.shadowBlur = 0;

    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ff00ff';
    ctx.fillStyle = '#ff00ff';
    ctx.beginPath();
    ctx.arc(food.x * gridSize + gridSize / 2, food.y * gridSize + gridSize / 2, gridSize * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

function loop(timestamp) {
    if (!isRunning) return;
    if (!lastTime) lastTime = timestamp;
    const delta = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    if (!isPaused) {
        update(delta);
        draw();
    }

    requestAnimationFrame(loop);
}

function startGame() {
    resizeCanvas();
    initGame();
    isRunning = true;
    isPaused = false;
    speed = 8;
    accumulator = 0;
    lastTime = 0;
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    requestAnimationFrame(loop);
}

function endGame() {
    isRunning = false;
    finalScoreEl.innerText = score;
    const highScore = Math.max(getHighScore(), score);
    localStorage.setItem(HIGH_SCORE_KEY, String(highScore));
    highScoreEl.innerText = highScore;
    gameOverScreen.classList.remove('hidden');
}

function togglePause() {
    if (!isRunning) return;
    isPaused = !isPaused;
    pauseBtn.innerText = isPaused ? '▶' : '⏸';
}

function returnToMenu() {
    isRunning = false;
    isPaused = false;
    pauseBtn.innerText = '⏸';
    startScreen.classList.remove('hidden');
    gameOverScreen.classList.add('hidden');
}

function getHighScore() {
    return parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10);
}

function handleKey(e) {
    const key = e.code;
    if (key === 'Space') {
        togglePause();
        return;
    }

    if (key === 'ArrowUp' || key === 'KeyW') {
        if (direction.y === 0) nextDirection = { x: 0, y: -1 };
    } else if (key === 'ArrowDown' || key === 'KeyS') {
        if (direction.y === 0) nextDirection = { x: 0, y: 1 };
    } else if (key === 'ArrowLeft' || key === 'KeyA') {
        if (direction.x === 0) nextDirection = { x: -1, y: 0 };
    } else if (key === 'ArrowRight' || key === 'KeyD') {
        if (direction.x === 0) nextDirection = { x: 1, y: 0 };
    }
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', togglePause);
menuBtn.addEventListener('click', returnToMenu);
window.addEventListener('keydown', handleKey);

highScoreEl.innerText = getHighScore();
resizeCanvas();
draw();
