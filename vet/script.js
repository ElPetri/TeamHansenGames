const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const hudEl = document.getElementById('hud');
const startScreen = document.getElementById('start-screen');
const modeScreen = document.getElementById('mode-screen');
const clinicScreen = document.getElementById('clinic-screen');
const resultScreen = document.getElementById('result-screen');
const nurseryScreen = document.getElementById('nursery-screen');

const startBtn = document.getElementById('start-btn');
const nurseryBtn = document.getElementById('nursery-btn');
const nurseryBackBtn = document.getElementById('nursery-back');
const modeClassicBtn = document.getElementById('mode-classic');
const modeBackBtn = document.getElementById('mode-back');
const backToMenu = document.getElementById('back-to-menu');
const resultContinue = document.getElementById('result-continue');
const avatarBtn = document.getElementById('avatar-btn');
const avatarPanel = document.getElementById('avatar-panel');
const avatarSaveBtn = document.getElementById('avatar-save');
const avatarOptionButtons = document.querySelectorAll('#avatar-panel [data-group]');

const petsTreatedEl = document.getElementById('pets-treated');
const coinsEl = document.getElementById('vet-coins');
const repEl = document.getElementById('vet-rep');
const globalLeaderboardEl = document.getElementById('global-leaderboard');
const nurseryCountEl = document.getElementById('nursery-count');
const nurseryGridEl = document.getElementById('nursery-grid');
const nurseryEmptyEl = document.getElementById('nursery-empty');
const resultTitleEl = document.getElementById('result-title');
const resultCoinsEl = document.getElementById('result-coins');
const resultHappyEl = document.getElementById('result-happy');

const toolWashBtn = document.getElementById('tool-wash');
const toolExamineBtn = document.getElementById('tool-examine');
const toolTreatBtn = document.getElementById('tool-treat');
const toolPetBtn = document.getElementById('tool-pet');
const toolFeedBtn = document.getElementById('tool-feed');
const toolDressBtn = document.getElementById('tool-dress');

const ingredientsEl = document.getElementById('ingredients');
const ingButtons = document.querySelectorAll('#ingredients .ing');
const foodOptionsEl = document.getElementById('food-options');
const foodButtons = document.querySelectorAll('#food-options .food');
const outfitOptionsEl = document.getElementById('outfit-options');
const outfitButtons = document.querySelectorAll('#outfit-options .outfit');
const barClean = document.getElementById('bar-clean');
const barHappy = document.getElementById('bar-happy');

const RESULT_POPUP_DELAY_MS = 900;
const AVATAR_KEY = 'vet_avatar_v1';
const NURSERY_KEY = 'vet_nursery_v1';
const NURSERY_LIMIT = 50;

const SCREEN_MAP = {
    START: startScreen,
    MODE_SELECT: modeScreen,
    CLINIC: clinicScreen,
    RESULT: resultScreen,
    NURSERY: nurseryScreen
};

const PET_TYPES = ['dog', 'cat', 'bunny', 'fox'];
const PET_LABELS = { dog: 'Dog', cat: 'Cat', bunny: 'Bunny', fox: 'Fox' };
const PET_EMOJIS = { dog: '🐶', cat: '🐱', bunny: '🐰', fox: '🦊' };
const PET_PARTICLES = {
    dog: ['🐾', '✨'],
    cat: ['💖', '✨'],
    bunny: ['🌟', '💗'],
    fox: ['🧡', '✨']
};
const FOOD_EMOJIS = { kibble: '🥣', fish: '🐟', carrot: '🥕' };
const OUTFIT_EMOJIS = { bow: '🎀', glasses: '🕶️', hat: '🎩', cape: '🦸' };
const AILMENTS = ['scratched', 'fever', 'ear'];
const AILMENT_REQUEST_TEXT = {
    scratched: 'a scratch',
    fever: 'a fever',
    ear: 'an ear infection'
};
const AILMENT_DIAGNOSIS_TEXT = {
    scratched: 'Scratch',
    fever: 'Fever',
    ear: 'Ear infection'
};

let width = 800;
let height = 600;
let lastTime = 0;
let gameState = 'START';
let currentMode = 'classic';
let doors = [];
let currentCustomer = null;
let petsTreated = 0;
let coins = 0;
let reputation = 0;
let activeTool = null;
let selectedIngredient = null;
let selectedFood = null;
let selectedOutfit = null;
let isPetting = false;
let lastPetX = 0;
let lastPetY = 0;
let sceneTime = 0;
let treatHintShownForCustomer = false;
let pendingResultTimer = null;

const particles = [];
const babyBursts = [];
const toastQueue = [];
let activeToast = null;
let nurseryBabies = [];

const avatar = {
    gender: 'girl',
    skin: '#f5cfa0',
    hair: '#2f221a',
    outfit: '#4aa3ff'
};

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const Sound = {
    tone(freq, type = 'sine', dur = 0.08, gain = 0.06) {
        try {
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.type = type;
            oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
            gainNode.gain.setValueAtTime(gain, audioCtx.currentTime);
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + dur);
        } catch (error) {}
    },
    click() { Sound.tone(580, 'triangle', 0.06, 0.04); },
    wash() { Sound.tone(420, 'sine', 0.08, 0.06); },
    success() { Sound.tone(880, 'sawtooth', 0.12, 0.08); },
    bark() {
        Sound.tone(320, 'square', 0.06, 0.05);
        setTimeout(() => Sound.tone(220, 'square', 0.05, 0.04), 55);
    },
    meow() {
        Sound.tone(620, 'triangle', 0.07, 0.045);
        setTimeout(() => Sound.tone(760, 'triangle', 0.06, 0.04), 45);
    },
    squeak() {
        Sound.tone(900, 'sine', 0.05, 0.035);
        setTimeout(() => Sound.tone(820, 'sine', 0.05, 0.03), 35);
    },
    chirp() {
        Sound.tone(1100, 'sine', 0.05, 0.035);
        setTimeout(() => Sound.tone(950, 'sine', 0.05, 0.03), 35);
    },
    petVocal(petType) {
        if (petType === 'dog') return Sound.bark();
        if (petType === 'cat') return Sound.meow();
        if (petType === 'bunny') return Sound.squeak();
        if (petType === 'fox') return Sound.chirp();
        return null;
    }
};

function ensureAudio() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
    }
}

function resize() {
    width = canvas.clientWidth || window.innerWidth;
    height = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.max(320, Math.floor(width * devicePixelRatio));
    canvas.height = Math.max(240, Math.floor(height * devicePixelRatio));
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}

function loadAvatar() {
    try {
        const raw = localStorage.getItem(AVATAR_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return;
        avatar.gender = parsed.gender || avatar.gender;
        avatar.skin = parsed.skin || avatar.skin;
        avatar.hair = parsed.hair || avatar.hair;
        avatar.outfit = parsed.outfit || avatar.outfit;
    } catch (error) {}
}

function saveAvatar() {
    try {
        localStorage.setItem(AVATAR_KEY, JSON.stringify(avatar));
    } catch (error) {}
}

function loadNursery() {
    try {
        const raw = localStorage.getItem(NURSERY_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            nurseryBabies = parsed.slice(-NURSERY_LIMIT);
        }
    } catch (error) {}
}

function saveNursery() {
    try {
        localStorage.setItem(NURSERY_KEY, JSON.stringify(nurseryBabies.slice(-NURSERY_LIMIT)));
    } catch (error) {}
}

function formatNurseryDate(isoDate) {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return 'Collected today';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function renderNursery() {
    nurseryCountEl.textContent = `${nurseryBabies.length} / ${NURSERY_LIMIT} babies`;
    nurseryGridEl.innerHTML = '';
    const visibleBabies = [...nurseryBabies].reverse();
    nurseryEmptyEl.classList.toggle('hidden', visibleBabies.length > 0);
    visibleBabies.forEach((baby) => {
        const card = document.createElement('div');
        card.className = 'nursery-card';
        card.style.borderColor = baby.color || 'rgba(143,210,255,.4)';
        card.innerHTML = `
            <span class="nursery-card-emoji">${baby.emoji}</span>
            <p class="nursery-card-title">Baby ${PET_LABELS[baby.type] || 'Pet'}</p>
            <p class="nursery-card-meta">From ${baby.parentName}</p>
            <p class="nursery-card-meta">${formatNurseryDate(baby.date)}</p>
        `;
        nurseryGridEl.appendChild(card);
    });
}

function addBabyToNursery(customer) {
    const baby = {
        type: customer.pet.type,
        emoji: PET_EMOJIS[customer.pet.type] || '🐾',
        color: customer.pet.color,
        parentName: customer.pet.name,
        date: new Date().toISOString()
    };
    nurseryBabies.push(baby);
    if (nurseryBabies.length > NURSERY_LIMIT) {
        nurseryBabies = nurseryBabies.slice(nurseryBabies.length - NURSERY_LIMIT);
    }
    saveNursery();
    renderNursery();
}

function syncAvatarUi() {
    avatarOptionButtons.forEach((button) => {
        const group = button.dataset.group;
        const value = button.dataset.value;
        button.classList.toggle('active', avatar[group] === value);
    });
}

function createDoors() {
    doors = [];
    const doorCount = 3;
    const spacing = width / (doorCount + 1);
    for (let index = 0; index < doorCount; index += 1) {
        doors.push({
            x: spacing * (index + 1),
            y: height * 0.42,
            w: 120,
            h: 140,
            open: false,
            unlocked: true
        });
    }
}

function setVisibleScreen(screenKey) {
    Object.values(SCREEN_MAP).forEach((screen) => screen.classList.add('hidden'));
    SCREEN_MAP[screenKey].classList.remove('hidden');
    hudEl.classList.toggle('hidden', screenKey !== 'CLINIC');
}

function updateHud() {
    petsTreatedEl.textContent = String(petsTreated);
    coinsEl.textContent = String(coins);
    repEl.textContent = String(reputation);
}

function resetIngredientSelection() {
    selectedIngredient = null;
    ingButtons.forEach((button) => button.classList.remove('selected'));
}

function resetFoodSelection() {
    selectedFood = null;
    foodButtons.forEach((button) => button.classList.remove('selected'));
}

function resetOutfitSelection() {
    selectedOutfit = null;
    outfitButtons.forEach((button) => button.classList.remove('selected'));
}

function hideChoicePanels() {
    ingredientsEl.classList.add('hidden');
    foodOptionsEl.classList.add('hidden');
    outfitOptionsEl.classList.add('hidden');
    resetIngredientSelection();
    resetFoodSelection();
    resetOutfitSelection();
}

function clearPendingResultTimer() {
    if (!pendingResultTimer) return;
    clearTimeout(pendingResultTimer);
    pendingResultTimer = null;
}

function clearCurrentCustomer() {
    currentCustomer = null;
    isPetting = false;
    treatHintShownForCustomer = false;
    hideChoicePanels();
    barClean.style.width = '0%';
    barHappy.style.width = '0%';
    doors.forEach((door) => {
        door.open = false;
    });
}

function goToStartScreen() {
    clearPendingResultTimer();
    clearCurrentCustomer();
    gameState = 'START';
    activeTool = null;
    setVisibleScreen('START');
}

function wrapTextLines(text, maxWidth) {
    const words = String(text || '').split(' ');
    const lines = [];
    let currentLine = '';
    words.forEach((word) => {
        const trial = currentLine ? `${currentLine} ${word}` : word;
        if (ctx.measureText(trial).width <= maxWidth || !currentLine) {
            currentLine = trial;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    });
    if (currentLine) lines.push(currentLine);
    return lines;
}

function getPetAnimation(petType, animT) {
    let offsetX = 0;
    let offsetY = 0;
    let rotation = 0;

    if (petType === 'dog') {
        offsetX = Math.sin(animT * 5.2) * 3;
        rotation = Math.sin(animT * 6.2) * 0.03;
    } else if (petType === 'cat') {
        offsetY = Math.sin(animT * 3.4) * 4;
        rotation = Math.sin(animT * 2.5) * 0.02;
    } else if (petType === 'bunny') {
        const hop = Math.max(0, Math.sin(animT * 4.8));
        offsetY = -hop * 8;
        rotation = Math.sin(animT * 4.8) * 0.015;
    } else if (petType === 'fox') {
        offsetX = Math.sin(animT * 6.5) * 4;
        offsetY = Math.cos(animT * 3.1) * 2;
        rotation = Math.sin(animT * 5.4) * 0.025;
    }

    return { offsetX, offsetY, rotation };
}

function drawCurrentCustomer() {
    if (!currentCustomer) return;

    const pet = currentCustomer.pet;
    const animT = sceneTime + (pet.animSeed || 0);
    const { offsetX, offsetY, rotation } = getPetAnimation(pet.type, animT);
    const outfitPlacement = {
        bow: { x: 22, y: -24, size: 28 },
        glasses: { x: 0, y: 2, size: 26 },
        hat: { x: 0, y: -34, size: 30 },
        cape: { x: 22, y: 8, size: 28 }
    };
    const outfitPlacementByPet = {
        dog: { glasses: { x: 0, y: 3, size: 26 } },
        cat: { glasses: { x: 0, y: 0, size: 25 } },
        bunny: { glasses: { x: 0, y: 5, size: 25 } },
        fox: {
            bow: { x: 20, y: -26, size: 28 },
            glasses: { x: 0, y: 1, size: 24 },
            hat: { x: 0, y: -33, size: 28 },
            cape: { x: 22, y: 10, size: 27 }
        }
    };

    ctx.save();
    ctx.translate(width * 0.5, height * 0.75);
    ctx.translate(offsetX, offsetY);
    ctx.rotate(rotation);

    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(47,106,152,0.45)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, Math.PI * 2);
    ctx.stroke();

    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#2f6a98';
    ctx.beginPath();
    ctx.arc(5, 8, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.font = '72px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(PET_EMOJIS[pet.type] || '🐾', 0, 0);

    if (pet.outfit) {
        const petPlacement = outfitPlacementByPet[pet.type] || {};
        const placement = petPlacement[pet.outfit] || outfitPlacement[pet.outfit] || outfitPlacement.bow;
        ctx.font = `${placement.size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
        ctx.fillText(OUTFIT_EMOJIS[pet.outfit] || '🎀', placement.x, placement.y);
    }

    if (pet.fedFood) {
        ctx.font = '22px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
        ctx.fillText(FOOD_EMOJIS[pet.fedFood] || '🥣', -30, 22);
    }

    if (currentCustomer.pregnant && !currentCustomer.delivered) {
        ctx.font = '26px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
        ctx.fillText('🍼', 31, -26);
    }

    ctx.fillStyle = '#111';
    ctx.font = '14px Arial, sans-serif';
    ctx.fillText(pet.name, 0, 54);

    ctx.font = '13px Arial, sans-serif';
    const bubbleLines = wrapTextLines(currentCustomer.request, 236).slice(0, 3);
    const bubbleHeight = 18 + bubbleLines.length * 16;
    const bubbleTop = -140;
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fillRect(-140, bubbleTop, 280, bubbleHeight);
    ctx.fillStyle = '#222';
    ctx.textAlign = 'left';
    bubbleLines.forEach((line, index) => {
        ctx.fillText(line, -128, bubbleTop + 16 + index * 16);
    });
    ctx.restore();
}

function drawBabyBursts() {
    babyBursts.forEach((burst) => {
        const alpha = Math.max(0, Math.min(1, burst.life / burst.maxLife));
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        ctx.beginPath();
        ctx.arc(burst.x, burst.y, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '34px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(burst.emoji, burst.x, burst.y);
        ctx.restore();
    });
}

function drawClinic() {
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, '#dff6ff');
    bg.addColorStop(0.55, '#f4ecff');
    bg.addColorStop(1, '#fff7dc');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    for (let index = 0; index < 10; index += 1) {
        const x = ((index * 137) % width) + Math.sin(sceneTime * 0.6 + index) * 18;
        const y = ((index * 91) % height) + Math.cos(sceneTime * 0.5 + index * 0.7) * 12;
        ctx.fillStyle = index % 2 ? 'rgba(255,182,217,0.16)' : 'rgba(143,210,255,0.16)';
        ctx.beginPath();
        ctx.arc(x, y, 20 + (index % 3) * 8, 0, Math.PI * 2);
        ctx.fill();
    }

    doors.forEach((door) => {
        ctx.save();
        ctx.translate(door.x, door.y);
        ctx.fillStyle = door.unlocked ? '#ffe8f4' : '#e9eef2';
        ctx.fillRect(-door.w / 2, -door.h / 2, door.w, door.h);
        ctx.fillStyle = door.unlocked ? '#ff9bd2' : '#8aa6c7';
        ctx.fillRect(-door.w / 2 + 12, -door.h / 2 + 12, door.w - 24, door.h - 24);
        if (!door.open) {
            ctx.fillStyle = 'rgba(0,0,0,0.25)';
            ctx.fillRect(-door.w / 2, -door.h / 2, door.w, door.h);
        }
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px "Trebuchet MS", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(door.open ? 'Open' : 'Closed', 0, 8);
        ctx.restore();
    });

    drawCurrentCustomer();
    drawBabyBursts();
    drawAvatar(95, height - 110);
}

function drawAvatar(x, y) {
    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = avatar.outfit;
    ctx.fillRect(-18, -2, 36, 42);

    ctx.fillStyle = avatar.skin;
    ctx.beginPath();
    ctx.arc(0, -22, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = avatar.hair;
    if (avatar.gender === 'girl') {
        ctx.fillRect(-14, -36, 28, 10);
        ctx.fillRect(-15, -30, 8, 12);
        ctx.fillRect(7, -30, 8, 12);
    } else {
        ctx.fillRect(-12, -36, 24, 8);
    }

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-5, -23, 3.5, 0, Math.PI * 2);
    ctx.arc(5, -23, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1a2f44';
    ctx.beginPath();
    ctx.arc(-5, -23, 1.7, 0, Math.PI * 2);
    ctx.arc(5, -23, 1.7, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#1a2f44';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-8, -25.5);
    ctx.lineTo(-9.5, -23.8);
    ctx.moveTo(-5, -26.2);
    ctx.lineTo(-5, -24.1);
    ctx.moveTo(-2, -25.5);
    ctx.lineTo(-0.5, -23.8);
    ctx.moveTo(2, -25.5);
    ctx.lineTo(0.5, -23.8);
    ctx.moveTo(5, -26.2);
    ctx.lineTo(5, -24.1);
    ctx.moveTo(8, -25.5);
    ctx.lineTo(9.5, -23.8);
    ctx.stroke();

    ctx.strokeStyle = '#c45b73';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -17, 4.8, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(6, 7, 5, 5);

    ctx.fillStyle = '#1f4d70';
    ctx.font = '12px Arial';
    ctx.fillText('You', -10, 58);
    ctx.restore();
}

function emitPetParticles(x, y, petType, intensity = 5) {
    const symbols = PET_PARTICLES[petType] || ['✨'];
    for (let index = 0; index < intensity; index += 1) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 24 + Math.random() * 48;
        particles.push({
            x: x + (Math.random() - 0.5) * 24,
            y: y + (Math.random() - 0.5) * 24,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 12,
            life: 0.55 + Math.random() * 0.35,
            maxLife: 0.9,
            symbol: symbols[Math.floor(Math.random() * symbols.length)],
            size: 16 + Math.random() * 8
        });
    }
}

function updateParticles(dt) {
    for (let index = particles.length - 1; index >= 0; index -= 1) {
        const particle = particles[index];
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.vy += 50 * dt;
        particle.life -= dt;
        if (particle.life <= 0) particles.splice(index, 1);
    }

    for (let index = babyBursts.length - 1; index >= 0; index -= 1) {
        const burst = babyBursts[index];
        burst.y += burst.vy * dt;
        burst.life -= dt;
        if (burst.life <= 0) babyBursts.splice(index, 1);
    }
}

function drawParticles() {
    particles.forEach((particle) => {
        const alpha = Math.max(0, Math.min(1, particle.life / particle.maxLife));
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = `${particle.size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(particle.symbol, particle.x, particle.y);
        ctx.restore();
    });
}

function maybeFinishCare() {
    if (!currentCustomer) return;
    if (currentCustomer.requiredTasks.length > 0) return;
    finishCare();
}

function getAilmentRequestText(ailment) {
    return AILMENT_REQUEST_TEXT[ailment] || ailment;
}

function getAilmentDiagnosisText(ailment) {
    return AILMENT_DIAGNOSIS_TEXT[ailment] || ailment;
}

function buildRequest(requiredTasks, pregnant, ailment) {
    const visibleTasks = requiredTasks.filter((task) => task !== 'deliver' && task !== 'treat');
    const careText = visibleTasks.length ? `Please ${visibleTasks.join(', ')}` : 'Please help';
    if (pregnant) {
        return `${careText} — baby on the way! Use the Delivery Kit.`;
    }
    if (ailment) {
        return `${careText} — my pet has ${getAilmentRequestText(ailment)}.`;
    }
    return `${careText}.`;
}

function buildRequiredTasks(pregnant, ailment) {
    const required = [];
    if (Math.random() < 0.7) required.push('wash');
    if (pregnant) {
        required.push('deliver');
    } else if (ailment) {
        required.push('treat');
    }
    required.push('pet');
    required.push('feed');
    required.push('dress');
    return required;
}

function spawnCustomerForDoor(door) {
    if (gameState !== 'CLINIC' || !door.unlocked || currentCustomer) return;

    door.open = true;
    const petType = PET_TYPES[Math.floor(Math.random() * PET_TYPES.length)];
    const pregnant = currentMode === 'classic' && Math.random() < 0.5;
    const ailment = pregnant ? null : (Math.random() < 0.6 ? AILMENTS[Math.floor(Math.random() * AILMENTS.length)] : null);
    const requiredTasks = buildRequiredTasks(pregnant, ailment);
    const name = `${PET_LABELS[petType]}-${Math.floor(Math.random() * 90 + 10)}`;
    const colors = ['#ffd6b6', '#cde8ff', '#ffe6f2', '#e8ffda'];

    currentCustomer = {
        doorIndex: doors.indexOf(door),
        owner: 'Alex',
        request: buildRequest(requiredTasks, pregnant, ailment),
        pregnant,
        delivered: false,
        deliveryBonusCoins: 0,
        deliveryBonusRep: 0,
        pet: {
            type: petType,
            name,
            color: colors[Math.floor(Math.random() * colors.length)],
            cleanliness: 0,
            happiness: 0,
            ailment,
            treated: false,
            animSeed: Math.random() * Math.PI * 2,
            fedFood: null,
            outfit: null
        },
        requiredTasks,
        progress: { wash: 0, pet: 0 }
    };

    treatHintShownForCustomer = false;
    barClean.style.width = '0%';
    barHappy.style.width = '0%';
}

function finishCare() {
    if (!currentCustomer || gameState === 'RESULT_PENDING') return;

    clearPendingResultTimer();
    const finishedCustomer = currentCustomer;
    const baseEarned = 10 + Math.floor(Math.random() * 6);
    const totalEarned = baseEarned + finishedCustomer.deliveryBonusCoins;
    const resultHearts = 3 + Math.min(2, Math.floor(finishedCustomer.pet.cleanliness / 25));

    coins += baseEarned;
    petsTreated += 1;
    reputation = Math.min(100, reputation + 2);
    updateHud();

    resultTitleEl.textContent = finishedCustomer.pregnant ? 'Delivery Complete!' : 'Good Job!';
    resultCoinsEl.textContent = String(totalEarned);
    resultHappyEl.textContent = String(resultHearts);

    gameState = 'RESULT_PENDING';
    isPetting = false;
    hideChoicePanels();
    doors.forEach((door) => {
        door.open = false;
    });

    pendingResultTimer = setTimeout(() => {
        pendingResultTimer = null;
        currentCustomer = null;
        setVisibleScreen('RESULT');
        gameState = 'RESULT';
    }, RESULT_POPUP_DELAY_MS);
}

function showToast(message, kind = 'info') {
    if (!message) return;

    toastQueue.push({ message, kind });
    if (activeToast) return;

    const showNextToast = () => {
        if (!toastQueue.length) {
            activeToast = null;
            return;
        }

        const next = toastQueue.shift();
        const toast = document.createElement('div');
        activeToast = toast;
        toast.textContent = next.message;
        toast.className = `vet-toast ${next.kind === 'error' ? 'error' : 'info'}`;

        document.body.appendChild(toast);
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
                activeToast = null;
                showNextToast();
            }, 170);
        }, 1400);
    };

    showNextToast();
}

function refreshIngredientOptions() {
    if (!currentCustomer) return;
    ingButtons.forEach((button) => {
        const isDeliveryButton = button.dataset.ing === 'delivery';
        const shouldShow = currentCustomer.pregnant ? isDeliveryButton : !isDeliveryButton;
        button.classList.toggle('hidden', !shouldShow);
    });
}

function applyDeliveryKit() {
    if (!currentCustomer || !currentCustomer.requiredTasks.includes('deliver') || currentCustomer.delivered) {
        ingredientsEl.classList.add('hidden');
        resetIngredientSelection();
        return;
    }

    currentCustomer.delivered = true;
    currentCustomer.requiredTasks = currentCustomer.requiredTasks.filter((task) => task !== 'deliver');
    currentCustomer.deliveryBonusCoins = 5;
    currentCustomer.deliveryBonusRep = 1;
    coins += currentCustomer.deliveryBonusCoins;
    reputation = Math.min(100, reputation + currentCustomer.deliveryBonusRep);
    updateHud();
    addBabyToNursery(currentCustomer);
    babyBursts.push({
        x: width * 0.5 + 48,
        y: height * 0.75 - 26,
        vy: -12,
        life: 1.5,
        maxLife: 1.5,
        emoji: PET_EMOJIS[currentCustomer.pet.type] || '🐾'
    });
    emitPetParticles(width * 0.5 + 36, height * 0.75 - 12, currentCustomer.pet.type, 10);
    Sound.success();
    showToast('Baby delivered! +5 coins and +1 reputation. 🍼');
    maybeFinishCare();

    ingredientsEl.classList.add('hidden');
    resetIngredientSelection();
}

function applyTreatmentByIngredient(ingredientCode) {
    if (!currentCustomer) return;
    if (ingredientCode === 'delivery') {
        applyDeliveryKit();
        return;
    }
    if (currentCustomer.pregnant || !currentCustomer.requiredTasks.includes('treat')) {
        ingredientsEl.classList.add('hidden');
        resetIngredientSelection();
        return;
    }

    const treatmentMap = { '0': 'scratched', '1': 'fever', '2': 'ear' };
    const targetAilment = treatmentMap[ingredientCode];

    currentCustomer.pet.treated = true;
    currentCustomer.requiredTasks = currentCustomer.requiredTasks.filter((task) => task !== 'treat');

    if (targetAilment === currentCustomer.pet.ailment) {
        Sound.success();
        showToast('Treatment worked! ✅');
    } else {
        Sound.click();
        reputation = Math.max(0, reputation - 1);
        updateHud();
        showToast('Not the best match, but treatment helped 👍', 'error');
    }

    maybeFinishCare();
    ingredientsEl.classList.add('hidden');
    resetIngredientSelection();
}

function applyFeedByChoice(foodChoice) {
    if (!currentCustomer || !currentCustomer.requiredTasks.includes('feed')) {
        foodOptionsEl.classList.add('hidden');
        resetFoodSelection();
        return;
    }

    currentCustomer.pet.fedFood = foodChoice;
    currentCustomer.requiredTasks = currentCustomer.requiredTasks.filter((task) => task !== 'feed');
    currentCustomer.pet.happiness = Math.min(100, currentCustomer.pet.happiness + 15);
    barHappy.style.width = `${currentCustomer.pet.happiness}%`;
    Sound.success();
    showToast('Pet fed! 🍽️');
    maybeFinishCare();

    foodOptionsEl.classList.add('hidden');
    resetFoodSelection();
}

function applyOutfitChoice(outfitChoice) {
    if (!currentCustomer || !currentCustomer.requiredTasks.includes('dress')) {
        outfitOptionsEl.classList.add('hidden');
        resetOutfitSelection();
        return;
    }

    currentCustomer.pet.outfit = outfitChoice;
    currentCustomer.requiredTasks = currentCustomer.requiredTasks.filter((task) => task !== 'dress');
    Sound.success();
    showToast('Outfit applied! ✨');
    maybeFinishCare();

    outfitOptionsEl.classList.add('hidden');
    resetOutfitSelection();
}

function handleWash() {
    if (!currentCustomer) return;
    currentCustomer.progress.wash += 1;
    currentCustomer.pet.cleanliness = Math.min(100, currentCustomer.progress.wash * 34);
    barClean.style.width = `${currentCustomer.pet.cleanliness}%`;
    Sound.wash();
    if (Math.random() < 0.35) Sound.petVocal(currentCustomer.pet.type);
    if (currentCustomer.progress.wash >= 3) {
        currentCustomer.requiredTasks = currentCustomer.requiredTasks.filter((task) => task !== 'wash');
        Sound.click();
        maybeFinishCare();
    }
}

function handlePetting(x, y, intensity = 20) {
    if (!currentCustomer) return;
    currentCustomer.progress.pet = (currentCustomer.progress.pet || 0) + intensity;
    currentCustomer.pet.happiness = Math.min(100, currentCustomer.progress.pet);
    barHappy.style.width = `${currentCustomer.pet.happiness}%`;
    Sound.tone(720, 'sine', 0.05, 0.03);
    Sound.petVocal(currentCustomer.pet.type);
    emitPetParticles(x, y, currentCustomer.pet.type, 6);

    if (currentCustomer.pet.happiness >= 60) {
        currentCustomer.requiredTasks = currentCustomer.requiredTasks.filter((task) => task !== 'pet');
        maybeFinishCare();
    }
}

function setActiveTool(tool) {
    activeTool = tool;
    [toolWashBtn, toolExamineBtn, toolTreatBtn, toolPetBtn, toolFeedBtn, toolDressBtn].forEach((button) => button.classList.remove('active'));
    toolWashBtn.classList.toggle('active', tool === 'wash');
    toolExamineBtn.classList.toggle('active', tool === 'examine');
    toolTreatBtn.classList.toggle('active', tool === 'treat');
    toolPetBtn.classList.toggle('active', tool === 'pet');
    toolFeedBtn.classList.toggle('active', tool === 'feed');
    toolDressBtn.classList.toggle('active', tool === 'dress');

    if (tool !== 'treat') {
        ingredientsEl.classList.add('hidden');
        resetIngredientSelection();
    }
    if (tool !== 'feed') {
        foodOptionsEl.classList.add('hidden');
        resetFoodSelection();
    }
    if (tool !== 'dress') {
        outfitOptionsEl.classList.add('hidden');
        resetOutfitSelection();
    }

    if (!currentCustomer) return;

    if (tool === 'treat') {
        if (currentCustomer.requiredTasks.includes('deliver') || currentCustomer.requiredTasks.includes('treat')) {
            refreshIngredientOptions();
            ingredientsEl.classList.remove('hidden');
            if (!treatHintShownForCustomer) {
                showToast(currentCustomer.pregnant ? 'Use the Delivery Kit for this expecting pet.' : 'Pick a medicine below to treat the pet.');
                treatHintShownForCustomer = true;
            }
        } else {
            ingredientsEl.classList.add('hidden');
            showToast('This pet does not need medicine right now.');
        }
    }

    if (tool === 'feed') {
        if (currentCustomer.requiredTasks.includes('feed')) {
            foodOptionsEl.classList.remove('hidden');
            showToast('Choose food for the pet.');
        } else {
            showToast('This pet is already fed.');
        }
    }

    if (tool === 'dress') {
        if (currentCustomer.requiredTasks.includes('dress')) {
            outfitOptionsEl.classList.remove('hidden');
            showToast('Pick an outfit for the pet.');
        } else {
            showToast('This pet is already dressed.');
        }
    }

    if (tool === 'wash') {
        handleWash();
    }

    if (tool === 'pet') {
        handlePetting(width * 0.5, height * 0.75, 16);
    }
}

canvas.addEventListener('pointerdown', (event) => {
    ensureAudio();
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (gameState !== 'CLINIC') return;

    for (const door of doors) {
        const dx = Math.abs(x - door.x);
        const dy = Math.abs(y - door.y);
        if (dx < door.w / 2 && dy < door.h / 2) {
            spawnCustomerForDoor(door);
            return;
        }
    }

    if (!currentCustomer) return;

    const px = width * 0.5;
    const py = height * 0.75;
    const dx = x - px;
    const dy = y - py;
    if (dx * dx + dy * dy >= 80 * 80) return;

    if (activeTool === 'wash') {
        handleWash();
        return;
    }

    if (activeTool === 'examine') {
        if (currentCustomer.pregnant) {
            alert('This pet is expecting. Use the Delivery Kit to help with delivery.');
            Sound.click();
        } else if (currentCustomer.pet.ailment) {
            alert(`Diagnosis: ${getAilmentDiagnosisText(currentCustomer.pet.ailment)}`);
            Sound.click();
        } else {
            alert('No obvious issues found');
        }
        return;
    }

    if (activeTool === 'treat') {
        refreshIngredientOptions();
        ingredientsEl.classList.remove('hidden');
        if (selectedIngredient !== null) {
            applyTreatmentByIngredient(selectedIngredient);
        }
        return;
    }

    if (activeTool === 'pet') {
        handlePetting(px, py, 20);
        isPetting = true;
        lastPetX = x;
        lastPetY = y;
        return;
    }

    if (activeTool === 'feed') {
        foodOptionsEl.classList.remove('hidden');
        if (selectedFood !== null) {
            applyFeedByChoice(selectedFood);
        }
        return;
    }

    if (activeTool === 'dress') {
        outfitOptionsEl.classList.remove('hidden');
        if (selectedOutfit !== null) {
            applyOutfitChoice(selectedOutfit);
        }
    }
});

canvas.addEventListener('pointermove', (event) => {
    if (!isPetting || !currentCustomer) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const delta = Math.abs(x - lastPetX) + Math.abs(y - lastPetY);
    if (delta <= 6) return;

    currentCustomer.progress.pet = (currentCustomer.progress.pet || 0) + Math.min(8, Math.floor(delta / 6));
    currentCustomer.pet.happiness = Math.min(100, currentCustomer.progress.pet);
    barHappy.style.width = `${currentCustomer.pet.happiness}%`;
    lastPetX = x;
    lastPetY = y;
    Sound.tone(720, 'sine', 0.04, 0.02);
    if (Math.random() < 0.25) Sound.petVocal(currentCustomer.pet.type);
    if (Math.random() < 0.65) emitPetParticles(x, y, currentCustomer.pet.type, 2);
    if (currentCustomer.pet.happiness >= 60) {
        currentCustomer.requiredTasks = currentCustomer.requiredTasks.filter((task) => task !== 'pet');
        isPetting = false;
        maybeFinishCare();
    }
});

canvas.addEventListener('pointerup', () => {
    isPetting = false;
});

toolWashBtn.addEventListener('click', () => setActiveTool('wash'));
toolExamineBtn.addEventListener('click', () => setActiveTool('examine'));
toolTreatBtn.addEventListener('click', () => setActiveTool('treat'));
toolPetBtn.addEventListener('click', () => setActiveTool('pet'));
toolFeedBtn.addEventListener('click', () => setActiveTool('feed'));
toolDressBtn.addEventListener('click', () => setActiveTool('dress'));

ingButtons.forEach((button) => button.addEventListener('click', () => {
    ingButtons.forEach((item) => item.classList.remove('selected'));
    button.classList.add('selected');
    selectedIngredient = button.dataset.ing;

    if (activeTool === 'treat' && currentCustomer) {
        applyTreatmentByIngredient(selectedIngredient);
    }
}));

foodButtons.forEach((button) => button.addEventListener('click', () => {
    foodButtons.forEach((item) => item.classList.remove('selected'));
    button.classList.add('selected');
    selectedFood = button.dataset.food;

    if (activeTool === 'feed' && currentCustomer) {
        applyFeedByChoice(selectedFood);
    }
}));

outfitButtons.forEach((button) => button.addEventListener('click', () => {
    outfitButtons.forEach((item) => item.classList.remove('selected'));
    button.classList.add('selected');
    selectedOutfit = button.dataset.outfit;

    if (activeTool === 'dress' && currentCustomer) {
        applyOutfitChoice(selectedOutfit);
    }
}));

avatarBtn.addEventListener('click', () => {
    avatarPanel.classList.toggle('hidden');
});

avatarOptionButtons.forEach((button) => {
    button.addEventListener('click', () => {
        const group = button.dataset.group;
        const value = button.dataset.value;
        avatar[group] = value;
        syncAvatarUi();
    });
});

avatarSaveBtn.addEventListener('click', () => {
    saveAvatar();
    avatarPanel.classList.add('hidden');
    Sound.success();
});

startBtn.addEventListener('click', () => {
    avatarPanel.classList.add('hidden');
    setVisibleScreen('MODE_SELECT');
    gameState = 'MODE_SELECT';
});

nurseryBtn.addEventListener('click', () => {
    avatarPanel.classList.add('hidden');
    renderNursery();
    setVisibleScreen('NURSERY');
    gameState = 'NURSERY';
});

nurseryBackBtn.addEventListener('click', () => {
    setVisibleScreen('START');
    gameState = 'START';
});

modeBackBtn.addEventListener('click', () => {
    setVisibleScreen('START');
    gameState = 'START';
});

modeClassicBtn.addEventListener('click', () => {
    currentMode = 'classic';
    clearCurrentCustomer();
    setVisibleScreen('CLINIC');
    gameState = 'CLINIC';
    resize();
    createDoors();
    updateHud();
});

backToMenu.addEventListener('click', () => {
    goToStartScreen();
});

resultContinue.addEventListener('click', () => {
    setVisibleScreen('CLINIC');
    gameState = 'CLINIC';
});

window.addEventListener('resize', () => {
    resize();
    createDoors();
});

function frame(time) {
    if (!lastTime) lastTime = time;
    const dt = Math.min(0.033, (time - lastTime) / 1000);
    lastTime = time;
    sceneTime += dt;
    updateParticles(dt);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawClinic();
    drawParticles();
    requestAnimationFrame(frame);
}

if (window.LeaderboardAPI && globalLeaderboardEl) {
    window.LeaderboardAPI.renderTabbedLeaderboard({
        container: globalLeaderboardEl,
        game: 'vet',
        mode: 'classic',
        modes: [{ value: 'classic', label: 'Classic Mode' }],
        playerName: window.LeaderboardAPI.getSavedName()
    });
}

loadAvatar();
loadNursery();
syncAvatarUi();
renderNursery();
updateHud();
resize();
createDoors();
setVisibleScreen('START');
requestAnimationFrame(frame);
