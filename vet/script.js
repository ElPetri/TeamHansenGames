const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const hudEl = document.getElementById('hud');
const startScreen = document.getElementById('start-screen');
const modeScreen = document.getElementById('mode-screen');
const clinicScreen = document.getElementById('clinic-screen');
const adventureScreen = document.getElementById('adventure-screen');
const helpingScreen = document.getElementById('helping-screen');
const resultScreen = document.getElementById('result-screen');
const nurseryScreen = document.getElementById('nursery-screen');

const startBtn = document.getElementById('start-btn');
const nurseryBtn = document.getElementById('nursery-btn');
const nurseryBackBtn = document.getElementById('nursery-back');
const modeClassicBtn = document.getElementById('mode-classic');
const modeAdventureBtn = document.getElementById('mode-adventure');
const modeHelpingBtn = document.getElementById('mode-helping');
const modeBackBtn = document.getElementById('mode-back');
const backToMenu = document.getElementById('back-to-menu');
const openShopBtn = document.getElementById('open-shop');
const parentDoorHelpBtn = document.getElementById('parent-door-help');
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
const adventureBackBtn = document.getElementById('adventure-back');
const adventureShopBtn = document.getElementById('adventure-shop-btn');
const adventureShopEl = document.getElementById('adventure-shop');
const adventureBuyBallBtn = document.getElementById('adventure-buy-ball');
const adventureCloseShopBtn = document.getElementById('adventure-close-shop');
const adventureInventoryEl = document.getElementById('adventure-inventory');
const adventureBallCountEl = document.getElementById('adventure-ball-count');
const adventureGogglesBtn = document.getElementById('adventure-goggles');
const adventureActionCatchBtn = document.getElementById('adventure-action-catch');
const adventureActionJumpBtn = document.getElementById('adventure-action-jump');
const adventureStatusEl = document.getElementById('adventure-status');
const adventureTreatmentEl = document.getElementById('adventure-treatment');
const adventureTreatmentTitleEl = document.getElementById('adventure-treatment-title');
const adventureTreatmentCopyEl = document.getElementById('adventure-treatment-copy');
const adventureTreatmentHintEl = document.getElementById('adventure-treatment-hint');
const adventureToolExamineBtn = document.getElementById('adventure-tool-examine');
const adventureToolWashBtn = document.getElementById('adventure-tool-wash');
const adventureToolTreatBtn = document.getElementById('adventure-tool-treat');
const adventureToolPetBtn = document.getElementById('adventure-tool-pet');
const adventureToolFeedBtn = document.getElementById('adventure-tool-feed');
const adventureToolDressBtn = document.getElementById('adventure-tool-dress');
const adventureBabyHelperBtn = document.getElementById('adventure-baby-helper');
const adventureMedicineEl = document.getElementById('adventure-medicine');
const adventureFoodEl = document.getElementById('adventure-food');
const adventureOutfitsEl = document.getElementById('adventure-outfits');
const adventureIngButtons = document.querySelectorAll('#adventure-medicine .adv-ing');
const adventureFoodButtons = document.querySelectorAll('#adventure-food .adv-food');
const adventureOutfitButtons = document.querySelectorAll('#adventure-outfits .adv-outfit');
const adventureNpcPromptEl = document.getElementById('adventure-npc-prompt');
const adventureNpcCopyEl = document.getElementById('adventure-npc-copy');
const adventureNpcInputEl = document.getElementById('adventure-npc-input');
const adventureNpcPresetButtons = document.querySelectorAll('#adventure-npc-prompt [data-coin-amount]');
const adventureNpcConfirmBtn = document.getElementById('adventure-npc-confirm');
const adventureNpcCancelBtn = document.getElementById('adventure-npc-cancel');
const adventureJoystickEl = document.getElementById('adventure-joystick');
const adventureJoystickKnobEl = document.getElementById('adventure-joystick-knob');
const helpingBackBtn = document.getElementById('helping-back');
const helpingStatusEl = document.getElementById('helping-status');
const helpingPickupEl = document.getElementById('helping-pickup');
const helpingPickupCopyEl = document.getElementById('helping-pickup-copy');
const helpingPickupListEl = document.getElementById('helping-pickup-list');
const helpingTreatmentEl = document.getElementById('helping-treatment');
const helpingTreatmentTitleEl = document.getElementById('helping-treatment-title');
const helpingTreatmentCopyEl = document.getElementById('helping-treatment-copy');
const helpingTreatmentHintEl = document.getElementById('helping-treatment-hint');
const helpingToolExamineBtn = document.getElementById('helping-tool-examine');
const helpingToolWashBtn = document.getElementById('helping-tool-wash');
const helpingToolBandageBtn = document.getElementById('helping-tool-bandage');
const helpingToolTreatBtn = document.getElementById('helping-tool-treat');
const helpingToolPetBtn = document.getElementById('helping-tool-pet');
const helpingToolFeedBtn = document.getElementById('helping-tool-feed');
const helpingToolDressBtn = document.getElementById('helping-tool-dress');
const helpingMedicineEl = document.getElementById('helping-medicine');
const helpingFoodEl = document.getElementById('helping-food');
const helpingOutfitsEl = document.getElementById('helping-outfits');
const helpingIngButtons = document.querySelectorAll('#helping-medicine .help-ing');
const helpingFoodButtons = document.querySelectorAll('#helping-food .help-food');
const helpingOutfitButtons = document.querySelectorAll('#helping-outfits .help-outfit');
const helpingJoystickEl = document.getElementById('helping-joystick');
const helpingJoystickKnobEl = document.getElementById('helping-joystick-knob');

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
const ADVENTURE_KEY = 'vet_adventure_v1';
const NURSERY_LIMIT = 50;
const ADVENTURE_BALL_COST = 15;

const SCREEN_MAP = {
    START: startScreen,
    MODE_SELECT: modeScreen,
    CLINIC: clinicScreen,
    ADVENTURE: adventureScreen,
    HELPING: helpingScreen,
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
let currentAdventureAction = 'catch';
let fieldGrassPatches = [];
let wildPets = [];
let treatedPetTypes = [];
let parentDoorHelps = 0;
let parentRevealTimer = 0;
let babyHelperUsed = false;
let nextWildPetId = 1;
let fieldNpc = null;
let helpingCases = [];
let nextHelpingCaseId = 1;
let helpingFollower = null;
let helpingDeliveryBasket = null;

const pressedKeys = new Set();
const joystickState = { active: false, dx: 0, dy: 0 };
const adventurePointerState = { joystickPointerId: null };
const helpingJoystickState = { active: false, dx: 0, dy: 0 };
const helpingPointerState = { joystickPointerId: null };
const adventureInventory = {
    balls: 0,
    gogglesUnlocked: true,
    gogglesActive: false
};
const fieldPlayer = {
    x: 0,
    y: 0,
    width: 30,
    height: 46,
    speed: 188,
    hidden: false,
    ridingPetId: null
};
const helpingPlayer = {
    x: 0,
    y: 0,
    width: 30,
    height: 46,
    speed: 178
};

const HELPING_OWNER_NAMES = ['Ava', 'Mason', 'Nora', 'Leo', 'Ruby', 'Finn', 'Chloe', 'Miles'];
const HELPING_OWNER_ACTIVITIES = ['phone', 'book'];
const HELPING_OWNER_GENDERS = ['girl', 'boy'];
const HELPING_OWNER_SKINS = ['#f5cfa0', '#e3b187', '#c98f66', '#8e5d3c'];
const HELPING_OWNER_HAIR = ['#2f221a', '#5a4330', '#7b5a3d', '#20150f'];
const HELPING_OWNER_OUTFITS = ['#4aa3ff', '#ff8fb8', '#63c989', '#ffb347', '#9f8cff'];
const HELPING_WAITING_CASE_COUNT = 5;
const HELPING_WAITING_PET_OFFSET = { x: 34, y: 18 };
const HELPING_WAITING_PET_TAP_RADIUS = 50;
const HELPING_WAITING_OWNER_TAP_RADIUS = 58;

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

function loadAdventure() {
    try {
        const raw = localStorage.getItem(ADVENTURE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return;
        adventureInventory.balls = Math.max(0, Number(parsed.balls) || 0);
        adventureInventory.gogglesUnlocked = parsed.gogglesUnlocked !== false;
        adventureInventory.gogglesActive = Boolean(parsed.gogglesActive);
        if (Array.isArray(parsed.treatedPetTypes)) {
            treatedPetTypes = parsed.treatedPetTypes.filter((type) => PET_TYPES.includes(type));
        }
        parentDoorHelps = Math.max(0, Number(parsed.parentDoorHelps) || 0);
    } catch (error) {}
}

function saveAdventure() {
    try {
        localStorage.setItem(ADVENTURE_KEY, JSON.stringify({
            balls: adventureInventory.balls,
            gogglesUnlocked: adventureInventory.gogglesUnlocked,
            gogglesActive: adventureInventory.gogglesActive,
            treatedPetTypes,
            parentDoorHelps
        }));
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
    const babyCount = Math.max(1, Number(customer.babyCount) || 1);
    for (let index = 0; index < babyCount; index += 1) {
        const baby = {
            type: customer.pet.type,
            emoji: PET_EMOJIS[customer.pet.type] || '🐾',
            color: customer.pet.color,
            parentName: customer.pet.name,
            date: new Date().toISOString()
        };
        nurseryBabies.push(baby);
    }
    if (nurseryBabies.length > NURSERY_LIMIT) {
        nurseryBabies = nurseryBabies.slice(nurseryBabies.length - NURSERY_LIMIT);
    }
    saveNursery();
    renderNursery();
}

function updateAdventureUi() {
    if (adventureBallCountEl) adventureBallCountEl.textContent = String(adventureInventory.balls);
    if (adventureGogglesBtn) {
        adventureGogglesBtn.textContent = `Goggles: ${adventureInventory.gogglesActive ? 'On' : 'Off'}`;
        adventureGogglesBtn.classList.toggle('active', adventureInventory.gogglesActive);
    }
    if (adventureActionCatchBtn && adventureActionJumpBtn) {
        adventureActionCatchBtn.classList.toggle('active', currentAdventureAction === 'catch');
        adventureActionJumpBtn.classList.toggle('active', currentAdventureAction === 'jump');
    }
    if (parentDoorHelpBtn) {
        parentDoorHelpBtn.classList.toggle('hidden', parentDoorHelps <= 0);
        parentDoorHelpBtn.textContent = `Parent Help (${parentDoorHelps})`;
    }
}

function pointInRect(x, y, rect) {
    return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function getHelpingLayout() {
    const waitingRoom = { x: width * 0.05, y: height * 0.18, w: width * 0.3, h: height * 0.34 };
    const nurseryPickup = { x: width * 0.05, y: height * 0.64, w: width * 0.25, h: height * 0.2 };
    const patientRoom = { x: width * 0.62, y: height * 0.15, w: width * 0.28, h: height * 0.3 };
    const pregnancyRoom = { x: width * 0.62, y: height * 0.58, w: width * 0.28, h: height * 0.22 };
    const hallVertical = { x: width * 0.4, y: height * 0.2, w: width * 0.12, h: height * 0.58 };
    const hallTop = { x: width * 0.32, y: height * 0.29, w: width * 0.36, h: height * 0.09 };
    const hallBottom = { x: width * 0.28, y: height * 0.67, w: width * 0.4, h: height * 0.09 };
    return {
        waitingRoom,
        nurseryPickup,
        patientRoom,
        pregnancyRoom,
        hallVertical,
        hallTop,
        hallBottom,
        patientSpot: { x: patientRoom.x + patientRoom.w * 0.56, y: patientRoom.y + patientRoom.h * 0.64, w: 76, h: 44 },
        pregnancySpot: { x: pregnancyRoom.x + pregnancyRoom.w * 0.56, y: pregnancyRoom.y + pregnancyRoom.h * 0.56, w: 88, h: 50 },
        pickupSpot: { x: nurseryPickup.x + nurseryPickup.w * 0.52, y: nurseryPickup.y + nurseryPickup.h * 0.54, w: 92, h: 54 }
    };
}

function getHelpingSeat(index, caseCount = HELPING_WAITING_CASE_COUNT) {
    const waitingRoom = getHelpingLayout().waitingRoom;
    const usableWidth = Math.max(0, waitingRoom.w - 68);
    let columns = Math.min(3, Math.max(1, caseCount));
    while (columns > 1) {
        const minimumGap = columns === 3 ? 112 : 136;
        if (usableWidth >= minimumGap * (columns - 1)) break;
        columns -= 1;
    }
    const row = Math.floor(index / columns);
    const rowStart = row * columns;
    const itemsInRow = Math.min(columns, caseCount - rowStart);
    const col = index - rowStart;
    const rowTop = waitingRoom.y + 86;
    const rowCount = Math.ceil(caseCount / columns);
    const maxBottom = Math.min(height - 70, waitingRoom.y + waitingRoom.h + 110);
    const availableRowHeight = Math.max(0, maxBottom - rowTop);
    const baseRowGap = columns === 3 ? 84 : 92;
    const rowGap = rowCount > 1
        ? clamp(availableRowHeight / (rowCount - 1), 72, baseRowGap)
        : 0;
    const columnGap = itemsInRow > 1 ? usableWidth / (itemsInRow - 1) : 0;
    const rowWidth = columnGap * Math.max(0, itemsInRow - 1);
    const rowStartX = waitingRoom.x + waitingRoom.w / 2 - rowWidth / 2;
    return {
        x: rowStartX + col * columnGap,
        y: rowTop + row * rowGap
    };
}

function getHelpingWaitingCasePositions(seat) {
    return {
        ownerX: seat.x,
        ownerY: seat.y,
        petX: seat.x + HELPING_WAITING_PET_OFFSET.x,
        petY: seat.y + HELPING_WAITING_PET_OFFSET.y
    };
}

function getHelpingWaitingCaseDistances(helpingCase, x, y) {
    const ownerDistance = distanceBetween(x, y, helpingCase.seatX, helpingCase.seatY);
    const petDistance = distanceBetween(x, y, helpingCase.pet.x, helpingCase.pet.y);
    return {
        ownerDistance,
        petDistance,
        nearestDistance: Math.min(ownerDistance, petDistance)
    };
}

function getClosestHelpingWaitingCase(x, y) {
    let closestCase = null;
    let closestDistance = Infinity;
    helpingCases.forEach((helpingCase) => {
        if (helpingCase.status !== 'waiting') return;
        const distances = getHelpingWaitingCaseDistances(helpingCase, x, y);
        const isNearOwner = distances.ownerDistance <= HELPING_WAITING_OWNER_TAP_RADIUS;
        const isNearPet = distances.petDistance <= HELPING_WAITING_PET_TAP_RADIUS;
        if (!isNearOwner && !isNearPet) return;
        if (distances.nearestDistance < closestDistance) {
            closestCase = helpingCase;
            closestDistance = distances.nearestDistance;
        }
    });
    return closestCase;
}

function createHelpingPetData(base = {}) {
    const type = base.type || PET_TYPES[Math.floor(Math.random() * PET_TYPES.length)];
    const petName = base.name || `${PET_LABELS[type]}-${Math.floor(Math.random() * 90 + 10)}`;
    const petColor = base.color || ['#ffd6b6', '#cde8ff', '#ffe6f2', '#e8ffda'][Math.floor(Math.random() * 4)];
    return {
        type,
        name: petName,
        color: petColor,
        cleanliness: 0,
        happiness: 0,
        ailment: base.ailment || null,
        treated: false,
        animSeed: Math.random() * Math.PI * 2,
        fedFood: null,
        outfit: null,
        pregnant: Boolean(base.pregnant),
        babyCount: Math.max(1, Number(base.babyCount) || 1),
        helpingPregnancyTried: Boolean(base.helpingPregnancyTried),
        x: base.x || 0,
        y: base.y || 0
    };
}

function buildHelpingRequiredTasks(pregnant, ailment) {
    const required = [];
    if (Math.random() < 0.65) required.push('wash');
    if (pregnant) {
        required.push('deliver');
    } else if (ailment === 'scratched') {
        required.push('bandage');
    } else if (ailment) {
        required.push('treat');
    }
    required.push('pet');
    required.push('feed');
    required.push('dress');
    return required;
}

function createHelpingOwnerLook() {
    return {
        gender: HELPING_OWNER_GENDERS[Math.floor(Math.random() * HELPING_OWNER_GENDERS.length)],
        skin: HELPING_OWNER_SKINS[Math.floor(Math.random() * HELPING_OWNER_SKINS.length)],
        hair: HELPING_OWNER_HAIR[Math.floor(Math.random() * HELPING_OWNER_HAIR.length)],
        outfit: HELPING_OWNER_OUTFITS[Math.floor(Math.random() * HELPING_OWNER_OUTFITS.length)]
    };
}

function getHelpingDeliveryBasket() {
    if (!helpingDeliveryBasket || !currentCustomer || currentCustomer.source !== 'helping') return null;
    if (helpingDeliveryBasket.caseId !== currentCustomer.helpingCaseId) return null;
    return helpingDeliveryBasket;
}

function isHelpingDeliveryReturnActive() {
    return Boolean(getHelpingDeliveryBasket());
}

function getHelpingOwnerCaseById(caseId) {
    return helpingCases.find((item) => item.id === caseId) || null;
}

function getHelpingRemainingTasksWithoutHandoff() {
    if (!currentCustomer || currentCustomer.source !== 'helping') return [];
    return currentCustomer.requiredTasks.filter((task) => task !== 'returnBaby');
}

function finishHelpingBabyHandoff() {
    const deliveryBasket = getHelpingDeliveryBasket();
    if (!deliveryBasket || !deliveryBasket.carrying || !currentCustomer || currentCustomer.source !== 'helping') return false;
    addBabyToNursery(currentCustomer);
    currentCustomer.requiredTasks = currentCustomer.requiredTasks.filter((task) => task !== 'returnBaby');
    helpingDeliveryBasket = null;
    Sound.success();
    emitPetParticles(helpingPlayer.x + 16, helpingPlayer.y - 28, currentCustomer.pet.type, 8);
    showToast(`Baby returned to ${currentCustomer.owner}!`);
    setHelpingStatus(`${currentCustomer.owner} has the baby now. Wrapping up the visit.`);
    updateHelpingUi();
    maybeFinishCare();
    return true;
}

function createHelpingCase(index) {
    const seat = getHelpingSeat(index);
    const positions = getHelpingWaitingCasePositions(seat);
    const ailmentRoll = Math.random();
    const ailment = ailmentRoll < 0.35 ? 'scratched' : (ailmentRoll < 0.48 ? 'fever' : (ailmentRoll < 0.58 ? 'ear' : null));
    const pregnant = !ailment && Math.random() < 0.28;
    const ownerLook = createHelpingOwnerLook();
    const pet = createHelpingPetData({
        ailment,
        pregnant,
        babyCount: pregnant ? 1 + Math.floor(Math.random() * 2) : 1,
        x: positions.petX,
        y: positions.petY
    });
    return {
        id: nextHelpingCaseId += 1,
        owner: HELPING_OWNER_NAMES[Math.floor(Math.random() * HELPING_OWNER_NAMES.length)],
        activity: HELPING_OWNER_ACTIVITIES[Math.floor(Math.random() * HELPING_OWNER_ACTIVITIES.length)],
        seatX: seat.x,
        seatY: seat.y,
        ownerGender: ownerLook.gender,
        ownerSkin: ownerLook.skin,
        ownerHair: ownerLook.hair,
        ownerOutfit: ownerLook.outfit,
        status: 'waiting',
        pet
    };
}

function populateHelpingCases() {
    helpingCases = Array.from({ length: HELPING_WAITING_CASE_COUNT }, (_, index) => createHelpingCase(index));
}

function resetHelpingPlayer() {
    const waitingRoom = getHelpingLayout().waitingRoom;
    helpingPlayer.x = waitingRoom.x + waitingRoom.w * 0.52;
    helpingPlayer.y = waitingRoom.y + waitingRoom.h * 0.78;
}

function setHelpingStatus(message) {
    if (helpingStatusEl) helpingStatusEl.textContent = message;
}

function hideHelpingChoicePanels() {
    helpingMedicineEl.classList.add('hidden');
    helpingFoodEl.classList.add('hidden');
    helpingOutfitsEl.classList.add('hidden');
}

function renderHelpingPickupList() {
    if (!helpingPickupListEl) return;
    helpingPickupListEl.innerHTML = '';
    const deliveryBasket = getHelpingDeliveryBasket();
    if (deliveryBasket && !deliveryBasket.carrying) {
        const deliveryNote = document.createElement('span');
        deliveryNote.textContent = `A delivery basket is waiting here for ${deliveryBasket.owner}. Tap the basket on the floor to carry it back.`;
        helpingPickupListEl.appendChild(deliveryNote);
        return;
    }
    if (deliveryBasket && deliveryBasket.carrying) {
        const carryingNote = document.createElement('span');
        carryingNote.textContent = `You are carrying the baby basket. Walk it back to ${deliveryBasket.owner} in The Waiting Room.`;
        helpingPickupListEl.appendChild(carryingNote);
        return;
    }
    const visiblePets = nurseryBabies.slice(-6).reverse();
    if (!visiblePets.length) {
        const empty = document.createElement('span');
        empty.textContent = 'No nursery pets are ready yet.';
        helpingPickupListEl.appendChild(empty);
        return;
    }
    visiblePets.forEach((baby, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = `${PET_EMOJIS[baby.type] || '🐾'} ${PET_LABELS[baby.type]}`;
        button.addEventListener('click', () => pickupHelpingNurseryPet(index));
        helpingPickupListEl.appendChild(button);
    });
}

function updateHelpingUi() {
    const layout = getHelpingLayout();
    const deliveryBasket = getHelpingDeliveryBasket();
    const nearPickup = distanceBetween(helpingPlayer.x, helpingPlayer.y, layout.pickupSpot.x + layout.pickupSpot.w / 2, layout.pickupSpot.y + layout.pickupSpot.h / 2) < 118;
    const shouldShowPickup = gameState === 'HELPING' && nearPickup && (!currentCustomer || Boolean(deliveryBasket));
    const wasHidden = helpingPickupEl.classList.contains('hidden');
    helpingPickupEl.classList.toggle('hidden', !shouldShowPickup);
    if (shouldShowPickup) {
        let pickupState = helpingFollower && helpingFollower.kind === 'nursery' ? 'busy' : 'idle';
        if (deliveryBasket && !deliveryBasket.carrying) {
            pickupState = 'delivery-ready';
            helpingPickupCopyEl.textContent = getHelpingRemainingTasksWithoutHandoff().length
                ? 'The delivery basket is ready, but finish the remaining care tasks before carrying the baby back.'
                : `The delivery basket is ready. Tap the basket on the floor to carry it back to ${deliveryBasket.owner}.`;
        } else if (deliveryBasket && deliveryBasket.carrying) {
            pickupState = 'delivery-carrying';
            helpingPickupCopyEl.textContent = `You already picked up the basket. Bring it back to ${deliveryBasket.owner} in The Waiting Room.`;
        } else {
            helpingPickupCopyEl.textContent = helpingFollower && helpingFollower.kind === 'nursery'
                ? 'Your nursery pet is already with you. Take them to the pregnancy room or patient room.'
                : 'Choose one of your collected nursery pets to bring into Helping Mode.';
        }
        if (wasHidden || helpingPickupEl.dataset.state !== pickupState || !helpingPickupListEl.childElementCount) {
            renderHelpingPickupList();
            helpingPickupEl.dataset.state = pickupState;
        }
    }
}

function getHelpingMovementVector() {
    let moveX = 0;
    let moveY = 0;
    if (pressedKeys.has('arrowleft') || pressedKeys.has('a')) moveX -= 1;
    if (pressedKeys.has('arrowright') || pressedKeys.has('d')) moveX += 1;
    if (pressedKeys.has('arrowup') || pressedKeys.has('w')) moveY -= 1;
    if (pressedKeys.has('arrowdown') || pressedKeys.has('s')) moveY += 1;
    moveX += helpingJoystickState.dx;
    moveY += helpingJoystickState.dy;
    if (Math.abs(moveX) < 0.01 && Math.abs(moveY) < 0.01) return { x: 0, y: 0 };
    return normalizeVector(moveX, moveY);
}

function canMoveThroughHelpingMap(x, y) {
    const layout = getHelpingLayout();
    const rooms = [layout.waitingRoom, layout.nurseryPickup, layout.patientRoom, layout.pregnancyRoom, layout.hallVertical, layout.hallTop, layout.hallBottom];
    return rooms.some((room) => pointInRect(x, y, room));
}

function getActiveHelpingCase() {
    if (!helpingFollower || helpingFollower.kind !== 'case') return null;
    return helpingCases.find((item) => item.id === helpingFollower.caseId) || null;
}

function startHelpingMode() {
    currentMode = 'helping';
    clearCurrentCustomer();
    populateHelpingCases();
    helpingFollower = null;
    helpingDeliveryBasket = null;
    resetHelpingPlayer();
    hideHelpingChoicePanels();
    helpingTreatmentEl.classList.add('hidden');
    setHelpingStatus('Walk to a waiting pet, then guide it through the halls to the patient room or pregnancy room.');
    updateHelpingUi();
    setVisibleScreen('HELPING');
    gameState = 'HELPING';
    updateHud();
}

function hideAdventureChoicePanels() {
    adventureMedicineEl.classList.add('hidden');
    adventureFoodEl.classList.add('hidden');
    adventureOutfitsEl.classList.add('hidden');
}

function closeAdventureShop() {
    adventureShopEl.classList.add('hidden');
}

function setAdventureStatus(message) {
    if (adventureStatusEl) {
        adventureStatusEl.textContent = message;
    }
}

function setAdventureAction(action) {
    currentAdventureAction = action;
    updateAdventureUi();
    setAdventureStatus(action === 'jump' ? 'Jump mode: tap a nearby pet to ride and hide behind it.' : 'Catch mode: buy balls, get close, and tap a pet to rescue it.');
}

function hasBabyHelperForPet(petType) {
    return nurseryBabies.some((baby) => baby.type === petType);
}

function grantParentHelper(petType) {
    if (!PET_TYPES.includes(petType)) return;
    if (!treatedPetTypes.includes(petType)) {
        treatedPetTypes.push(petType);
        parentDoorHelps += 1;
        saveAdventure();
    }
    updateAdventureUi();
}

function randomRange(min, max) {
    return min + Math.random() * (max - min);
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function distanceBetween(ax, ay, bx, by) {
    return Math.hypot(ax - bx, ay - by);
}

function normalizeVector(x, y) {
    const magnitude = Math.hypot(x, y) || 1;
    return { x: x / magnitude, y: y / magnitude };
}

function getAdventureFieldTop() {
    return height * 0.22;
}

function getGrassPatchBounds(patch) {
    const w = patch.wRatio * width;
    const h = patch.hRatio * height;
    const fieldTop = getAdventureFieldTop();
    return {
        x: clamp(patch.xRatio * width, w / 2 + 42, width - w / 2 - 42),
        y: clamp(patch.yRatio * height, fieldTop + h / 2, height - h / 2 - 44),
        w,
        h
    };
}

function scaleAdventureEntity(entity, previousWidth, previousHeight, bottomPadding) {
    if (!entity || !previousWidth || !previousHeight) return;
    const previousTop = previousHeight * 0.22;
    const nextTop = getAdventureFieldTop();
    const previousFieldHeight = Math.max(1, previousHeight - previousTop - bottomPadding);
    const nextFieldHeight = Math.max(1, height - nextTop - bottomPadding);
    entity.x = clamp((entity.x / previousWidth) * width, 42, width - 42);
    entity.y = clamp(nextTop + (((entity.y - previousTop) / previousFieldHeight) * nextFieldHeight), nextTop, height - bottomPadding);
}

function getAdventureTaskLabel(task) {
    if (task === 'wash') return 'Wash';
    if (task === 'deliver') return 'Use Delivery Kit';
    if (task === 'treat') return 'Treat';
    if (task === 'pet') return 'Pet';
    if (task === 'feed') return 'Feed';
    if (task === 'dress') return 'Dress';
    return task;
}

function createAdventureGrassPatches() {
    fieldGrassPatches = [];
    const patchCount = Math.max(8, Math.floor(width / 120));
    for (let index = 0; index < patchCount; index += 1) {
        fieldGrassPatches.push({
            xRatio: randomRange(0.12, 0.88),
            yRatio: randomRange(0.3, 0.88),
            wRatio: randomRange(0.1, 0.18),
            hRatio: randomRange(0.08, 0.14)
        });
    }
}

function createAdventureNpc() {
    fieldNpc = {
        x: width * 0.18,
        y: height * 0.66
    };
}

function createWildPet() {
    const type = PET_TYPES[Math.floor(Math.random() * PET_TYPES.length)];
    const x = randomRange(70, width - 70);
    const y = randomRange(height * 0.24, height - 70);
    const direction = normalizeVector(randomRange(-1, 1), randomRange(-1, 1));
    const pregnant = Math.random() < 0.35;
    return {
        id: nextWildPetId += 1,
        type,
        x,
        y,
        vx: direction.x,
        vy: direction.y,
        facingX: direction.x,
        facingY: direction.y,
        speed: randomRange(26, 42),
        animSeed: Math.random() * Math.PI * 2,
        turnTimer: randomRange(1.2, 3.4),
        alertTimer: 0,
        pregnant,
        babyCount: pregnant ? 1 + Math.floor(Math.random() * 2) : 0,
        ailment: pregnant ? null : (Math.random() < 0.65 ? AILMENTS[Math.floor(Math.random() * AILMENTS.length)] : null),
        color: ['#ffd6b6', '#cde8ff', '#ffe6f2', '#e8ffda'][Math.floor(Math.random() * 4)]
    };
}

function populateWildPets() {
    wildPets = [];
    const targetCount = 6;
    while (wildPets.length < targetCount) {
        wildPets.push(createWildPet());
    }
}

function ensureWildPetPopulation() {
    while (wildPets.length < 6) {
        wildPets.push(createWildPet());
    }
}

function resetFieldPlayer() {
    fieldPlayer.x = width * 0.5;
    fieldPlayer.y = height * 0.78;
    fieldPlayer.hidden = false;
    fieldPlayer.ridingPetId = null;
}

function startAdventureMode() {
    currentMode = 'adventure';
    clearCurrentCustomer();
    resetFieldPlayer();
    createAdventureGrassPatches();
    createAdventureNpc();
    populateWildPets();
    babyHelperUsed = false;
    hideAdventureChoicePanels();
    closeAdventureNpcPrompt();
    closeAdventureShop();
    setAdventureAction('catch');
    updateAdventureUi();
    setVisibleScreen('ADVENTURE');
    gameState = 'ADVENTURE';
    updateHud();
}

function getAdventureMovementVector() {
    let moveX = 0;
    let moveY = 0;
    if (pressedKeys.has('arrowleft') || pressedKeys.has('a')) moveX -= 1;
    if (pressedKeys.has('arrowright') || pressedKeys.has('d')) moveX += 1;
    if (pressedKeys.has('arrowup') || pressedKeys.has('w')) moveY -= 1;
    if (pressedKeys.has('arrowdown') || pressedKeys.has('s')) moveY += 1;
    moveX += joystickState.dx;
    moveY += joystickState.dy;
    if (Math.abs(moveX) < 0.01 && Math.abs(moveY) < 0.01) return { x: 0, y: 0 };
    return normalizeVector(moveX, moveY);
}

function playerInGrass() {
    return fieldGrassPatches.some((patch) => {
        const bounds = getGrassPatchBounds(patch);
        return fieldPlayer.x > bounds.x - bounds.w / 2
            && fieldPlayer.x < bounds.x + bounds.w / 2
            && fieldPlayer.y > bounds.y - bounds.h / 2
            && fieldPlayer.y < bounds.y + bounds.h / 2;
    });
}

function getMountedPet() {
    return wildPets.find((pet) => pet.id === fieldPlayer.ridingPetId) || null;
}

function getClosestWildPet(x, y, maxDistance = 90) {
    let closestPet = null;
    let closestDistance = maxDistance;
    wildPets.forEach((pet) => {
        const distance = distanceBetween(x, y, pet.x, pet.y);
        if (distance <= closestDistance) {
            closestPet = pet;
            closestDistance = distance;
        }
    });
    return closestPet;
}

function beginAdventureTreatment(pet) {
    const requiredTasks = buildRequiredTasks(pet.pregnant, pet.ailment);
    currentCustomer = {
        doorIndex: -1,
        owner: 'Field Rescue',
        request: pet.pregnant ? 'Care for this expecting pet right here in the field.' : 'Treat this rescued pet before sending it home.',
        pregnant: pet.pregnant,
        delivered: false,
        deliveryBonusCoins: 0,
        deliveryBonusRep: 0,
        babyCount: pet.babyCount,
        source: 'adventure',
        pet: {
            type: pet.type,
            name: `${PET_LABELS[pet.type]}-${Math.floor(Math.random() * 90 + 10)}`,
            color: pet.color,
            cleanliness: 0,
            happiness: 0,
            ailment: pet.ailment,
            treated: false,
            animSeed: pet.animSeed,
            fedFood: null,
            outfit: null
        },
        requiredTasks,
        progress: { wash: 0, pet: 0 }
    };
    barClean.style.width = '0%';
    barHappy.style.width = '0%';
    babyHelperUsed = false;
    activeTool = null;
    hideAdventureChoicePanels();
    closeAdventureNpcPrompt();
    updateAdventureTreatmentUi();
    adventureTreatmentEl.classList.remove('hidden');
    showToast('Rescue started. Use Examine, Wash, Treat, Feed, and Dress to finish care.');
    setAdventureStatus('Rescue in progress: complete every treatment task before heading back into the grass.');
    gameState = 'ADVENTURE_TREAT';
}

function completeAdventureTreatment(finishedCustomer, totalEarned) {
    currentCustomer = null;
    gameState = 'ADVENTURE';
    adventureTreatmentEl.classList.add('hidden');
    hideAdventureChoicePanels();
    barClean.style.width = '0%';
    barHappy.style.width = '0%';
    grantParentHelper(finishedCustomer.pet.type);
    ensureWildPetPopulation();
    saveAdventure();
    updateAdventureUi();
    showToast(`Rescue complete! +${totalEarned} coins 🌿`);
    setAdventureStatus('Sneak through tall grass and look for your next patient.');
}

function updateAdventureTreatmentUi() {
    if (!currentCustomer) {
        adventureTreatmentTitleEl.textContent = 'Treat Wild Pet';
        adventureTreatmentCopyEl.textContent = 'Catch a pet to begin treatment.';
        adventureTreatmentHintEl.textContent = 'Use the care buttons below to finish the rescue.';
        adventureBabyHelperBtn.classList.add('hidden');
        return;
    }
    const remainingTasks = currentCustomer.requiredTasks.map((task) => getAdventureTaskLabel(task));
    adventureTreatmentTitleEl.textContent = `${PET_LABELS[currentCustomer.pet.type]} Rescue`;
    adventureTreatmentCopyEl.textContent = currentCustomer.pregnant
        ? `This pet is expecting ${currentCustomer.babyCount > 1 ? `${currentCustomer.babyCount} babies` : 'a baby'}.`
        : (currentCustomer.pet.ailment ? `Diagnosis: ${getAilmentDiagnosisText(currentCustomer.pet.ailment)}.` : 'No obvious illness. Finish the comfort tasks.');
    adventureTreatmentHintEl.textContent = remainingTasks.length
        ? `Next steps: ${remainingTasks.join(', ')}.`
        : 'All care tasks are complete.';
    adventureBabyHelperBtn.classList.toggle('hidden', babyHelperUsed || !hasBabyHelperForPet(currentCustomer.pet.type));
}

function getHelpingTaskLabel(task) {
    if (task === 'wash') return 'Wash';
    if (task === 'bandage') return 'Bandage';
    if (task === 'treat') return 'Treat';
    if (task === 'deliver') return 'Use Delivery Kit';
    if (task === 'returnBaby') return 'Return Baby';
    if (task === 'pet') return 'Pet';
    if (task === 'feed') return 'Feed';
    if (task === 'dress') return 'Dress';
    return task;
}

function updateHelpingTreatmentUi() {
    if (!helpingTreatmentEl) return;
    if (!currentCustomer || currentCustomer.source !== 'helping') {
        helpingTreatmentEl.classList.add('hidden');
        helpingTreatmentTitleEl.textContent = 'Patient Room';
        helpingTreatmentCopyEl.textContent = 'Bring a patient into the room to begin treatment.';
        helpingTreatmentHintEl.textContent = 'For scratches, use Bandage once. Then finish the remaining care tasks.';
        return;
    }
    const deliveryBasket = getHelpingDeliveryBasket();
    helpingTreatmentEl.classList.toggle('hidden', Boolean(deliveryBasket) || gameState !== 'HELPING_TREAT');
    const remainingTasks = currentCustomer.requiredTasks.map((task) => getHelpingTaskLabel(task));
    helpingTreatmentTitleEl.textContent = `${PET_LABELS[currentCustomer.pet.type]} Patient`;
    if (deliveryBasket) {
        helpingTreatmentCopyEl.textContent = deliveryBasket.carrying
            ? `You are carrying ${currentCustomer.babyCount > 1 ? `${currentCustomer.babyCount} babies` : 'the baby'} back to ${currentCustomer.owner}.`
            : `Delivery is complete. Visit Nursery Pickup, grab the basket, and return ${currentCustomer.babyCount > 1 ? 'the babies' : 'the baby'} to ${currentCustomer.owner}.`;
    } else {
        helpingTreatmentCopyEl.textContent = currentCustomer.pregnant
            ? `This pet may need delivery care for ${currentCustomer.babyCount > 1 ? `${currentCustomer.babyCount} babies` : 'a baby'}.`
            : (currentCustomer.pet.ailment ? `Current issue: ${getAilmentDiagnosisText(currentCustomer.pet.ailment)}.` : 'No major illness found. Finish the comfort tasks.');
    }
    helpingTreatmentHintEl.textContent = remainingTasks.length
        ? `Remaining care: ${remainingTasks.join(', ')}.`
        : 'All care tasks are complete.';
}

function pickupHelpingNurseryPet(pickupIndex) {
    if (helpingFollower) {
        showToast('Only one pet can follow you at a time.', 'error');
        return;
    }
    const baby = nurseryBabies.slice(-6).reverse()[pickupIndex];
    if (!baby) {
        showToast('That nursery pet is no longer available.', 'error');
        return;
    }
    helpingFollower = {
        kind: 'nursery',
        pet: createHelpingPetData({
            type: baby.type,
            color: baby.color,
            name: `Nursery ${PET_LABELS[baby.type]}`,
            x: helpingPlayer.x - 24,
            y: helpingPlayer.y + 18
        })
    };
    helpingPickupEl.classList.add('hidden');
    setHelpingStatus('Your nursery pet is ready. Take it to the pregnancy room or patient room.');
}

function selectHelpingCase(helpingCase) {
    if (!helpingCase || helpingFollower || (currentCustomer && currentCustomer.source === 'helping')) {
        showToast('Finish with the pet already following you first.', 'error');
        return;
    }
    helpingCase.status = 'following';
    helpingFollower = {
        kind: 'case',
        caseId: helpingCase.id,
        owner: helpingCase.owner,
        pet: helpingCase.pet
    };
    setHelpingStatus(`Guide ${helpingCase.pet.name} through the halls. Take it to the patient room or pregnancy room.`);
}

function helpingFollowerInRoom(room) {
    if (!helpingFollower) return false;
    return pointInRect(helpingFollower.pet.x, helpingFollower.pet.y, room);
}

function beginHelpingTreatmentFromFollower() {
    if (!helpingFollower) return;
    if (currentCustomer && currentCustomer.source === 'helping') {
        if (currentCustomer.helpingCaseId !== (helpingFollower.caseId || null)) {
            showToast('Finish the current Helping case before starting another one.', 'error');
            return;
        }
        hideHelpingChoicePanels();
        updateHelpingTreatmentUi();
        helpingTreatmentEl.classList.remove('hidden');
        setHelpingStatus(currentCustomer.requiredTasks.includes('returnBaby') && !getHelpingRemainingTasksWithoutHandoff().length
            ? 'The patient is ready. Pick up the baby basket and return it to the owner.'
            : 'Treatment resumed. Finish every remaining care task.');
        gameState = 'HELPING_TREAT';
        return;
    }
    const pet = helpingFollower.pet;
    const requiredTasks = buildHelpingRequiredTasks(pet.pregnant, pet.ailment);
    currentCustomer = {
        doorIndex: -1,
        owner: helpingFollower.kind === 'case' ? helpingFollower.owner : 'Your Pet',
        request: pet.pregnant ? 'Please help this pet with delivery care in the patient room.' : 'Please finish this pet\'s care gently in the patient room.',
        pregnant: pet.pregnant,
        delivered: false,
        deliveryBonusCoins: 0,
        deliveryBonusRep: 0,
        babyCount: pet.babyCount,
        source: 'helping',
        helpingKind: helpingFollower.kind,
        helpingCaseId: helpingFollower.caseId || null,
        pet,
        requiredTasks,
        progress: { wash: 0, pet: 0 }
    };
    hideHelpingChoicePanels();
    updateHelpingTreatmentUi();
    helpingTreatmentEl.classList.remove('hidden');
    setHelpingStatus('Treatment started. Use the patient room tools to finish every remaining task.');
    gameState = 'HELPING_TREAT';
}

function completeHelpingTreatment(finishedCustomer, totalEarned) {
    helpingTreatmentEl.classList.add('hidden');
    hideHelpingChoicePanels();
    helpingDeliveryBasket = null;
    if (finishedCustomer.pet) {
        finishedCustomer.pet.pregnant = false;
        finishedCustomer.pet.ailment = null;
        finishedCustomer.pet.treated = false;
        finishedCustomer.pet.cleanliness = 0;
        finishedCustomer.pet.happiness = 0;
        finishedCustomer.pet.fedFood = null;
        finishedCustomer.pet.outfit = null;
    }
    if (finishedCustomer.helpingKind === 'case' && finishedCustomer.helpingCaseId) {
        helpingCases = helpingCases.filter((item) => item.id !== finishedCustomer.helpingCaseId);
        while (helpingCases.length < 5) {
            helpingCases.push(createHelpingCase(helpingCases.length));
        }
    }
    helpingFollower = null;
    currentCustomer = null;
    gameState = 'HELPING';
    updateHelpingUi();
    showToast(`Helping room care complete! +${totalEarned} coins.`);
    setHelpingStatus('Return to the waiting room to guide another pet, or visit the nursery pickup area.');
}

function attemptHelpingPregnancy() {
    if (!helpingFollower) return;
    if (helpingFollower.pet.helpingPregnancyTried) {
        showToast('This pet already tried the pregnancy room this visit.');
        return;
    }
    helpingFollower.pet.helpingPregnancyTried = true;
    if (Math.random() < 0.55) {
        helpingFollower.pet.pregnant = true;
        helpingFollower.pet.babyCount = 1 + Math.floor(Math.random() * 2);
        helpingFollower.pet.ailment = null;
        showToast(`${helpingFollower.pet.name} may be expecting now. Take the pet to the patient room later.`);
        setHelpingStatus('Pregnancy room success. Guide the pet to the patient room when you are ready for care.');
        return;
    }
    showToast('No baby signs yet. You can still help the pet in the patient room.');
    setHelpingStatus('The pregnancy room was quiet this time. You can continue helping the pet elsewhere.');
}

function applyBandage() {
    if (!currentCustomer || !currentCustomer.requiredTasks.includes('bandage')) {
        showToast('This pet does not need a bandage right now.');
        return;
    }
    currentCustomer.pet.treated = true;
    currentCustomer.requiredTasks = currentCustomer.requiredTasks.filter((task) => task !== 'bandage');
    Sound.success();
    emitPetParticles(width * 0.5, height * 0.75, currentCustomer.pet.type, 6);
    showToast('Bandage applied right away.');
    updateHelpingTreatmentUi();
    maybeFinishCare();
}

function closeAdventureNpcPrompt() {
    if (!adventureNpcPromptEl) return;
    adventureNpcPromptEl.classList.add('hidden');
    if (adventureNpcInputEl) adventureNpcInputEl.value = '';
}

function openAdventureNpcPrompt() {
    if (!fieldNpc || !adventureNpcPromptEl) return;
    const friendLabel = avatar.gender === 'girl' ? 'Boy field friend' : 'Girl field friend';
    adventureNpcCopyEl.textContent = `${friendLabel}: How many coins do you want?`;
    adventureNpcInputEl.value = adventureNpcInputEl.value || '25';
    adventureNpcPromptEl.classList.remove('hidden');
    setAdventureStatus('Choose a coin amount from your field friend.');
}

function confirmAdventureNpcCoins() {
    const requestedAmount = Math.floor(Number(adventureNpcInputEl.value));
    if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
        showToast('Enter a valid coin amount.', 'error');
        return;
    }
    coins += requestedAmount;
    updateHud();
    closeAdventureNpcPrompt();
    showToast(`Your field friend gave you ${requestedAmount} coins.`);
    setAdventureStatus('Coins received. Explore the field when you are ready.');
}

function callBabyHelper() {
    if (!currentCustomer || babyHelperUsed || !hasBabyHelperForPet(currentCustomer.pet.type)) return;
    const remainingTasks = currentCustomer.requiredTasks.filter((task) => task !== 'deliver');
    if (!remainingTasks.length) return;
    const task = remainingTasks[Math.floor(Math.random() * remainingTasks.length)];
    babyHelperUsed = true;
    if (task === 'wash') {
        currentCustomer.progress.wash = 3;
        currentCustomer.pet.cleanliness = 100;
        barClean.style.width = '100%';
    }
    if (task === 'pet') {
        currentCustomer.progress.pet = 60;
        currentCustomer.pet.happiness = 100;
        barHappy.style.width = '100%';
    }
    if (task === 'feed') currentCustomer.pet.fedFood = 'carrot';
    if (task === 'dress') currentCustomer.pet.outfit = 'bow';
    if (task === 'treat') currentCustomer.pet.treated = true;
    currentCustomer.requiredTasks = currentCustomer.requiredTasks.filter((item) => item !== task);
    emitPetParticles(width * 0.5, height * 0.75, currentCustomer.pet.type, 8);
    showToast('Baby helper rushed in and handled a task! 🍼');
    updateAdventureTreatmentUi();
    maybeFinishCare();
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
    hudEl.classList.toggle('hidden', screenKey !== 'CLINIC' && screenKey !== 'ADVENTURE' && screenKey !== 'HELPING');
}

function updateHud() {
    petsTreatedEl.textContent = String(petsTreated);
    coinsEl.textContent = String(coins);
    repEl.textContent = String(reputation);
    updateAdventureUi();
    updateHelpingUi();
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
    hideAdventureChoicePanels();
    hideHelpingChoicePanels();
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
    babyHelperUsed = false;
    hideChoicePanels();
    if (adventureTreatmentEl) adventureTreatmentEl.classList.add('hidden');
    if (helpingTreatmentEl) helpingTreatmentEl.classList.add('hidden');
    barClean.style.width = '0%';
    barHappy.style.width = '0%';
    doors.forEach((door) => {
        door.open = false;
    });
}

function goToStartScreen() {
    clearPendingResultTimer();
    clearCurrentCustomer();
    closeAdventureNpcPrompt();
    closeAdventureShop();
    gameState = 'START';
    activeTool = null;
    fieldPlayer.ridingPetId = null;
    helpingFollower = null;
    helpingDeliveryBasket = null;
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
    if (gameState === 'START') {
        drawAvatar(width * 0.5, height * 0.7, { label: 'You' });
    } else {
        drawAvatar(95, height - 110);
    }
}

function drawGrassPatch(patch, hidden = false) {
    const bounds = getGrassPatchBounds(patch);
    ctx.save();
    ctx.translate(bounds.x, bounds.y);
    ctx.fillStyle = hidden ? 'rgba(52,131,70,0.92)' : 'rgba(104,191,96,0.78)';
    ctx.beginPath();
    ctx.roundRect(-bounds.w / 2, -bounds.h / 2, bounds.w, bounds.h, 26);
    ctx.fill();
    ctx.strokeStyle = hidden ? 'rgba(237,255,228,0.22)' : 'rgba(255,255,255,0.26)';
    ctx.lineWidth = 2;
    for (let blade = -bounds.w / 2 + 10; blade < bounds.w / 2; blade += 18) {
        ctx.beginPath();
        ctx.moveTo(blade, bounds.h / 2 - 6);
        ctx.lineTo(blade + 4, -bounds.h / 2 + 10 + Math.sin(sceneTime + blade * 0.04) * 4);
        ctx.stroke();
    }
    ctx.restore();
}

function drawWildPet(pet) {
    const anim = getPetAnimation(pet.type, sceneTime + pet.animSeed);
    ctx.save();
    ctx.translate(pet.x + anim.offsetX * 0.6, pet.y + anim.offsetY * 0.6);
    ctx.rotate(anim.rotation);
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = pet.alertTimer > 0 ? 'rgba(255,122,122,0.8)' : 'rgba(47,106,152,0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = '54px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(PET_EMOJIS[pet.type] || '🐾', 0, 0);
    if (pet.pregnant && adventureInventory.gogglesActive) {
        ctx.font = '22px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
        ctx.fillText('🍼', 24, -22 + Math.sin(sceneTime * 6 + pet.animSeed) * 3);
    }
    if (parentRevealTimer > 0) {
        ctx.strokeStyle = 'rgba(255,214,109,0.75)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 38 + Math.sin(sceneTime * 10 + pet.animSeed) * 2, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.restore();
}

function drawFieldPlayer() {
    const mountedPet = getMountedPet();
    if (mountedPet) {
        drawWildPet(mountedPet);
    }
    if (fieldPlayer.hidden) return;
    const drawX = mountedPet ? mountedPet.x : fieldPlayer.x;
    const drawY = mountedPet ? mountedPet.y - 8 : fieldPlayer.y;
    drawAvatar(drawX, drawY);
}

function drawFieldNpc() {
    if (!fieldNpc) return;
    drawAvatar(fieldNpc.x, fieldNpc.y, {
        gender: avatar.gender === 'girl' ? 'boy' : 'girl',
        hair: '#5a4330',
        outfit: '#ff8fb8',
        label: 'Friend'
    });
    if (distanceBetween(fieldPlayer.x, fieldPlayer.y, fieldNpc.x, fieldNpc.y) <= 118 && gameState === 'ADVENTURE') {
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.strokeStyle = 'rgba(74,163,255,0.34)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(fieldNpc.x - 38, fieldNpc.y - 78, 76, 28, 14);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#2f6a98';
        ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Tap to talk', fieldNpc.x, fieldNpc.y - 64);
        ctx.restore();
    }
}

function drawHelpingPet(pet, x, y, label = '') {
    const anim = getPetAnimation(pet.type, sceneTime + (pet.animSeed || 0));
    ctx.save();
    ctx.translate(x + anim.offsetX * 0.4, y + anim.offsetY * 0.4);
    ctx.rotate(anim.rotation * 0.7);
    ctx.fillStyle = 'rgba(255,255,255,0.96)';
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(47,106,152,0.36)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = '44px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(PET_EMOJIS[pet.type] || '🐾', 0, 0);
    if (pet.pregnant) {
        ctx.font = '18px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
        ctx.fillText('🍼', 22, -18);
    }
    if (label) {
        ctx.fillStyle = '#1f4d70';
        ctx.font = '11px Arial';
        ctx.fillText(label, 0, 38);
    }
    ctx.restore();
}

function drawHelpingBabyBasket(x, y, petType, babyCount, carried = false) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = carried ? 'rgba(224,170,110,0.98)' : 'rgba(232,186,129,0.96)';
    ctx.beginPath();
    ctx.roundRect(-20, -12, 40, 24, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(142,95,44,0.72)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -12, 13, Math.PI, 0);
    ctx.stroke();
    ctx.font = '22px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(PET_EMOJIS[petType] || '🐾', 0, 1);
    if (babyCount > 1) {
        ctx.fillStyle = '#1f4d70';
        ctx.font = 'bold 11px "Trebuchet MS", sans-serif';
        ctx.fillText(`x${babyCount}`, 15, -16);
    }
    ctx.restore();
}

function drawHelpingGoalCue(x, y, label, color = 'rgba(74,163,255,0.9)') {
    const pulse = (Math.sin(sceneTime * 4.8) + 1) * 0.5;
    ctx.save();
    ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
    ctx.strokeStyle = color;
    ctx.fillStyle = color.replace('0.9', '0.12');
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, 28 + pulse * 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 42 + pulse * 10, 0, Math.PI * 2);
    ctx.globalAlpha = 0.35;
    ctx.stroke();
    ctx.globalAlpha = 1;

    const bubbleWidth = Math.max(110, ctx.measureText(label).width + 26);
    const bubbleX = x - bubbleWidth / 2;
    const bubbleY = y - 74;
    ctx.fillStyle = 'rgba(255,255,255,0.96)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(bubbleX, bubbleY, bubbleWidth, 30, 14);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 8, bubbleY + 30);
    ctx.lineTo(x, bubbleY + 40);
    ctx.lineTo(x + 8, bubbleY + 30);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#275a81';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, bubbleY + 15);
    ctx.restore();
}

function drawHelpingOwner(helpingCase) {
    const deliveryBasket = getHelpingDeliveryBasket();
    const isHandoffTarget = Boolean(deliveryBasket && deliveryBasket.carrying && deliveryBasket.caseId === helpingCase.id);
    const isNearbyHandoffTarget = isHandoffTarget && distanceBetween(helpingPlayer.x, helpingPlayer.y, helpingCase.seatX, helpingCase.seatY) <= 150;
    const bounceOffset = isNearbyHandoffTarget ? Math.sin(sceneTime * 7) * 4 : 0;
    drawAvatar(helpingCase.seatX, helpingCase.seatY + bounceOffset, {
        label: helpingCase.owner,
        gender: helpingCase.ownerGender,
        skin: helpingCase.ownerSkin,
        hair: helpingCase.ownerHair,
        outfit: helpingCase.ownerOutfit
    });
    ctx.save();
    ctx.font = '24px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(helpingCase.activity === 'phone' ? '📱' : '📘', helpingCase.seatX + 22, helpingCase.seatY + 4 + bounceOffset);
    if (isNearbyHandoffTarget) {
        ctx.font = '18px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
        ctx.fillText('✨', helpingCase.seatX - 24, helpingCase.seatY - 34 + Math.sin(sceneTime * 9) * 3);
        ctx.fillText('💖', helpingCase.seatX + 28, helpingCase.seatY - 28 + Math.cos(sceneTime * 8) * 3);
    }
    ctx.restore();
    if (helpingCase.status === 'waiting') {
        drawHelpingPet(helpingCase.pet, helpingCase.pet.x, helpingCase.pet.y, 'Waiting');
    }
}

function drawHelpingRoom(rect, title, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeStyle = 'rgba(55,108,146,0.35)';
    ctx.lineWidth = 4;
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = '#245b84';
    ctx.font = 'bold 18px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(title, rect.x + 14, rect.y + 12);
    ctx.restore();
}

function drawHelpingMode() {
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, '#f3fbff');
    bg.addColorStop(0.5, '#fef4ff');
    bg.addColorStop(1, '#fff6dd');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    const layout = getHelpingLayout();
    [layout.hallVertical, layout.hallTop, layout.hallBottom].forEach((hall) => {
        ctx.fillStyle = 'rgba(240,245,251,0.94)';
        ctx.fillRect(hall.x, hall.y, hall.w, hall.h);
        ctx.strokeStyle = 'rgba(126,159,190,0.24)';
        ctx.strokeRect(hall.x, hall.y, hall.w, hall.h);
    });

    drawHelpingRoom(layout.waitingRoom, 'The Waiting Room', 'rgba(255,248,252,0.96)');
    drawHelpingRoom(layout.patientRoom, 'Patient Room', 'rgba(244,252,255,0.96)');
    drawHelpingRoom(layout.pregnancyRoom, 'Baby Room', 'rgba(255,247,232,0.96)');
    drawHelpingRoom(layout.nurseryPickup, 'Nursery Pickup', 'rgba(244,255,242,0.96)');

    ctx.fillStyle = 'rgba(74,163,255,0.18)';
    ctx.fillRect(layout.patientSpot.x, layout.patientSpot.y, layout.patientSpot.w, layout.patientSpot.h);
    ctx.fillRect(layout.pickupSpot.x, layout.pickupSpot.y, layout.pickupSpot.w, layout.pickupSpot.h);
    ctx.fillStyle = 'rgba(255,124,196,0.16)';
    ctx.fillRect(layout.pregnancySpot.x, layout.pregnancySpot.y, layout.pregnancySpot.w, layout.pregnancySpot.h);

    ctx.save();
    ctx.font = '24px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🩹', layout.patientSpot.x + layout.patientSpot.w / 2, layout.patientSpot.y + layout.patientSpot.h / 2);
    ctx.fillText('🍼', layout.pregnancySpot.x + layout.pregnancySpot.w / 2, layout.pregnancySpot.y + layout.pregnancySpot.h / 2);
    ctx.fillText('🧺', layout.pickupSpot.x + layout.pickupSpot.w / 2, layout.pickupSpot.y + layout.pickupSpot.h / 2);
    ctx.restore();

    const deliveryBasket = getHelpingDeliveryBasket();
    if (deliveryBasket && !deliveryBasket.carrying) {
        const pickupX = layout.pickupSpot.x + layout.pickupSpot.w / 2;
        const pickupY = layout.pickupSpot.y + layout.pickupSpot.h / 2 + 20;
        drawHelpingGoalCue(pickupX, pickupY, getHelpingRemainingTasksWithoutHandoff().length ? 'Finish care first' : 'Tap basket');
        drawHelpingBabyBasket(pickupX, pickupY, deliveryBasket.petType, deliveryBasket.babyCount);
    }

    helpingCases.forEach((helpingCase) => drawHelpingOwner(helpingCase));

    if (deliveryBasket && deliveryBasket.carrying) {
        const ownerCase = getHelpingOwnerCaseById(deliveryBasket.caseId);
        if (ownerCase) {
            drawHelpingGoalCue(ownerCase.seatX, ownerCase.seatY - 10, `Bring baby to ${ownerCase.owner}`, 'rgba(255,124,196,0.9)');
        }
    }

    if (helpingFollower && gameState === 'HELPING') {
        drawHelpingPet(helpingFollower.pet, helpingFollower.pet.x, helpingFollower.pet.y, helpingFollower.kind === 'nursery' ? 'Your pet' : 'Following');
    }

    if (currentCustomer && currentCustomer.source === 'helping' && gameState === 'HELPING_TREAT') {
        const patientCenterX = layout.patientSpot.x + layout.patientSpot.w / 2;
        const patientCenterY = layout.patientSpot.y + layout.patientSpot.h / 2 + 54;
        drawHelpingPet(currentCustomer.pet, patientCenterX, patientCenterY, currentCustomer.pet.name);
    }

    if (deliveryBasket && deliveryBasket.carrying) {
        drawHelpingBabyBasket(helpingPlayer.x + 18, helpingPlayer.y - 36, deliveryBasket.petType, deliveryBasket.babyCount, true);
    }

    drawAvatar(helpingPlayer.x, helpingPlayer.y);
}

function updateHelpingMode(dt) {
    if (gameState !== 'HELPING') return;
    const move = getHelpingMovementVector();
    const nextX = helpingPlayer.x + move.x * helpingPlayer.speed * dt;
    const nextY = helpingPlayer.y + move.y * helpingPlayer.speed * dt;
    if (canMoveThroughHelpingMap(nextX, nextY)) {
        helpingPlayer.x = clamp(nextX, 28, width - 28);
        helpingPlayer.y = clamp(nextY, 28, height - 28);
    }

    if (helpingFollower) {
        const targetX = helpingPlayer.x - 24;
        const targetY = helpingPlayer.y + 18;
        const follow = normalizeVector(targetX - helpingFollower.pet.x, targetY - helpingFollower.pet.y);
        const distance = distanceBetween(helpingFollower.pet.x, helpingFollower.pet.y, targetX, targetY);
        if (distance > 8) {
            helpingFollower.pet.x += follow.x * Math.min(distance, 140) * dt;
            helpingFollower.pet.y += follow.y * Math.min(distance, 140) * dt;
        }
    }

    const deliveryBasket = getHelpingDeliveryBasket();
    if (deliveryBasket && deliveryBasket.carrying) {
        const ownerCase = getHelpingOwnerCaseById(deliveryBasket.caseId);
        if (ownerCase && distanceBetween(helpingPlayer.x, helpingPlayer.y, ownerCase.seatX, ownerCase.seatY) <= 126) {
            setHelpingStatus(`You found ${ownerCase.owner}. Tap the owner, or walk the last step forward, to hand over the baby.`);
        }
        if (ownerCase && distanceBetween(helpingPlayer.x, helpingPlayer.y, ownerCase.seatX, ownerCase.seatY) <= 96) {
            finishHelpingBabyHandoff();
        }
    }
}

function drawAdventureField() {
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, '#b8efff');
    sky.addColorStop(0.38, '#d8f7d2');
    sky.addColorStop(1, '#8ed174');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = 'rgba(203,240,176,0.65)';
    for (let stripe = 0; stripe < 9; stripe += 1) {
        ctx.fillRect(0, height * 0.22 + stripe * 48, width, 20);
    }

    fieldGrassPatches.forEach((patch, index) => drawGrassPatch(patch, index % 2 === 0));
    wildPets.forEach((pet) => drawWildPet(pet));
    drawFieldNpc();
    drawFieldPlayer();

    if (fieldPlayer.hidden) {
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.88)';
        ctx.font = 'bold 14px "Trebuchet MS", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Hidden in grass', fieldPlayer.x, fieldPlayer.y - 46);
        ctx.restore();
    }

    if (gameState === 'ADVENTURE_TREAT') {
        ctx.save();
        ctx.fillStyle = 'rgba(20,38,56,0.24)';
        ctx.fillRect(0, 0, width, height);
        drawCurrentCustomer();
        ctx.restore();
    }
}

function updateWildPet(pet, dt) {
    if (fieldPlayer.ridingPetId === pet.id) {
        pet.x = fieldPlayer.x;
        pet.y = fieldPlayer.y;
        pet.alertTimer = 0;
        return;
    }
    pet.turnTimer -= dt;
    pet.alertTimer = Math.max(0, pet.alertTimer - dt);
    if (pet.turnTimer <= 0) {
        const direction = normalizeVector(randomRange(-1, 1), randomRange(-1, 1));
        pet.vx = direction.x;
        pet.vy = direction.y;
        pet.facingX = direction.x;
        pet.facingY = direction.y;
        pet.turnTimer = randomRange(1.4, 3.5);
    }

    const mountedPet = getMountedPet();
    const playerTargetX = mountedPet ? mountedPet.x : fieldPlayer.x;
    const playerTargetY = mountedPet ? mountedPet.y : fieldPlayer.y;
    const playerDistance = distanceBetween(pet.x, pet.y, playerTargetX, playerTargetY);

    let playerVisible = !fieldPlayer.hidden;
    if (mountedPet && mountedPet.id !== pet.id) {
        const rideForward = normalizeVector(mountedPet.facingX || mountedPet.vx || 0.1, mountedPet.facingY || mountedPet.vy || 0.1);
        const toWatcher = { x: pet.x - mountedPet.x, y: pet.y - mountedPet.y };
        const isBehindMountedPet = (toWatcher.x * rideForward.x) + (toWatcher.y * rideForward.y) < -12;
        if (isBehindMountedPet) playerVisible = false;
    }

    if (playerVisible && playerDistance < 130) {
        const flee = normalizeVector(pet.x - playerTargetX, pet.y - playerTargetY);
        pet.vx = flee.x;
        pet.vy = flee.y;
        pet.facingX = flee.x;
        pet.facingY = flee.y;
        pet.alertTimer = 1.25;
    }

    const moveSpeed = pet.speed + (pet.alertTimer > 0 ? 46 : 0);
    pet.x = clamp(pet.x + pet.vx * moveSpeed * dt, 42, width - 42);
    pet.y = clamp(pet.y + pet.vy * moveSpeed * dt, height * 0.2, height - 44);
}

function updateAdventureField(dt) {
    if (parentRevealTimer > 0) parentRevealTimer = Math.max(0, parentRevealTimer - dt);
    if (gameState === 'ADVENTURE') {
        const move = getAdventureMovementVector();
        fieldPlayer.x = clamp(fieldPlayer.x + move.x * fieldPlayer.speed * dt, 32, width - 32);
        fieldPlayer.y = clamp(fieldPlayer.y + move.y * fieldPlayer.speed * dt, height * 0.2, height - 28);
        const mountedPet = getMountedPet();
        if (mountedPet) {
            mountedPet.x = fieldPlayer.x;
            mountedPet.y = fieldPlayer.y;
            if (Math.abs(move.x) > 0.001 || Math.abs(move.y) > 0.001) {
                mountedPet.vx = move.x;
                mountedPet.vy = move.y;
                mountedPet.facingX = move.x;
                mountedPet.facingY = move.y;
            }
        }
        fieldPlayer.hidden = !mountedPet && playerInGrass();
        wildPets.forEach((pet) => updateWildPet(pet, dt));
    }
}

function drawAvatar(x, y, options = {}) {
    const avatarGender = options.gender || avatar.gender;
    const avatarSkin = options.skin || avatar.skin;
    const avatarHair = options.hair || avatar.hair;
    const avatarOutfit = options.outfit || avatar.outfit;
    const avatarLabel = options.label || 'You';
    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = avatarOutfit;
    ctx.fillRect(-18, -2, 36, 42);

    ctx.fillStyle = avatarSkin;
    ctx.beginPath();
    ctx.arc(0, -22, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = avatarHair;
    if (avatarGender === 'girl') {
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
    ctx.fillText(avatarLabel, avatarLabel === 'You' ? -10 : -16, 58);
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

    if (finishedCustomer.source === 'adventure') {
        updateHud();
        completeAdventureTreatment(finishedCustomer, totalEarned);
        return;
    }

    if (finishedCustomer.source === 'helping') {
        updateHud();
        completeHelpingTreatment(finishedCustomer, totalEarned);
        return;
    }

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
    adventureIngButtons.forEach((button) => {
        const isDeliveryButton = button.dataset.ing === 'delivery';
        const shouldShow = currentCustomer.pregnant ? isDeliveryButton : !isDeliveryButton;
        button.classList.toggle('hidden', !shouldShow);
    });
    helpingIngButtons.forEach((button) => {
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
    if (currentCustomer.source === 'helping' && currentCustomer.helpingKind === 'case' && currentCustomer.helpingCaseId) {
        const layout = getHelpingLayout();
        currentCustomer.requiredTasks.push('returnBaby');
        helpingDeliveryBasket = {
            caseId: currentCustomer.helpingCaseId,
            owner: currentCustomer.owner,
            petType: currentCustomer.pet.type,
            petColor: currentCustomer.pet.color,
            babyCount: currentCustomer.babyCount,
            carrying: false
        };
        currentCustomer.pet.x = layout.patientSpot.x + layout.patientSpot.w / 2 - 28;
        currentCustomer.pet.y = layout.patientSpot.y + layout.patientSpot.h / 2 + 54;
        helpingTreatmentEl.classList.add('hidden');
        gameState = 'HELPING';
        showToast(`Baby delivered! Bring ${currentCustomer.babyCount > 1 ? 'the basket of babies' : 'the baby basket'} back to ${currentCustomer.owner}. 🍼`);
        setHelpingStatus(`Delivery went well. Visit Nursery Pickup, grab the basket, and return it to ${currentCustomer.owner}.`);
        updateHelpingUi();
    } else {
        addBabyToNursery(currentCustomer);
        showToast(`Baby delivered${currentCustomer.babyCount > 1 ? `! ${currentCustomer.babyCount} babies joined the nursery. 🍼` : '! +5 coins and +1 reputation. 🍼'}`);
        maybeFinishCare();
    }
    updateAdventureTreatmentUi();
    updateHelpingTreatmentUi();

    ingredientsEl.classList.add('hidden');
    adventureMedicineEl.classList.add('hidden');
    helpingMedicineEl.classList.add('hidden');
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
    adventureMedicineEl.classList.add('hidden');
    helpingMedicineEl.classList.add('hidden');
    resetIngredientSelection();
    updateAdventureTreatmentUi();
    updateHelpingTreatmentUi();
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
    adventureFoodEl.classList.add('hidden');
    helpingFoodEl.classList.add('hidden');
    resetFoodSelection();
    updateAdventureTreatmentUi();
    updateHelpingTreatmentUi();
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
    adventureOutfitsEl.classList.add('hidden');
    helpingOutfitsEl.classList.add('hidden');
    resetOutfitSelection();
    updateAdventureTreatmentUi();
    updateHelpingTreatmentUi();
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
    updateAdventureTreatmentUi();
    updateHelpingTreatmentUi();
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
    updateAdventureTreatmentUi();
    updateHelpingTreatmentUi();
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

function toggleAdventureShop(forceOpen = null) {
    const shouldOpen = forceOpen === null ? adventureShopEl.classList.contains('hidden') : forceOpen;
    adventureShopEl.classList.toggle('hidden', !shouldOpen);
    if (shouldOpen) {
        closeAdventureNpcPrompt();
        setAdventureStatus('Buy catch balls before you head deeper into the field.');
    }
}

function buyAdventureBall() {
    if (coins < ADVENTURE_BALL_COST) {
        showToast('You need more coins to buy a catch ball.', 'error');
        return;
    }
    coins -= ADVENTURE_BALL_COST;
    adventureInventory.balls += 1;
    saveAdventure();
    updateHud();
    showToast('Catch ball added to your adventure inventory.');
}

function triggerAdventureTool(tool) {
    if (!currentCustomer) return;
    hideAdventureChoicePanels();
    if (tool === 'examine') {
        if (currentCustomer.pregnant) {
            showToast(`This pet is expecting ${currentCustomer.babyCount > 1 ? `${currentCustomer.babyCount} babies` : 'a baby'}.`);
        } else if (currentCustomer.pet.ailment) {
            showToast(`Diagnosis: ${getAilmentDiagnosisText(currentCustomer.pet.ailment)}`);
        } else {
            showToast('No obvious illness found. Focus on comfort care.');
        }
        return;
    }
    if (tool === 'wash') {
        handleWash();
        return;
    }
    if (tool === 'treat') {
        if (!currentCustomer.requiredTasks.includes('treat') && !currentCustomer.requiredTasks.includes('deliver')) {
            showToast('This pet does not need medicine right now.');
            return;
        }
        refreshIngredientOptions();
        adventureMedicineEl.classList.remove('hidden');
        return;
    }
    if (tool === 'pet') {
        handlePetting(width * 0.5, height * 0.75, 24);
        return;
    }
    if (tool === 'feed') {
        adventureFoodEl.classList.remove('hidden');
        return;
    }
    if (tool === 'dress') {
        adventureOutfitsEl.classList.remove('hidden');
    }
}

function triggerHelpingTool(tool) {
    if (!currentCustomer || currentCustomer.source !== 'helping') return;
    hideHelpingChoicePanels();
    if (tool === 'examine') {
        if (currentCustomer.pregnant) {
            showToast(`This pet may be expecting ${currentCustomer.babyCount > 1 ? `${currentCustomer.babyCount} babies` : 'a baby'}.`);
        } else if (currentCustomer.pet.ailment) {
            showToast(`Diagnosis: ${getAilmentDiagnosisText(currentCustomer.pet.ailment)}`);
        } else {
            showToast('No obvious illness found. Finish the comfort tasks.');
        }
        return;
    }
    if (tool === 'wash') {
        handleWash();
        return;
    }
    if (tool === 'bandage') {
        applyBandage();
        return;
    }
    if (tool === 'treat') {
        if (!currentCustomer.requiredTasks.includes('treat') && !currentCustomer.requiredTasks.includes('deliver')) {
            showToast('This pet does not need medicine right now.');
            return;
        }
        refreshIngredientOptions();
        helpingMedicineEl.classList.remove('hidden');
        return;
    }
    if (tool === 'pet') {
        handlePetting(width * 0.5, height * 0.75, 24);
        return;
    }
    if (tool === 'feed') {
        helpingFoodEl.classList.remove('hidden');
        return;
    }
    if (tool === 'dress') {
        helpingOutfitsEl.classList.remove('hidden');
    }
}

function captureWildPet(pet) {
    if (adventureInventory.balls <= 0) {
        showToast('No balls left. Buy more in the field shop.', 'error');
        return;
    }
    adventureInventory.balls -= 1;
    wildPets = wildPets.filter((candidate) => candidate.id !== pet.id);
    emitPetParticles(pet.x, pet.y, pet.type, 10);
    Sound.success();
    saveAdventure();
    updateAdventureUi();
    beginAdventureTreatment(pet);
}

function toggleRidePet(pet) {
    if (fieldPlayer.ridingPetId === pet.id) {
        fieldPlayer.ridingPetId = null;
        fieldPlayer.hidden = playerInGrass();
        setAdventureStatus('You hopped off the pet. Use tall grass to stay hidden again.');
        return;
    }
    fieldPlayer.ridingPetId = pet.id;
    fieldPlayer.hidden = false;
    setAdventureStatus('You hopped on a pet. Tap the pet again to hop off, and pets behind it cannot spot you.');
}

function useParentDoorHelp() {
    if (parentDoorHelps <= 0 || currentCustomer || gameState !== 'CLINIC') return;
    const availableDoor = doors.find((door) => !door.open) || doors[0];
    if (!availableDoor) return;
    parentDoorHelps = Math.max(0, parentDoorHelps - 1);
    saveAdventure();
    updateAdventureUi();
    spawnCustomerForDoor(availableDoor);
    showToast('A parent helper opened a clinic door for you!');
}

function handleAdventurePointerDown(x, y) {
    if (gameState !== 'ADVENTURE') return;
    if (adventureNpcPromptEl && !adventureNpcPromptEl.classList.contains('hidden')) return;
    if (fieldNpc && distanceBetween(x, y, fieldNpc.x, fieldNpc.y) <= 76) {
        if (distanceBetween(fieldPlayer.x, fieldPlayer.y, fieldNpc.x, fieldNpc.y) > 118) {
            showToast('Walk closer to your field friend first.');
            return;
        }
        openAdventureNpcPrompt();
        return;
    }
    const mountedPet = getMountedPet();
    if (mountedPet && currentAdventureAction === 'jump') {
        const tappedMountedPet = distanceBetween(x, y, mountedPet.x, mountedPet.y) <= 84;
        const tappedRider = distanceBetween(x, y, fieldPlayer.x, fieldPlayer.y) <= 84;
        if (tappedMountedPet || tappedRider) {
            toggleRidePet(mountedPet);
            return;
        }
    }
    const pet = getClosestWildPet(x, y, 72);
    if (!pet) return;
    if (distanceBetween(fieldPlayer.x, fieldPlayer.y, pet.x, pet.y) > 96) {
        showToast('Move closer to the pet first.');
        return;
    }
    if (currentAdventureAction === 'jump') {
        toggleRidePet(pet);
        return;
    }
    captureWildPet(pet);
}

function handleHelpingPointerDown(x, y) {
    if (gameState !== 'HELPING' && !isHelpingDeliveryReturnActive()) return;
    const layout = getHelpingLayout();
    const deliveryBasket = getHelpingDeliveryBasket();

    if (deliveryBasket && !deliveryBasket.carrying && pointInRect(x, y, layout.pickupSpot)) {
        const spotCenterX = layout.pickupSpot.x + layout.pickupSpot.w / 2;
        const spotCenterY = layout.pickupSpot.y + layout.pickupSpot.h / 2;
        if (distanceBetween(helpingPlayer.x, helpingPlayer.y, spotCenterX, spotCenterY) > 126) {
            showToast('Walk closer to the nursery basket first.');
            return;
        }
        if (getHelpingRemainingTasksWithoutHandoff().length) {
            showToast('Finish the remaining patient-room care before carrying the baby back.');
            return;
        }
        deliveryBasket.carrying = true;
        helpingPickupEl.classList.add('hidden');
        renderHelpingPickupList();
        setHelpingStatus(`You picked up the baby basket. Bring it back to ${deliveryBasket.owner} in The Waiting Room.`);
        showToast('Baby basket picked up.');
        updateHelpingTreatmentUi();
        return;
    }

    if (deliveryBasket && deliveryBasket.carrying) {
        const ownerCase = getHelpingOwnerCaseById(deliveryBasket.caseId);
        if (ownerCase && distanceBetween(x, y, ownerCase.seatX, ownerCase.seatY) <= 56) {
            if (distanceBetween(helpingPlayer.x, helpingPlayer.y, ownerCase.seatX, ownerCase.seatY) > 126) {
                showToast('Walk closer to the owner before handing over the baby.');
                return;
            }
            finishHelpingBabyHandoff();
            return;
        }
    }

    if (helpingFollower && pointInRect(x, y, layout.patientSpot)) {
        const spotCenterX = layout.patientSpot.x + layout.patientSpot.w / 2;
        const spotCenterY = layout.patientSpot.y + layout.patientSpot.h / 2;
        if (distanceBetween(helpingPlayer.x, helpingPlayer.y, spotCenterX, spotCenterY) > 126 || !helpingFollowerInRoom(layout.patientRoom)) {
            showToast('Bring the pet closer to the patient room bed first.');
            return;
        }
        beginHelpingTreatmentFromFollower();
        return;
    }

    if (helpingFollower && pointInRect(x, y, layout.pregnancySpot)) {
        const spotCenterX = layout.pregnancySpot.x + layout.pregnancySpot.w / 2;
        const spotCenterY = layout.pregnancySpot.y + layout.pregnancySpot.h / 2;
        if (distanceBetween(helpingPlayer.x, helpingPlayer.y, spotCenterX, spotCenterY) > 126 || !helpingFollowerInRoom(layout.pregnancyRoom)) {
            showToast('Guide the pet deeper into the baby room first.');
            return;
        }
        attemptHelpingPregnancy();
        return;
    }

    const waitingCase = getClosestHelpingWaitingCase(x, y);
    if (waitingCase) {
        const playerDistances = getHelpingWaitingCaseDistances(waitingCase, helpingPlayer.x, helpingPlayer.y);
        if (playerDistances.nearestDistance > 126) {
            showToast('Walk closer to that owner and pet first.');
            return;
        }
        selectHelpingCase(waitingCase);
    }
}

canvas.addEventListener('pointerdown', (event) => {
    ensureAudio();
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (gameState === 'ADVENTURE') {
        handleAdventurePointerDown(x, y);
        return;
    }

    if (gameState === 'HELPING' || isHelpingDeliveryReturnActive()) {
        handleHelpingPointerDown(x, y);
        return;
    }

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

window.addEventListener('keydown', (event) => {
    pressedKeys.add(event.key.toLowerCase());
    if (event.key === 'Escape' && fieldPlayer.ridingPetId) {
        const mountedPet = getMountedPet();
        if (mountedPet) toggleRidePet(mountedPet);
        else fieldPlayer.ridingPetId = null;
    }
});

window.addEventListener('keyup', (event) => {
    pressedKeys.delete(event.key.toLowerCase());
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
    closeAdventureShop();
    setVisibleScreen('CLINIC');
    gameState = 'CLINIC';
    resize();
    createDoors();
    updateHud();
});

modeAdventureBtn.addEventListener('click', () => {
    resize();
    startAdventureMode();
});

modeHelpingBtn.addEventListener('click', () => {
    resize();
    startHelpingMode();
});

backToMenu.addEventListener('click', () => {
    goToStartScreen();
});

adventureBackBtn.addEventListener('click', () => {
    goToStartScreen();
});

helpingBackBtn.addEventListener('click', () => {
    goToStartScreen();
});

openShopBtn.addEventListener('click', () => {
    if (currentMode === 'adventure' || gameState === 'ADVENTURE' || gameState === 'ADVENTURE_TREAT') {
        toggleAdventureShop(true);
    } else {
        showToast('The field shop opens in Adventure Mode.');
    }
});

adventureShopBtn.addEventListener('click', () => {
    toggleAdventureShop(true);
});

adventureCloseShopBtn.addEventListener('click', () => {
    toggleAdventureShop(false);
});

adventureBuyBallBtn.addEventListener('click', () => {
    buyAdventureBall();
});

parentDoorHelpBtn.addEventListener('click', () => {
    useParentDoorHelp();
});

adventureGogglesBtn.addEventListener('click', () => {
    adventureInventory.gogglesActive = !adventureInventory.gogglesActive;
    saveAdventure();
    updateAdventureUi();
    setAdventureStatus(adventureInventory.gogglesActive ? 'Goggles are on. Expecting pets now glow with a baby marker.' : 'Goggles are off.');
});

adventureActionCatchBtn.addEventListener('click', () => setAdventureAction('catch'));
adventureActionJumpBtn.addEventListener('click', () => setAdventureAction('jump'));
adventureToolExamineBtn.addEventListener('click', () => triggerAdventureTool('examine'));
adventureToolWashBtn.addEventListener('click', () => triggerAdventureTool('wash'));
adventureToolTreatBtn.addEventListener('click', () => triggerAdventureTool('treat'));
adventureToolPetBtn.addEventListener('click', () => triggerAdventureTool('pet'));
adventureToolFeedBtn.addEventListener('click', () => triggerAdventureTool('feed'));
adventureToolDressBtn.addEventListener('click', () => triggerAdventureTool('dress'));
adventureBabyHelperBtn.addEventListener('click', () => callBabyHelper());
helpingToolExamineBtn.addEventListener('click', () => triggerHelpingTool('examine'));
helpingToolWashBtn.addEventListener('click', () => triggerHelpingTool('wash'));
helpingToolBandageBtn.addEventListener('click', () => triggerHelpingTool('bandage'));
helpingToolTreatBtn.addEventListener('click', () => triggerHelpingTool('treat'));
helpingToolPetBtn.addEventListener('click', () => triggerHelpingTool('pet'));
helpingToolFeedBtn.addEventListener('click', () => triggerHelpingTool('feed'));
helpingToolDressBtn.addEventListener('click', () => triggerHelpingTool('dress'));

adventureIngButtons.forEach((button) => button.addEventListener('click', () => {
    selectedIngredient = button.dataset.ing;
    applyTreatmentByIngredient(selectedIngredient);
}));

adventureFoodButtons.forEach((button) => button.addEventListener('click', () => {
    selectedFood = button.dataset.food;
    applyFeedByChoice(selectedFood);
}));

adventureOutfitButtons.forEach((button) => button.addEventListener('click', () => {
    selectedOutfit = button.dataset.outfit;
    applyOutfitChoice(selectedOutfit);
}));

helpingIngButtons.forEach((button) => button.addEventListener('click', () => {
    selectedIngredient = button.dataset.ing;
    applyTreatmentByIngredient(selectedIngredient);
}));

helpingFoodButtons.forEach((button) => button.addEventListener('click', () => {
    selectedFood = button.dataset.food;
    applyFeedByChoice(selectedFood);
}));

helpingOutfitButtons.forEach((button) => button.addEventListener('click', () => {
    selectedOutfit = button.dataset.outfit;
    applyOutfitChoice(selectedOutfit);
}));

adventureNpcPresetButtons.forEach((button) => button.addEventListener('click', () => {
    adventureNpcInputEl.value = button.dataset.coinAmount;
}));

adventureNpcConfirmBtn.addEventListener('click', () => {
    confirmAdventureNpcCoins();
});

adventureNpcCancelBtn.addEventListener('click', () => {
    closeAdventureNpcPrompt();
    setAdventureStatus('Sneak through tall grass and look for your next patient.');
});

adventureNpcInputEl.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        confirmAdventureNpcCoins();
    }
});

resultContinue.addEventListener('click', () => {
    setVisibleScreen('CLINIC');
    gameState = 'CLINIC';
});

function updateJoystickFromPoint(clientX, clientY) {
    const rect = adventureJoystickEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const rawX = clientX - centerX;
    const rawY = clientY - centerY;
    const maxRadius = rect.width * 0.28;
    const vector = normalizeVector(rawX, rawY);
    const magnitude = Math.min(maxRadius, Math.hypot(rawX, rawY));
    joystickState.dx = vector.x * (magnitude / maxRadius);
    joystickState.dy = vector.y * (magnitude / maxRadius);
    adventureJoystickKnobEl.style.transform = `translate(calc(-50% + ${vector.x * magnitude}px), calc(-50% + ${vector.y * magnitude}px))`;
}

function resetJoystick(event = null) {
    if (event && adventurePointerState.joystickPointerId !== null && adventureJoystickEl.hasPointerCapture(event.pointerId)) {
        adventureJoystickEl.releasePointerCapture(event.pointerId);
    }
    adventurePointerState.joystickPointerId = null;
    joystickState.active = false;
    joystickState.dx = 0;
    joystickState.dy = 0;
    adventureJoystickKnobEl.style.transform = 'translate(-50%, -50%)';
}

adventureJoystickEl.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    joystickState.active = true;
    adventurePointerState.joystickPointerId = event.pointerId;
    adventureJoystickEl.setPointerCapture(event.pointerId);
    updateJoystickFromPoint(event.clientX, event.clientY);
});

adventureJoystickEl.addEventListener('pointermove', (event) => {
    if (adventurePointerState.joystickPointerId !== event.pointerId) return;
    if (!joystickState.active) return;
    event.preventDefault();
    updateJoystickFromPoint(event.clientX, event.clientY);
});

adventureJoystickEl.addEventListener('pointerup', (event) => resetJoystick(event));
adventureJoystickEl.addEventListener('pointerleave', (event) => resetJoystick(event));
adventureJoystickEl.addEventListener('pointercancel', (event) => resetJoystick(event));

function updateHelpingJoystickFromPoint(clientX, clientY) {
    const rect = helpingJoystickEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const rawX = clientX - centerX;
    const rawY = clientY - centerY;
    const maxRadius = rect.width * 0.28;
    const vector = normalizeVector(rawX, rawY);
    const magnitude = Math.min(maxRadius, Math.hypot(rawX, rawY));
    helpingJoystickState.dx = vector.x * (magnitude / maxRadius);
    helpingJoystickState.dy = vector.y * (magnitude / maxRadius);
    helpingJoystickKnobEl.style.transform = `translate(calc(-50% + ${vector.x * magnitude}px), calc(-50% + ${vector.y * magnitude}px))`;
}

function resetHelpingJoystick(event = null) {
    if (event && helpingPointerState.joystickPointerId !== null && helpingJoystickEl.hasPointerCapture(event.pointerId)) {
        helpingJoystickEl.releasePointerCapture(event.pointerId);
    }
    helpingPointerState.joystickPointerId = null;
    helpingJoystickState.active = false;
    helpingJoystickState.dx = 0;
    helpingJoystickState.dy = 0;
    helpingJoystickKnobEl.style.transform = 'translate(-50%, -50%)';
}

helpingJoystickEl.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    helpingJoystickState.active = true;
    helpingPointerState.joystickPointerId = event.pointerId;
    helpingJoystickEl.setPointerCapture(event.pointerId);
    updateHelpingJoystickFromPoint(event.clientX, event.clientY);
});

helpingJoystickEl.addEventListener('pointermove', (event) => {
    if (helpingPointerState.joystickPointerId !== event.pointerId) return;
    if (!helpingJoystickState.active) return;
    event.preventDefault();
    updateHelpingJoystickFromPoint(event.clientX, event.clientY);
});

helpingJoystickEl.addEventListener('pointerup', (event) => resetHelpingJoystick(event));
helpingJoystickEl.addEventListener('pointerleave', (event) => resetHelpingJoystick(event));
helpingJoystickEl.addEventListener('pointercancel', (event) => resetHelpingJoystick(event));

window.addEventListener('resize', () => {
    const previousWidth = width;
    const previousHeight = height;
    resize();
    createDoors();
    scaleAdventureEntity(fieldPlayer, previousWidth, previousHeight, 28);
    wildPets.forEach((pet) => scaleAdventureEntity(pet, previousWidth, previousHeight, 44));
    scaleAdventureEntity(fieldNpc, previousWidth, previousHeight, 54);
    scaleAdventureEntity(helpingPlayer, previousWidth, previousHeight, 28);
    helpingCases.forEach((helpingCase, index) => {
        const seat = getHelpingSeat(index, helpingCases.length || HELPING_WAITING_CASE_COUNT);
        const positions = getHelpingWaitingCasePositions(seat);
        helpingCase.seatX = seat.x;
        helpingCase.seatY = seat.y;
        if (helpingCase.status === 'waiting') {
            helpingCase.pet.x = positions.petX;
            helpingCase.pet.y = positions.petY;
        }
    });
    if (helpingFollower) {
        scaleAdventureEntity(helpingFollower.pet, previousWidth, previousHeight, 32);
    }
    fieldPlayer.x = clamp(fieldPlayer.x || width * 0.5, 32, width - 32);
    fieldPlayer.y = clamp(fieldPlayer.y || height * 0.78, height * 0.2, height - 28);
});

function frame(time) {
    if (!lastTime) lastTime = time;
    const dt = Math.min(0.033, (time - lastTime) / 1000);
    lastTime = time;
    sceneTime += dt;
    updateParticles(dt);
    if (gameState === 'ADVENTURE' || gameState === 'ADVENTURE_TREAT') {
        updateAdventureField(dt);
    }
    if (gameState === 'HELPING' || isHelpingDeliveryReturnActive()) {
        updateHelpingMode(dt);
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (gameState === 'ADVENTURE' || gameState === 'ADVENTURE_TREAT') {
        drawAdventureField();
    } else if (gameState === 'HELPING' || gameState === 'HELPING_TREAT') {
        drawHelpingMode();
    } else {
        drawClinic();
    }
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
loadAdventure();
syncAvatarUi();
renderNursery();
updateHud();
resize();
createDoors();
resetFieldPlayer();
createAdventureGrassPatches();
setVisibleScreen('START');
requestAnimationFrame(frame);
