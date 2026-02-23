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
const shopBtn = document.getElementById('shop-btn');
const shopPanel = document.getElementById('shop-panel');
const shopCloseBtn = document.getElementById('shop-close-btn');
const buyFreezeBtn = document.getElementById('buy-freeze');
const buyLifeBtn = document.getElementById('buy-life');
const buyExplosionBtn = document.getElementById('buy-explosion');
const buyWeaponBtn = document.getElementById('buy-weapon');
const costFreezeEl = document.getElementById('cost-freeze');
const costLifeEl = document.getElementById('cost-life');
const costExplosionEl = document.getElementById('cost-explosion');
const costWeaponEl = document.getElementById('cost-weapon');
const gameContainer = document.getElementById('game-container');
const eventBanner = document.getElementById('event-banner');
const captionBar = document.getElementById('caption-bar');
const starfieldEl = document.getElementById('starfield');
const modeSelect = startScreen.querySelector('.mode-select');
const gradeSelect = startScreen.querySelector('.grade-select');
const changeGradeBtn = document.getElementById('change-grade-btn');
const playerNameInput = document.getElementById('player-name');
const nameErrorEl = document.getElementById('name-error');
const saveScoreBtn = document.getElementById('save-score-btn');
const globalLeaderboardEl = document.getElementById('global-leaderboard');

const HIGH_SCORE_KEY = 'mathBlaster_bestScore';
const MAX_LIVES = 5;
const MATH_BLASTER_PERSONALITY_IDX = 'mathBlaster_personalityIdx';
const MATH_BLASTER_PROGRESSION = 'mathBlaster_progression';

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
let starFlashTimeout = null;
let runBestStreak = 0;
let currentPersonality = 'coach';
let captionCooldownUntil = 0;
let captionHideTimeout = null;
let isShopOpen = false;
let currentTheme = 0;
let explosionStyle = 0;
let weaponStyle = 0;
let runMaxScore = 0;

const SHOP_COSTS = {
    freeze: 180,
    life: 280,
    explosion: 320,
    weapon: 300
};

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const CAPTION_PACKS = {
    coach: {
        start: ['Coach ready. You got this!', 'Eyes up, math hero!', 'Let’s go team!'],
        correct: ['Nice!', 'Great answer!', 'Sharp thinking!'],
        wrong: ['Close one—next shot!', 'Try again, champ!', 'Keep going!'],
        streak: ['Streak rising!', 'Combo power!', 'On fire!'],
        level: ['Level up!', 'New challenge!', 'You’re improving fast!'],
        life: ['Bonus life earned!', 'Extra life—awesome!'],
        freeze: ['Freeze blast!', 'Everything slowed down!'],
        star: ['Star moment! Boom!', 'Mega streak blast!', 'You are unstoppable!'],
        gameover: ['Great effort!', 'Strong run!', 'Ready for another?'],
        unlock: ['New reward unlocked!', 'You earned a new style!', 'Achievement unlocked!']
    },
    hype: {
        start: ['Let’s blast OFF!', 'Arcade mode hype!', 'Bring the thunder!'],
        correct: ['BOOM!', 'Perfect hit!', 'Crushed it!'],
        wrong: ['Reset and rebound!', 'Missed it—reload!', 'You got the next one!'],
        streak: ['Combo cooking!', 'Streak energy!', 'Speed run vibes!'],
        level: ['LEVEL UP!!', 'Heat check passed!', 'Power spike!'],
        life: ['+1 LIFE! Let’s go!', 'Extra life secured!'],
        freeze: ['Freeze field online!', 'Time slowed. Attack!'],
        star: ['STAR MODE!!!', 'Legend move!', 'Screen shaker!'],
        gameover: ['Huge run!', 'That was epic!', 'Run it back!'],
        unlock: ['Hype unlocked!', 'New power unlocked!', 'Reward drop!']
    },
    robot: {
        start: ['Systems online. Solve.', 'Target lock: equations.', 'Mission begin.'],
        correct: ['Confirmed.', 'Accurate.', 'Direct hit.'],
        wrong: ['Input mismatch.', 'Recompute.', 'Retry accepted.'],
        streak: ['Combo sequence active.', 'Streak protocol rising.', 'Efficiency increased.'],
        level: ['Level threshold reached.', 'Difficulty escalated.', 'Upgrade confirmed.'],
        life: ['Life unit granted.', 'Vital reserve increased.'],
        freeze: ['Temporal slowdown engaged.', 'Freeze protocol active.'],
        star: ['Star burst initialized.', 'High-output streak event.', 'Max pulse detected.'],
        gameover: ['Session complete.', 'Performance archived.', 'Re-run recommended.'],
        unlock: ['Module unlocked.', 'New protocol enabled.', 'Reward acquired.']
    }
};

const progression = loadProgression();

const Sound = {
    ensure() {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
        }
    },
    tone(freq, type, duration, gain = 0.07) {
        try {
            Sound.ensure();
            const osc = audioCtx.createOscillator();
            const vol = audioCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            vol.gain.setValueAtTime(gain, audioCtx.currentTime);
            vol.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
            osc.connect(vol);
            vol.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + duration);
        } catch {
            // Ignore audio errors.
        }
    },
    correct() {
        Sound.tone(680, 'triangle', 0.06, 0.07);
    },
    wrong() {
        Sound.tone(190, 'sawtooth', 0.09, 0.06);
    },
    streak() {
        Sound.tone(840, 'square', 0.08, 0.08);
    },
    life() {
        Sound.tone(520, 'triangle', 0.06, 0.07);
        setTimeout(() => Sound.tone(760, 'triangle', 0.08, 0.07), 55);
    },
    level() {
        Sound.tone(440, 'square', 0.07, 0.06);
        setTimeout(() => Sound.tone(660, 'square', 0.07, 0.06), 45);
    },
    freeze() {
        Sound.tone(320, 'sine', 0.12, 0.07);
    },
    star() {
        Sound.tone(950, 'triangle', 0.08, 0.08);
        setTimeout(() => Sound.tone(1200, 'triangle', 0.08, 0.06), 50);
    },
    unlock() {
        Sound.tone(560, 'triangle', 0.06, 0.07);
        setTimeout(() => Sound.tone(890, 'triangle', 0.12, 0.08), 45);
    },
    gameOver() {
        Sound.tone(210, 'sawtooth', 0.16, 0.07);
    }
};

function loadProgression() {
    try {
        const parsed = JSON.parse(localStorage.getItem(MATH_BLASTER_PROGRESSION) || '{}');
        const unlocked = parsed.unlocked || {};
        const badges = parsed.badges || {};
        return {
            unlocked: {
                coach: true,
                hype: !!unlocked.hype,
                robot: !!unlocked.robot
            },
            badges: {
                streak10: !!badges.streak10,
                streak20: !!badges.streak20,
                score500: !!badges.score500
            }
        };
    } catch {
        return {
            unlocked: { coach: true, hype: false, robot: false },
            badges: { streak10: false, streak20: false, score500: false }
        };
    }
}

function saveProgression() {
    try {
        localStorage.setItem(MATH_BLASTER_PROGRESSION, JSON.stringify(progression));
    } catch {
        // Ignore storage errors.
    }
}

function getUnlockedPersonalities() {
    return ['coach', 'hype', 'robot'].filter((name) => progression.unlocked[name]);
}

function pickNextPersonality() {
    const available = getUnlockedPersonalities();
    let idx = 0;
    try {
        idx = Number.parseInt(localStorage.getItem(MATH_BLASTER_PERSONALITY_IDX) || '0', 10);
        if (!Number.isFinite(idx)) idx = 0;
    } catch {
        idx = 0;
    }

    const nextIdx = idx % available.length;
    const personality = available[nextIdx] || 'coach';

    try {
        localStorage.setItem(MATH_BLASTER_PERSONALITY_IDX, String((nextIdx + 1) % available.length));
    } catch {
        // Ignore storage errors.
    }

    return personality;
}

function randomItem(items) {
    if (!items || !items.length) return '';
    return items[Math.floor(Math.random() * items.length)];
}

function setCaption(message, { force = false, star = false } = {}) {
    if (!captionBar || !message) return;
    if (!force && performance.now() < captionCooldownUntil) return;
    captionCooldownUntil = performance.now() + 520;
    if (captionHideTimeout) clearTimeout(captionHideTimeout);

    captionBar.textContent = message;
    captionBar.classList.remove('hype', 'robot', 'star');
    captionBar.classList.add('visible');
    if (currentPersonality === 'hype') captionBar.classList.add('hype');
    if (currentPersonality === 'robot') captionBar.classList.add('robot');

    if (star) {
        captionBar.classList.remove('star');
        void captionBar.offsetWidth;
        captionBar.classList.add('star');
    }

    const holdMs = star ? 2100 : 1600;
    captionHideTimeout = setTimeout(() => {
        captionBar.classList.remove('visible');
    }, holdMs);
}

function speak(eventName, options = {}) {
    const { force = false, customMessage = '', star = false } = options;
    const bank = CAPTION_PACKS[currentPersonality] || CAPTION_PACKS.coach;
    const line = customMessage || randomItem(bank[eventName]);
    setCaption(line, { force, star });
}

function triggerStarMoment() {
    if (starFlashTimeout) clearTimeout(starFlashTimeout);
    gameContainer.classList.remove('star-pulse');
    void gameContainer.offsetWidth;
    gameContainer.classList.add('star-pulse');
    starFlashTimeout = setTimeout(() => {
        gameContainer.classList.remove('star-pulse');
    }, 460);

    const centerX = window.innerWidth * 0.5;
    const centerY = window.innerHeight * 0.42;
    explodeAt(centerX, centerY);
    explodeAt(centerX - 120, centerY + 40);
    explodeAt(centerX + 120, centerY + 40);

    showBanner('⭐ STAR MOMENT!', 'star');
    speak('star', { force: true, star: true });
    Sound.star();
}

function applyBackgroundThemeByScore() {
    if (!starfieldEl) return;
    if (runMaxScore < 200) {
        if (currentTheme !== 0) {
            currentTheme = 0;
            starfieldEl.classList.remove('theme-0', 'theme-1', 'theme-2', 'theme-3');
            starfieldEl.classList.add('theme-0');
        }
        return;
    }

    const passedBands = Math.floor(runMaxScore / 200);
    const nextTheme = ((passedBands - 1) % 3) + 1;
    if (nextTheme === currentTheme) return;
    currentTheme = nextTheme;
    starfieldEl.classList.remove('theme-0', 'theme-1', 'theme-2', 'theme-3');
    starfieldEl.classList.add(`theme-${currentTheme}`);
    showBanner(`🌌 New Background Theme!`, 'level');
}

function canAfford(cost) {
    return score >= cost;
}

function spendScore(cost) {
    score = Math.max(0, score - cost);
    scoreEl.innerText = score;
    tryLevelUp();
}

function updateShopButtons() {
    if (!shopPanel) return;
    const freezeCost = SHOP_COSTS.freeze;
    const lifeCost = SHOP_COSTS.life;
    const explosionCost = SHOP_COSTS.explosion;
    const weaponCost = SHOP_COSTS.weapon;

    costFreezeEl.textContent = String(freezeCost);
    costLifeEl.textContent = String(lifeCost);
    costExplosionEl.textContent = explosionStyle >= 2 ? 'MAX' : String(explosionCost);
    costWeaponEl.textContent = weaponStyle >= 2 ? 'MAX' : String(weaponCost);

    buyFreezeBtn.disabled = !canAfford(freezeCost);
    buyLifeBtn.disabled = !canAfford(lifeCost) || lives >= MAX_LIVES;
    buyExplosionBtn.disabled = explosionStyle >= 2 || !canAfford(explosionCost);
    buyWeaponBtn.disabled = weaponStyle >= 2 || !canAfford(weaponCost);
}

function toggleShop(forceState) {
    if (!isRunning || !shopPanel) return;
    isShopOpen = typeof forceState === 'boolean' ? forceState : !isShopOpen;
    shopPanel.classList.toggle('hidden', !isShopOpen);
    if (isShopOpen) {
        updateShopButtons();
        speak('start', { force: true, customMessage: 'Shop open. Buy upgrades!' });
    } else {
        answerInput.focus();
    }
}

function buyFreeze() {
    if (!canAfford(SHOP_COSTS.freeze)) return;
    spendScore(SHOP_COSTS.freeze);
    activateFreeze(3000);
    showBanner('❄ Freeze Purchased!', 'freeze');
    updateShopButtons();
}

function buyLife() {
    if (lives >= MAX_LIVES || !canAfford(SHOP_COSTS.life)) return;
    spendScore(SHOP_COSTS.life);
    lives += 1;
    livesEl.innerText = lives;
    showBanner('+1 Life Purchased!', 'life');
    speak('life', { force: true });
    Sound.life();
    updateShopButtons();
}

function buyExplosionUpgrade() {
    if (explosionStyle >= 2 || !canAfford(SHOP_COSTS.explosion)) return;
    spendScore(SHOP_COSTS.explosion);
    explosionStyle += 1;
    showBanner(`Explosion FX Lv${explosionStyle + 1} Activated`, 'level');
    speak('unlock', { force: true, customMessage: 'Explosion effect upgraded!' });
    Sound.unlock();
    updateShopButtons();
}

function buyWeaponUpgrade() {
    if (weaponStyle >= 2 || !canAfford(SHOP_COSTS.weapon)) return;
    spendScore(SHOP_COSTS.weapon);
    weaponStyle += 1;
    showBanner(`Rocket FX Lv${weaponStyle + 1} Activated`, 'level');
    speak('unlock', { force: true, customMessage: 'Rocket style upgraded!' });
    Sound.unlock();
    updateShopButtons();
}

function applyProgressionFromRun() {
    const unlocks = [];
    const badges = [];

    if (runBestStreak >= 8 && !progression.unlocked.hype) {
        progression.unlocked.hype = true;
        unlocks.push('Hype Personality');
    }

    if (runBestStreak >= 15 && !progression.unlocked.robot) {
        progression.unlocked.robot = true;
        unlocks.push('Robot Personality');
    }

    if (runBestStreak >= 10 && !progression.badges.streak10) {
        progression.badges.streak10 = true;
        badges.push('Streak 10 Badge');
    }

    if (runBestStreak >= 20 && !progression.badges.streak20) {
        progression.badges.streak20 = true;
        badges.push('Streak 20 Badge');
    }

    if (score >= 500 && !progression.badges.score500) {
        progression.badges.score500 = true;
        badges.push('Score 500 Badge');
    }

    if (!unlocks.length && !badges.length) return;

    saveProgression();
    Sound.unlock();

    const parts = [];
    if (unlocks.length) parts.push(`Unlocked: ${unlocks.join(', ')}`);
    if (badges.length) parts.push(`Badges: ${badges.join(', ')}`);
    const message = parts.join(' • ');

    showBanner(message, 'level');
    speak('unlock', { force: true, customMessage: message });
}

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
    el.addEventListener('pointerup', (event) => {
        if (event.pointerType === 'mouse') return;
        event.preventDefault();
        handler(event);
    });

    el.addEventListener('click', (event) => {
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
        speak('level', { force: true });
        Sound.level();
    }
}

function activateFreeze(ms) {
    freezeUntil = Math.max(freezeUntil, performance.now() + ms);
    showBanner('⏸ Freeze Activated (3s)', 'freeze');
    triggerFreezeFlash();
    speak('freeze', { force: true });
    Sound.freeze();
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
    if (weaponStyle === 1) rocket.style.background = 'linear-gradient(to top, #ff66cc, #00f3ff)';
    if (weaponStyle >= 2) {
        rocket.style.width = '8px';
        rocket.style.height = '24px';
        rocket.style.background = 'linear-gradient(to top, #ffe66d, #ff00ff)';
        rocket.style.boxShadow = '0 0 12px #ffe66d, 0 0 24px rgba(255, 0, 255, 0.45)';
    }
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
        if (weaponStyle >= 1) explodeAt(targetX - 36, targetY + 8);
        if (weaponStyle >= 2) explodeAt(targetX + 36, targetY + 8);

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
    const particleCount = explosionStyle === 0 ? 14 : (explosionStyle === 1 ? 20 : 28);
    const palette = explosionStyle === 0
        ? PARTICLE_COLORS
        : (explosionStyle === 1
            ? ['#9cf2ff', '#63ffc4', '#ffe66d', '#ff9be5', '#ffffff']
            : ['#ff66ff', '#ffe66d', '#66ffd9', '#8ec5ff', '#ffffff', '#ff8b3d']);
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'explosion-particle';

        const angle = (i / particleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
        const distance = 26 + Math.random() * (explosionStyle === 2 ? 90 : 56);
        const size = 4 + Math.random() * (explosionStyle === 2 ? 7 : 5);

        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.background = palette[Math.floor(Math.random() * palette.length)];
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
    runBestStreak = 0;
    level = 1;
    runMaxScore = 0;
    freezeUntil = 0;
    isShopOpen = false;
    spawnTimer = 1.25;
    lastTime = 0;
    speedBase = tier.speedBase;
    scoreEl.innerText = score;
    livesEl.innerText = lives;
    updateStreakUI();
    problemLayer.innerHTML = '';
    answerInput.value = '';
    eventBanner.classList.add('hidden');
    gameContainer.classList.remove('star-pulse');
    shopPanel.classList.add('hidden');
    currentTheme = 0;
    starfieldEl.classList.remove('theme-0', 'theme-1', 'theme-2', 'theme-3');
    starfieldEl.classList.add('theme-0');
    captionCooldownUntil = 0;
    if (captionHideTimeout) clearTimeout(captionHideTimeout);
    captionBar.classList.remove('visible');
    updateBestScoreUI();
    updateShopButtons();
}

function startGame() {
    if (!selectedGrade) return;
    resetGame();
    currentPersonality = pickNextPersonality();
    speak('start', { force: true });
    isRunning = true;
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    answerInput.focus();
    requestAnimationFrame(loop);
}

function endGame() {
    isRunning = false;
    Sound.gameOver();
    speak('gameover', { force: true });
    finalScoreEl.innerText = score;
    if (score > bestScore) {
        bestScore = score;
        saveBestScore(bestScore);
    }
    updateBestScoreUI();
    applyProgressionFromRun();
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
    gameContainer.classList.remove('hit-flash', 'freeze-flash', 'star-pulse');
    isShopOpen = false;
    shopPanel.classList.add('hidden');
    if (captionHideTimeout) clearTimeout(captionHideTimeout);
    captionBar.classList.remove('visible');
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

    if (isShopOpen) {
        requestAnimationFrame(loop);
        return;
    }

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
    speak('wrong', { force: true });
    Sound.wrong();
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
        runBestStreak = Math.max(runBestStreak, streak);
        updateStreakUI();
        const comboTier = Math.min(3, Math.floor((streak - 1) / 3));
        const points = 10 + comboTier * 5;
        score += points;
        runMaxScore = Math.max(runMaxScore, score);
        scoreEl.innerText = score;
        applyBackgroundThemeByScore();
        updateShopButtons();
        Sound.correct();
        speak('correct');
        speedBase = Math.min(getTier().speedCap, speedBase + getTier().speedStep);
        triggerHitFlash();
        tryLevelUp();

        if (streak > 1 && streak % 3 === 0) {
            speak('streak');
            Sound.streak();
        }

        if (streak % 5 === 0 && lives < MAX_LIVES) {
            lives += 1;
            livesEl.innerText = lives;
            showBanner('+1 Life!', 'life');
            speak('life', { force: true });
            Sound.life();
        }

        if (streak % 10 === 0) {
            triggerStarMoment();
            activateFreeze(3000);
        }
    } else {
        resetStreak();
        shakeInput();
        speak('wrong');
        Sound.wrong();
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
onPress(shopBtn, () => toggleShop());
onPress(shopCloseBtn, () => toggleShop(false));
onPress(buyFreezeBtn, buyFreeze);
onPress(buyLifeBtn, buyLife);
onPress(buyExplosionBtn, buyExplosionUpgrade);
onPress(buyWeaponBtn, buyWeaponUpgrade);

window.addEventListener('keydown', (e) => {
    if (e.code !== 'Space') return;
    if (!isRunning) return;
    e.preventDefault();
    toggleShop();
});

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
