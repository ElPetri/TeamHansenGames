const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const coinsEl = document.getElementById('coins');
const livesEl = document.getElementById('lives');
const waveEl = document.getElementById('wave');
const weaponLevelEl = document.getElementById('weapon-level');

const starStatus = document.getElementById('star-status');
const yoshiStatus = document.getElementById('yoshi-status');
const freezeStatus = document.getElementById('freeze-status');
const megaStatus = document.getElementById('mega-status');
const capeStatus = document.getElementById('cape-status');

const starTimerEl = document.getElementById('star-timer');
const yoshiTimerEl = document.getElementById('yoshi-timer');
const freezeTimerEl = document.getElementById('freeze-timer');
const megaTimerEl = document.getElementById('mega-timer');
const capeTimerEl = document.getElementById('cape-timer');
const modeStatusEl = document.getElementById('mode-status');
const objectiveStatusEl = document.getElementById('objective-status');

const startScreen = document.getElementById('start-screen');
const shopScreen = document.getElementById('shop-screen');
const gameOverScreen = document.getElementById('game-over-screen');

const goTitleEl = document.getElementById('go-title');
const goSubtitleEl = document.getElementById('go-subtitle');
const finalScoreEl = document.getElementById('final-score');
const finalWaveEl = document.getElementById('final-wave');
const playerNameInput = document.getElementById('player-name');
const nameErrorEl = document.getElementById('name-error');
const saveScoreBtn = document.getElementById('save-score-btn');
const nextStoryBtn = document.getElementById('next-story-btn');
const globalLeaderboardEl = document.getElementById('global-leaderboard');

const arenaBtn = document.getElementById('arena-btn');
const storyBtn = document.getElementById('story-btn');
const shopBtn = document.getElementById('shop-btn');
const resumeBtn = document.getElementById('resume-btn');
const restartBtn = document.getElementById('restart-btn');

const buyFireRateBtn = document.getElementById('buy-fire-rate');
const buyDamageBtn = document.getElementById('buy-damage');
const buySpeedBtn = document.getElementById('buy-speed');
const buyLifeBtn = document.getElementById('buy-life');

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const Sound = {
    tone(freq, type, duration, gain = 0.08) {
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
    },
    shoot() {
        Sound.tone(420, 'square', 0.08, 0.06);
    },
    hit() {
        Sound.tone(120, 'sawtooth', 0.12, 0.08);
    },
    pickup() {
        Sound.tone(620, 'triangle', 0.08, 0.09);
        setTimeout(() => Sound.tone(840, 'triangle', 0.1, 0.08), 60);
    },
    explosion() {
        Sound.tone(80, 'square', 0.2, 0.11);
    },
    boss() {
        Sound.tone(180, 'sawtooth', 0.18, 0.1);
    }
};

const STORY_CHAPTERS = [
    { title: 'Chapter 1: Orbit Breach', targetScore: 250 },
    { title: 'Chapter 2: Lunar Ambush', targetScore: 700 },
    { title: 'Chapter 3: Nebula Clash', targetScore: 1400 },
    { title: 'Chapter 4: Bowser Armada', targetScore: 2300 }
];

const game = {
    state: 'START',
    mode: 'arena',
    score: 0,
    coins: 0,
    lives: 3,
    wave: 1,
    storyChapter: 0,
    waveTimer: 0,
    waveDuration: 19,
    keys: Object.create(null),
    stars: [],
    enemies: [],
    bullets: [],
    enemyBullets: [],
    particles: [],
    powerups: [],
    explosions: [],
    spawnTimer: 0,
    spawnGap: 0.9,
    fireTimer: 0,
    shakeTimer: 0,
    shakeStrength: 0,
    starPowerTimer: 0,
    yoshiTimer: 0,
    freezeTimer: 0,
    megaTimer: 0,
    capeTimer: 0,
    yoshiTongueTimer: 0,
    yoshiBombTimer: 0,
    yoshiTarget: null,
    bossAlive: false,
    bossCycle: 0,
    shopOpen: false,
    upgrades: {
        fireRate: 0,
        damage: 0,
        speed: 0
    }
};

const mario = {
    x: 0,
    y: 0,
    radius: 20,
    speed: 280,
    damageCooldown: 0,
    invulnFlash: 0
};

const HIT_INVULN_DURATION = 2;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (!mario.x && !mario.y) {
        mario.x = canvas.width * 0.5;
        mario.y = canvas.height * 0.8;
    }
}

function randomRange(min, max) {
    return min + Math.random() * (max - min);
}

function randomInt(min, max) {
    return Math.floor(randomRange(min, max + 1));
}

function createStars() {
    game.stars = Array.from({ length: 120 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: randomRange(1, 2.8),
        alpha: randomRange(0.15, 0.8),
        drift: randomRange(4, 18)
    }));
}

function resetRun(mode = game.mode, preserveProgress = false) {
    game.mode = mode;

    if (!preserveProgress) {
        game.score = 0;
        game.coins = 0;
        game.lives = 3;
        game.upgrades.fireRate = 0;
        game.upgrades.damage = 0;
        game.upgrades.speed = 0;
        game.storyChapter = 0;
    }

    game.wave = 1;
    game.waveTimer = 0;
    game.spawnTimer = 0;
    game.spawnGap = game.mode === 'story' ? 1.2 : 1.15;
    game.fireTimer = 0;
    game.starPowerTimer = 0;
    game.yoshiTimer = 0;
    game.freezeTimer = 0;
    game.megaTimer = 0;
    game.capeTimer = 0;
    game.yoshiTongueTimer = 0;
    game.yoshiBombTimer = 0;
    game.bossAlive = false;
    game.bossCycle = 0;
    game.shopOpen = false;

    mario.x = canvas.width * 0.5;
    mario.y = canvas.height * 0.83;
    mario.radius = 20;
    mario.damageCooldown = 0;
    mario.invulnFlash = 0;

    game.enemies.length = 0;
    game.bullets.length = 0;
    game.enemyBullets.length = 0;
    game.particles.length = 0;
    game.powerups.length = 0;
    game.explosions.length = 0;

    setState('PLAYING');
    configureResultScreen({ allowSave: false, showNext: false, subtitle: '' });
    updateHud();
}

function setState(nextState) {
    game.state = nextState;
    startScreen.classList.toggle('hidden', nextState !== 'START');
    shopScreen.classList.toggle('hidden', nextState !== 'SHOP');
    gameOverScreen.classList.toggle('hidden', nextState !== 'GAMEOVER');
}

function renderGlobalLeaderboard() {
    if (!window.LeaderboardAPI || !globalLeaderboardEl) return;
    const playerName = (playerNameInput && playerNameInput.value) || window.LeaderboardAPI.getSavedName() || '';
    window.LeaderboardAPI.renderTabbedLeaderboard({
        container: globalLeaderboardEl,
        game: 'goomba',
        mode: 'arena',
        modes: [{ value: 'arena', label: 'Arena' }],
        playerName
    });
}

function getStoryChapterConfig() {
    return STORY_CHAPTERS[Math.min(game.storyChapter, STORY_CHAPTERS.length - 1)];
}

function configureResultScreen({ allowSave, showNext, subtitle, title }) {
    saveScoreBtn.classList.toggle('hidden', !allowSave);
    playerNameInput.classList.toggle('hidden', !allowSave);
    nameErrorEl.classList.toggle('hidden', !allowSave);
    nextStoryBtn.classList.toggle('hidden', !showNext);
    goSubtitleEl.classList.toggle('hidden', !subtitle);
    goSubtitleEl.textContent = subtitle || '';
    if (title) goTitleEl.textContent = title;
}

function speedModifier() {
    return 1 + game.upgrades.speed * 0.1;
}

function fireInterval() {
    return Math.max(0.11, 0.27 - game.upgrades.fireRate * 0.03);
}

function fireDamage() {
    return 1 + game.upgrades.damage;
}

function updateHud() {
    scoreEl.textContent = String(game.score);
    coinsEl.textContent = String(game.coins);
    livesEl.textContent = String(game.lives);
    waveEl.textContent = String(game.wave);
    weaponLevelEl.textContent = String(1 + game.upgrades.damage);

    if (game.mode === 'story') {
        const chapter = getStoryChapterConfig();
        modeStatusEl.textContent = `Mode: Story (${game.storyChapter + 1}/${STORY_CHAPTERS.length})`;
        objectiveStatusEl.classList.remove('hidden');
        objectiveStatusEl.textContent = `Objective: ${chapter.title} (${Math.min(game.score, chapter.targetScore)}/${chapter.targetScore})`;
    } else {
        modeStatusEl.textContent = 'Mode: Arena';
        objectiveStatusEl.classList.add('hidden');
    }

    starStatus.classList.toggle('hidden', game.starPowerTimer <= 0);
    yoshiStatus.classList.toggle('hidden', game.yoshiTimer <= 0);
    freezeStatus.classList.toggle('hidden', game.freezeTimer <= 0);
    megaStatus.classList.toggle('hidden', game.megaTimer <= 0);
    capeStatus.classList.toggle('hidden', game.capeTimer <= 0);

    starTimerEl.textContent = `${Math.max(0, game.starPowerTimer).toFixed(1)}s`;
    yoshiTimerEl.textContent = `${Math.max(0, game.yoshiTimer).toFixed(1)}s`;
    freezeTimerEl.textContent = `${Math.max(0, game.freezeTimer).toFixed(1)}s`;
    megaTimerEl.textContent = `${Math.max(0, game.megaTimer).toFixed(1)}s`;
    capeTimerEl.textContent = `${Math.max(0, game.capeTimer).toFixed(1)}s`;
}

function spawnEnemy() {
    const topX = randomRange(40, canvas.width - 40);
    const entryY = -30;
    const tier = Math.min(8, 1 + Math.floor(game.wave / 3));
    const r = Math.random();

    let type = 'goomba';
    if (r > 0.85) type = 'piranha';
    else if (r > 0.65) type = 'boo';
    else if (r > 0.45) type = 'koopa';

    const presets = {
        goomba: { hp: 2 + tier, speed: 45 + game.wave * 3, points: 10, coins: 8, radius: 20, color: '#d89058', zig: 0.6 },
        koopa: { hp: 4 + tier, speed: 62 + game.wave * 3.5, points: 15, coins: 12, radius: 22, color: '#63cf57', zig: 0.9 },
        boo: { hp: 3 + tier, speed: 52 + game.wave * 2.8, points: 18, coins: 13, radius: 18, color: '#d5e8ff', zig: 1.4 },
        piranha: { hp: 5 + tier * 1.5, speed: 35 + game.wave * 2.2, points: 22, coins: 16, radius: 24, color: '#ff7070', zig: 0.3 }
    };

    const p = presets[type];
    game.enemies.push({
        x: topX,
        y: entryY,
        vx: randomRange(-40, 40),
        vy: p.speed,
        hp: p.hp,
        maxHp: p.hp,
        radius: p.radius,
        points: p.points,
        coins: p.coins,
        type,
        color: p.color,
        age: 0,
        zig: p.zig,
        shotTimer: randomRange(0.8, 2.2)
    });
}

function spawnBoss(kind) {
    const isMajor = kind === 'major';
    const hp = isMajor ? 280 + game.wave * 18 : 160 + game.wave * 10;

    game.enemies.push({
        x: canvas.width * 0.5,
        y: -80,
        vx: isMajor ? 90 : 120,
        vy: isMajor ? 34 : 44,
        hp,
        maxHp: hp,
        radius: isMajor ? 56 : 42,
        points: isMajor ? 700 : 300,
        coins: isMajor ? 300 : 170,
        type: isMajor ? 'bowser' : 'bowserjr',
        color: isMajor ? '#ff8948' : '#96ff7d',
        age: 0,
        zig: 0.7,
        shotTimer: 1.1,
        boss: true,
        major: isMajor
    });
    game.bossAlive = true;
    Sound.boss();
}

function maybeSpawnBoss() {
    if (game.bossAlive) return;
    if (game.wave % 10 === 0) {
        spawnBoss('major');
        return;
    }
    if (game.wave % 5 === 0) {
        spawnBoss('mini');
    }
}

function spawnPowerup(x, y) {
    const roll = Math.random();
    let type = 'star';
    if (roll > 0.84) type = 'yoshi';
    else if (roll > 0.68) type = 'ice';
    else if (roll > 0.52) type = 'mega';
    else if (roll > 0.36) type = 'cape';
    else if (roll > 0.18) type = 'flower';

    game.powerups.push({
        x,
        y: Math.min(y, -18),
        vy: randomRange(65, 95),
        radius: 14,
        type,
        t: Math.random() * Math.PI * 2
    });
}

function applyPowerup(type) {
    Sound.pickup();
    if (type === 'star') game.starPowerTimer = Math.max(game.starPowerTimer, 10);
    else if (type === 'yoshi') game.yoshiTimer = Math.max(game.yoshiTimer, 30);
    else if (type === 'ice') game.freezeTimer = Math.max(game.freezeTimer, 7);
    else if (type === 'mega') game.megaTimer = Math.max(game.megaTimer, 8);
    else if (type === 'cape') game.capeTimer = Math.max(game.capeTimer, 6);
    else if (type === 'flower') game.upgrades.damage = Math.min(8, game.upgrades.damage + 1);
    updateHud();
}

function openShop() {
    if (game.state !== 'PLAYING') return;
    game.shopOpen = true;
    setState('SHOP');
}

function closeShop() {
    if (game.state !== 'SHOP') return;
    game.shopOpen = false;
    setState('PLAYING');
}

function buyUpgrade(kind, cost) {
    if (game.coins < cost) {
        Sound.hit();
        return;
    }
    game.coins -= cost;
    if (kind === 'fireRate') game.upgrades.fireRate += 1;
    else if (kind === 'damage') game.upgrades.damage += 1;
    else if (kind === 'speed') game.upgrades.speed += 1;
    else if (kind === 'life') game.lives += 1;
    Sound.pickup();
    updateHud();
}

function emitExplosion(x, y, color, count = 18) {
    for (let i = 0; i < count; i += 1) {
        const a = Math.random() * Math.PI * 2;
        const s = randomRange(50, 260);
        game.particles.push({
            x,
            y,
            vx: Math.cos(a) * s,
            vy: Math.sin(a) * s,
            life: randomRange(0.2, 0.8),
            color
        });
    }
    game.shakeTimer = 0.18;
    game.shakeStrength = Math.min(14, game.shakeStrength + 8);
}

function damageEnemy(enemy, dmg) {
    enemy.hp -= dmg;
    if (enemy.hp > 0) return false;

    game.score += enemy.points;
    game.coins += enemy.coins;
    emitExplosion(enemy.x, enemy.y, enemy.color, enemy.boss ? 42 : 18);
    Sound.explosion();

    if (enemy.boss) {
        game.bossAlive = false;
        spawnPowerup(enemy.x, -20);
        spawnPowerup(enemy.x + 80, -20);
    } else if (Math.random() < 0.23) {
        spawnPowerup(enemy.x, -20);
    }

    checkStoryProgress();

    return true;
}

function checkStoryProgress() {
    if (game.mode !== 'story' || game.state !== 'PLAYING') return;

    const chapter = getStoryChapterConfig();
    if (game.score < chapter.targetScore) return;

    finalScoreEl.textContent = String(game.score);
    finalWaveEl.textContent = String(game.wave);

    const isFinalChapter = game.storyChapter >= STORY_CHAPTERS.length - 1;
    if (isFinalChapter) {
        configureResultScreen({
            title: 'STORY COMPLETE',
            subtitle: 'Mario defeated the Goomba fleet!',
            allowSave: false,
            showNext: false
        });
    } else {
        configureResultScreen({
            title: `CHAPTER ${game.storyChapter + 1} CLEAR`,
            subtitle: 'Prepare for the next chapter.',
            allowSave: false,
            showNext: true
        });
    }

    setState('GAMEOVER');
}

function yoshiLogic(dt) {
    if (game.yoshiTimer <= 0) return;

    game.yoshiTongueTimer -= dt;
    game.yoshiBombTimer -= dt;

    if (game.yoshiTongueTimer <= 0) {
        let target = null;
        let best = Infinity;
        for (const enemy of game.enemies) {
            if (enemy.boss) continue;
            const dx = enemy.x - mario.x;
            const dy = enemy.y - mario.y;
            const d = dx * dx + dy * dy;
            if (d < best) {
                best = d;
                target = enemy;
            }
        }

        if (target) {
            game.yoshiTarget = { x: target.x, y: target.y, timer: 0.15 };
            target.hp = 0;
            damageEnemy(target, 999);
            game.enemies = game.enemies.filter((enemy) => enemy.hp > 0);
            game.yoshiTongueTimer = 1.2;
            game.yoshiBombTimer = 0.6;
        }
    }

    if (game.yoshiBombTimer <= 0) {
        const bombX = mario.x + randomRange(-140, 140);
        const bombY = mario.y - randomRange(120, 220);
        const radius = 120;
        emitExplosion(bombX, bombY, '#ffbb55', 26);
        for (let i = game.enemies.length - 1; i >= 0; i -= 1) {
            const enemy = game.enemies[i];
            const dx = enemy.x - bombX;
            const dy = enemy.y - bombY;
            if ((dx * dx) + (dy * dy) < radius * radius) {
                if (damageEnemy(enemy, 8 + game.wave)) {
                    game.enemies.splice(i, 1);
                }
            }
        }
        game.yoshiBombTimer = 2.6;
    }

    if (game.yoshiTarget) {
        game.yoshiTarget.timer -= dt;
        if (game.yoshiTarget.timer <= 0) game.yoshiTarget = null;
    }
}

function spawnFireball() {
    const spreadBase = 0.1;
    const shotCount = game.upgrades.damage >= 4 ? 2 : 1;

    for (let i = 0; i < shotCount; i += 1) {
        const angle = (-Math.PI / 2) + (i === 0 ? -spreadBase : spreadBase);
        game.bullets.push({
            x: mario.x,
            y: mario.y - mario.radius,
            vx: Math.cos(angle) * 40,
            vy: Math.sin(angle) * 530,
            radius: 7,
            dmg: fireDamage(),
            life: 1.5
        });
    }
    Sound.shoot();
}

function updateMario(dt) {
    let dx = 0;
    let dy = 0;
    if (game.keys.KeyA) dx -= 1;
    if (game.keys.KeyD) dx += 1;
    if (game.keys.KeyW) dy -= 1;
    if (game.keys.KeyS) dy += 1;

    const len = Math.hypot(dx, dy) || 1;
    const speed = mario.speed * speedModifier() * (game.megaTimer > 0 ? 0.92 : 1);

    mario.x += (dx / len) * speed * dt;
    mario.y += (dy / len) * speed * dt;

    const r = game.megaTimer > 0 ? 30 : 20;
    mario.radius = r;
    mario.x = Math.max(r, Math.min(canvas.width - r, mario.x));
    mario.y = Math.max(r, Math.min(canvas.height - r, mario.y));

    mario.damageCooldown = Math.max(0, mario.damageCooldown - dt);
    mario.invulnFlash += dt * 15;

    game.fireTimer -= dt;
    if (game.fireTimer <= 0) {
        spawnFireball();
        game.fireTimer = fireInterval();
    }
}

function updateProjectiles(dt) {
    for (let i = game.bullets.length - 1; i >= 0; i -= 1) {
        const bullet = game.bullets[i];
        bullet.x += bullet.vx * dt;
        bullet.y += bullet.vy * dt;
        bullet.life -= dt;

        if (bullet.life <= 0 || bullet.y < -30 || bullet.x < -20 || bullet.x > canvas.width + 20) {
            game.bullets.splice(i, 1);
            continue;
        }

        for (let j = game.enemies.length - 1; j >= 0; j -= 1) {
            const enemy = game.enemies[j];
            const dx = enemy.x - bullet.x;
            const dy = enemy.y - bullet.y;
            const rr = enemy.radius + bullet.radius;
            if ((dx * dx) + (dy * dy) < rr * rr) {
                game.bullets.splice(i, 1);
                if (damageEnemy(enemy, bullet.dmg)) {
                    game.enemies.splice(j, 1);
                }
                break;
            }
        }
    }

}

function updateEnemies(dt) {
    const freezeMul = game.freezeTimer > 0 ? 0.25 : 1;

    for (let i = game.enemies.length - 1; i >= 0; i -= 1) {
        const enemy = game.enemies[i];
        enemy.age += dt;

        if (enemy.boss) {
            enemy.y = Math.min(canvas.height * 0.28, enemy.y + enemy.vy * dt * freezeMul);
            enemy.x += Math.sin(enemy.age * enemy.zig) * enemy.vx * dt * freezeMul;
        } else {
            enemy.x += Math.sin(enemy.age * enemy.zig) * enemy.vx * 0.25 * dt * freezeMul;
            enemy.y += enemy.vy * dt * freezeMul;
        }

        enemy.x = Math.max(enemy.radius, Math.min(canvas.width - enemy.radius, enemy.x));

        if (enemy.y > canvas.height + 80) {
            game.enemies.splice(i, 1);
            continue;
        }

        const dx = mario.x - enemy.x;
        const dy = mario.y - enemy.y;
        const rr = mario.radius + enemy.radius;
        if ((dx * dx) + (dy * dy) < rr * rr) {
            if (game.megaTimer > 0) {
                if (damageEnemy(enemy, 999)) game.enemies.splice(i, 1);
                continue;
            }
            hitMario();
            if (damageEnemy(enemy, 999)) game.enemies.splice(i, 1);
        }
    }
}

function updatePowerups(dt) {
    for (let i = game.powerups.length - 1; i >= 0; i -= 1) {
        const p = game.powerups[i];
        p.t += dt * 5;
        p.y += p.vy * dt;
        p.x += Math.sin(p.t) * 40 * dt;

        if (p.y > canvas.height + 30) {
            game.powerups.splice(i, 1);
            continue;
        }

        const dx = mario.x - p.x;
        const dy = mario.y - p.y;
        const rr = mario.radius + p.radius;
        if ((dx * dx) + (dy * dy) < rr * rr) {
            applyPowerup(p.type);
            game.powerups.splice(i, 1);
        }
    }
}

function hitMario() {
    if (game.starPowerTimer > 0 || game.capeTimer > 0 || mario.damageCooldown > 0) {
        return;
    }

    game.lives -= 1;
    mario.damageCooldown = HIT_INVULN_DURATION;
    game.shakeTimer = 0.22;
    game.shakeStrength = Math.min(16, game.shakeStrength + 10);
    Sound.hit();

    if (game.lives <= 0) {
        endRun();
    }
    updateHud();
}

function endRun() {
    game.state = 'GAMEOVER';
    finalScoreEl.textContent = String(game.score);
    finalWaveEl.textContent = String(game.wave);

    const isArena = game.mode === 'arena';
    configureResultScreen({
        title: 'MISSION FAILED',
        subtitle: isArena ? '' : 'Story run failed. Try again from Chapter 1.',
        allowSave: isArena,
        showNext: false
    });

    if (isArena && window.LeaderboardAPI && playerNameInput) {
        const savedName = window.LeaderboardAPI.getSavedName();
        if (savedName && !playerNameInput.value) playerNameInput.value = savedName;
    }
    setState('GAMEOVER');
}

function updateTimers(dt) {
    game.starPowerTimer = Math.max(0, game.starPowerTimer - dt);
    game.yoshiTimer = Math.max(0, game.yoshiTimer - dt);
    game.freezeTimer = Math.max(0, game.freezeTimer - dt);
    game.megaTimer = Math.max(0, game.megaTimer - dt);
    game.capeTimer = Math.max(0, game.capeTimer - dt);

    game.waveTimer += dt;
    if (game.waveTimer >= game.waveDuration) {
        game.waveTimer = 0;
        game.wave += 1;
        game.spawnGap = Math.max(0.48, game.spawnGap * 0.97);
        maybeSpawnBoss();
        updateHud();
    }

    updateHud();
}

function updateSpawns(dt) {
    if (game.bossAlive) return;
    game.spawnTimer -= dt;
    if (game.spawnTimer > 0) return;

    const amount = 1 + (Math.random() < Math.min(0.35, game.wave * 0.02) ? 1 : 0);
    for (let i = 0; i < amount; i += 1) spawnEnemy();
    game.spawnTimer = randomRange(game.spawnGap * 0.9, game.spawnGap * 1.35);
}

function updateParticles(dt) {
    for (let i = game.particles.length - 1; i >= 0; i -= 1) {
        const p = game.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.97;
        p.vy *= 0.97;
        p.life -= dt;
        if (p.life <= 0) game.particles.splice(i, 1);
    }
}

function drawBackground(dt) {
    ctx.fillStyle = '#04060d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const nebula = ctx.createRadialGradient(canvas.width * 0.8, canvas.height * 0.2, 40, canvas.width * 0.8, canvas.height * 0.2, 460);
    nebula.addColorStop(0, 'rgba(122, 75, 255, 0.22)');
    nebula.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = nebula;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const star of game.stars) {
        star.y += star.drift * dt;
        if (star.y > canvas.height + 5) {
            star.y = -3;
            star.x = Math.random() * canvas.width;
        }
        ctx.fillStyle = `rgba(220,240,255,${star.alpha})`;
        ctx.fillRect(star.x, star.y, star.size, star.size);
    }
}

function drawMario() {
    const invuln = mario.damageCooldown > 0;
    if (invuln && Math.sin(mario.invulnFlash) > 0) return;

    ctx.save();
    ctx.translate(mario.x, mario.y);

    if (game.starPowerTimer > 0) {
        ctx.strokeStyle = '#ffe66d';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, mario.radius + 8, 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.fillStyle = '#ff2828';
    ctx.fillRect(-mario.radius, -mario.radius * 0.4, mario.radius * 2, mario.radius * 1.1);

    ctx.fillStyle = '#ffe0bc';
    ctx.beginPath();
    ctx.arc(0, -mario.radius * 0.55, mario.radius * 0.62, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#d62323';
    ctx.fillRect(-mario.radius * 0.75, -mario.radius * 1.18, mario.radius * 1.5, mario.radius * 0.45);

    ctx.fillStyle = '#2a56ff';
    ctx.fillRect(-mario.radius * 0.65, mario.radius * 0.2, mario.radius * 1.3, mario.radius * 0.8);

    if (game.megaTimer > 0) {
        ctx.strokeStyle = '#78ff68';
        ctx.lineWidth = 3;
        ctx.strokeRect(-mario.radius * 1.1, -mario.radius * 1.1, mario.radius * 2.2, mario.radius * 2.2);
    }

    ctx.restore();

    if (game.yoshiTimer > 0) {
        ctx.save();
        const yx = mario.x - mario.radius * 1.8;
        const yy = mario.y + mario.radius * 0.2;
        ctx.fillStyle = '#52d558';
        ctx.beginPath();
        ctx.arc(yx, yy, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(yx + 8, yy - 3, 4, 0, Math.PI * 2);
        ctx.fill();

        if (game.yoshiTarget) {
            ctx.strokeStyle = '#ff88cc';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(yx + 10, yy - 1);
            ctx.lineTo(game.yoshiTarget.x, game.yoshiTarget.y);
            ctx.stroke();
        }
        ctx.restore();
    }
}

function drawEnemy(enemy) {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);

    ctx.fillStyle = enemy.color;
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(-enemy.radius * 0.28, -enemy.radius * 0.18, enemy.radius * 0.2, 0, Math.PI * 2);
    ctx.arc(enemy.radius * 0.28, -enemy.radius * 0.18, enemy.radius * 0.2, 0, Math.PI * 2);
    ctx.fill();

    if (enemy.type === 'bowser' || enemy.type === 'bowserjr') {
        ctx.fillStyle = '#111';
        ctx.fillRect(-enemy.radius * 0.6, enemy.radius * 0.25, enemy.radius * 1.2, 4);

        const hpPct = Math.max(0, enemy.hp / enemy.maxHp);
        ctx.fillStyle = '#281016';
        ctx.fillRect(-enemy.radius, -enemy.radius - 14, enemy.radius * 2, 6);
        ctx.fillStyle = '#ff5f5f';
        ctx.fillRect(-enemy.radius, -enemy.radius - 14, enemy.radius * 2 * hpPct, 6);
    }

    ctx.restore();
}

function drawProjectiles() {
    for (const bullet of game.bullets) {
        ctx.fillStyle = '#ff7f27';
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawPowerups() {
    for (const p of game.powerups) {
        let color = '#ffe66d';
        let label = '⭐';
        if (p.type === 'yoshi') {
            color = '#6fff7f';
            label = 'Y';
        } else if (p.type === 'ice') {
            color = '#86d9ff';
            label = '❄';
        } else if (p.type === 'mega') {
            color = '#ff8b5a';
            label = 'M';
        } else if (p.type === 'cape') {
            color = '#c18aff';
            label = 'C';
        } else if (p.type === 'flower') {
            color = '#ffda65';
            label = 'F';
        }

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#101010';
        ctx.font = 'bold 12px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, p.x, p.y + 0.5);
    }
}

function drawParticles() {
    for (const p of game.particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life * 1.4);
        ctx.fillRect(p.x, p.y, 3, 3);
    }
    ctx.globalAlpha = 1;
}

let lastTime = 0;
function frame(time) {
    const dt = Math.min(0.033, ((time - lastTime) || 16.67) / 1000);
    lastTime = time;

    if (game.state === 'PLAYING') {
        updateMario(dt);
        updateTimers(dt);
        updateSpawns(dt);
        updateEnemies(dt);
        updateProjectiles(dt);
        updatePowerups(dt);
        updateParticles(dt);
        yoshiLogic(dt);
    }

    drawBackground(dt);

    ctx.save();
    if (game.shakeTimer > 0) {
        game.shakeTimer -= dt;
        game.shakeStrength *= 0.9;
        const ox = randomRange(-game.shakeStrength, game.shakeStrength);
        const oy = randomRange(-game.shakeStrength, game.shakeStrength);
        ctx.translate(ox, oy);
    }

    for (const enemy of game.enemies) drawEnemy(enemy);
    drawProjectiles();
    drawPowerups();
    drawMario();
    drawParticles();

    ctx.restore();

    requestAnimationFrame(frame);
}

arenaBtn.addEventListener('click', () => {
    audioCtx.resume();
    resetRun('arena');
});

storyBtn.addEventListener('click', () => {
    audioCtx.resume();
    resetRun('story');
});

restartBtn.addEventListener('click', () => {
    resetRun(game.mode, false);
});

nextStoryBtn.addEventListener('click', () => {
    if (game.mode !== 'story') return;
    game.storyChapter = Math.min(game.storyChapter + 1, STORY_CHAPTERS.length - 1);
    resetRun('story', true);
});

if (saveScoreBtn) {
    saveScoreBtn.addEventListener('click', () => {
        if (game.mode !== 'arena') return;
        if (!window.LeaderboardAPI || !playerNameInput) return;
        const fallbackName = window.LeaderboardAPI.getSavedName() || 'Player';
        const name = playerNameInput.value || fallbackName;
        window.LeaderboardAPI.validateAndSubmit({
            game: 'goomba',
            mode: 'arena',
            name,
            score: game.score,
            inputElement: playerNameInput,
            errorElement: nameErrorEl
        }).then((result) => {
            if (!result.success) return;
            setState('START');
            renderGlobalLeaderboard();
        });
    });
}

shopBtn.addEventListener('click', openShop);
resumeBtn.addEventListener('click', closeShop);

buyFireRateBtn.addEventListener('click', () => buyUpgrade('fireRate', 60));
buyDamageBtn.addEventListener('click', () => buyUpgrade('damage', 80));
buySpeedBtn.addEventListener('click', () => buyUpgrade('speed', 70));
buyLifeBtn.addEventListener('click', () => buyUpgrade('life', 120));

window.addEventListener('keydown', (e) => {
    game.keys[e.code] = true;
    if (e.code === 'KeyB') {
        if (game.state === 'PLAYING') openShop();
        else if (game.state === 'SHOP') closeShop();
    }
});

window.addEventListener('keyup', (e) => {
    game.keys[e.code] = false;
});

window.addEventListener('resize', () => {
    resize();
    createStars();
});

resize();
createStars();
setState('START');
updateHud();
if (window.LeaderboardAPI && playerNameInput) {
    const savedName = window.LeaderboardAPI.getSavedName();
    if (savedName) playerNameInput.value = savedName;
}
renderGlobalLeaderboard();
requestAnimationFrame(frame);
