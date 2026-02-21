const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const startScreen = document.getElementById('start-screen');
const clinicScreen = document.getElementById('clinic-screen');
const resultScreen = document.getElementById('result-screen');
const startBtn = document.getElementById('start-btn');
const backToMenu = document.getElementById('back-to-menu');
const resultContinue = document.getElementById('result-continue');

const petsTreatedEl = document.getElementById('pets-treated');
const coinsEl = document.getElementById('vet-coins');
const repEl = document.getElementById('vet-rep');
const globalLeaderboardEl = document.getElementById('global-leaderboard');

let width = 800, height = 600;
let lastTime = 0;
let gameState = 'START';
let doors = [];
let currentCustomer = null;
let petsTreated = 0;
let coins = 0;
let reputation = 0;

function resize() {
    width = canvas.clientWidth || window.innerWidth;
    height = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.max(320, Math.floor(width * devicePixelRatio));
    canvas.height = Math.max(240, Math.floor(height * devicePixelRatio));
    ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
}

function createDoors() {
    doors = [];
    const doorCount = 3;
    const spacing = width / (doorCount + 1);
    for (let i=0;i<doorCount;i++) {
        doors.push({
            x: spacing*(i+1),
            y: height*0.42,
            w: 120,
            h: 140,
            open: false,
            unlocked: i===0
        });
    }
}

function drawClinic() {
    // floor
    ctx.fillStyle = '#f8ffff';
    ctx.fillRect(0,0,width,height);

    // doors
    for (const d of doors) {
        ctx.save();
        ctx.translate(d.x, d.y);
        ctx.fillStyle = d.unlocked ? '#cfefff' : '#e9eef2';
        ctx.fillRect(-d.w/2, -d.h/2, d.w, d.h);
        ctx.fillStyle = '#8aa6c7';
        ctx.fillRect(-d.w/2 + 12, -d.h/2 + 12, d.w - 24, d.h - 24);
        if (!d.open) {
            ctx.fillStyle = 'rgba(0,0,0,0.25)';
            ctx.fillRect(-d.w/2, -d.h/2, d.w, d.h);
            ctx.fillStyle = '#fff';
            ctx.fillText('Closed', -18, 8);
        } else {
            ctx.fillStyle = '#fff';
            ctx.fillText('Open', -12, 8);
        }
        ctx.restore();
    }

    // current customer
    if (currentCustomer) {
        const p = currentCustomer.pet;
        ctx.save();
        ctx.translate(width*0.5, height*0.75);
        // pet circle
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(0,0,40,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = '#111'; ctx.fillText(p.name, -10, 50);
        // speech bubble
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.fillRect(-140, -130, 280, 48);
        ctx.fillStyle = '#222'; ctx.fillText(currentCustomer.request, -128, -110);
        ctx.restore();
    }
}

function spawnCustomerForDoor(door) {
    if (!door.unlocked) return;
    if (currentCustomer) return;
    door.open = true;

    const petTypes = ['Dog','Cat','Bunny'];
    const name = petTypes[Math.floor(Math.random()*petTypes.length)] + '-' + Math.floor(Math.random()*90+10);
    const colors = ['#ffd6b6','#cde8ff','#ffe6f2','#e8ffda'];

    currentCustomer = {
        doorIndex: doors.indexOf(door),
        owner: 'Alex',
        request: 'Please wash and check the pet',
        pet: { type: 'dog', name, color: colors[Math.floor(Math.random()*colors.length)], cleanliness: 0 }
    };
}

canvas.addEventListener('pointerdown', (ev) => {
    // map coords
    const rect = canvas.getBoundingClientRect();
    const x = (ev.clientX - rect.left);
    const y = (ev.clientY - rect.top);

    if (gameState === 'CLINIC') {
        for (const d of doors) {
            const dx = Math.abs(x - d.x);
            const dy = Math.abs(y - d.y);
            if (dx < d.w/2 && dy < d.h/2) {
                spawnCustomerForDoor(d);
                return;
            }
        }
        // if clicking pet area and a customer exists, increase cleanliness
        if (currentCustomer) {
            const px = width*0.5, py = height*0.75;
            const dx = x - px, dy = y - py;
            if (dx*dx + dy*dy < 60*60) {
                currentCustomer.pet.cleanliness += 1;
                if (currentCustomer.pet.cleanliness >= 3) finishCare();
            }
        }
    }
});

function finishCare() {
    if (!currentCustomer) return;
    // determine coins and reputation
    const earned = 10 + Math.floor(Math.random()*6);
    coins += earned;
    petsTreated += 1;
    reputation = Math.min(100, reputation + 2);
    // show result
    document.getElementById('result-coins').textContent = String(earned);
    document.getElementById('result-happy').textContent = String(3 + Math.min(2, Math.floor(currentCustomer.pet.cleanliness/1)));
    // clear
    currentCustomer = null;
    for (const d of doors) d.open = false;
    // update HUD
    petsTreatedEl.textContent = String(petsTreated);
    coinsEl.textContent = String(coins);
    repEl.textContent = String(reputation);
    // show result screen
    clinicScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');
    gameState = 'RESULT';
}

function frame(time) {
    if (!lastTime) lastTime = time;
    const dt = Math.min(0.033, (time - lastTime)/1000);
    lastTime = time;

    ctx.clearRect(0,0,canvas.width,canvas.height);
    drawClinic();
    requestAnimationFrame(frame);
}

startBtn.addEventListener('click', () => {
    startScreen.classList.add('hidden');
    clinicScreen.classList.remove('hidden');
    document.getElementById('hud').classList.remove('hidden');
    gameState = 'CLINIC';
    resize(); createDoors();
});

backToMenu.addEventListener('click', () => {
    clinicScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    document.getElementById('hud').classList.add('hidden');
    gameState = 'START';
});

resultContinue.addEventListener('click', () => {
    resultScreen.classList.add('hidden');
    clinicScreen.classList.remove('hidden');
    gameState = 'CLINIC';
});

window.addEventListener('resize', () => { resize(); createDoors(); });

// Leaderboard rendering on start screen
if (window.LeaderboardAPI && globalLeaderboardEl) {
    window.LeaderboardAPI.renderTabbedLeaderboard({
        container: globalLeaderboardEl,
        game: 'vet',
        mode: 'sandbox',
        modes: [{ value: 'sandbox', label: 'Sandbox' }],
        playerName: window.LeaderboardAPI.getSavedName()
    });
}

resize(); createDoors(); requestAnimationFrame(frame);
