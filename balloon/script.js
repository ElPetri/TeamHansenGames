const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameContainer = document.getElementById('game-container');

// Elements
const scoreEl = document.getElementById('score');
const moneyEl = document.getElementById('money');
const waveEl = document.getElementById('wave');
const uiLayer = document.getElementById('ui-layer');
const startScreen = document.getElementById('start-screen');
const modeScreen = document.getElementById('mode-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const upgradeMenu = document.getElementById('upgrade-menu');
const costFireRateEl = document.getElementById('cost-firerate');
const costMultiShotEl = document.getElementById('cost-multishot');
const costShotgunEl = document.getElementById('cost-shotgun');
const costLaserEl = document.getElementById('cost-laser');
const barFireRate = document.getElementById('bar-firerate');
const barMultiShot = document.getElementById('bar-multishot');
const finalScoreEl = document.getElementById('final-score');
const playerNameInput = document.getElementById('player-name');
const topScoresList = document.getElementById('top-scores-list');
const livesEl = document.getElementById('lives');
const audioToggleBtn = document.getElementById('audio-btn');
const pauseBtn = document.getElementById('pause-btn');
const modeUnlocksEl = document.getElementById('mode-unlocks');
const modeBackBtn = document.getElementById('mode-back-btn');
const menuBtn = document.getElementById('menu-btn');
const chaosHud = document.getElementById('chaos-hud');
const modeLabelEl = document.getElementById('mode-label');
const bossHpWrap = document.getElementById('boss-hp');
const bossHpFill = document.getElementById('boss-hp-fill');
const statusShieldEl = document.getElementById('status-shield');
const statusSlowMoEl = document.getElementById('status-slowmo');
const statusDoubleCashEl = document.getElementById('status-doublecash');
const statusRapidFireEl = document.getElementById('status-rapidfire');
const valueShieldEl = document.getElementById('value-shield');
const valueSlowMoEl = document.getElementById('value-slowmo');
const valueDoubleCashEl = document.getElementById('value-doublecash');
const valueRapidFireEl = document.getElementById('value-rapidfire');
const ringShieldEl = document.getElementById('ring-shield');
const ringSlowMoEl = document.getElementById('ring-slowmo');
const ringDoubleCashEl = document.getElementById('ring-doublecash');
const ringRapidFireEl = document.getElementById('ring-rapidfire');

// Game State
let gameState = 'START';
let difficulty = 'easy';
let gameMode = localStorage.getItem('popTheBalloons_lastMode') || 'classic';
let score = 0;
let money = 0;
let lives = 3;
let frames = 0; // Keeping for cosmetic anims (wobble)
let mouse = { x: 0, y: 0 };
let isAudioMuted = false;
let loopId = 0; // To cancel loops
let lastTime = 0; // Delta time tracking

// Audio System
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const Sound = {
    playTone: (freq, type, duration, vol = 0.1) => {
        if (gameState !== 'PLAYING' && gameState !== 'START') return;
        if (isAudioMuted) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(vol, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    },
    shoot: () => Sound.playTone(300, 'square', 0.1, 0.1),
    shotgun: () => {
         Sound.playTone(150, 'sawtooth', 0.2, 0.15); // Shorter duration
         Sound.playTone(100, 'square', 0.2, 0.15);
    },
    laser: () => {
        if (isAudioMuted) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    },
    pop: () => Sound.playTone(500 + Math.random() * 500, 'sine', 0.1, 0.1),
    buy: () => {
         Sound.playTone(600, 'sine', 0.1, 0.2);
         setTimeout(() => Sound.playTone(1200, 'sine', 0.2, 0.2), 100);
    },
    error: () => Sound.playTone(150, 'sawtooth', 0.3, 0.2)
};

// Leaderboard
const LEADERBOARD_KEYS = {
    classic: 'popTheBalloons_leaderboard_classic',
    chaos: 'popTheBalloons_leaderboard_chaos'
};
const CHAOS_PROGRESS_KEY = 'popTheBalloons_chaosProgress';
const LAST_MODE_KEY = 'popTheBalloons_lastMode';

// Upgrade Costs & State
const MAX_UPGRADES = 5;
let upgrades = {
    fireRate: { level: 0, cost: 100 },
    multiShot: { level: 0, cost: 500 },
    shotgun: { unlocked: false, cost: 1000 },
    laser: { unlocked: false, cost: 2500 }
};

let currentWeapon = 'standard';

// Wave System
let wave = 1;
let enemiesRemainingToSpawn = 0;
let spawnTimer = 0;    // Now in seconds
let waveCooldown = 0;  // Now in seconds
let activeEnemies = 0;
let bossWaveActive = false;
let bossDefeats = 0;
let maxBossDefeated = parseInt(localStorage.getItem(CHAOS_PROGRESS_KEY) || '0', 10);
let powerupsUnlocked = false;
let screenShakeUnlocked = false;
let currentBoss = null;

// Entities
let tank;
let darts = [];
let lasers = [];
let balloons = [];
let particles = [];
let waveText = null; // Store reference to wave text element
let powerups = [];
let bossProjectiles = [];

let shieldCharges = 0;
let slowMoTimer = 0;
let doubleCashTimer = 0;
let rapidFireTimer = 0;
let invulnTimer = 0;

const POWERUP_DURATIONS = {
    slowmo: 5,
    doublecash: 10,
    rapidfire: 3
};

const INVULN_DURATION = 1.2;

let shakeTime = 0;
let shakeIntensity = 0;

class Tank {
    constructor() {
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.angle = 0;
        this.color = '#00f3ff';
        this.barrelLength = 40;
        this.width = 40;
        
        // Stats
        this.baseFireRate = 0.25; // Seconds per shot (approx 15 frames @ 60fps)
        this.currentFireRate = 0.25;
        this.fireTimer = 0;
        this.shotCount = 1;
        this.spread = 0.2;
        
        this.recoilX = 0;
        this.recoilY = 0;
    }

    update(dt) {
        // Damping recoil (time based)
        this.recoilX *= Math.pow(0.1, dt); // Strong damping
        this.recoilY *= Math.pow(0.1, dt);

        this.x = (canvas.width / 2) + this.recoilX;
        this.y = (canvas.height / 2) + this.recoilY;

        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        this.angle = Math.atan2(dy, dx);

        // Auto Fire
        if (this.fireTimer <= 0) {
            this.shoot();
            const effectiveFireRate = getEffectiveFireRate();
            // Weapon specific delays
            if (currentWeapon === 'shotgun') this.fireTimer = effectiveFireRate * 2.5;
            else if (currentWeapon === 'laser') this.fireTimer = Math.max(0.3, effectiveFireRate * 2); 
            else this.fireTimer = effectiveFireRate;
        } else {
            this.fireTimer -= dt;
        }
    }

    shoot() {
        const kick = currentWeapon === 'shotgun' ? 10 : (currentWeapon === 'laser' ? 5 : 3);
        this.recoilX = -Math.cos(this.angle) * kick;
        this.recoilY = -Math.sin(this.angle) * kick;

        const tipX = this.x + Math.cos(this.angle) * this.barrelLength;
        const tipY = this.y + Math.sin(this.angle) * this.barrelLength;

        if (currentWeapon === 'laser') {
            Sound.laser();
            let hit = false;
            const laserLen = Math.max(canvas.width, canvas.height);
            const endX = tipX + Math.cos(this.angle) * laserLen;
            const endY = tipY + Math.sin(this.angle) * laserLen;
            
            lasers.push({sx: tipX, sy: tipY, ex: endX, ey: endY, life: 0.2}); // 0.2s life

            for (let i = balloons.length - 1; i >= 0; i--) {
                const b = balloons[i];
                const v1x = endX - tipX, v1y = endY - tipY;
                const v2x = b.x - tipX, v2y = b.y - tipY;
                const lenSq = v1x*v1x + v1y*v1y;
                let u = (v2x * v1x + v2y * v1y) / lenSq;
                u = Math.max(0, Math.min(1, u));
                const cx = tipX + u * v1x;
                const cy = tipY + u * v1y;
                const distSq = (b.x - cx)**2 + (b.y - cy)**2;
                
                if (distSq < (b.radius + 10)**2) { 
                    const dead = handleBalloonDamage(b, 5);
                    createHighlight(b.x, b.y, '#00f3ff');
                    if (dead) balloons.splice(i, 1);
                }
            }
        } else if (currentWeapon === 'shotgun') {
            Sound.shotgun();
            const pellets = 5 + (this.shotCount);
            const spread = 0.5;
            for(let i=0; i<pellets; i++) {
                const angleOffset = (Math.random() - 0.5) * spread;
                // Speed ~720px/s
                darts.push(new Dart(tipX, tipY, this.angle + angleOffset, 720 + Math.random() * 300, 0.5)); 
            }
        } else {
            Sound.shoot();
            let startAngle = this.angle;
            if (this.shotCount > 1) {
                startAngle -= (this.spread * (this.shotCount - 1)) / 2;
            }
            for (let i = 0; i < this.shotCount; i++) {
                const currentAngle = startAngle + (i * this.spread);
                // Speed ~900px/s (15px/frame * 60)
                darts.push(new Dart(tipX, tipY, currentAngle, 900));
            }
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        if (invulnTimer > 0) {
            const pulse = 0.6 + Math.sin(frames * 0.3) * 0.4;
            ctx.save();
            ctx.shadowBlur = 30;
            ctx.shadowColor = '#66ccff';
            ctx.strokeStyle = `rgba(102, 204, 255, ${0.5 + pulse * 0.3})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, 28 + pulse * 4, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(0, -6, this.barrelLength, 12);
        ctx.shadowBlur = 0;

        ctx.restore();
    }
    
    recalcStats() {
        // Base 0.25s. Max upgrade (lvl 5) reduces by 0.15s -> 0.1s
        this.currentFireRate = Math.max(0.05, this.baseFireRate - (upgrades.fireRate.level * 0.03));
        this.shotCount = 1 + upgrades.multiShot.level;
    }
}

class Dart {
    constructor(x, y, angle, speed = 900, lifeSeconds = 2) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = speed;
        this.radius = 4;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.life = lifeSeconds;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        ctx.fillStyle = currentWeapon === 'shotgun' ? '#ffaa00' : '#ffff00';
        ctx.shadowBlur = 5;
        ctx.shadowColor = ctx.fillStyle;
        
        ctx.beginPath();
        if (currentWeapon === 'shotgun') ctx.arc(0,0,3,0,Math.PI*2);
        else {
             ctx.moveTo(8, 0);
             ctx.lineTo(-4, 4);
             ctx.lineTo(-4, -4);
        }
        ctx.fill();
        ctx.restore();
    }
}

class Balloon {
    constructor(options = {}) {
        if (typeof options === 'boolean') options = { isSeeker: options };
        this.isSeeker = !!options.isSeeker;
        this.isArmored = !!options.isArmored;
        this.isSplitter = !!options.isSplitter;
        this.splitLevel = options.splitLevel || 0;
        this.isMini = !!options.isMini;
        const edge = Math.floor(Math.random() * 4); 
        const padding = 60; 
        
        if (edge === 0) { this.x = Math.random() * canvas.width; this.y = -padding; }
        else if (edge === 1) { this.x = canvas.width + padding; this.y = Math.random() * canvas.height; }
        else if (edge === 2) { this.x = Math.random() * canvas.width; this.y = canvas.height + padding; }
        else { this.x = -padding; this.y = Math.random() * canvas.height; }

        this.radius = this.isMini ? 10 + Math.random() * 6 : (15 + Math.random() * 15);
        
        // Difficulty scaling
        let speedBase = 1.0 + (wave * 0.1); 
        
        // Slower on Easy, specially on Mobile
        if (difficulty === 'easy') {
            speedBase *= 0.8;
            if (canvas.width < 768) speedBase *= 0.75;
        }

        let moveSpeed = (60 + Math.random() * 120) * speedBase;
        
        let hpBase = 1 + Math.floor(wave / 2);

        this.speed = moveSpeed;
        this.hp = this.isMini ? Math.max(1, Math.floor(hpBase * 0.6)) : hpBase;
        this.maxHp = this.hp;
        this.armor = this.isArmored ? (2 + Math.floor(wave / 6)) : 0;
        if (this.isSeeker) {
            this.speed *= 0.7; 
            this.hp = Math.floor(this.hp * 1.5);
            this.maxHp = this.hp;
            this.color = '#ff0055'; 
        } else {
             const hues = [120, 180, 280, 300]; 
             const hue = hues[Math.floor(Math.random() * hues.length)];
             this.color = `hsl(${hue}, 100%, 50%)`;
        }

        if (this.isArmored) {
            this.color = '#88baff';
            this.speed *= 0.85;
        }

        if (this.isSplitter) {
            this.color = '#ffcc66';
            this.speed *= 1.1;
        }
    }

    update(dt) {
        let dx, dy;
        if (this.isSeeker) {
            dx = tank.x - this.x;
            dy = tank.y - this.y;
        } else {
            dx = (canvas.width/2) - this.x;
            dy = (canvas.height/2) - this.y;
        }
        
        const dist = Math.hypot(dx, dy);
        const slowMoFactor = getSlowMoFactor();
        this.x += (dx / dist) * this.speed * slowMoFactor * dt;
        this.y += (dy / dist) * this.speed * slowMoFactor * dt;

        this.x += Math.sin(frames * 0.05 + this.y) * 30 * dt; // Wobble per second

        if (dist < 30 + this.radius) {
            handlePlayerHit();
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        
        if (this.isSeeker) {
            ctx.beginPath();
            ctx.moveTo(this.radius, 0);
            ctx.lineTo(-this.radius, this.radius);
            ctx.lineTo(-this.radius, -this.radius);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.ellipse(0, 0, this.radius, this.radius * 1.1, 0, 0, Math.PI*2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;

        if (this.isArmored) {
            ctx.strokeStyle = '#d0e8ff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(0, 0, this.radius + 4, this.radius * 1.1 + 4, 0, 0, Math.PI * 2);
            ctx.stroke();
        }

        if (this.isSplitter) {
            ctx.strokeStyle = '#fff2b2';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-6, 0); ctx.lineTo(6, 0);
            ctx.moveTo(0, -6); ctx.lineTo(0, 6);
            ctx.stroke();
        }
        
        if (this.hp > 1 || this.armor > 0) {
            ctx.fillStyle = 'white';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            const armorText = this.armor > 0 ? `+${this.armor}` : '';
            ctx.fillText(`${this.hp}${armorText}`, 0, 5);
        }
        ctx.restore();
    }
}

class BossBalloon {
    constructor() {
        const edge = Math.floor(Math.random() * 4);
        const padding = 80;
        if (edge === 0) { this.x = Math.random() * canvas.width; this.y = -padding; }
        else if (edge === 1) { this.x = canvas.width + padding; this.y = Math.random() * canvas.height; }
        else if (edge === 2) { this.x = Math.random() * canvas.width; this.y = canvas.height + padding; }
        else { this.x = -padding; this.y = Math.random() * canvas.height; }

        this.isBoss = true;
        this.radius = 45;
        this.tier = Math.floor(wave / 5);
        const baseHp = 1 + Math.floor(wave / 2);
        const hpMultiplier = this.tier === 1 ? 12 : 10;
        this.maxHp = baseHp * hpMultiplier;
        this.hp = this.maxHp;

        let speedBase = 1.0 + (wave * 0.05);
        if (difficulty === 'easy') {
            speedBase *= 0.85;
            if (canvas.width < 768) speedBase *= 0.8;
        }
        this.speed = 40 * speedBase;
        if (this.tier === 1) this.speed *= 1.15;

        this.minionsSpawned = false;
        this.shotTimer = 1.5;
        this.shotCooldown = 2.8;
        this.shieldTimer = 0;
        this.shieldCooldown = 6;
        this.shieldActive = false;
    }

    update(dt) {
        const dx = (canvas.width / 2) - this.x;
        const dy = (canvas.height / 2) - this.y;
        const dist = Math.hypot(dx, dy);
        const slowMoFactor = getSlowMoFactor();

        this.x += (dx / dist) * this.speed * slowMoFactor * dt;
        this.y += (dy / dist) * this.speed * slowMoFactor * dt;
        this.x += Math.sin(frames * 0.04 + this.y) * 15 * dt;

        if (dist < 40 + this.radius) {
            handlePlayerHit();
        }

        if (this.tier >= 4) {
            this.shieldCooldown -= dt;
            if (this.shieldCooldown <= 0 && !this.shieldActive) {
                this.shieldActive = true;
                this.shieldTimer = 2.2;
                this.shieldCooldown = 8 + Math.random() * 2;
            }
            if (this.shieldActive) {
                this.shieldTimer -= dt;
                if (this.shieldTimer <= 0) this.shieldActive = false;
            }
        }

        if (this.tier >= 1) {
            const threshold = this.tier === 1 ? 0.7 : 0.5;
            const count = this.tier === 1 ? 2 : 3;
            if (!this.minionsSpawned && this.hp <= this.maxHp * threshold) {
                this.minionsSpawned = true;
                spawnBossMinions(this, count);
            }
        }

        if (this.tier >= 2) {
            this.shotTimer -= dt;
            if (this.shotTimer <= 0) {
                bossProjectiles.push(new BossProjectile(this.x, this.y));
                this.shotTimer = this.shotCooldown + Math.random() * 0.6;
            }
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        const gradient = ctx.createRadialGradient(0, 0, 5, 0, 0, this.radius + 10);
        gradient.addColorStop(0, '#fff59d');
        gradient.addColorStop(0.6, '#ff00ff');
        gradient.addColorStop(1, '#5a00ff');
        ctx.fillStyle = gradient;
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#ff00ff';
        ctx.beginPath();
        ctx.ellipse(0, 0, this.radius, this.radius * 1.1, 0, 0, Math.PI * 2);
        ctx.fill();

        if (this.shieldActive) {
            ctx.strokeStyle = '#66ccff';
            ctx.lineWidth = 3;
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#66ccff';
            ctx.beginPath();
            ctx.ellipse(0, 0, this.radius + 8, this.radius * 1.1 + 8, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.hp, 0, 6);
        ctx.restore();
    }
}

class BossProjectile {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 8;
        this.speed = 180;
        this.life = 6;
        const angle = Math.atan2(tank.y - y, tank.x - x);
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.turnRate = 3.5;
    }

    update(dt) {
        const dx = tank.x - this.x;
        const dy = tank.y - this.y;
        const dist = Math.hypot(dx, dy) || 1;
        const desiredVx = (dx / dist) * this.speed;
        const desiredVy = (dy / dist) * this.speed;
        const turn = Math.min(1, this.turnRate * dt);
        this.vx += (desiredVx - this.vx) * turn;
        this.vy += (desiredVy - this.vy) * turn;

        const slowMoFactor = getSlowMoFactor();
        this.x += this.vx * slowMoFactor * dt;
        this.y += this.vy * slowMoFactor * dt;
        this.life -= dt;
    }

    draw() {
        ctx.save();
        ctx.fillStyle = '#ff5555';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff2222';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Powerup {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.radius = 12;
        this.life = 16;
        this.floatOffset = Math.random() * Math.PI * 2;
    }

    update(dt) {
        this.life -= dt;
        const dx = tank.x - this.x;
        const dy = tank.y - this.y;
        const dist = Math.hypot(dx, dy) || 1;
        const pull = 85;
        this.x += (dx / dist) * pull * dt;
        this.y += (dy / dist) * pull * dt;
        this.y += Math.sin(frames * 0.12 + this.floatOffset) * 5 * dt;
    }

    draw() {
        ctx.save();
        const colorMap = {
            shield: '#00ffea',
            slowmo: '#66aaff',
            doublecash: '#00ff66',
            rapidfire: '#ffcc00',
            health: '#ff5a7a'
        };
        const labelMap = {
            shield: 'S',
            slowmo: 'T',
            doublecash: '$',
            rapidfire: 'R',
            health: '❤'
        };
        const color = colorMap[this.type] || '#ffffff';
        ctx.fillStyle = color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#000';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(labelMap[this.type] || '?', this.x, this.y + 4);
        ctx.restore();
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.angle = Math.random() * Math.PI * 2;
        this.speed = 60 + Math.random() * 240; // px/s
        this.alpha = 1;
        this.decay = 1.0 + Math.random(); // alpha loss per second
    }
    update(dt) {
        this.x += Math.cos(this.angle) * this.speed * dt;
        this.y += Math.sin(this.angle) * this.speed * dt;
        this.alpha -= this.decay * dt;
        this.speed *= Math.pow(0.5, dt); // Drag
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 5;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
    }
}

// Input
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault(); 
    const touch = e.touches[0];
    mouse.x = touch.clientX;
    mouse.y = touch.clientY;
}, { passive: false });
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault(); 
    const touch = e.touches[0];
    mouse.x = touch.clientX;
    mouse.y = touch.clientY;
}, { passive: false });

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'KeyQ' || e.code === 'Escape') {
        if (gameState === 'PLAYING' || gameState === 'PAUSED') togglePause();
    }
    
    if (gameState === 'PLAYING') {
        if (e.code === 'Digit1') equipWeapon('standard');
        if (e.code === 'Digit2') equipWeapon('shotgun');
        if (e.code === 'Digit3') equipWeapon('laser');
    }
});

document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        difficulty = btn.getAttribute('data-mode');
        if(audioCtx.state === 'suspended') audioCtx.resume();
        showModeScreen();
    });
});

document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        gameMode = btn.getAttribute('data-mode');
        localStorage.setItem(LAST_MODE_KEY, gameMode);
        startGame();
    });
});

modeBackBtn.addEventListener('click', () => {
    modeScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
});

document.getElementById('upgrade-btn').addEventListener('click', togglePause);
document.getElementById('close-menu-btn').addEventListener('click', togglePause);
document.getElementById('pause-btn').addEventListener('click', togglePause);
menuBtn.addEventListener('click', returnToMenu);
document.getElementById('buy-firerate').addEventListener('click', () => buyUpgrade('fireRate'));
document.getElementById('buy-multishot').addEventListener('click', () => buyUpgrade('multiShot'));
document.getElementById('buy-shotgun').addEventListener('click', () => unlockWeapon('shotgun'));
document.getElementById('buy-laser').addEventListener('click', () => unlockWeapon('laser'));

const restart = () => {
    gameOverScreen.classList.add('hidden');
    modeScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    loadLeaderboard();
};
document.getElementById('restart-btn').addEventListener('click', restart);

audioToggleBtn.addEventListener('click', () => {
    isAudioMuted = !isAudioMuted;
    audioToggleBtn.innerText = isAudioMuted ? "🔇" : "🔊";
});

document.getElementById('save-score-btn').addEventListener('click', () => {
    const name = playerNameInput.value || "Anonymous";
    saveScore(name, score);
    restart();
});

function showModeScreen() {
    startScreen.classList.add('hidden');
    modeScreen.classList.remove('hidden');
    updateModeUnlocks();
}

function updateModeUnlocks() {
    if (maxBossDefeated >= 2) {
        modeUnlocksEl.innerText = 'Chaos unlocks: Power-ups + Screen Shake';
    } else if (maxBossDefeated >= 1) {
        modeUnlocksEl.innerText = 'Chaos unlocks: Power-ups unlocked';
    } else {
        modeUnlocksEl.innerText = 'Chaos unlocks: Defeat the first boss to unlock power-ups';
    }
}

function getLeaderboardKey(mode = gameMode) {
    return mode === 'chaos' ? LEADERBOARD_KEYS.chaos : LEADERBOARD_KEYS.classic;
}

function getSlowMoFactor() {
    return slowMoTimer > 0 ? 0.5 : 1;
}

function getEffectiveFireRate() {
    return rapidFireTimer > 0 ? tank.currentFireRate * 0.6 : tank.currentFireRate;
}

function getCashMultiplier() {
    return doubleCashTimer > 0 ? 2 : 1;
}

function triggerScreenShake(intensity, duration) {
    if (!screenShakeUnlocked) return;
    shakeIntensity = Math.max(shakeIntensity, intensity);
    shakeTime = Math.max(shakeTime, duration);
}

function handlePlayerHit() {
    if (invulnTimer > 0) return;
    if (shieldCharges > 0) {
        shieldCharges--;
        createHighlight(tank.x, tank.y, '#00ffea');
        triggerScreenShake(6, 0.3);
        Sound.playTone(200, 'square', 0.2, 0.1);
        return;
    }
    lives = Math.max(0, lives - 1);
    updateScoreUI();
    triggerScreenShake(10, 0.4);
    Sound.playTone(140, 'sawtooth', 0.3, 0.15);
    invulnTimer = INVULN_DURATION;
    clearNearbyBalloons();
    if (lives <= 0) {
        endGame();
    }
}

function clearNearbyBalloons() {
    const clearRadius = 140;
    for (let i = balloons.length - 1; i >= 0; i--) {
        const b = balloons[i];
        const dist = Math.hypot(b.x - tank.x, b.y - tank.y);
        if (dist <= clearRadius) {
            popBalloon(b);
            balloons.splice(i, 1);
        }
    }
}

function applyPowerup(type) {
    if (type === 'shield') {
        shieldCharges++;
    } else if (type === 'health') {
        lives = Math.min(3, lives + 1);
        updateScoreUI();
    } else if (type === 'slowmo') {
        slowMoTimer = Math.max(slowMoTimer, 5);
    } else if (type === 'doublecash') {
        doubleCashTimer = Math.max(doubleCashTimer, 10);
    } else if (type === 'rapidfire') {
        rapidFireTimer = Math.max(rapidFireTimer, 3);
    }
    Sound.playTone(800, 'sine', 0.15, 0.15);
}

function maybeSpawnPowerup(x, y) {
    if (gameMode !== 'chaos' || !powerupsUnlocked) return;
    if (Math.random() > 0.1) return;
    const types = ['shield', 'slowmo', 'doublecash', 'rapidfire'];
    const type = types[Math.floor(Math.random() * types.length)];
    powerups.push(new Powerup(x, y, type));
}

function spawnBossMinions(boss, count) {
    for (let i = 0; i < count; i++) {
        const minion = new Balloon(false);
        minion.x = boss.x + Math.cos((Math.PI * 2 * i) / count) * 40;
        minion.y = boss.y + Math.sin((Math.PI * 2 * i) / count) * 40;
        minion.speed *= 1.1;
        balloons.push(minion);
    }
}

function spawnSplitterChildren(parent) {
    const count = 2;
    for (let i = 0; i < count; i++) {
        const child = new Balloon({
            isMini: true,
            splitLevel: parent.splitLevel + 1
        });
        const angle = (Math.PI * 2 * i) / count;
        child.x = parent.x + Math.cos(angle) * 12;
        child.y = parent.y + Math.sin(angle) * 12;
        child.speed *= 1.15;
        child.color = '#ffe3a3';
        balloons.push(child);
    }
}

function updateChaosHud() {
    if (gameMode !== 'chaos') return;

    if (currentBoss && currentBoss.isBoss) {
        bossHpWrap.classList.remove('hidden');
        const ratio = Math.max(0, currentBoss.hp) / currentBoss.maxHp;
        bossHpFill.style.width = `${Math.max(4, ratio * 100)}%`;
    } else {
        bossHpWrap.classList.add('hidden');
    }

    valueShieldEl.innerText = `${shieldCharges}`;
    valueSlowMoEl.innerText = `${slowMoTimer.toFixed(1)}s`;
    valueDoubleCashEl.innerText = `${doubleCashTimer.toFixed(1)}s`;
    valueRapidFireEl.innerText = `${rapidFireTimer.toFixed(1)}s`;

    updatePowerupRing(ringShieldEl, shieldCharges > 0 ? 1 : 0, '#00ffea');
    updatePowerupRing(ringSlowMoEl, slowMoTimer / POWERUP_DURATIONS.slowmo, '#66aaff');
    updatePowerupRing(ringDoubleCashEl, doubleCashTimer / POWERUP_DURATIONS.doublecash, '#00ff66');
    updatePowerupRing(ringRapidFireEl, rapidFireTimer / POWERUP_DURATIONS.rapidfire, '#ffcc00');
}

function updatePowerupRing(el, ratio, color) {
    const clamped = Math.max(0, Math.min(1, ratio));
    const deg = Math.round(clamped * 360);
    el.style.background = `conic-gradient(${color} ${deg}deg, rgba(255, 255, 255, 0.1) 0deg)`;
    el.style.boxShadow = clamped > 0 ? `0 0 10px ${color}` : '0 0 6px rgba(0, 243, 255, 0.2)';
}

function handleBalloonDamage(b, amount) {
    if (b.isBoss && b.shieldActive) {
        createHighlight(b.x, b.y, '#66ccff');
        Sound.playTone(220, 'sine', 0.05, 0.05);
        return false;
    }
    if (b.armor && b.armor > 0) {
        const absorbed = Math.min(amount, b.armor);
        b.armor -= absorbed;
        amount -= absorbed;
        createHighlight(b.x, b.y, '#a5d3ff');
        Sound.playTone(320, 'square', 0.05, 0.05);
        if (amount <= 0) return false;
    }
    b.hp -= amount;
    if (b.isBoss) {
        triggerScreenShake(2, 0.12);
    }
    if (b.hp <= 0) {
        handleBalloonDeath(b);
        return true;
    }
    return false;
}

function handleBalloonDeath(b) {
    if (b.isSplitter && b.splitLevel < 1) {
        spawnSplitterChildren(b);
        popBalloon(b);
        return;
    }
    if (b.isBoss) {
        handleBossDefeat(b);
    } else {
        popBalloon(b);
    }
}

function handleBossDefeat(boss) {
    if (boss === currentBoss) currentBoss = null;
    const cashReward = (500 + wave * 50) * getCashMultiplier();
    score += 500 + (wave * 20);
    money += cashReward;
    updateScoreUI();
    updateUpgradeUI();
    Sound.playTone(180, 'sawtooth', 0.4, 0.2);
    triggerScreenShake(10, 0.4);

    for (let i = 0; i < 40; i++) {
        particles.push(new Particle(boss.x, boss.y, '#ffcc55'));
    }

    bossDefeats++;
    if (gameMode === 'chaos') {
        if (bossDefeats >= 1) powerupsUnlocked = true;
        if (bossDefeats >= 2) screenShakeUnlocked = true;
        if (bossDefeats > maxBossDefeated) {
            maxBossDefeated = bossDefeats;
            localStorage.setItem(CHAOS_PROGRESS_KEY, String(maxBossDefeated));
            updateModeUnlocks();
        }
    }

    const healthDrop = new Powerup(boss.x, boss.y, 'health');
    powerups.push(healthDrop);

    if (waveText) waveText.remove();
    waveText = document.createElement('div');
    waveText.innerText = 'BOSS DEFEATED';
    waveText.style = "position:absolute; top:40%; left:50%; transform:translate(-50%,-50%); font-size:48px; color:var(--neon-pink); font-family:var(--font-heading); text-shadow:0 0 20px black; pointer-events:none; animation: fadeUp 2s forwards;";
    document.body.appendChild(waveText);
    setTimeout(() => { if(waveText) waveText.remove(); }, 2000);
}

function startGame() {
    if (loopId) cancelAnimationFrame(loopId); // Stop old loop if any
    
    gameState = 'PLAYING';
    score = 0;
    money = 0;
    lives = 3;
    frames = 0;
    wave = 1;
    bossDefeats = 0;
    powerupsUnlocked = gameMode === 'chaos' && maxBossDefeated >= 1;
    screenShakeUnlocked = gameMode === 'chaos' && maxBossDefeated >= 2;
    shieldCharges = 0;
    slowMoTimer = 0;
    doubleCashTimer = 0;
    rapidFireTimer = 0;
    invulnTimer = 0;
    shakeTime = 0;
    shakeIntensity = 0;
    startWave(1);
    
    upgrades = {
        fireRate: { level: 0, cost: 100 },
        multiShot: { level: 0, cost: 500 },
        shotgun: { unlocked: false, cost: 1000 },
        laser: { unlocked: false, cost: 2500 }
    };
    currentWeapon = 'standard';
    
    tank = new Tank();
    tank.recalcStats();
    darts = [];
    balloons = [];
    particles = [];
    lasers = [];
    powerups = [];
    bossProjectiles = [];
    
    startScreen.classList.add('hidden');
    modeScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    upgradeMenu.classList.add('hidden');
    updateScoreUI();
    updateUpgradeUI();
    chaosHud.classList.toggle('hidden', gameMode !== 'chaos');
    modeLabelEl.innerText = gameMode === 'chaos' ? 'Chaos' : 'Classic';

    lastTime = performance.now();
    loopId = requestAnimationFrame(gameLoop);
}

function startWave(n) {
    wave = n;
    bossWaveActive = gameMode === 'chaos' && (n % 5 === 0);
    if (bossWaveActive) {
        enemiesRemainingToSpawn = 0;
        spawnTimer = 0;
        currentBoss = new BossBalloon();
        balloons.push(currentBoss);
    } else {
        enemiesRemainingToSpawn = 10 + (n * 5); 
        spawnTimer = 1.0; 
        currentBoss = null;
    }
    waveEl.innerText = wave;
    
    // Anounce
    if (waveText) waveText.remove();
    waveText = document.createElement('div');
    waveText.innerText = bossWaveActive ? `BOSS WAVE` : `WAVE ${wave}`;
    waveText.style = "position:absolute; top:40%; left:50%; transform:translate(-50%,-50%); font-size:60px; color:var(--neon-green); font-family:var(--font-heading); text-shadow:0 0 20px black; pointer-events:none; animation: fadeUp 2s forwards;";
    document.body.appendChild(waveText);
    setTimeout(() => { if(waveText) waveText.remove(); }, 2000);
    
    Sound.playTone(400, 'sine', 0.5, 0.2);
}

function gameLoop(timestamp) {
    if (gameState !== 'PLAYING') return;

    // Delta Time Calculation
    if (!lastTime) lastTime = timestamp;
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    // Clear
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    drawGroundDetail();
    
    tank.update(dt);
    tank.draw();

    if (slowMoTimer > 0) slowMoTimer = Math.max(0, slowMoTimer - dt);
    if (doubleCashTimer > 0) doubleCashTimer = Math.max(0, doubleCashTimer - dt);
    if (rapidFireTimer > 0) rapidFireTimer = Math.max(0, rapidFireTimer - dt);
    if (invulnTimer > 0) invulnTimer = Math.max(0, invulnTimer - dt);
    
    // Wave Logic
    if (activeEnemies === 0 && enemiesRemainingToSpawn === 0) {
        // Wave Complete
        waveCooldown += dt;

        // Show Pause / Countdown
        ctx.save();
        ctx.fillStyle = "white";
        ctx.font = "20px 'Orbitron'";
        ctx.textAlign = "center";
        ctx.fillText(`NEXT WAVE IN ${(4.0 - waveCooldown).toFixed(1)}`, canvas.width/2, 100);
        ctx.restore();

        if (waveCooldown > 4.0) { // 4 seconds delay
             startWave(wave + 1);
             waveCooldown = 0;
        }
    } else {
        // Spawning
        if (enemiesRemainingToSpawn > 0) {
             spawnTimer -= dt;
             if (spawnTimer <= 0) {
                 let balloon;
                 if (gameMode === 'chaos') {
                     const roll = Math.random();
                     if (wave >= 6 && roll < 0.18) {
                         balloon = new Balloon({ isSplitter: true });
                     } else if (wave >= 4 && roll < 0.36) {
                         balloon = new Balloon({ isArmored: true });
                     } else {
                         const isSeeker = (wave > 2) && (Math.random() > 0.7);
                         balloon = new Balloon({ isSeeker });
                     }
                 } else {
                     const isSeeker = (wave > 2) && (Math.random() > 0.7);
                     balloon = new Balloon({ isSeeker });
                 }
                 balloons.push(balloon);
                 enemiesRemainingToSpawn--;
                 activeEnemies++;
                 
                 // Rate calculation
                 let rate = Math.max(0.2, 1.5 - (wave * 0.1));
                 if (difficulty === 'nuclear') rate /= 2;
                 spawnTimer = rate;
             }
        }
    }

    // Weapons
    for (let i = darts.length - 1; i >= 0; i--) {
        const d = darts[i];
        d.update(dt);
        d.draw();

        if (d.life <= 0 || d.x < -100 || d.x > canvas.width + 100 || d.y < -100 || d.y > canvas.height + 100) {
            darts.splice(i, 1);
            continue;
        }

        // Hit Check
        for (let j = balloons.length - 1; j >= 0; j--) {
            const b = balloons[j];
            const dist = Math.hypot(d.x - b.x, d.y - b.y);
            if (dist < b.radius + d.radius) {
                Sound.pop();
                createHighlight(d.x, d.y, '#FFF');
                darts.splice(i, 1); 
                const dead = handleBalloonDamage(b, 1);
                if (dead) balloons.splice(j, 1);
                break;
            }
        }
    }
    
    // Lasers
    for (let i = lasers.length - 1; i >= 0; i--) {
        const l = lasers[i];
        ctx.strokeStyle = `rgba(0, 243, 255, ${l.life / 0.2})`;
        ctx.lineWidth = 4 + Math.random() * 4;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00f3ff';
        ctx.beginPath();
        ctx.moveTo(l.sx, l.sy);
        ctx.lineTo(l.ex, l.ey);
        ctx.stroke();
        ctx.shadowBlur = 0;
        l.life -= dt;
        if (l.life <= 0) lasers.splice(i, 1);
    }

    // Boss Projectiles
    for (let i = bossProjectiles.length - 1; i >= 0; i--) {
        const p = bossProjectiles[i];
        p.update(dt);
        p.draw();
        const dist = Math.hypot(p.x - tank.x, p.y - tank.y);
        if (dist < p.radius + 18) {
            handlePlayerHit();
            bossProjectiles.splice(i, 1);
            continue;
        }
        if (p.life <= 0 || p.x < -100 || p.x > canvas.width + 100 || p.y < -100 || p.y > canvas.height + 100) {
            bossProjectiles.splice(i, 1);
        }
    }

    // Balloons
    activeEnemies = balloons.length;
    balloons.forEach(b => {
        b.update(dt);
        b.draw();
    });

    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update(dt);
        particles[i].draw();
        if (particles[i].alpha <= 0) particles.splice(i, 1);
    }

    // Powerups
    for (let i = powerups.length - 1; i >= 0; i--) {
        const p = powerups[i];
        p.update(dt);
        p.draw();
        const dist = Math.hypot(p.x - tank.x, p.y - tank.y);
        if (dist < p.radius + 20) {
            applyPowerup(p.type);
            powerups.splice(i, 1);
            continue;
        }
        if (p.life <= 0) powerups.splice(i, 1);
    }

    updateChaosHud();

    frames++;
    if (shakeTime > 0) {
        shakeTime = Math.max(0, shakeTime - dt);
        const dx = (Math.random() * 2 - 1) * shakeIntensity;
        const dy = (Math.random() * 2 - 1) * shakeIntensity;
        gameContainer.style.transform = `translate(${dx}px, ${dy}px)`;
    } else {
        gameContainer.style.transform = '';
        shakeIntensity = 0;
    }
    loopId = requestAnimationFrame(gameLoop);
}

function drawGroundDetail() {
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.1)';
    ctx.lineWidth = 1;
    const gridSize = 50;
    const offset = (frames * 1) % gridSize; // Purely cosmetic, frames is ok
    
    for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = offset - gridSize; y < canvas.height; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
}

function createHighlight(x, y, color) {
    for (let i = 0; i < 5; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function popBalloon(b) {
    score += (10 + wave);
    money += (10 + Math.floor(wave/2)) * getCashMultiplier();
    updateScoreUI();
    updateUpgradeUI(); 
    Sound.pop();

    maybeSpawnPowerup(b.x, b.y);
    
    for (let i = 0; i < 15; i++) {
        particles.push(new Particle(b.x, b.y, b.color));
    }
}

function endGame() {
    gameState = 'GAMEOVER';
    shakeTime = 0;
    shakeIntensity = 0;
    gameContainer.style.transform = '';
    finalScoreEl.innerText = score;
    gameOverScreen.classList.remove('hidden');
    Sound.playTone(100, 'sawtooth', 0.5);
}

function returnToMenu() {
    gameState = 'START';
    if (loopId) cancelAnimationFrame(loopId);
    upgradeMenu.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    modeScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    chaosHud.classList.add('hidden');
    pauseBtn.innerText = "⏸";
    loadLeaderboard();
}

function togglePause() {
    if (gameState === 'PLAYING') {
        gameState = 'PAUSED';
        upgradeMenu.classList.remove('hidden');
        pauseBtn.innerText = "▶"; // Change icon to Play
        updateUpgradeUI();
    } else if (gameState === 'PAUSED') {
        gameState = 'PLAYING';
        upgradeMenu.classList.add('hidden');
        pauseBtn.innerText = "⏸"; // Change icon back to Pause
        lastTime = performance.now(); // Essential to prevent huge DT jump
        loopId = requestAnimationFrame(gameLoop);
    }
}

function buyUpgrade(type) {
    const upg = upgrades[type];
    if (upg.level >= MAX_UPGRADES) return;
    if (money >= upg.cost) {
        money -= upg.cost;
        upg.level++;
        upg.cost = Math.floor(upg.cost * 1.5);
        Sound.buy();
        tank.recalcStats();
        updateScoreUI();
        updateUpgradeUI();
    } else {
        Sound.error();
    }
}

function unlockWeapon(type) {
    const upg = upgrades[type];
    if (upg.unlocked) { 
        equipWeapon(type);
        return;
    }
    
    if (money >= upg.cost) {
        money -= upg.cost;
        upg.unlocked = true;
        Sound.buy();
        equipWeapon(type);
        updateScoreUI();
        updateUpgradeUI();
    } else {
        Sound.error();
    }
}

function equipWeapon(type) {
    if (type !== 'standard' && !upgrades[type].unlocked) return;
    currentWeapon = type;
    Sound.playTone(600, 'square', 0.1);
    updateUpgradeUI();
}

function updateScoreUI() {
    scoreEl.innerText = score;
    moneyEl.innerText = money;
    livesEl.innerText = lives;
}

function loadLeaderboard(mode = gameMode) {
    const key = getLeaderboardKey(mode);
    const list = JSON.parse(localStorage.getItem(key) || '[]');
    topScoresList.innerHTML = '';
    list.slice(0, 10).forEach((entry, i) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>#${i+1} ${entry.name}</span> <span>${entry.score}</span>`;
        topScoresList.appendChild(li);
    });
    const currHigh = list.length > 0 ? list[0].score : 0;
    document.getElementById('high-score').innerText = currHigh;
}

function saveScore(name, finalScore) {
    const key = getLeaderboardKey();
    let list = JSON.parse(localStorage.getItem(key) || '[]');
    list.push({ name, score: finalScore });
    list.sort((a, b) => b.score - a.score);
    localStorage.setItem(key, JSON.stringify(list.slice(0, 10)));
}

function updateUpgradeUI() {
    ['fireRate', 'multiShot'].forEach(key => {
        const upg = upgrades[key];
        const btn = document.getElementById('buy-' + key.toLowerCase());
        const costEl = document.getElementById('cost-' + key.toLowerCase());
        const bar = document.getElementById('bar-' + key.toLowerCase());
        
        if (upg.level >= MAX_UPGRADES) {
            btn.innerText = "MAX";
            btn.disabled = true;
            costEl.innerText = "-";
        } else {
            btn.disabled = money < upg.cost;
            costEl.innerText = upg.cost;
            bar.style.width = (upg.level / MAX_UPGRADES * 100) + "%";
        }
    });

    ['shotgun', 'laser'].forEach(key => {
        const upg = upgrades[key];
        const btn = document.getElementById('buy-' + key);
        const costEl = document.getElementById('cost-' + key);
        
        if (upg.unlocked) {
            btn.innerText = currentWeapon === key ? "EQUIPPED" : "EQUIP";
            btn.disabled = currentWeapon === key;
            costEl.innerText = "Owned";
            btn.style.borderColor = currentWeapon === key ? '#00ff00' : '#00f3ff';
            btn.style.color = currentWeapon === key ? '#00ff00' : '#00f3ff';
        } else {
            btn.innerText = "BUY";
            btn.disabled = money < upg.cost;
            costEl.innerText = upg.cost;
        }
    });
}

loadLeaderboard();
updateModeUnlocks();
