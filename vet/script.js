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
const toolWashBtn = document.getElementById('tool-wash');
const toolExamineBtn = document.getElementById('tool-examine');
const toolTreatBtn = document.getElementById('tool-treat');
const toolPetBtn = document.getElementById('tool-pet');
const toolDressBtn = document.getElementById('tool-dress');
const ingredientsEl = document.getElementById('ingredients');
const ingButtons = document.querySelectorAll('#ingredients .ing');
const barClean = document.getElementById('bar-clean');
const barHappy = document.getElementById('bar-happy');

let width = 800, height = 600;
let lastTime = 0;
let gameState = 'START';
let doors = [];
let currentCustomer = null;
let petsTreated = 0;
let coins = 0;
let reputation = 0;
let activeTool = null;
let selectedIngredient = null;
let isPetting = false;
let lastPetX = 0, lastPetY = 0;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const Sound = {
    tone(freq, type = 'sine', dur = 0.08, gain = 0.06) {
        try {
            const o = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            o.type = type; o.frequency.setValueAtTime(freq, audioCtx.currentTime);
            g.gain.setValueAtTime(gain, audioCtx.currentTime);
            o.connect(g); g.connect(audioCtx.destination);
            o.start(); o.stop(audioCtx.currentTime + dur);
        } catch (e) {}
    },
    click() { Sound.tone(580, 'triangle', 0.06, 0.04); },
    wash() { Sound.tone(420, 'sine', 0.08, 0.06); },
    success() { Sound.tone(880, 'sawtooth', 0.12, 0.08); }
};

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

    // create a small set of possible ailments and required tasks
    const ailments = ['scratched', 'fever', 'ear'];
    const chosenAilment = Math.random() < 0.6 ? ailments[Math.floor(Math.random()*ailments.length)] : null;
    const required = [];
    // washing is recommended if random or chosen indicates dirty
    if (Math.random() < 0.7) required.push('wash');
    if (chosenAilment) required.push('treat');
    required.push('pet'); // always pet before finish

    currentCustomer = {
        doorIndex: doors.indexOf(door),
        owner: 'Alex',
        request: chosenAilment ? `Please ${required.join(' & ')} — my pet has ${chosenAilment}` : `Please ${required.join(' & ')}`,
        pet: { type: 'dog', name, color: colors[Math.floor(Math.random()*colors.length)], cleanliness: 0, happiness: 0, ailment: chosenAilment, treated: false },
        requiredTasks: required,
        progress: { wash: 0, pet: 0 }
    };
    // reset UI
    barClean.style.width = '0%';
    barHappy.style.width = '0%';
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
        // pet interactions depend on active tool
        if (currentCustomer) {
            const px = width*0.5, py = height*0.75;
            const dx = x - px, dy = y - py;
            if (dx*dx + dy*dy < 80*80) {
                if (activeTool === 'wash') {
                    currentCustomer.progress.wash += 1;
                    currentCustomer.pet.cleanliness = Math.min(100, currentCustomer.progress.wash * 34);
                    barClean.style.width = `${currentCustomer.pet.cleanliness}%`;
                    Sound.wash();
                    if (currentCustomer.progress.wash >= 3) {
                        // washing done
                        const idx = currentCustomer.requiredTasks.indexOf('wash');
                        if (idx >= 0) currentCustomer.requiredTasks.splice(idx,1);
                        Sound.click();
                    }
                } else if (activeTool === 'examine') {
                    // reveal ailment
                    if (currentCustomer.pet.ailment) {
                        alert(`Diagnosis: ${currentCustomer.pet.ailment}`);
                        Sound.click();
                    } else {
                        alert('No obvious issues found');
                    }
                } else if (activeTool === 'treat') {
                    if (!selectedIngredient) {
                        // prompt to pick ingredient
                        ingredientsEl.classList.remove('hidden');
                    } else {
                        // simple treatment check: map ingredients to ailments
                        const map = { '0': 'scratched', '1': 'fever', '2': 'ear' };
                        if (map[selectedIngredient] === currentCustomer.pet.ailment) {
                            currentCustomer.pet.treated = true;
                            currentCustomer.requiredTasks = currentCustomer.requiredTasks.filter(t => t !== 'treat');
                            Sound.success();
                        } else {
                            Sound.click();
                            reputation = Math.max(0, reputation - 1);
                        }
                        // hide ingredients after attempt
                        ingredientsEl.classList.add('hidden');
                        selectedIngredient = null;
                        ingButtons.forEach(b => b.classList.remove('selected'));
                    }
                } else if (activeTool === 'pet') {
                    // start petting — pointermove will increase happiness
                    isPetting = true;
                    lastPetX = x; lastPetY = y;
                } else if (activeTool === 'dress') {
                    // toggle simple outfit flag
                    currentCustomer.pet.outfit = currentCustomer.pet.outfit ? null : 'bow';
                    Sound.click();
                }
            }
        }
    }
});

canvas.addEventListener('pointermove', (ev) => {
    if (!isPetting || !currentCustomer) return;
    const rect = canvas.getBoundingClientRect();
    const x = (ev.clientX - rect.left);
    const y = (ev.clientY - rect.top);
    const dx = Math.abs(x - lastPetX) + Math.abs(y - lastPetY);
    if (dx > 6) {
        currentCustomer.progress.pet = (currentCustomer.progress.pet || 0) + Math.min(8, Math.floor(dx/6));
        currentCustomer.pet.happiness = Math.min(100, (currentCustomer.progress.pet));
        barHappy.style.width = `${currentCustomer.pet.happiness}%`;
        lastPetX = x; lastPetY = y;
        Sound.tone(720, 'sine', 0.04, 0.02);
        if (currentCustomer.pet.happiness >= 60) {
            // mark pet task as done
            const idx = currentCustomer.requiredTasks.indexOf('pet');
            if (idx >= 0) currentCustomer.requiredTasks.splice(idx,1);
            isPetting = false;
        }
    }
});

canvas.addEventListener('pointerup', () => { isPetting = false; });

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

// Tool button handlers
function setActiveTool(tool) {
    activeTool = tool;
    [toolWashBtn, toolExamineBtn, toolTreatBtn, toolPetBtn, toolDressBtn].forEach(b => b.classList.toggle('active', b.dataset.tool === tool));
    // highlight active button manually since dataset not set
    toolWashBtn.classList.toggle('active', tool === 'wash');
    toolExamineBtn.classList.toggle('active', tool === 'examine');
    toolTreatBtn.classList.toggle('active', tool === 'treat');
    toolPetBtn.classList.toggle('active', tool === 'pet');
    toolDressBtn.classList.toggle('active', tool === 'dress');
    if (tool !== 'treat') ingredientsEl.classList.add('hidden');
}

toolWashBtn.addEventListener('click', () => setActiveTool('wash'));
toolExamineBtn.addEventListener('click', () => setActiveTool('examine'));
toolTreatBtn.addEventListener('click', () => setActiveTool('treat'));
toolPetBtn.addEventListener('click', () => setActiveTool('pet'));
toolDressBtn.addEventListener('click', () => setActiveTool('dress'));

ingButtons.forEach(b => b.addEventListener('click', (ev) => {
    ingButtons.forEach(x => x.classList.remove('selected'));
    b.classList.add('selected');
    selectedIngredient = b.dataset.ing;
}));

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
