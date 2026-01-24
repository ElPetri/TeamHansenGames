const { Storage, formatTime, clamp, Timer } = window.LabCore;

const progressKey = 'lab_security_progress';
const medalRank = { gold: 3, silver: 2, bronze: 1 };
const medalEmoji = { gold: '🥇', silver: '🥈', bronze: '🥉' };
const hintUnlocks = [20, 40, 60];

const experimentStrip = document.getElementById('experiment-strip');
const workspace = document.getElementById('workspace');
const expTitle = document.getElementById('exp-title');
const expDesc = document.getElementById('exp-desc');
const timerValue = document.getElementById('timer-value');
const parTime = document.getElementById('par-time');
const statusText = document.getElementById('status-text');
const hintBtn = document.getElementById('hint-btn');
const hintText = document.getElementById('hint-text');
const resetBtn = document.getElementById('reset-btn');
const completeModal = document.getElementById('complete-modal');
const completeTitle = document.getElementById('complete-title');
const completeFact = document.getElementById('complete-fact');
const medalRow = document.getElementById('medal-row');
const nextBtn = document.getElementById('next-btn');

let progress = Storage.getJSON(progressKey, {});
let currentIndex = 0;
let currentExperiment = null;
let timer = null;
let hintIndex = 0;
let hintsUsed = 0;
let selectedTile = null;
let sharedMode = false;

function createElement(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
}

function updateProgress(id, medal) {
    const current = progress[id];
    if (!current || medalRank[medal] > medalRank[current]) {
        progress[id] = medal;
        Storage.setJSON(progressKey, progress);
    }
}

function renderExperimentStrip() {
    experimentStrip.innerHTML = '';
    SECURITY_EXPERIMENTS.forEach((exp, index) => {
        const card = createElement('button', 'exp-card');
        card.dataset.index = index;
        const title = createElement('div', 'exp-title', `${exp.id}. ${exp.title}`);
        const meta = createElement('div', 'exp-meta', exp.type.toUpperCase());
        card.appendChild(title);
        card.appendChild(meta);
        const medal = progress[exp.id];
        if (medal) {
            const medalEl = createElement('div', 'exp-medal', medalEmoji[medal]);
            card.appendChild(medalEl);
        }
        if (index === currentIndex && !sharedMode) {
            card.classList.add('active');
        }
        card.addEventListener('click', () => {
            sharedMode = false;
            loadExperiment(index);
        });
        experimentStrip.appendChild(card);
    });

    const shareCard = createElement('button', 'exp-card');
    shareCard.dataset.index = 'share';
    shareCard.appendChild(createElement('div', 'exp-title', 'Create a Cipher'));
    shareCard.appendChild(createElement('div', 'exp-meta', 'SHARE MODE'));

    const allComplete = SECURITY_EXPERIMENTS.every(exp => progress[exp.id]);
    if (!allComplete) {
        shareCard.classList.add('locked');
        shareCard.addEventListener('click', () => {
            statusText.textContent = 'Status: Complete all experiments to unlock Create a Cipher.';
        });
    } else {
        shareCard.addEventListener('click', () => {
            sharedMode = true;
            loadShareBuilder();
        });
    }

    experimentStrip.appendChild(shareCard);
}

function updateActiveCard() {
    document.querySelectorAll('.exp-card').forEach(card => {
        card.classList.remove('active');
    });
    const target = experimentStrip.querySelector(`.exp-card[data-index="${currentIndex}"]`);
    if (target && !sharedMode) target.classList.add('active');
}

function setStatus(text) {
    statusText.textContent = `Status: ${text}`;
}

function resetHintState() {
    hintIndex = 0;
    hintsUsed = 0;
    hintBtn.classList.remove('unlocked');
    hintText.textContent = 'Hints unlock as time passes.';
    hintBtn.textContent = 'Hint (Locked)';
}

function updateHintButton(elapsed) {
    if (!currentExperiment || currentExperiment.hints.length === 0) return;
    if (hintIndex >= currentExperiment.hints.length) {
        hintBtn.textContent = 'All hints used';
        hintBtn.classList.remove('unlocked');
        return;
    }
    const unlockTime = hintUnlocks[Math.min(hintIndex, hintUnlocks.length - 1)];
    if (elapsed >= unlockTime) {
        hintBtn.classList.add('unlocked');
        hintBtn.textContent = `Hint ${hintIndex + 1}`;
    } else {
        hintBtn.classList.remove('unlocked');
        const remaining = Math.max(0, Math.ceil(unlockTime - elapsed));
        hintBtn.textContent = `Hint ${hintIndex + 1} (Locked ${remaining}s)`;
    }
}

function handleHintClick() {
    if (!currentExperiment) return;
    const elapsed = timer ? timer.getElapsed() : 0;
    const unlockTime = hintUnlocks[Math.min(hintIndex, hintUnlocks.length - 1)];
    if (elapsed < unlockTime) {
        hintText.textContent = `Hint unlocks in ${Math.ceil(unlockTime - elapsed)}s.`;
        return;
    }
    if (hintIndex >= currentExperiment.hints.length) return;
    hintText.textContent = currentExperiment.hints[hintIndex];
    hintIndex += 1;
    hintsUsed += 1;
    updateHintButton(elapsed);
}

function startTimer() {
    if (timer) timer.stop();
    timer = new Timer(120, (remaining, elapsed) => {
        timerValue.textContent = formatTime(remaining);
        updateHintButton(elapsed);
    }, () => {
        setStatus('Time up. You can still finish for a bronze medal.');
    });
    timer.start();
}

function loadExperiment(index) {
    currentIndex = index;
    currentExperiment = SECURITY_EXPERIMENTS[index];
    updateActiveCard();
    resetHintState();
    expTitle.textContent = currentExperiment.title;
    expDesc.textContent = currentExperiment.description;
    parTime.textContent = `Par ${formatTime(currentExperiment.parTime)}`;
    setStatus('In progress');
    workspace.innerHTML = '';
    selectedTile = null;
    startTimer();

    if (currentExperiment.type === 'caesar') {
        setupCaesar(currentExperiment);
    } else if (currentExperiment.type === 'frequency') {
        setupFrequency(currentExperiment);
    } else if (currentExperiment.type === 'xor') {
        setupXor(currentExperiment);
    } else if (currentExperiment.type === 'otp') {
        setupOtp(currentExperiment);
    } else if (currentExperiment.type === 'hash') {
        setupHash(currentExperiment);
    } else if (currentExperiment.type === 'collision') {
        setupCollision(currentExperiment);
    } else if (currentExperiment.type === 'public') {
        setupPublic(currentExperiment);
    }
}

function showCompleteModal(medal) {
    completeTitle.textContent = 'Experiment Complete';
    completeFact.textContent = currentExperiment.fact;
    medalRow.innerHTML = '';
    const medalEl = createElement('div', 'raised-tile', `${medalEmoji[medal]} ${medal.toUpperCase()}`);
    medalRow.appendChild(medalEl);
    nextBtn.textContent = sharedMode ? 'Go to Lab →' : 'Next Experiment →';
    completeModal.classList.remove('hidden');
}

function completeExperiment() {
    if (!currentExperiment) return;
    timer?.stop();
    const elapsed = timer ? timer.getElapsed() : 120;
    const underPar = elapsed <= currentExperiment.parTime;
    let medal = 'bronze';
    if (underPar && hintsUsed === 0) medal = 'gold';
    else if (underPar || hintsUsed === 0) medal = 'silver';

    if (!sharedMode) {
        updateProgress(currentExperiment.id, medal);
        renderExperimentStrip();
    }

    showCompleteModal(medal);
    setStatus('Complete');
}

function closeModal() {
    completeModal.classList.add('hidden');
}

function nextExperiment() {
    closeModal();
    if (sharedMode) {
        sharedMode = false;
        loadExperiment(0);
        return;
    }
    if (currentIndex < SECURITY_EXPERIMENTS.length - 1) {
        loadExperiment(currentIndex + 1);
    }
}

function caesarShift(text, shift) {
    const normalized = ((shift % 26) + 26) % 26;
    return text.replace(/[A-Z]/g, char => {
        const code = char.charCodeAt(0) - 65;
        return String.fromCharCode(((code + normalized) % 26) + 65);
    });
}

function setupCaesar(exp) {
    const cipher = caesarShift(exp.fact, exp.shift);
    const wrapper = createElement('div', 'cipher-row');
    const cipherBox = createElement('div', 'cipher-box');
    cipherBox.appendChild(createElement('div', 'exp-meta', 'Ciphertext'));
    const cipherText = createElement('div', 'cipher-text', cipher);
    cipherBox.appendChild(cipherText);

    const decodeBox = createElement('div', 'cipher-box');
    decodeBox.appendChild(createElement('div', 'exp-meta', 'Decoded'));
    const decodedText = createElement('div', 'cipher-text', '');
    decodeBox.appendChild(decodedText);

    wrapper.appendChild(cipherBox);
    wrapper.appendChild(decodeBox);

    const wheel = createElement('div', 'wheel raised-tile');
    const wheelLabel = createElement('div', 'wheel-label', 'Shift');
    const wheelValue = createElement('div', 'wheel-value', '0');
    const wheelHandle = createElement('div', 'wheel-handle');
    wheel.appendChild(wheelLabel);
    wheel.appendChild(wheelValue);
    wheel.appendChild(wheelHandle);

    workspace.appendChild(wrapper);
    workspace.appendChild(wheel);

    let currentShift = 0;
    let startX = 0;
    let startShift = 0;

    const updateDecoded = () => {
        const decoded = caesarShift(cipher, 26 - currentShift);
        decodedText.textContent = decoded;
        if (decoded === exp.fact) {
            completeExperiment();
        }
    };

    updateDecoded();

    const onPointerMove = (event) => {
        const delta = event.clientX - startX;
        const shiftChange = Math.round(delta / 16);
        currentShift = (startShift + shiftChange + 26) % 26;
        wheelValue.textContent = currentShift;
        wheelHandle.style.transform = `rotate(${currentShift * 14}deg)`;
        updateDecoded();
    };

    const onPointerUp = () => {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
    };

    wheel.addEventListener('pointerdown', (event) => {
        startX = event.clientX;
        startShift = currentShift;
        wheel.setPointerCapture(event.pointerId);
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
    });
}

function setupFrequency(exp) {
    const instructions = createElement('div', 'raised-tile', 'Match the most common ciphertext letters with likely English letters.');
    const barRow = createElement('div', 'tile-tray');

    const slots = [];

    exp.bars.forEach((bar, index) => {
        const zone = createElement('div', 'drop-zone');
        zone.dataset.slot = bar;
        zone.appendChild(createElement('span', '', bar));
        zone.appendChild(createElement('span', '', '→'));
        const placeholder = createElement('span', 'slot-placeholder', '?');
        zone.appendChild(placeholder);
        barRow.appendChild(zone);
        slots.push(zone);
    });

    const tray = createElement('div', 'tile-tray');
    exp.targetOrder.forEach(letter => {
        const tile = createElement('div', 'raised-tile draggable selectable', letter);
        tile.dataset.letter = letter;
        tile.dataset.draggable = 'true';
        tray.appendChild(tile);
    });

    workspace.appendChild(instructions);
    workspace.appendChild(barRow);
    workspace.appendChild(createElement('div', 'exp-meta', 'Drag tiles onto bars:'));
    workspace.appendChild(tray);

    setupDragAndDrop(tray, slots, () => {
        const mapping = {};
        let filled = true;
        slots.forEach((slot, index) => {
            const tile = slot.querySelector('.draggable');
            if (!tile) {
                filled = false;
                return;
            }
            mapping[slot.dataset.slot] = tile.dataset.letter;
        });
        if (!filled) return;
        const isCorrect = exp.targetOrder.every((letter, idx) => mapping[exp.bars[idx]] === letter);
        if (isCorrect) {
            const reveal = createElement('div', 'raised-tile', `Decoded Fact: ${exp.fact}`);
            workspace.appendChild(reveal);
            completeExperiment();
        } else {
            setStatus('Close! Try swapping a couple of letters.');
        }
    });
}

function setupXor(exp) {
    const cipherBytes = exp.plaintext.split('').map((char, idx) => char.charCodeAt(0) ^ exp.keyBytes[idx]);

    const header = createElement('div', 'raised-tile', 'Toggle key bits until the decoded word reads XOR.');
    const grid = createElement('div', 'cipher-box');

    const keyBits = exp.keyBytes.map(() => Array(8).fill(0));

    const renderRow = (labelText, bytes, editable) => {
        const row = createElement('div', 'cipher-box');
        row.appendChild(createElement('div', 'exp-meta', labelText));
        bytes.forEach((byte, index) => {
            const bits = byteToBits(byte);
            const bitRow = createElement('div', 'bit-grid');
            bits.forEach((bit, bitIndex) => {
                const tile = createElement('div', 'bit-tile', bit ? '1' : '0');
                if (editable) {
                    tile.classList.add('draggable');
                    tile.dataset.byte = index;
                    tile.dataset.bit = bitIndex;
                    tile.addEventListener('click', () => {
                        keyBits[index][bitIndex] = keyBits[index][bitIndex] ? 0 : 1;
                        updateKeyRow();
                    });
                }
                bitRow.appendChild(tile);
            });
            row.appendChild(bitRow);
        });
        return row;
    };

    const cipherRow = renderRow('Cipher Bits', cipherBytes, false);
    const keyRow = renderRow('Key Bits (tap to toggle)', exp.keyBytes.map(() => 0), true);
    const outputBox = createElement('div', 'raised-tile', 'Output: ???');

    const updateKeyRow = () => {
        const tiles = keyRow.querySelectorAll('.bit-tile');
        tiles.forEach(tile => {
            const byteIndex = Number(tile.dataset.byte);
            const bitIndex = Number(tile.dataset.bit);
            const value = keyBits[byteIndex][bitIndex];
            tile.textContent = value ? '1' : '0';
            tile.classList.toggle('on', value === 1);
        });
        const output = cipherBytes.map((byte, idx) => {
            const keyByte = bitsToByte(keyBits[idx]);
            return String.fromCharCode(byte ^ keyByte);
        }).join('');
        outputBox.textContent = `Output: ${output}`;
        if (output === exp.plaintext) {
            const reveal = createElement('div', 'raised-tile', `Fact: ${exp.fact}`);
            workspace.appendChild(reveal);
            completeExperiment();
        }
    };

    workspace.appendChild(header);
    workspace.appendChild(cipherRow);
    workspace.appendChild(keyRow);
    workspace.appendChild(outputBox);

    updateKeyRow();
}

function setupOtp(exp) {
    const messageTile = createElement('div', 'raised-tile draggable selectable', 'MESSAGE');
    messageTile.dataset.draggable = 'true';
    const keyTile = createElement('div', 'raised-tile draggable selectable', 'KEY');
    keyTile.dataset.draggable = 'true';

    const tray = createElement('div', 'tile-tray');
    tray.appendChild(messageTile);
    tray.appendChild(keyTile);

    const encryptZone = createElement('div', 'drop-zone');
    encryptZone.dataset.drop = 'encrypt';
    encryptZone.textContent = 'Encrypt Zone';

    const decryptZone = createElement('div', 'drop-zone');
    decryptZone.dataset.drop = 'decrypt';
    decryptZone.textContent = 'Decrypt Zone';

    workspace.appendChild(createElement('div', 'raised-tile', 'Drag KEY to encrypt, then use the same KEY to decrypt.'));
    workspace.appendChild(tray);
    workspace.appendChild(encryptZone);
    workspace.appendChild(decryptZone);

    let encrypted = false;

    setupDragAndDrop(tray, [encryptZone, decryptZone], (dragEl, dropZone) => {
        if (dragEl.textContent === 'KEY' && dropZone.dataset.drop === 'encrypt') {
            encrypted = true;
            encryptZone.textContent = '🔒 Ciphertext';
            setStatus('Encrypted. Now decrypt with the same key.');
            tray.appendChild(dragEl);
        } else if (dragEl.textContent === 'KEY' && dropZone.dataset.drop === 'decrypt' && encrypted) {
            decryptZone.textContent = '✅ Plaintext';
            setStatus('Decrypted!');
            completeExperiment();
            tray.appendChild(dragEl);
        } else {
            tray.appendChild(dragEl);
        }
    });
}

function setupHash(exp) {
    const wordRow = createElement('div', 'tile-tray');
    const letters = exp.word.split('');
    const letterTiles = letters.map(letter => {
        const tile = createElement('div', 'raised-tile', letter);
        tile.dataset.letter = letter;
        tile.dataset.slot = 'letter';
        wordRow.appendChild(tile);
        return tile;
    });

    const flipTile = createElement('div', 'raised-tile draggable selectable', 'FLIP');
    flipTile.dataset.draggable = 'true';

    const tray = createElement('div', 'tile-tray');
    tray.appendChild(flipTile);

    const hashBox = createElement('div', 'raised-tile', 'Hash: --');

    workspace.appendChild(createElement('div', 'raised-tile', 'Drag FLIP onto any letter tile to change it.'));
    workspace.appendChild(wordRow);
    workspace.appendChild(tray);
    workspace.appendChild(hashBox);

    const originalHash = toyHash(exp.word);
    hashBox.textContent = `Hash: ${originalHash}`;

    setupDragAndDrop(tray, letterTiles, (dragEl, dropZone) => {
        if (dragEl.textContent !== 'FLIP') return;
        const current = dropZone.textContent;
        const next = String.fromCharCode(((current.charCodeAt(0) - 65 + 1) % 26) + 65);
        dropZone.textContent = next;
        const newWord = letterTiles.map(tile => tile.textContent).join('');
        const newHash = toyHash(newWord);
        hashBox.textContent = `Hash: ${newHash}`;
        if (newHash !== originalHash) {
            completeExperiment();
        }
        tray.appendChild(dragEl);
    });
}

function setupCollision(exp) {
    const header = createElement('div', 'raised-tile', 'Generate inputs and drag two with the same hash into the slots.');
    const tray = createElement('div', 'tile-tray');
    const generateBtn = createElement('button', 'reset-btn', 'Generate');

    const slotA = createElement('div', 'drop-zone');
    slotA.dataset.drop = 'slotA';
    slotA.textContent = 'Slot A';
    const slotB = createElement('div', 'drop-zone');
    slotB.dataset.drop = 'slotB';
    slotB.textContent = 'Slot B';

    const slots = [slotA, slotB];

    workspace.appendChild(header);
    workspace.appendChild(generateBtn);
    workspace.appendChild(tray);
    workspace.appendChild(slotA);
    workspace.appendChild(slotB);

    const attach = setupDragAndDrop(tray, slots, () => {
        const tileA = slotA.querySelector('.draggable');
        const tileB = slotB.querySelector('.draggable');
        if (!tileA || !tileB) return;
        if (tileA.dataset.hash === tileB.dataset.hash && tileA.dataset.value !== tileB.dataset.value) {
            completeExperiment();
        } else {
            setStatus('No collision yet. Generate more tiles.');
        }
    });

    const generateTile = () => {
        const value = randomString(exp.length, exp.alphabet);
        const hash = toyHash(value);
        const tile = createElement('div', 'raised-tile draggable selectable', `${value} → ${hash}`);
        tile.dataset.value = value;
        tile.dataset.hash = hash;
        tile.dataset.draggable = 'true';
        tray.appendChild(tile);
        attach(tile);
    };

    generateBtn.addEventListener('click', () => {
        for (let i = 0; i < 4; i += 1) generateTile();
    });
}

function setupPublic(exp) {
    const messageTile = createElement('div', 'raised-tile draggable selectable', 'MESSAGE');
    messageTile.dataset.draggable = 'true';
    const publicTile = createElement('div', 'raised-tile draggable selectable', 'PUBLIC LOCK');
    publicTile.dataset.draggable = 'true';
    const privateTile = createElement('div', 'raised-tile draggable selectable', 'PRIVATE KEY');
    privateTile.dataset.draggable = 'true';

    const tray = createElement('div', 'tile-tray');
    tray.appendChild(messageTile);
    tray.appendChild(publicTile);
    tray.appendChild(privateTile);

    const encryptZone = createElement('div', 'drop-zone');
    encryptZone.dataset.drop = 'encrypt';
    encryptZone.textContent = 'Encrypt with Public Lock';

    const decryptZone = createElement('div', 'drop-zone');
    decryptZone.dataset.drop = 'decrypt';
    decryptZone.textContent = 'Decrypt with Private Key';

    workspace.appendChild(createElement('div', 'raised-tile', 'Drag the PUBLIC LOCK to encrypt, then PRIVATE KEY to decrypt.'));
    workspace.appendChild(tray);
    workspace.appendChild(encryptZone);
    workspace.appendChild(decryptZone);

    let encrypted = false;

    setupDragAndDrop(tray, [encryptZone, decryptZone], (dragEl, dropZone) => {
        if (dragEl.textContent === 'PUBLIC LOCK' && dropZone.dataset.drop === 'encrypt') {
            encrypted = true;
            encryptZone.textContent = '🔒 Ciphertext';
            setStatus('Encrypted. Now decrypt with the private key.');
            tray.appendChild(dragEl);
        } else if (dragEl.textContent === 'PRIVATE KEY' && dropZone.dataset.drop === 'decrypt' && encrypted) {
            decryptZone.textContent = '✅ Message Restored';
            completeExperiment();
            tray.appendChild(dragEl);
        } else {
            tray.appendChild(dragEl);
        }
    });
}

function setupDragAndDrop(tray, dropZones, onDrop) {
    const draggableSelector = '[data-draggable="true"]';

    const handlePointerDown = (event) => {
        const target = event.currentTarget;
        selectedTile = target;
        target.classList.add('dragging');
        target.setPointerCapture(event.pointerId);

        const rect = target.getBoundingClientRect();
        const offsetX = event.clientX - rect.left;
        const offsetY = event.clientY - rect.top;
        target.dataset.offsetX = offsetX;
        target.dataset.offsetY = offsetY;

        target.style.position = 'fixed';
        target.style.zIndex = '50';
        target.style.left = `${event.clientX - offsetX}px`;
        target.style.top = `${event.clientY - offsetY}px`;
    };

    const handlePointerMove = (event) => {
        const target = event.currentTarget;
        if (!target.classList.contains('dragging')) return;
        const offsetX = Number(target.dataset.offsetX || 0);
        const offsetY = Number(target.dataset.offsetY || 0);
        target.style.left = `${event.clientX - offsetX}px`;
        target.style.top = `${event.clientY - offsetY}px`;
        dropZones.forEach(zone => {
            const rect = zone.getBoundingClientRect();
            const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
            zone.classList.toggle('active', inside);
        });
    };

    const handlePointerUp = (event) => {
        const target = event.currentTarget;
        target.classList.remove('dragging');
        target.releasePointerCapture(event.pointerId);
        target.style.position = '';
        target.style.zIndex = '';
        target.style.left = '';
        target.style.top = '';

        const dropTarget = dropZones.find(zone => {
            const rect = zone.getBoundingClientRect();
            return event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
        });

        dropZones.forEach(zone => zone.classList.remove('active'));

        if (dropTarget) {
            const existing = dropTarget.querySelector(draggableSelector);
            if (existing) tray.appendChild(existing);
            dropTarget.appendChild(target);
            onDrop?.(target, dropTarget);
        } else {
            tray.appendChild(target);
        }
        selectedTile = null;
    };

    const handleTapSelect = (event) => {
        if (event.pointerType !== 'touch') return;
        const target = event.currentTarget;
        if (selectedTile && selectedTile !== target) {
            selectedTile.classList.remove('selected');
        }
        selectedTile = target;
        target.classList.toggle('selected');
    };

    const handleDropTap = (event) => {
        if (!selectedTile) return;
        const dropZone = event.currentTarget;
        const existing = dropZone.querySelector(draggableSelector);
        if (existing) tray.appendChild(existing);
        dropZone.appendChild(selectedTile);
        selectedTile.classList.remove('selected');
        onDrop?.(selectedTile, dropZone);
        selectedTile = null;
    };

    const attach = (tile) => {
        tile.addEventListener('pointerdown', handlePointerDown);
        tile.addEventListener('pointermove', handlePointerMove);
        tile.addEventListener('pointerup', handlePointerUp);
        tile.addEventListener('click', handleTapSelect);
    };

    tray.querySelectorAll(draggableSelector).forEach(attach);

    dropZones.forEach(zone => {
        zone.addEventListener('click', handleDropTap);
    });

    return attach;
}

function byteToBits(byte) {
    return Array.from({ length: 8 }, (_, i) => (byte >> (7 - i)) & 1);
}

function bitsToByte(bits) {
    return bits.reduce((acc, bit, idx) => acc | (bit << (7 - idx)), 0);
}

function toyHash(value) {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
        hash = (hash * 31 + value.charCodeAt(i)) % 256;
    }
    return hash.toString(16).padStart(2, '0').toUpperCase();
}

function randomString(length, alphabet) {
    let out = '';
    for (let i = 0; i < length; i += 1) {
        out += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return out;
}

function loadShareBuilder() {
    expTitle.textContent = 'Create a Cipher';
    expDesc.textContent = 'Build a Caesar cipher and share it with a friend.';
    parTime.textContent = 'Par --:--';
    workspace.innerHTML = '';
    setStatus('Ready');
    if (timer) timer.stop();

    const form = createElement('div', 'cipher-box');
    const messageInput = document.createElement('textarea');
    messageInput.placeholder = 'Enter a short message (max 100 chars).';
    messageInput.maxLength = 100;
    messageInput.className = 'cipher-text';

    const shiftRow = createElement('div', 'tile-tray');
    const shiftLabel = createElement('div', 'raised-tile', 'Shift');
    const shiftValue = document.createElement('input');
    shiftValue.type = 'range';
    shiftValue.min = 1;
    shiftValue.max = 25;
    shiftValue.value = 3;
    shiftValue.className = 'range-slider';
    const shiftDisplay = createElement('div', 'raised-tile', '3');
    shiftRow.appendChild(shiftLabel);
    shiftRow.appendChild(shiftValue);
    shiftRow.appendChild(shiftDisplay);

    const generateBtn = createElement('button', 'primary-btn', 'Generate Link');
    const output = createElement('div', 'cipher-text', '');
    const copyBtn = createElement('button', 'reset-btn', 'Copy Link');

    shiftValue.addEventListener('input', () => {
        shiftDisplay.textContent = shiftValue.value;
    });

    generateBtn.addEventListener('click', () => {
        const message = messageInput.value.trim().toUpperCase();
        if (!message) {
            setStatus('Enter a message to generate a link.');
            return;
        }
        const data = { type: 'caesar', message, shift: Number(shiftValue.value) };
        const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
        const url = `${window.location.origin}${window.location.pathname}?cipher=${encoded}`;
        output.textContent = url;
        setStatus('Link generated.');
    });

    copyBtn.addEventListener('click', async () => {
        if (!output.textContent) return;
        try {
            await navigator.clipboard.writeText(output.textContent);
            setStatus('Link copied to clipboard.');
        } catch (err) {
            setStatus('Copy failed. Select and copy manually.');
        }
    });

    form.appendChild(messageInput);
    form.appendChild(shiftRow);
    form.appendChild(generateBtn);
    form.appendChild(output);
    form.appendChild(copyBtn);

    workspace.appendChild(form);
}

function loadSharedCipher(data) {
    sharedMode = true;
    currentExperiment = {
        title: 'Shared Cipher Challenge',
        description: 'Decode the shared Caesar cipher.',
        parTime: 60,
        hints: [
            'Rotate the shift until the text makes sense.',
            'Try common shifts like 3 or 13.',
            `The shift is ${data.shift}.`
        ],
        fact: data.message,
        shift: data.shift,
        type: 'caesar'
    };
    expTitle.textContent = currentExperiment.title;
    expDesc.textContent = currentExperiment.description;
    parTime.textContent = `Par ${formatTime(currentExperiment.parTime)}`;
    resetHintState();
    setStatus('Solve the shared cipher.');
    workspace.innerHTML = '';
    startTimer();
    setupCaesar(currentExperiment);
}

function checkForSharedCipher() {
    const params = new URLSearchParams(window.location.search);
    const payload = params.get('cipher');
    if (!payload) return false;
    try {
        const decoded = JSON.parse(decodeURIComponent(escape(atob(payload))));
        if (decoded.type === 'caesar') {
            loadSharedCipher(decoded);
            return true;
        }
    } catch (err) {
        return false;
    }
    return false;
}

hintBtn.addEventListener('click', handleHintClick);
resetBtn.addEventListener('click', () => {
    if (sharedMode && currentExperiment) {
        loadSharedCipher({ message: currentExperiment.fact, shift: currentExperiment.shift, type: 'caesar' });
    } else {
        loadExperiment(currentIndex);
    }
});
nextBtn.addEventListener('click', nextExperiment);
completeModal.addEventListener('click', (event) => {
    if (event.target === completeModal) {
        closeModal();
    }
});

renderExperimentStrip();

if (!checkForSharedCipher()) {
    loadExperiment(0);
}
