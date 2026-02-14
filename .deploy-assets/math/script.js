const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const streakEl = document.getElementById('streak');
const finalScoreEl = document.getElementById('final-score');
const bestScoreStartEl = document.getElementById('best-score-start');
const bestScoreOverEl = document.getElementById('best-score-over');
const problemLayer = document.getElementById('problem-layer');
const answerInput = document.getElementById('answer-input');
const submitBtn = document.getElementById('submit-btn');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over');
const restartBtn = document.getElementById('restart-btn');
const menuBtn = document.getElementById('menu-btn');
const gameContainer = document.getElementById('game-container');
const eventBanner = document.getElementById('event-banner');
const modeSelect = startScreen.querySelector('.mode-select');
const gradeSelect = startScreen.querySelector('.grade-select');
const changeGradeBtn = document.getElementById('change-grade-btn');
const playerNameInput = document.getElementById('player-name');
const nameErrorEl = document.getElementById('name-error');
const saveScoreBtn = document.getElementById('save-score-btn');
const globalLeaderboardEl = document.getElementById('global-leaderboard');

const HIGH_SCORE_KEY = 'mathBlaster_bestScore';
const MAX_LIVES = 5;

let gameMode = 'arithmetic';
let selectedGrade = null;
let problems = [];
let score = 0;
let lives = 3;
let streak = 0;
let level = 1;
let spawnTimer = 0;
let lastTime = 0;
let isRunning = false;
let speedBase = 30;
let freezeUntil = 0;
let bannerTimeout = null;
let hitFlashTimeout = null;
let freezeFlashTimeout = null;
let bestScore = loadBestScore();

const GRADE_TIERS = {
    k2: {
        unlockedModes: ['arithmetic'],
        speedBase: 16,
        speedCap: 45,
        speedStep: 0.2,
        spawnStart: 3.6,
        spawnFloor: 2.4,
        maxOnScreen: 3,
        speedJitter: 8,
        scoreSpeedDiv: 80,
        arithmetic: { ops: ['+', '-'], aRange: [1, 10], bRange: [1, 10], allowNegatives: false },
        preAlgebra: { coeffRange: [1, 6] },
        algebra: { xRange: [2, 8], aRange: [2, 5], bRange: [2, 10] }
    },
    '34': {
        unlockedModes: ['arithmetic'],
        speedBase: 20,
        speedCap: 60,
        speedStep: 0.25,
        spawnStart: 3.4,
        spawnFloor: 2.0,
        maxOnScreen: 3,
        speedJitter: 10,
        scoreSpeedDiv: 65,
        arithmetic: { ops: ['+', '-', '×'], aRange: [3, 20], bRange: [2, 12], allowNegatives: true },
        preAlgebra: { coeffRange: [1, 9] },
        algebra: { xRange: [2, 9], aRange: [2, 6], bRange: [2, 12] }
    },
    '56': {
        unlockedModes: ['arithmetic', 'prealgebra'],
        speedBase: 24,
        speedCap: 70,
        speedStep: 0.3,
        spawnStart: 3.2,
        spawnFloor: 1.8,
        maxOnScreen: 4,
        speedJitter: 12,
        scoreSpeedDiv: 55,
        arithmetic: { ops: ['+', '-', '×'], aRange: [3, 20], bRange: [2, 12], allowNegatives: true },
        preAlgebra: { coeffRange: [1, 9] },
        algebra: { xRange: [2, 9], aRange: [2, 6], bRange: [2, 12] }
    },
    '78': {
        unlockedModes: ['arithmetic', 'prealgebra', 'algebra'],
        speedBase: 28,
        speedCap: 70,
        speedStep: 0.3,
        spawnStart: 3.1,
        spawnFloor: 1.6,
        maxOnScreen: 4,
        speedJitter: 14,
        scoreSpeedDiv: 48,
        arithmetic: { ops: ['+', '-', '×'], aRange: [3, 20], bRange: [2, 12], allowNegatives: true },
        preAlgebra: { coeffRange: [1, 9] },
        algebra: { xRange: [2, 9], aRange: [2, 6], bRange: [2, 12] }
    },
    '9+': {
        unlockedModes: ['arithmetic', 'prealgebra', 'algebra', 'mixed'],
        speedBase: 30,
        speedCap: 70,
        speedStep: 0.3,
        spawnStart: 3.0,
        spawnFloor: 1.4,
        maxOnScreen: 4,
        speedJitter: 16,
        scoreSpeedDiv: 40,
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
    requestAnimationFrame(() => {
        modeSelect.classList.remove('hidden');
    });
    changeGradeBtn.classList.remove('hidden');
}

function renderGlobalLeaderboard() {
    if (!window.LeaderboardAPI || !globalLeaderboardEl) return;
    const playerName = (playerNameInput && playerNameInput.value) || window.LeaderboardAPI.getSavedName() || '';
    window.LeaderboardAPI.renderTabbedLeaderboard({
        container: globalLeaderboardEl,
        game: 'math',
        mode: 'standard',
        playerName
    });
}

function applyGradeToModes() {
    const tier = getTier();
    startScreen.querySelectorAll('.mode-btn').forEach(btn => {
        const mode = btn.dataset.mode;
        btn.classList.toggle('locked', !tier.unlockedModes.includes(mode));
    });
}

function loadBestScore() {
    try {
        const raw = localStorage.getItem(HIGH_SCORE_KEY);
        const value = Number.parseInt(raw || '0', 10);
        return Number.isFinite(value) ? value : 0;
    } catch {
        return 0;
    }
}

function saveBestScore(value) {
    try {
        localStorage.setItem(HIGH_SCORE_KEY, String(value));
    } catch {
        // Ignore storage errors on restricted/private mobile browsers.
    }
}

function onPress(el, handler) {
    let lastPressTs = 0;

    el.addEventListener('pointerup', (event) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        lastPressTs = Date.now();
        handler(event);
    });

    el.addEventListener('click', (event) => {
        if (Date.now() - lastPressTs < 350) return;
        handler(event);
    });
}

function updateBestScoreUI() {
    bestScoreStartEl.innerText = bestScore;
    bestScoreOverEl.innerText = bestScore;
}

function updateStreakUI() {
    streakEl.innerText = streak;
}

function showBanner(message, type = '') {
    if (bannerTimeout) clearTimeout(bannerTimeout);
    eventBanner.textContent = message;
    eventBanner.className = `event-banner ${type}`.trim();
    eventBanner.classList.remove('hidden');
    bannerTimeout = setTimeout(() => {
        eventBanner.classList.add('hidden');
    }, 1400);
}

function triggerHitFlash() {
    if (hitFlashTimeout) clearTimeout(hitFlashTimeout);
    gameContainer.classList.add('hit-flash');
    hitFlashTimeout = setTimeout(() => {
        gameContainer.classList.remove('hit-flash');
    }, 130);
}

function triggerFreezeFlash() {
    if (freezeFlashTimeout) clearTimeout(freezeFlashTimeout);
    gameContainer.classList.add('freeze-flash');
    freezeFlashTimeout = setTimeout(() => {
        gameContainer.classList.remove('freeze-flash');
    }, 260);
}

function shakeInput() {
    answerInput.classList.remove('shake');
    void answerInput.offsetWidth;
    answerInput.classList.add('shake');
}

function getSpawnInterval() {
    const tier = getTier();
    return Math.max(tier.spawnFloor, tier.spawnStart - score / 500);
}

function tryLevelUp() {
    const nextLevel = Math.floor(score / 100) + 1;
    if (nextLevel > level) {
        level = nextLevel;
        showBanner(`Level ${level}!`, 'level');
    }
}

function activateFreeze(ms) {
    freezeUntil = Math.max(freezeUntil, performance.now() + ms);
    showBanner('⏸ Freeze Activated (3s)', 'freeze');
    triggerFreezeFlash();
}

function resetStreak() {
    streak = 0;
    updateStreakUI();
}

const PARTICLE_COLORS = ['#00ff66', '#00f3ff', '#ff00ff', '#ffe44d', '#ff8800', '#ffffff'];

function launchRocket(problem) {
    if (!problem) return;
    problem.targeted = true;
    problem.el.classList.add('targeted');

    const rocket = document.createElement('div');
    rocket.className = 'rocket';
    problemLayer.appendChild(rocket);

    const startX = window.innerWidth / 2;
    const startY = window.innerHeight - 74;
    const rect = problem.el.getBoundingClientRect();
    const targetX = rect.left + rect.width / 2;
    const targetY = rect.top + rect.height / 2;
    const dx = targetX - startX;
    const dy = targetY - startY;
    const angle = Math.atan2(dx, -dy);

    rocket.style.left = `${startX}px`;
    rocket.style.top = `${startY}px`;
    rocket.style.setProperty('--angle', `${angle}rad`);

    const startTime = performance.now();
    const duration = 320;

    function animate(now) {
        const t = Math.min(1, (now - startTime) / duration);
        const ease = 1 - (1 - t) * (1 - t);
        rocket.style.left = `${startX + dx * ease}px`;
        rocket.style.top = `${startY + dy * ease}px`;

        if (t < 1) {
            requestAnimationFrame(animate);
            return;
        }

        rocket.remove();
        explodeAt(targetX, targetY);

        const index = problems.indexOf(problem);
        if (index >= 0) {
            removeProblem(index);
        } else {
            problem.el.remove();
        }
    }

    requestAnimationFrame(animate);
}

function explodeAt(x, y) {
    const particleCount = 14;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'explosion-particle';

        const angle = (i / particleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
        const distance = 26 + Math.random() * 56;
        const size = 4 + Math.random() * 5;

        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.background = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
        particle.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
        particle.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);

        problemLayer.appendChild(particle);
        particle.addEventListener('animationend', () => particle.remove(), { once: true });
    }
}

function resetGame() {
    const tier = getTier();
    problems = [];
    score = 0;
    lives = 3;
    streak = 0;
    level = 1;
    freezeUntil = 0;
    spawnTimer = 1.25;
    lastTime = 0;
    speedBase = tier.speedBase;
    scoreEl.innerText = score;
    livesEl.innerText = lives;
    updateStreakUI();
    problemLayer.innerHTML = '';
    answerInput.value = '';
    eventBanner.classList.add('hidden');
    updateBestScoreUI();
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
    if (score > bestScore) {
        bestScore = score;
        saveBestScore(bestScore);
    }
    updateBestScoreUI();
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
    eventBanner.classList.add('hidden');
    gameContainer.classList.remove('hit-flash', 'freeze-flash');
    showGradeSelection();
    updateBestScoreUI();
    renderGlobalLeaderboard();
}

function loop(timestamp) {
    if (!isRunning) return;
    if (!lastTime) lastTime = timestamp;
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    const isFrozen = timestamp < freezeUntil;

    spawnTimer -= dt;
    if (spawnTimer <= 0) {
        if (!isFrozen && problems.length < getTier().maxOnScreen) {
            spawnProblem();
        }
        spawnTimer = getSpawnInterval();
    }

    updateProblems(dt, isFrozen);
    requestAnimationFrame(loop);
}

function updateProblems(dt, isFrozen) {
    const height = window.innerHeight;
    problems.forEach(problem => {
        if (problem.targeted) return;
        if (isFrozen) {
            problem.el.classList.add('frozen');
        } else {
            problem.el.classList.remove('frozen');
            problem.y += problem.speed * dt;
            problem.el.style.transform = `translate(${problem.x}px, ${problem.y}px)`;
            if (problem.y > height - 120) {
                problem.el.classList.add('alarm');
            }
        }
    });

    if (isFrozen) return;

    for (let i = problems.length - 1; i >= 0; i--) {
        const problem = problems[i];
        if (!problem.targeted && problem.y > height) {
            removeProblem(i);
            loseLife();
        }
    }
}

function removeProblem(index, animate = false) {
    const [problem] = problems.splice(index, 1);
    if (problem) {
        if (animate) {
            problem.el.classList.add('blast');
            problem.el.addEventListener('animationend', () => problem.el.remove(), { once: true });
        } else {
            problem.el.remove();
        }
    }
}

function loseLife() {
    lives -= 1;
    livesEl.innerText = lives;
    resetStreak();
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
        speed: speedBase + Math.random() * getTier().speedJitter + score / getTier().scoreSpeedDiv
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
        launchRocket(problems[hitIndex]);
        streak += 1;
        updateStreakUI();
        const comboTier = Math.min(3, Math.floor((streak - 1) / 3));
        const points = 10 + comboTier * 5;
        score += points;
        scoreEl.innerText = score;
        speedBase = Math.min(getTier().speedCap, speedBase + getTier().speedStep);
        triggerHitFlash();
        tryLevelUp();

        if (streak % 5 === 0 && lives < MAX_LIVES) {
            lives += 1;
            livesEl.innerText = lives;
            showBanner('+1 Life!', 'life');
        }

        if (streak % 10 === 0) {
            activateFreeze(3000);
        }
    } else {
        resetStreak();
        shakeInput();
    }

    answerInput.value = '';
    answerInput.focus();
}

function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

onPress(submitBtn, submitAnswer);
answerInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitAnswer();
});

onPress(restartBtn, returnToMenu);

onPress(saveScoreBtn, () => {
    if (!window.LeaderboardAPI || !playerNameInput) return;
    const fallbackName = window.LeaderboardAPI.getSavedName() || 'Player';
    const name = playerNameInput.value || fallbackName;
    window.LeaderboardAPI.validateAndSubmit({
        game: 'math',
        mode: 'standard',
        name,
        score,
        inputElement: playerNameInput,
        errorElement: nameErrorEl
    }).then(result => {
        if (result.success) {
            returnToMenu();
        }
    });
});

onPress(menuBtn, returnToMenu);

startScreen.querySelectorAll('.mode-btn').forEach(btn => {
    onPress(btn, () => {
        if (btn.classList.contains('locked') || !selectedGrade) return;
        gameMode = btn.dataset.mode;
        renderGlobalLeaderboard();
        startGame();
    });
});

startScreen.querySelectorAll('.grade-btn').forEach(btn => {
    onPress(btn, () => {
        startScreen.querySelectorAll('.grade-btn').forEach(el => el.classList.remove('active'));
        btn.classList.add('active');
        selectedGrade = btn.dataset.grade;
        applyGradeToModes();
        showModeSelection();
    });
});

onPress(changeGradeBtn, () => {
    selectedGrade = null;
    startScreen.querySelectorAll('.grade-btn').forEach(el => el.classList.remove('active'));
    showGradeSelection();
});

updateBestScoreUI();
showGradeSelection();

if (window.LeaderboardAPI && playerNameInput) {
    const savedName = window.LeaderboardAPI.getSavedName();
    if (savedName) {
        playerNameInput.value = savedName;
    }
}

renderGlobalLeaderboard();
