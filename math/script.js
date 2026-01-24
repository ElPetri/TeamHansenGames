const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const finalScoreEl = document.getElementById('final-score');
const problemLayer = document.getElementById('problem-layer');
const answerInput = document.getElementById('answer-input');
const submitBtn = document.getElementById('submit-btn');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over');
const restartBtn = document.getElementById('restart-btn');
const menuBtn = document.getElementById('menu-btn');

let gameMode = 'arithmetic';
let problems = [];
let score = 0;
let lives = 3;
let spawnTimer = 0;
let lastTime = 0;
let isRunning = false;
let speedBase = 30;

const modes = ['arithmetic', 'prealgebra', 'algebra', 'mixed'];

function resetGame() {
    problems = [];
    score = 0;
    lives = 3;
    spawnTimer = 0;
    lastTime = 0;
    speedBase = 30;
    scoreEl.innerText = score;
    livesEl.innerText = lives;
    problemLayer.innerHTML = '';
    answerInput.value = '';
}

function startGame() {
    resetGame();
    isRunning = true;
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    answerInput.focus();
    requestAnimationFrame(loop);
}

function endGame() {
    isRunning = false;
    finalScoreEl.innerText = score;
    gameOverScreen.classList.remove('hidden');
}

function returnToMenu() {
    isRunning = false;
    startScreen.classList.remove('hidden');
    gameOverScreen.classList.add('hidden');
    problems = [];
    problemLayer.innerHTML = '';
    answerInput.value = '';
}

function loop(timestamp) {
    if (!isRunning) return;
    if (!lastTime) lastTime = timestamp;
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    spawnTimer -= dt;
    if (spawnTimer <= 0) {
        spawnProblem();
        spawnTimer = Math.max(1.4, 3.0 - score / 250);
    }

    updateProblems(dt);
    requestAnimationFrame(loop);
}

function updateProblems(dt) {
    const height = window.innerHeight;
    problems.forEach(problem => {
        problem.y += problem.speed * dt;
        problem.el.style.transform = `translate(${problem.x}px, ${problem.y}px)`;
        if (problem.y > height - 120) {
            problem.el.classList.add('alarm');
        }
    });

    for (let i = problems.length - 1; i >= 0; i--) {
        const problem = problems[i];
        if (problem.y > height) {
            removeProblem(i);
            loseLife();
        }
    }
}

function removeProblem(index) {
    const [problem] = problems.splice(index, 1);
    if (problem) {
        problem.el.remove();
    }
}

function loseLife() {
    lives -= 1;
    livesEl.innerText = lives;
    if (lives <= 0) {
        endGame();
    }
}

function spawnProblem() {
    const width = window.innerWidth;
    const problemData = createProblem();
    const el = document.createElement('div');
    el.className = 'problem';
    el.textContent = problemData.question;
    problemLayer.appendChild(el);

    problems.push({
        ...problemData,
        el,
        x: Math.random() * (width - 200) + 40,
        y: -40,
        speed: speedBase + Math.random() * 18 + score / 16
    });
}

function createProblem() {
    const mode = gameMode === 'mixed' ? modes[Math.floor(Math.random() * 3)] : gameMode;
    switch (mode) {
        case 'prealgebra':
            return createPreAlgebra();
        case 'algebra':
            return createAlgebra();
        default:
            return createArithmetic();
    }
}

function createArithmetic() {
    const ops = ['+', '-', '×'];
    const a = rand(3, 20);
    const b = rand(2, 12);
    const op = ops[Math.floor(Math.random() * ops.length)];
    let answer = 0;
    if (op === '+') answer = a + b;
    if (op === '-') answer = a - b;
    if (op === '×') answer = a * b;
    return {
        question: `${a} ${op} ${b}`,
        answer: String(answer)
    };
}

function createPreAlgebra() {
    const a = rand(1, 9);
    const b = rand(1, 9);
    const sign = Math.random() > 0.5 ? '+' : '-';
    const answer = sign === '+' ? a + b : a - b;
    return {
        question: `${a}x ${sign} ${b}x = ?x`,
        answer: String(answer)
    };
}

function createAlgebra() {
    const x = rand(2, 9);
    const a = rand(2, 6);
    const b = rand(2, 12);
    const type = Math.random();

    if (type < 0.5) {
        const equation = `x + ${b} = ${x + b}`;
        return { question: equation, answer: String(x) };
    }

    const equation = `${a}x - ${b} = ${a * x - b}`;
    return { question: equation, answer: String(x) };
}

function submitAnswer() {
    if (!isRunning) return;
    const input = answerInput.value.trim();
    if (!input) return;

    let hitIndex = -1;
    for (let i = 0; i < problems.length; i++) {
        if (problems[i].answer === input) {
            hitIndex = i;
            break;
        }
    }

    if (hitIndex >= 0) {
        removeProblem(hitIndex);
        score += 10;
        scoreEl.innerText = score;
        speedBase = Math.min(70, speedBase + 0.6);
    }

    answerInput.value = '';
    answerInput.focus();
}

function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

submitBtn.addEventListener('click', submitAnswer);
answerInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitAnswer();
});

restartBtn.addEventListener('click', () => {
    startScreen.classList.remove('hidden');
    gameOverScreen.classList.add('hidden');
});

menuBtn.addEventListener('click', returnToMenu);

startScreen.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        gameMode = btn.dataset.mode;
        startGame();
    });
});
