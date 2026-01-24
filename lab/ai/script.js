const { Storage, formatTime, clamp, Timer } = window.LabCore;

const progressKey = 'lab_ai_progress';
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
const continueBtn = document.getElementById('continue-btn');
const deepDive = document.getElementById('deep-dive');
const deepDiveFormula = document.getElementById('deep-dive-formula');
const deepDiveCode = document.getElementById('deep-dive-code');

let progress = Storage.getJSON(progressKey, {});
let currentIndex = 0;
let currentExperiment = null;
let timer = null;
let hintIndex = 0;
let hintsUsed = 0;
let selectedTile = null;
let isSolved = false;
let bonusMode = false;

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
    AI_EXPERIMENTS.forEach((exp, index) => {
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
        if (index === currentIndex && !bonusMode) {
            card.classList.add('active');
        }
        card.addEventListener('click', () => {
            bonusMode = false;
            loadExperiment(index);
        });
        experimentStrip.appendChild(card);
    });

    const bonusCard = createElement('button', 'exp-card');
    bonusCard.dataset.index = 'bonus';
    bonusCard.appendChild(createElement('div', 'exp-title', 'Train a Tiny Model'));
    bonusCard.appendChild(createElement('div', 'exp-meta', 'BONUS'));

    const allComplete = AI_EXPERIMENTS.every(exp => progress[exp.id]);
    if (!allComplete) {
        bonusCard.classList.add('locked');
        bonusCard.addEventListener('click', () => {
            setStatus('Complete all experiments to unlock the Doodle Lab.');
        });
    } else {
        bonusCard.addEventListener('click', () => {
            bonusMode = true;
            loadDoodleLab();
        });
    }
    experimentStrip.appendChild(bonusCard);
}

function updateActiveCard() {
    document.querySelectorAll('.exp-card').forEach(card => {
        card.classList.remove('active');
    });
    const target = experimentStrip.querySelector(`.exp-card[data-index="${currentIndex}"]`);
    if (target && !bonusMode) target.classList.add('active');
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
    hintBtn.disabled = false;
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
    currentExperiment = AI_EXPERIMENTS[index];
    updateActiveCard();
    resetHintState();
    isSolved = false;
    expTitle.textContent = currentExperiment.title;
    expDesc.textContent = currentExperiment.description;
    parTime.textContent = `Par ${formatTime(currentExperiment.parTime)}`;
    setStatus('In progress');
    workspace.innerHTML = '';
    selectedTile = null;
    startTimer();

    if (currentExperiment.type === 'line') {
        setupLine(currentExperiment);
    } else if (currentExperiment.type === 'features') {
        setupFeatures(currentExperiment);
    } else if (currentExperiment.type === 'bias') {
        setupBias(currentExperiment);
    } else if (currentExperiment.type === 'neuron') {
        setupNeuron(currentExperiment);
    } else if (currentExperiment.type === 'knn') {
        setupKnn(currentExperiment);
    } else if (currentExperiment.type === 'rl') {
        setupRl(currentExperiment);
    } else if (currentExperiment.type === 'attention') {
        setupAttention(currentExperiment);
    } else if (currentExperiment.type === 'reply') {
        setupReply(currentExperiment);
    }
}

function showCompleteModal(medal) {
    completeTitle.textContent = 'Experiment Complete';
    completeFact.textContent = `Fact: ${currentExperiment.fact}`;
    medalRow.innerHTML = '';
    const medalEl = createElement('div', 'raised-tile', `${medalEmoji[medal]} ${medal.toUpperCase()}`);
    medalRow.appendChild(medalEl);
    const formulaText = currentExperiment.deepDive?.formula || 'No formula available.';
    if (window.katex) {
        deepDiveFormula.innerHTML = '';
        window.katex.render(formulaText.replace(/\n/g, '\\\\'), deepDiveFormula, {
            displayMode: true,
            throwOnError: false
        });
    } else {
        deepDiveFormula.textContent = formulaText;
    }
    deepDiveCode.textContent = currentExperiment.deepDive?.code || 'No code available.';
    deepDive.open = false;
    nextBtn.textContent = bonusMode ? 'Go to Lab →' : 'Next Experiment →';
    completeModal.classList.remove('hidden');
}

function completeExperiment() {
    if (!currentExperiment) return;
    if (isSolved) return;
    isSolved = true;
    timer?.stop();
    const elapsed = timer ? timer.getElapsed() : 120;
    const underPar = elapsed <= currentExperiment.parTime;
    let medal = 'bronze';
    if (underPar && hintsUsed === 0) medal = 'gold';
    else if (underPar || hintsUsed === 0) medal = 'silver';

    if (!bonusMode) {
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
    if (bonusMode) {
        bonusMode = false;
        loadExperiment(0);
        return;
    }
    if (currentIndex < AI_EXPERIMENTS.length - 1) {
        loadExperiment(currentIndex + 1);
    }
}

function seededRandom(seed) {
    let value = seed % 2147483647;
    if (value <= 0) value += 2147483646;
    return () => (value = (value * 16807) % 2147483647) / 2147483647;
}

function generateClusterPoints(seed, clusters, countPerCluster) {
    const rand = seededRandom(seed);
    const points = [];
    clusters.forEach(cluster => {
        for (let i = 0; i < countPerCluster; i += 1) {
            const jitterX = (rand() - 0.5) * 0.2;
            const jitterY = (rand() - 0.5) * 0.2;
            points.push({
                x: clamp(cluster.center[0] + jitterX, 0.05, 0.95),
                y: clamp(cluster.center[1] + jitterY, 0.05, 0.95),
                label: cluster.label
            });
        }
    });
    return points;
}

function setupLine(exp) {
    const wrap = createElement('div', 'canvas-wrap');
    const holder = createElement('div', 'canvas-holder');
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 300;
    canvas.className = 'ai-canvas';
    holder.appendChild(canvas);

    const handleA = createElement('div', 'line-handle');
    const handleB = createElement('div', 'line-handle');
    holder.appendChild(handleA);
    holder.appendChild(handleB);

    wrap.appendChild(holder);
    const stats = createElement('div', 'raised-tile', 'Accuracy: 0%');
    const checkBtn = createElement('button', 'maze-btn', 'Check Line');
    wrap.appendChild(stats);
    wrap.appendChild(checkBtn);
    const legend = createElement('div', 'class-legend');
    const magentaLegend = createElement('span', 'legend-dot', 'Magenta');
    magentaLegend.prepend(createElement('span', 'dot magenta'));
    const orangeLegend = createElement('span', 'legend-dot', 'Orange');
    orangeLegend.prepend(createElement('span', 'dot orange'));
    legend.appendChild(magentaLegend);
    legend.appendChild(orangeLegend);
    wrap.appendChild(legend);
    workspace.appendChild(wrap);

    const points = generateClusterPoints(exp.seed, exp.clusters, exp.clusterCount);
    let line = { x1: 0.1, y1: 0.5, x2: 0.9, y2: 0.5 };
    let hasInteracted = false;
    let currentAccuracy = 0;

    const ctx = canvas.getContext('2d');

    const updateHandles = () => {
        handleA.style.left = `${line.x1 * 100}%`;
        handleA.style.top = `${line.y1 * 100}%`;
        handleB.style.left = `${line.x2 * 100}%`;
        handleB.style.top = `${line.y2 * 100}%`;
    };

    const computeAccuracy = () => {
        let leftMagenta = 0;
        let leftOrange = 0;
        let rightMagenta = 0;
        let rightOrange = 0;
        points.forEach(point => {
            const side = (line.x2 - line.x1) * (point.y - line.y1) - (line.y2 - line.y1) * (point.x - line.x1);
            if (side >= 0) {
                if (point.label === 'magenta') leftMagenta += 1;
                else leftOrange += 1;
            } else {
                if (point.label === 'magenta') rightMagenta += 1;
                else rightOrange += 1;
            }
        });
        const accuracyA = (leftMagenta + rightOrange) / points.length;
        const accuracyB = (leftOrange + rightMagenta) / points.length;
        return Math.max(accuracyA, accuracyB);
    };

    const render = () => {
        window.AiViz.drawScatter(ctx, points, line);
        currentAccuracy = computeAccuracy();
        stats.textContent = `Accuracy: ${Math.round(currentAccuracy * 100)}%`;
    };

    const startDrag = (event, handleKey) => {
        event.preventDefault();
        const handle = event.currentTarget;
        handle.setPointerCapture(event.pointerId);
        const move = (moveEvent) => {
            const rect = canvas.getBoundingClientRect();
            const x = clamp((moveEvent.clientX - rect.left) / rect.width, 0, 1);
            const y = clamp((moveEvent.clientY - rect.top) / rect.height, 0, 1);
            line[handleKey] = x;
            line[handleKey === 'x1' ? 'y1' : 'y2'] = y;
            hasInteracted = true;
            updateHandles();
            render();
        };
        const stop = () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', stop);
            handle.releasePointerCapture(event.pointerId);
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', stop);
    };

    handleA.addEventListener('pointerdown', (event) => startDrag(event, 'x1'));
    handleB.addEventListener('pointerdown', (event) => startDrag(event, 'x2'));

    checkBtn.addEventListener('click', () => {
        if (!hasInteracted) {
            setStatus('Move the line first, then check.');
            return;
        }
        if (currentAccuracy >= 0.9) {
            completeExperiment();
        } else {
            setStatus('Not quite. Aim for 90% accuracy.');
        }
    });

    updateHandles();
    render();
}

function setupFeatures(exp) {
    workspace.appendChild(createElement('div', 'raised-tile', 'Drag three features into the model slots. Order does not matter.'));

    const emojiRow = createElement('div', 'emoji-row');
    ['🍕', '🍎', '🌮', '🎸', '⚽', '🎺'].forEach(emoji => {
        emojiRow.appendChild(createElement('div', 'emoji-card', emoji));
    });
    workspace.appendChild(emojiRow);

    const slotRow = createElement('div', 'drag-row');
    const slots = Array.from({ length: 3 }, () => createElement('div', 'drop-zone', 'Drop feature'));
    slots.forEach(slot => slotRow.appendChild(slot));

    const tray = createElement('div', 'drag-row');
    exp.features.forEach(feature => {
        const tile = createElement('div', 'raised-tile draggable selectable', feature.label);
        tile.dataset.feature = feature.id;
        tile.dataset.draggable = 'true';
        tray.appendChild(tile);
    });

    const result = createElement('div', 'raised-tile', 'Accuracy: --');
    workspace.appendChild(slotRow);
    workspace.appendChild(tray);
    workspace.appendChild(result);

    setupDragAndDrop(tray, slots, () => {
        const chosen = slots.map(slot => slot.querySelector('.draggable')).filter(Boolean);
        if (chosen.length < 3) {
            result.textContent = 'Accuracy: --';
            return;
        }
        const selectedIds = chosen.map(tile => tile.dataset.feature);
        const matchCount = selectedIds.filter(id => exp.optimalSet.includes(id)).length;
        const accuracy = matchCount === 3 ? 92 : matchCount === 2 ? 84 : matchCount === 1 ? 72 : 60;
        result.textContent = `Accuracy: ${accuracy}%`;
        const isOptimal = exp.optimalSet.every(id => selectedIds.includes(id));
        if (isOptimal) {
            completeExperiment();
        } else {
            setStatus('Try swapping one feature to boost accuracy. Food traits are usually edible, smelly, or crumbly.');
        }
    });
}

function setupBias(exp) {
    workspace.appendChild(createElement('div', 'raised-tile', 'Select 8 applicants to include in training.'));

    const grid = createElement('div', 'profile-grid');
    const summary = createElement('div', 'raised-tile', 'Selected: 0');
    const rateBox = createElement('div', 'raised-tile', 'Approval rates: --');

    let selected = new Set();

    const updateSummary = () => {
        const selectedProfiles = exp.profiles.filter(p => selected.has(p.id));
        const countA = selectedProfiles.filter(p => p.group === 'A').length;
        const countB = selectedProfiles.filter(p => p.group === 'B').length;
        summary.textContent = `Selected: ${selectedProfiles.length} (A: ${countA}, B: ${countB})`;

        if (selectedProfiles.length === 0) {
            rateBox.textContent = 'Approval rates: --';
            return;
        }
        const biasGap = Math.abs(countA - countB);
        const rateA = biasGap === 0 ? 60 : countA > countB ? 72 : 48;
        const rateB = biasGap === 0 ? 60 : countB > countA ? 72 : 48;
        rateBox.textContent = `Approval rates → Group A: ${rateA}% | Group B: ${rateB}%`;

        if (selectedProfiles.length === 8 && countA === 4 && countB === 4) {
            completeExperiment();
        } else if (selectedProfiles.length === 8) {
            setStatus('Balanced data reduces bias. Try 4 from each group.');
        }
    };

    exp.profiles.forEach(profile => {
        const card = createElement('div', 'profile-card');
        card.innerHTML = `<div class="exp-meta">Group ${profile.group}</div><div>Score: ${profile.score}</div><div>Debt: ${profile.debt}</div>`;
        card.addEventListener('click', () => {
            if (selected.has(profile.id)) {
                selected.delete(profile.id);
                card.classList.remove('selected');
            } else {
                if (selected.size >= 8) {
                    setStatus('Training set is full. Deselect one to swap.');
                    return;
                }
                selected.add(profile.id);
                card.classList.add('selected');
            }
            updateSummary();
        });
        grid.appendChild(card);
    });

    workspace.appendChild(grid);
    workspace.appendChild(summary);
    workspace.appendChild(rateBox);
}

function setupNeuron(exp) {
    const stageLabel = createElement('div', 'neuron-stage', 'Target: AND');
    const help = createElement('div', 'raised-tile', 'A neuron sums inputs × weights + bias. Output is 1 if the sum ≥ 0. Try to make ONLY 111 fire for AND.');
    workspace.appendChild(stageLabel);
    workspace.appendChild(help);

    const inputRow = createElement('div', 'choice-row');
    const inputs = [0, 0, 0];
    const toggles = inputs.map((_, idx) => {
        const btn = createElement('button', 'choice-btn', `Input ${idx + 1}: 0`);
        btn.addEventListener('click', () => {
            inputs[idx] = inputs[idx] ? 0 : 1;
            btn.textContent = `Input ${idx + 1}: ${inputs[idx]}`;
            updateOutputs();
        });
        inputRow.appendChild(btn);
        return btn;
    });

    const weightsRow = createElement('div', 'table-grid');
    const weights = [1, 1, 1];
    const weightSliders = weights.map((_, idx) => {
        const wrapper = createElement('div', 'raised-tile');
        const label = createElement('div', '', `Weight ${idx + 1}`);
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = -2;
        slider.max = 2;
        slider.step = 0.1;
        slider.value = weights[idx];
        slider.className = 'weight-slider';
        const value = createElement('div', '', weights[idx].toFixed(1));
        slider.addEventListener('input', () => {
            weights[idx] = Number(slider.value);
            value.textContent = weights[idx].toFixed(1);
            updateOutputs();
        });
        wrapper.append(label, slider, value);
        weightsRow.appendChild(wrapper);
        return slider;
    });

    const biasWrapper = createElement('div', 'raised-tile');
    const biasLabel = createElement('div', '', 'Bias');
    const biasSlider = document.createElement('input');
    biasSlider.type = 'range';
    biasSlider.min = -2;
    biasSlider.max = 2;
    biasSlider.step = 0.1;
    biasSlider.value = -1;
    biasSlider.className = 'weight-slider';
    const biasValue = createElement('div', '', '-1.0');
    biasSlider.addEventListener('input', () => {
        biasValue.textContent = Number(biasSlider.value).toFixed(1);
        updateOutputs();
    });
    biasWrapper.append(biasLabel, biasSlider, biasValue);
    weightsRow.appendChild(biasWrapper);

    const table = createElement('div', 'table-grid');
    const stageButtons = createElement('div', 'choice-row');
    let currentStage = 'AND';
    let andSolved = false;

    exp.stages.forEach(stage => {
        const btn = createElement('button', 'choice-btn', stage);
        btn.addEventListener('click', () => {
            currentStage = stage;
            stageButtons.querySelectorAll('.choice-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            stageLabel.textContent = `Target: ${stage}`;
            updateOutputs();
        });
        if (stage === 'AND') btn.classList.add('active');
        if (stage !== 'AND') btn.disabled = true;
        stageButtons.appendChild(btn);
    });

    const resultRow = createElement('div', 'raised-tile', 'Match the AND gate to complete.');

    workspace.appendChild(inputRow);
    workspace.appendChild(weightsRow);
    workspace.appendChild(stageButtons);
    workspace.appendChild(table);
    workspace.appendChild(resultRow);

    const truthTable = {
        AND: (a, b, c) => (a && b && c ? 1 : 0),
        OR: (a, b, c) => (a || b || c ? 1 : 0),
        XOR: (a, b, c) => ((a + b + c) % 2 === 1 ? 1 : 0)
    };

    function perceptron(a, b, c) {
        const sum = a * weights[0] + b * weights[1] + c * weights[2] + Number(biasSlider.value);
        return sum >= 0 ? 1 : 0;
    }

    function updateOutputs() {
        table.innerHTML = '';
        let allMatch = true;
        for (let a = 0; a <= 1; a += 1) {
            for (let b = 0; b <= 1; b += 1) {
                for (let c = 0; c <= 1; c += 1) {
                    const target = truthTable[currentStage](a, b, c);
                    const actual = perceptron(a, b, c);
                    const row = createElement('div', 'table-row');
                    row.innerHTML = `<span>${a}${b}${c}</span><span>Target ${target}</span><span>Output ${actual}</span>`;
                    if (target !== actual) {
                        allMatch = false;
                        row.style.color = '#ff9f3d';
                    }
                    table.appendChild(row);
                }
            }
        }

        if (currentStage === 'XOR') {
            resultRow.textContent = 'XOR is not linearly separable. It needs a multi-layer network.';
            resultRow.style.color = '#ff9f3d';
        } else {
            resultRow.style.color = '';
            resultRow.textContent = `Match the ${currentStage} gate.`;
        }

        if (currentStage === 'AND' && allMatch) {
            resultRow.textContent = 'AND solved! Stretch goals unlocked: OR and XOR.';
            if (!andSolved) {
                andSolved = true;
                stageButtons.querySelectorAll('.choice-btn').forEach(btn => {
                    if (btn.textContent !== 'AND') btn.disabled = false;
                });
                completeExperiment();
            }
        }
    }

    updateOutputs();
}

function setupKnn(exp) {
    const wrap = createElement('div', 'canvas-wrap');
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 300;
    canvas.className = 'ai-canvas';
    wrap.appendChild(canvas);

    const legend = createElement('div', 'class-legend');
    const magentaLegend = createElement('span', 'legend-dot', 'Magenta');
    magentaLegend.prepend(createElement('span', 'dot magenta'));
    const orangeLegend = createElement('span', 'legend-dot', 'Orange');
    orangeLegend.prepend(createElement('span', 'dot orange'));
    legend.appendChild(magentaLegend);
    legend.appendChild(orangeLegend);
    wrap.appendChild(legend);

    const sliderRow = createElement('div', 'stat-row');
    const sliderLabel = createElement('div', 'raised-tile', 'K = 3');
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = 1;
    slider.max = 9;
    slider.step = 2;
    slider.value = 3;
    slider.className = 'slider';
    sliderRow.append(sliderLabel, slider);
    wrap.appendChild(sliderRow);

    const choiceRow = createElement('div', 'choice-row');
    const magentaBtn = createElement('button', 'choice-btn', 'Magenta');
    const orangeBtn = createElement('button', 'choice-btn', 'Orange');
    choiceRow.append(magentaBtn, orangeBtn);
    wrap.appendChild(choiceRow);

    const progressBox = createElement('div', 'raised-tile', 'Correct: 0 / 5');
    const voteBox = createElement('div', 'raised-tile', 'Votes: --');
    wrap.appendChild(progressBox);
    wrap.appendChild(voteBox);

    workspace.appendChild(wrap);

    const points = generateClusterPoints(exp.seed, [
        { label: 'magenta', center: [0.25, 0.65] },
        { label: 'orange', center: [0.7, 0.35] }
    ], exp.pointCount);

    const rand = seededRandom(exp.seed + 5);
    const tests = Array.from({ length: 5 }, () => ({ x: 0.2 + rand() * 0.6, y: 0.2 + rand() * 0.6 }));
    let testIndex = 0;
    let correct = 0;
    let currentNeighbors = [];

    const ctx = canvas.getContext('2d');

    const computeNeighbors = () => {
        const k = Number(slider.value);
        const testPoint = tests[testIndex];
        const sorted = points.slice().sort((a, b) => {
            const da = (a.x - testPoint.x) ** 2 + (a.y - testPoint.y) ** 2;
            const db = (b.x - testPoint.x) ** 2 + (b.y - testPoint.y) ** 2;
            return da - db;
        });
        currentNeighbors = sorted.slice(0, k);
    };

    const predict = () => {
        const counts = currentNeighbors.reduce((acc, p) => {
            acc[p.label] = (acc[p.label] || 0) + 1;
            return acc;
        }, {});
        voteBox.textContent = `Votes → Magenta: ${counts.magenta || 0} | Orange: ${counts.orange || 0}`;
        return (counts.magenta || 0) >= (counts.orange || 0) ? 'magenta' : 'orange';
    };

    const render = () => {
        computeNeighbors();
        const testPoint = tests[testIndex];
        window.AiViz.drawScatter(ctx, points, null, testPoint, currentNeighbors);
        sliderLabel.textContent = `K = ${slider.value}`;
    };

    const handleGuess = (guess) => {
        const predicted = predict();
        if (guess === predicted) {
            correct += 1;
            setStatus('Correct!');
        } else {
            setStatus('Not quite. The neighbor vote goes the other way.');
        }
        progressBox.textContent = `Correct: ${correct} / 5`;
        testIndex = (testIndex + 1) % tests.length;
        render();
        if (correct >= 5) {
            completeExperiment();
        }
    };

    magentaBtn.addEventListener('click', () => handleGuess('magenta'));
    orangeBtn.addEventListener('click', () => handleGuess('orange'));
    slider.addEventListener('input', render);

    render();
}

function setupRl(exp) {
    const wrap = createElement('div', 'canvas-wrap');
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 320;
    canvas.className = 'ai-canvas';
    wrap.appendChild(canvas);

    const controls = createElement('div', 'maze-controls');
    const goalInput = document.createElement('input');
    goalInput.type = 'number';
    goalInput.value = 10;
    goalInput.min = 1;
    goalInput.max = 20;
    goalInput.className = 'slider';
    const trapInput = document.createElement('input');
    trapInput.type = 'number';
    trapInput.value = -5;
    trapInput.min = -20;
    trapInput.max = -1;
    trapInput.className = 'slider';
    const stepInput = document.createElement('input');
    stepInput.type = 'number';
    stepInput.value = -1;
    stepInput.min = -5;
    stepInput.max = 0;
    stepInput.className = 'slider';

    const train1 = createElement('button', 'maze-btn', 'Train 1 Episode');
    const train10 = createElement('button', 'maze-btn', 'Train 10 Episodes');
    const resetBtn = createElement('button', 'maze-btn', 'Reset Agent');

    controls.append(
        createElement('span', 'exp-meta', 'Goal'), goalInput,
        createElement('span', 'exp-meta', 'Trap'), trapInput,
        createElement('span', 'exp-meta', 'Step'), stepInput,
        train1, train10, resetBtn
    );

    const legendRow = createElement('div', 'stat-row');
    legendRow.appendChild(createElement('span', 'legend-pill goal', 'Goal')); 
    legendRow.appendChild(createElement('span', 'legend-pill trap', 'Traps')); 
    legendRow.appendChild(createElement('span', 'legend-pill agent', 'Agent'));

    const explain = createElement('div', 'raised-tile', 'Reward the agent to reach the goal. Train a few episodes and watch the green values grow along the best path.');
    const stats = createElement('div', 'raised-tile', 'Episodes: 0 | Success: 0 | Last: --');
    wrap.appendChild(controls);
    wrap.appendChild(legendRow);
    wrap.appendChild(explain);
    wrap.appendChild(stats);
    workspace.appendChild(wrap);

    const grid = exp.gridSize;
    const qTable = Array.from({ length: grid }, () => Array.from({ length: grid }, () => [0, 0, 0, 0]));
    let episodes = 0;
    let success = 0;

    const actions = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1]
    ];

    const isTrap = (pos) => exp.traps.some(([r, c]) => r === pos[0] && c === pos[1]);

    const maxQ = (pos) => Math.max(...qTable[pos[0]][pos[1]]);

    const chooseAction = (pos, epsilon = 0.2) => {
        if (Math.random() < epsilon) return Math.floor(Math.random() * 4);
        const values = qTable[pos[0]][pos[1]];
        return values.indexOf(Math.max(...values));
    };

    const step = (pos, actionIdx) => {
        const [dr, dc] = actions[actionIdx];
        const next = [clamp(pos[0] + dr, 0, grid - 1), clamp(pos[1] + dc, 0, grid - 1)];
        let reward = Number(stepInput.value);
        if (next[0] === exp.goal[0] && next[1] === exp.goal[1]) reward = Number(goalInput.value);
        if (isTrap(next)) reward = Number(trapInput.value);
        return { next, reward };
    };

    const trainEpisode = () => {
        let pos = [...exp.start];
        let steps = 0;
        const alpha = 0.3;
        const gamma = 0.9;
        while (steps < 40) {
            const action = chooseAction(pos, 0.3);
            const { next, reward } = step(pos, action);
            const currentQ = qTable[pos[0]][pos[1]][action];
            const target = reward + gamma * maxQ(next);
            qTable[pos[0]][pos[1]][action] = currentQ + alpha * (target - currentQ);
            pos = next;
            steps += 1;
            if (pos[0] === exp.goal[0] && pos[1] === exp.goal[1]) break;
            if (isTrap(pos)) break;
        }
        episodes += 1;
        if (pos[0] === exp.goal[0] && pos[1] === exp.goal[1] && steps <= 20) {
            success += 1;
        }
        const reachedGoal = pos[0] === exp.goal[0] && pos[1] === exp.goal[1];
        const lastLabel = reachedGoal ? `Goal in ${steps} steps` : isTrap(pos) ? 'Hit trap' : 'Stopped';
        stats.textContent = `Episodes: ${episodes} | Success: ${success} | Last: ${lastLabel}`;
        renderMaze();
        if (episodes >= 30 && success === 0) {
            setStatus('Hint: Try Goal +10, Trap -5, Step -1.');
        }
        if (success >= 1 && episodes >= 5) {
            completeExperiment();
        }
    };

    const renderMaze = () => {
        const values = qTable.map(row => row.map(cell => Math.max(...cell)));
        window.AiViz.drawMaze(canvas.getContext('2d'), grid, exp.start, exp.goal, exp.traps, exp.start, values);
    };

    train1.addEventListener('click', () => trainEpisode());
    train10.addEventListener('click', () => {
        for (let i = 0; i < 10; i += 1) trainEpisode();
    });
    resetBtn.addEventListener('click', () => {
        for (let r = 0; r < grid; r += 1) {
            for (let c = 0; c < grid; c += 1) {
                qTable[r][c] = [0, 0, 0, 0];
            }
        }
        episodes = 0;
        success = 0;
        stats.textContent = 'Episodes: 0 | Success: 0';
        renderMaze();
    });

    renderMaze();
}

function setupAttention(exp) {
    const sentenceBox = createElement('div', 'raised-tile');
    const words = exp.sentence.split(' ');
    const sliderRow = createElement('div', 'stat-row');
    const sliderLabel = createElement('div', 'raised-tile', 'Threshold: 0.12');
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = 0;
    slider.max = 0.3;
    slider.step = 0.01;
    slider.value = 0.12;
    slider.className = 'slider';
    sliderRow.append(sliderLabel, slider);

    const checkBtn = createElement('button', 'maze-btn', 'Check Summary');
    const result = createElement('div', 'raised-tile', 'Select the most important words.');

    workspace.appendChild(sentenceBox);
    workspace.appendChild(sliderRow);
    workspace.appendChild(checkBtn);
    workspace.appendChild(result);

    const render = () => {
        const threshold = Number(slider.value);
        sliderLabel.textContent = `Threshold: ${threshold.toFixed(2)}`;
        window.AiViz.drawHeatmapWords(sentenceBox, words, exp.weights, threshold);
    };

    slider.addEventListener('input', render);

    checkBtn.addEventListener('click', () => {
        const threshold = Number(slider.value);
        const selected = exp.weights.map((w, idx) => (w >= threshold ? idx : null)).filter(idx => idx !== null);
        const summaryMatch = exp.summaryIndexes.every(idx => selected.includes(idx));
        const extraCount = selected.filter(idx => !exp.summaryIndexes.includes(idx)).length;
        if (summaryMatch && extraCount <= 2) {
            completeExperiment();
        } else {
            result.textContent = 'Try keeping only the highest-weight words.';
            setStatus('Adjust the threshold to keep key words.');
        }
    });

    render();
}

function setupReply(exp) {
    let round = 0;
    let wins = 0;
    let locked = false;

    const promptBox = createElement('div', 'raised-tile', exp.scenarios[0].prompt);
    const replyGrid = createElement('div', 'profile-grid');
    const progress = createElement('div', 'raised-tile', `Correct: ${wins} / ${exp.roundsToWin}`);

    workspace.appendChild(promptBox);
    workspace.appendChild(replyGrid);
    workspace.appendChild(progress);

    const renderRound = () => {
        replyGrid.innerHTML = '';
        const scenario = exp.scenarios[round % exp.scenarios.length];
        promptBox.textContent = scenario.prompt;
        scenario.replies.forEach((reply, idx) => {
            const card = createElement('div', 'reply-card');
            card.textContent = reply.text;
            const bar = createElement('div', 'reply-bar');
            const fill = createElement('div', 'reply-bar-fill');
            bar.appendChild(fill);
            card.appendChild(bar);
            card.addEventListener('click', () => {
                if (locked) return;
                locked = true;
                const topProb = Math.max(...scenario.replies.map(r => r.prob));
                if (reply.prob === topProb) {
                    wins += 1;
                    setStatus('Correct!');
                } else {
                    setStatus('Not quite. The model picks the most probable reply.');
                }
                progress.textContent = `Correct: ${wins} / ${exp.roundsToWin}`;
                scenario.replies.forEach((r, index) => {
                    const cardEl = replyGrid.children[index];
                    const fillEl = cardEl.querySelector('.reply-bar-fill');
                    fillEl.style.width = `${Math.round(r.prob * 100)}%`;
                });
                round += 1;
                if (wins >= exp.roundsToWin) {
                    completeExperiment();
                } else {
                    setTimeout(() => {
                        locked = false;
                        renderRound();
                    }, 800);
                }
            });
            replyGrid.appendChild(card);
        });
    };

    renderRound();
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

function loadDoodleLab() {
    expTitle.textContent = 'Train a Tiny Model';
    expDesc.textContent = 'Draw circles, squares, and triangles. Train a mini model to recognize them.';
    parTime.textContent = 'Par --:--';
    workspace.innerHTML = '';
    setStatus('Bonus mode');
    if (timer) timer.stop();
    hintBtn.disabled = true;
    hintBtn.textContent = 'Hints disabled';
    hintText.textContent = 'Bonus unlocked: train your own tiny model.';

    const lab = new window.DoodleLab.DoodleLab(workspace);
    lab;
}

hintBtn.addEventListener('click', handleHintClick);
resetBtn.addEventListener('click', () => loadExperiment(currentIndex));
nextBtn.addEventListener('click', nextExperiment);
continueBtn.addEventListener('click', () => closeModal());
completeModal.addEventListener('click', (event) => {
    if (event.target === completeModal) closeModal();
});

renderExperimentStrip();
loadExperiment(0);
