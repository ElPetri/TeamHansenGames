let canvas, ctx, scoreEl, highScoreEl, finalScoreEl, startScreen, gameOverScreen, startBtn, restartBtn, pauseBtn, menuBtn;

const HIGH_SCORE_KEY = 'snakeNeon_highScore';
const CAPTURE_HIGH_SCORE_KEY = 'snakeCapture_highScore';
let gameMode = 'classic'; // 'classic' or 'capture'
let circles = [];
let enemies = [];
let circleRespawnTimers = [];
let enemyAccumulator = 0;
let pendingEnemyRespawns = 0;
const CIRCLE_COUNT = 50;
const ENEMY_SPEED_FACTOR = 0.65;
const MAX_ENEMIES = 16;
let captureState = {
    circlesEaten: 0,
    enemiesCaptured: 0,
    bestScore: 0,
    nextEnemyCount: 1
};

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
let touchStart = null;

function resizeCanvas() {
    const { innerWidth, innerHeight } = window;
    canvas.width = innerWidth;
    canvas.height = innerHeight;

    gridSize = Math.max(16, Math.floor(Math.min(innerWidth, innerHeight) / 30));
    cols = Math.floor(innerWidth / gridSize);
    rows = Math.floor(innerHeight / gridSize);
}

function setMode(mode) {
    gameMode = mode;
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    if (highScoreEl) {
        highScoreEl.innerText = mode === 'capture' ? getCaptureHighScore() : getHighScore();
    }
    startGame();
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

    if (gameMode === 'classic') {
        placeFood();
    } else if (gameMode === 'capture') {
        // Place 50 circles randomly
        circles = [];
        for (let i = 0; i < CIRCLE_COUNT; i++) {
            circles.push(randomCircle());
        }
        // Place one enemy
        enemies = [];
        spawnEnemies(1);
        circleRespawnTimers = [];
        enemyAccumulator = 0;
        pendingEnemyRespawns = 0;
        captureState.circlesEaten = 0;
        captureState.enemiesCaptured = 0;
        captureState.nextEnemyCount = 1;
    }
}

function isCellOccupied(x, y, { includePlayer = true, includeEnemies = true, includeCircles = true } = {}) {
    if (includePlayer && snake.some(seg => seg.x === x && seg.y === y)) return true;
    if (includeCircles && circles.some(c => c.x === x && c.y === y)) return true;
    if (includeEnemies) {
        for (let enemy of enemies) {
            if (enemy.segments && enemy.segments.some(seg => seg.x === x && seg.y === y)) return true;
        }
    }
    return false;
}

function randomCircle() {
    let valid = false, x, y;
    while (!valid) {
        x = Math.floor(Math.random() * cols);
        y = Math.floor(Math.random() * rows);
        valid = !isCellOccupied(x, y, { includePlayer: true, includeEnemies: true, includeCircles: true });
    }
    return { x, y };
}

function randomEnemy() {
    let valid = false, x, y;
    const dirs = [
        { x: 1, y: 0 }, { x: -1, y: 0 },
        { x: 0, y: 1 }, { x: 0, y: -1 }
    ];
    let dir = dirs[Math.floor(Math.random() * dirs.length)];
    let attempts = 0;
    while (!valid && attempts < 200) {
        attempts += 1;
        // Ensure room for 3-segment enemy snake
        if (dir.x === 1) x = Math.floor(Math.random() * (cols - 2)) + 2;
        if (dir.x === -1) x = Math.floor(Math.random() * (cols - 2));
        if (dir.y === 1) y = Math.floor(Math.random() * (rows - 2)) + 2;
        if (dir.y === -1) y = Math.floor(Math.random() * (rows - 2));
        if (dir.x === 0) x = Math.floor(Math.random() * cols);
        if (dir.y === 0) y = Math.floor(Math.random() * rows);

        const segments = [
            { x, y },
            { x: x - dir.x, y: y - dir.y },
            { x: x - dir.x * 2, y: y - dir.y * 2 }
        ];

        valid = segments.every(seg => !isCellOccupied(seg.x, seg.y, { includePlayer: true, includeEnemies: true, includeCircles: false }));
        if (valid) {
            // Remove any circles under the enemy spawn
            circles = circles.filter(c => !segments.some(seg => seg.x === c.x && seg.y === c.y));
            return { segments, dir, grow: 0 };
        }
        dir = dirs[Math.floor(Math.random() * dirs.length)];
    }
    return null;
}

function spawnEnemies(count) {
    let spawned = 0;
    while (spawned < count && enemies.length < MAX_ENEMIES) {
        const enemy = randomEnemy();
        if (!enemy) break;
        enemies.push(enemy);
        spawned += 1;
    }
    return spawned;
}

function attemptPendingEnemyRespawns() {
    if (pendingEnemyRespawns > 0) {
        const spawned = spawnEnemies(pendingEnemyRespawns);
        pendingEnemyRespawns = Math.max(0, pendingEnemyRespawns - spawned);
    }
}

function scheduleCircleRespawn() {
    circleRespawnTimers.push(1 + Math.random() * 9);
}

function updateCircleRespawns(delta) {
    for (let i = circleRespawnTimers.length - 1; i >= 0; i--) {
        circleRespawnTimers[i] -= delta;
        if (circleRespawnTimers[i] <= 0) {
            if (circles.length < CIRCLE_COUNT) {
                circles.push(randomCircle());
            }
            circleRespawnTimers.splice(i, 1);
        }
    }
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
    if (gameMode === 'capture') {
        enemyAccumulator += delta;
        updateCircleRespawns(delta);
        attemptPendingEnemyRespawns();
    }
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

        if (gameMode === 'classic') {
            if (newHead.x === food.x && newHead.y === food.y) {
                score += 10;
                scoreEl.innerText = score;
                placeFood();
                speed = Math.min(14, speed + 0.1);
            } else {
                snake.pop();
            }
        } else if (gameMode === 'capture') {
            // Eat circles
            let ateCircle = false;
            for (let i = 0; i < circles.length; i++) {
                if (circles[i].x === newHead.x && circles[i].y === newHead.y) {
                    circles.splice(i, 1);
                    captureState.circlesEaten++;
                    score += 1;
                    scoreEl.innerText = score;
                    scheduleCircleRespawn();
                    ateCircle = true;
                    break;
                }
            }
            if (!ateCircle) snake.pop();

            // Collision with enemy segments
            for (let enemy of enemies) {
                if (enemy.segments.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
                    endGame();
                    return;
                }
            }

            // Encirclement detection (continuous)
            for (let e = enemies.length - 1; e >= 0; e--) {
                if (isEnemyEncircled(enemies[e])) {
                    triggerCaptureEffect(enemies[e]);
                    enemies.splice(e, 1);
                    captureState.enemiesCaptured++;
                    score += 10;
                    scoreEl.innerText = score;
                    for (let b = 0; b < 10; b++) scheduleCircleRespawn();
                    for (let l = 0; l < 10; l++) snake.push({ ...snake[snake.length - 1] });
                    captureState.nextEnemyCount = Math.min(MAX_ENEMIES, captureState.nextEnemyCount * 2);
                }
            }
        }
    }

    if (gameMode === 'capture') {
        const enemyStep = 1 / (speed * ENEMY_SPEED_FACTOR);
        while (enemyAccumulator >= enemyStep) {
            enemyAccumulator -= enemyStep;
            let respawnCount = 0;
            for (let i = enemies.length - 1; i >= 0; i--) {
                const enemy = enemies[i];
                const dirs = [
                    { x: 1, y: 0 }, { x: -1, y: 0 },
                    { x: 0, y: 1 }, { x: 0, y: -1 }
                ];
                const tail = enemy.segments[enemy.segments.length - 1];
                const validDirs = dirs.filter(dir => {
                    const nx = enemy.segments[0].x + dir.x;
                    const ny = enemy.segments[0].y + dir.y;
                    if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) return false;
                    if (snake.some(seg => seg.x === nx && seg.y === ny)) return false;
                    if (enemy.segments.some(seg => seg.x === nx && seg.y === ny)) {
                        // Allow moving into tail only if it will move away
                        return enemy.grow === 0 && tail.x === nx && tail.y === ny;
                    }
                    for (let j = 0; j < enemies.length; j++) {
                        if (j === i) continue;
                        if (enemies[j].segments.some(seg => seg.x === nx && seg.y === ny)) return false;
                    }
                    return true;
                });

                if (validDirs.length === 0) {
                    // No valid move this tick: enemy dies and respawns
                    enemies.splice(i, 1);
                    respawnCount += 2;
                    continue;
                }

                if (Math.random() < 0.2 || !validDirs.some(d => d.x === enemy.dir.x && d.y === enemy.dir.y)) {
                    enemy.dir = validDirs[Math.floor(Math.random() * validDirs.length)];
                }
                const nextHead = {
                    x: enemy.segments[0].x + enemy.dir.x,
                    y: enemy.segments[0].y + enemy.dir.y
                };

                // Enemy dies if it overlaps player or itself
                if (snake.some(seg => seg.x === nextHead.x && seg.y === nextHead.y) ||
                    enemy.segments.some(seg => seg.x === nextHead.x && seg.y === nextHead.y)) {
                    enemies.splice(i, 1);
                    respawnCount += 2;
                    continue;
                }

                // Enemy dies if it overlaps another enemy
                let hitOther = false;
                for (let j = 0; j < enemies.length; j++) {
                    if (j === i) continue;
                    if (enemies[j].segments.some(seg => seg.x === nextHead.x && seg.y === nextHead.y)) {
                        hitOther = true;
                        break;
                    }
                }
                if (hitOther) {
                    enemies.splice(i, 1);
                    respawnCount += 2;
                    continue;
                }

                enemy.segments.unshift(nextHead);

                // Enemy eats circles
                let ate = false;
                for (let i = 0; i < circles.length; i++) {
                    if (circles[i].x === nextHead.x && circles[i].y === nextHead.y) {
                        circles.splice(i, 1);
                        scheduleCircleRespawn();
                        enemy.grow += 1;
                        ate = true;
                        break;
                    }
                }
                if (!ate && enemy.grow > 0) {
                    enemy.grow -= 1;
                } else if (!ate) {
                    enemy.segments.pop();
                }

                // Enemy collides with player head
                if (enemy.segments[0].x === snake[0].x && enemy.segments[0].y === snake[0].y) {
                    endGame();
                    return;
                }
            }
            if (respawnCount > 0) {
                pendingEnemyRespawns += respawnCount;
            }
            attemptPendingEnemyRespawns();
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

    if (gameMode === 'classic') {
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
    } else if (gameMode === 'capture') {
        // Draw circles
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ff00ff';
        for (let c of circles) {
            ctx.fillStyle = '#ff00ff';
            ctx.beginPath();
            ctx.arc(c.x * gridSize + gridSize / 2, c.y * gridSize + gridSize / 2, gridSize * 0.35, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;

        // Draw enemies (distinct colored snake)
        for (let enemy of enemies) {
            enemy.segments.forEach((seg, idx) => {
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#bd00ff';
                ctx.fillStyle = idx === 0 ? '#bd00ff' : '#8b00cc';
                ctx.fillRect(seg.x * gridSize + 2, seg.y * gridSize + 2, gridSize - 4, gridSize - 4);
                ctx.shadowBlur = 0;
            });
        }

        // Draw snake
        let loopGlow = false;
        if (gameMode === 'capture' && snake.length > 4) {
            // Check if last loop formed
            for (let enemy of enemies) {
                if (isEnemyEncircled(enemy)) {
                    loopGlow = true;
                    break;
                }
            }
        }
        ctx.shadowBlur = loopGlow ? 30 : 15;
        ctx.shadowColor = loopGlow ? '#fff600' : '#00ff66';
        snake.forEach((segment, index) => {
            ctx.fillStyle = index === 0 ? '#00ff66' : '#00b35a';
            ctx.fillRect(segment.x * gridSize + 2, segment.y * gridSize + 2, gridSize - 4, gridSize - 4);
        });
        ctx.shadowBlur = 0;

        // Draw particles (capture effect)
        drawParticles();
    }
}

// Point-in-polygon test for encirclement
function isEnemyEncircled(enemy) {
    if (snake.length < 6) return false;
    const head = enemy.segments[0];
    if (snake.some(seg => seg.x === head.x && seg.y === head.y)) return false;

    const queue = [{ x: head.x, y: head.y }];
    const visited = new Set([`${head.x},${head.y}`]);
    const isBlocked = (x, y) => snake.some(seg => seg.x === x && seg.y === y);

    while (queue.length) {
        const { x, y } = queue.shift();
        if (x === 0 || y === 0 || x === cols - 1 || y === rows - 1) return false;

        const neighbors = [
            { x: x + 1, y },
            { x: x - 1, y },
            { x, y: y + 1 },
            { x, y: y - 1 }
        ];
        for (const n of neighbors) {
            if (n.x < 0 || n.x >= cols || n.y < 0 || n.y >= rows) continue;
            const key = `${n.x},${n.y}`;
            if (visited.has(key)) continue;
            if (isBlocked(n.x, n.y)) continue;
            visited.add(key);
            queue.push(n);
        }
    }

    return true;
}

// Particle effect for enemy capture
let particles = [];
function triggerCaptureEffect(enemy) {
    const head = enemy.segments[0];
    for (let i = 0; i < 30; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 2;
        particles.push({
            x: head.x * gridSize + gridSize / 2,
            y: head.y * gridSize + gridSize / 2,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 30 + Math.random() * 20
        });
    }
}

function drawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life / 50);
        ctx.fillStyle = '#fff600';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.life <= 0) particles.splice(i, 1);
    }
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
    if (startScreen) startScreen.classList.add('hidden');
    if (gameOverScreen) gameOverScreen.classList.add('hidden');
    requestAnimationFrame(loop);
}

function endGame() {
    isRunning = false;
    finalScoreEl.innerText = score;
    if (gameMode === 'classic') {
        const highScore = Math.max(getHighScore(), score);
        localStorage.setItem(HIGH_SCORE_KEY, String(highScore));
        highScoreEl.innerText = highScore;
    } else if (gameMode === 'capture') {
        const highScore = Math.max(getCaptureHighScore(), score);
        localStorage.setItem(CAPTURE_HIGH_SCORE_KEY, String(highScore));
        highScoreEl.innerText = highScore;
    }
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

function getCaptureHighScore() {
    return parseInt(localStorage.getItem(CAPTURE_HIGH_SCORE_KEY) || '0', 10);
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

function handleSwipe(start, end) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    if (Math.abs(dx) < 12 && Math.abs(dy) < 12) return;
    if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0 && direction.x === 0) nextDirection = { x: 1, y: 0 };
        if (dx < 0 && direction.x === 0) nextDirection = { x: -1, y: 0 };
    } else {
        if (dy > 0 && direction.y === 0) nextDirection = { x: 0, y: 1 };
        if (dy < 0 && direction.y === 0) nextDirection = { x: 0, y: -1 };
    }
}

window.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    scoreEl = document.getElementById('score');
    highScoreEl = document.getElementById('high-score');
    finalScoreEl = document.getElementById('final-score');
    startScreen = document.getElementById('start-screen');
    gameOverScreen = document.getElementById('game-over');
    startBtn = document.getElementById('start-btn');
    restartBtn = document.getElementById('restart-btn');
    pauseBtn = document.getElementById('pause-btn');
    menuBtn = document.getElementById('menu-btn');

    const classicBtn = document.getElementById('classic-btn');
    const captureBtn = document.getElementById('capture-btn');
    if (classicBtn && captureBtn) {
        classicBtn.addEventListener('click', () => setMode('classic'));
        captureBtn.addEventListener('click', () => setMode('capture'));
    }
    if (startBtn) startBtn.addEventListener('click', startGame);
    if (restartBtn) restartBtn.addEventListener('click', startGame);
    if (pauseBtn) pauseBtn.addEventListener('click', togglePause);
    if (menuBtn) menuBtn.addEventListener('click', returnToMenu);
    highScoreEl.innerText = gameMode === 'capture' ? getCaptureHighScore() : getHighScore();
    resizeCanvas();
    draw();
    window.addEventListener('keydown', handleKey);
    canvas.addEventListener('pointerdown', (event) => {
        if (event.pointerType === 'mouse') return;
        touchStart = { x: event.clientX, y: event.clientY };
        canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener('pointermove', (event) => {
        if (!touchStart) return;
        const current = { x: event.clientX, y: event.clientY };
        handleSwipe(touchStart, current);
        touchStart = current;
    });
    canvas.addEventListener('pointerup', () => {
        touchStart = null;
    });
});
