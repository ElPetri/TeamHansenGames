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
const modeSelect = startScreen.querySelector('.mode-select');
const gradeSelect = startScreen.querySelector('.grade-select');
const changeGradeBtn = document.getElementById('change-grade-btn');

let gameMode = 'arithmetic';
let selectedGrade = null;
let problems = [];
let score = 0;
let lives = 3;
let spawnTimer = 0;
let lastTime = 0;
let isRunning = false;
let speedBase = 30;

const modes = ['arithmetic', 'prealgebra', 'algebra', 'mixed'];
const GRADE_TIERS = {
    k2: {
        unlockedModes: ['arithmetic'],
        speedBase: 18,
        speedCap: 45,
        spawnFloor: 2.0,
        arithmetic: { ops: ['+', '-'], aRange: [1, 10], bRange: [1, 10], allowNegatives: false },
        preAlgebra: { coeffRange: [1, 6] },
        algebra: { xRange: [2, 8], aRange: [2, 5], bRange: [2, 10] }
    },
    '34': {
        unlockedModes: ['arithmetic'],
        speedBase: 22,
        speedCap: 70,
        spawnFloor: 1.8,
        arithmetic: { ops: ['+', '-', '×'], aRange: [3, 20], bRange: [2, 12], allowNegatives: true },
        preAlgebra: { coeffRange: [1, 9] },
        algebra: { xRange: [2, 9], aRange: [2, 6], bRange: [2, 12] }
    },
    '56': {
        unlockedModes: ['arithmetic', 'prealgebra'],
        speedBase: 26,
        speedCap: 70,
        spawnFloor: 1.4,
        arithmetic: { ops: ['+', '-', '×'], aRange: [3, 20], bRange: [2, 12], allowNegatives: true },
        preAlgebra: { coeffRange: [1, 9] },
        algebra: { xRange: [2, 9], aRange: [2, 6], bRange: [2, 12] }
    },
    '78': {
        unlockedModes: ['arithmetic', 'prealgebra', 'algebra'],
        speedBase: 30,
        speedCap: 70,
        spawnFloor: 1.4,
        arithmetic: { ops: ['+', '-', '×'], aRange: [3, 20], bRange: [2, 12], allowNegatives: true },
        preAlgebra: { coeffRange: [1, 9] },
        algebra: { xRange: [2, 9], aRange: [2, 6], bRange: [2, 12] }
    },
    '9+': {
        unlockedModes: ['arithmetic', 'prealgebra', 'algebra', 'mixed'],
        speedBase: 30,
        speedCap: 70,
        spawnFloor: 1.4,
        arithmetic: { ops: ['+', '-', '×'], aRange: [3, 24], bRange: [2, 14], allowNegatives: true },
        preAlgebra: { coeffRange: [1, 12] },
        algebra: { xRange: [2, 12], aRange: [2, 8], bRange: [2, 18] }
    }
};

function getTier() {
    return GRADE_TIERS[selectedGrade] || GRADE_TIERS['78'];
}

function showGradeSelection() {
    gradeSelect.classList.remove('hidden');
    modeSelect.classList.add('hidden');
    changeGradeBtn.classList.add('hidden');
}

function showModeSelection() {
    gradeSelect.classList.add('hidden');
    modeSelect.classList.remove('hidden');
    changeGradeBtn.classList.remove('hidden');
}

function applyGradeToModes() {
    const tier = getTier();
    startScreen.querySelectorAll('.mode-btn').forEach(btn => {
        const mode = btn.dataset.mode;
        btn.classList.toggle('locked', !tier.unlockedModes.includes(mode));
    });
}

function resetGame() {
    const tier = getTier();
    problems = [];
    score = 0;
    lives = 3;
    spawnTimer = 0;
    lastTime = 0;
    speedBase = tier.speedBase;
    scoreEl.innerText = score;
    livesEl.innerText = lives;
    problemLayer.innerHTML = '';
    answerInput.value = '';
}

function startGame() {
    if (!selectedGrade) return;
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
    selectedGrade = null;
    startScreen.classList.remove('hidden');
    gameOverScreen.classList.add('hidden');
    problems = [];
    problemLayer.innerHTML = '';
    answerInput.value = '';
    showGradeSelection();
}

function loop(timestamp) {
    if (!isRunning) return;
    if (!lastTime) lastTime = timestamp;
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    spawnTimer -= dt;
    if (spawnTimer <= 0) {
        spawnProblem();
        spawnTimer = Math.max(getTier().spawnFloor, 3.0 - score / 250);
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
    const tier = getTier();
    const mixedPool = tier.unlockedModes.filter(mode => mode !== 'mixed');
    const mode = gameMode === 'mixed'
        ? mixedPool[Math.floor(Math.random() * mixedPool.length)]
        : gameMode;
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
    const settings = getTier().arithmetic;
    const ops = settings.ops;
    let a = rand(settings.aRange[0], settings.aRange[1]);
    let b = rand(settings.bRange[0], settings.bRange[1]);
    const op = ops[Math.floor(Math.random() * ops.length)];

    if (op === '-' && !settings.allowNegatives && a < b) {
        [a, b] = [b, a];
    }

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
    const range = getTier().preAlgebra.coeffRange;
    const a = rand(range[0], range[1]);
    const b = rand(range[0], range[1]);
    const sign = Math.random() > 0.5 ? '+' : '-';
    const answer = sign === '+' ? a + b : a - b;
    return {
        question: `${a}x ${sign} ${b}x = ?x`,
        answer: String(answer)
    };
}

function createAlgebra() {
    const settings = getTier().algebra;
    const x = rand(settings.xRange[0], settings.xRange[1]);
    const a = rand(settings.aRange[0], settings.aRange[1]);
    const b = rand(settings.bRange[0], settings.bRange[1]);
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
        speedBase = Math.min(getTier().speedCap, speedBase + 0.6);
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

restartBtn.addEventListener('click', returnToMenu);

menuBtn.addEventListener('click', returnToMenu);

startScreen.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (btn.classList.contains('locked') || !selectedGrade) return;
        gameMode = btn.dataset.mode;
        startGame();
    });
});

startScreen.querySelectorAll('.grade-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        selectedGrade = btn.dataset.grade;
        applyGradeToModes();
        showModeSelection();
    });
});

changeGradeBtn.addEventListener('click', () => {
    selectedGrade = null;
    showGradeSelection();
});

showGradeSelection();
