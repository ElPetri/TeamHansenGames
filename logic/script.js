// ========== STATE ==========
let gates = [];
let wires = [];
let history = []; // For undo
let nextGateId = 1;
let nextWireId = 1;

let mode = 'tutorial'; // 'tutorial' or 'sandbox'
let currentLevel = 0;

let draggingGate = null;
let draggingFromPalette = false;
let dragOffset = { x: 0, y: 0 };

let connectingWire = null; // { fromGate, fromPort, fromType }
let previewWire = null;
let dragMoved = false; // Track if gate was actually dragged vs just clicked

// ========== DOM ELEMENTS ==========
const canvasContainer = document.getElementById('canvas-container');
const gateLayer = document.getElementById('gate-layer');
const wireLayer = document.getElementById('wire-layer');
const tooltip = document.getElementById('tooltip');
const tooltipTitle = document.getElementById('tooltip-title');
const tooltipDesc = document.getElementById('tooltip-desc');
const tooltipTable = document.getElementById('tooltip-table').querySelector('tbody');

const tutorialPanel = document.getElementById('tutorial-panel');
const levelNumEl = document.getElementById('level-num');
const levelTitleEl = document.getElementById('level-title');
const levelDescEl = document.getElementById('level-desc');
const levelStatus = document.getElementById('level-status');
const statusIcon = document.getElementById('status-icon');
const statusText = document.getElementById('status-text');

const shareModal = document.getElementById('share-modal');
const shareUrlInput = document.getElementById('share-url');

// ========== INITIALIZATION ==========
function init() {
    setupEventListeners();
    loadFromURL();
    
    if (mode === 'tutorial') {
        loadLevel(currentLevel);
    }
    
    render();
}

function setupEventListeners() {
    // Mode toggle
    document.getElementById('tutorial-btn').addEventListener('click', () => setMode('tutorial'));
    document.getElementById('sandbox-btn').addEventListener('click', () => setMode('sandbox'));
    
    // Actions
    document.getElementById('undo-btn').addEventListener('click', undo);
    document.getElementById('clear-btn').addEventListener('click', clearCanvas);
    document.getElementById('share-btn').addEventListener('click', showShareModal);
    document.getElementById('copy-url-btn').addEventListener('click', copyShareURL);
    document.getElementById('close-modal-btn').addEventListener('click', () => shareModal.classList.add('hidden'));
    
    // Level navigation
    document.getElementById('prev-level-btn').addEventListener('click', () => loadLevel(currentLevel - 1));
    document.getElementById('next-level-btn').addEventListener('click', () => loadLevel(currentLevel + 1));
    
    // Palette drag
    document.querySelectorAll('.gate-item').forEach(item => {
        item.addEventListener('pointerdown', startDragFromPalette);
    });
    
    // Canvas events
    canvasContainer.addEventListener('pointermove', onPointerMove);
    canvasContainer.addEventListener('pointerup', onPointerUp);
    canvasContainer.addEventListener('pointerleave', onPointerUp);
    
    // Global pointer up (in case drag ends outside canvas)
    document.addEventListener('pointerup', onPointerUp);
    
    // Keyboard
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cancelConnection();
        }
        if (e.key === 'Delete' || e.key === 'Backspace') {
            deleteSelected();
        }
        if (e.ctrlKey && e.key === 'z') {
            e.preventDefault();
            undo();
        }
    });
}

// ========== MODE & LEVELS ==========
function setMode(newMode) {
    mode = newMode;
    document.getElementById('tutorial-btn').classList.toggle('active', mode === 'tutorial');
    document.getElementById('sandbox-btn').classList.toggle('active', mode === 'sandbox');
    tutorialPanel.classList.toggle('hidden', mode === 'sandbox');
    
    if (mode === 'tutorial') {
        loadLevel(currentLevel);
    } else {
        clearCanvas();
    }
}

function loadLevel(index) {
    if (index < 0 || index >= LEVELS.length) return;
    
    currentLevel = index;
    const level = LEVELS[currentLevel];
    
    // Update UI
    levelNumEl.textContent = level.id;
    levelTitleEl.textContent = level.title;
    levelDescEl.innerHTML = `<p>${level.description}</p><p><strong>Goal:</strong> ${level.goal}</p>`;
    
    // Update nav buttons
    document.getElementById('prev-level-btn').disabled = currentLevel === 0;
    document.getElementById('next-level-btn').disabled = currentLevel === LEVELS.length - 1;
    
    // Reset status
    levelStatus.classList.remove('success');
    statusIcon.textContent = '⏳';
    statusText.textContent = 'In Progress';
    
    // Clear and setup
    gates = [];
    wires = [];
    nextGateId = 1;
    nextWireId = 1;
    
    // Place preplaced gates
    level.preplacedGates.forEach(pg => {
        createGate(pg.type, pg.x, pg.y, false);
    });
    
    saveState();
    render();
}

function checkLevelCompletion() {
    if (mode !== 'tutorial') return;
    
    const level = LEVELS[currentLevel];
    const circuit = { gates, wires };
    
    if (level.successCondition(circuit)) {
        levelStatus.classList.add('success');
        statusIcon.textContent = '✅';
        statusText.textContent = 'Complete!';
    } else {
        levelStatus.classList.remove('success');
        statusIcon.textContent = '⏳';
        statusText.textContent = 'In Progress';
    }
}

// ========== GATE CREATION ==========
function createGate(type, x, y, saveHistory = true) {
    const info = GATE_INFO[type];
    
    const gate = {
        id: nextGateId++,
        type,
        x,
        y,
        inputs: new Array(info.inputs).fill(0),
        output: type === 'SWITCH' ? 0 : 0,
        inputConnections: new Array(info.inputs).fill(null) // Track which wire connects to each input
    };
    
    gates.push(gate);
    
    if (saveHistory) {
        saveState();
    }
    
    return gate;
}

function deleteGate(gateId) {
    // Remove connected wires
    wires = wires.filter(w => w.from.gateId !== gateId && w.to.gateId !== gateId);
    
    // Remove gate
    gates = gates.filter(g => g.id !== gateId);
    
    saveState();
    propagateSignals();
    render();
}

function deleteSelected() {
    const selected = gates.find(g => g.selected);
    if (selected) {
        deleteGate(selected.id);
    }
}

// ========== DRAG & DROP ==========
function startDragFromPalette(e) {
    e.preventDefault();
    const item = e.currentTarget;
    const type = item.dataset.gate;
    
    // Create a temporary gate at cursor position
    const rect = canvasContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    draggingGate = createGate(type, x, y, false);
    draggingFromPalette = true;
    dragOffset = { x: 35, y: 25 }; // Center of gate
    
    render();
}

function startDragGate(e, gate) {
    if (e.target.classList.contains('port')) return; // Don't drag when clicking ports
    
    e.preventDefault();
    e.stopPropagation();
    
    // Deselect all, select this one
    gates.forEach(g => g.selected = false);
    gate.selected = true;
    
    draggingGate = gate;
    draggingFromPalette = false;
    dragMoved = false; // Reset movement tracker
    
    const rect = e.currentTarget.getBoundingClientRect();
    dragOffset = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
    
    render();
}

function onPointerMove(e) {
    const rect = canvasContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Dragging gate
    if (draggingGate) {
        const newX = x - dragOffset.x;
        const newY = y - dragOffset.y;
        
        // Check if actually moved (more than 5px)
        if (Math.abs(newX - draggingGate.x) > 5 || Math.abs(newY - draggingGate.y) > 5) {
            dragMoved = true;
        }
        
        draggingGate.x = newX;
        draggingGate.y = newY;
        
        // Clamp to canvas
        draggingGate.x = Math.max(0, Math.min(draggingGate.x, rect.width - 70));
        draggingGate.y = Math.max(0, Math.min(draggingGate.y, rect.height - 50));
        
        render();
    }
    
    // Drawing wire preview
    if (connectingWire) {
        previewWire = { x, y };
        renderWires();
    }
}

function onPointerUp(e) {
    if (draggingGate) {
        const rect = canvasContainer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // If dropped outside canvas, remove it
        if (draggingFromPalette && (x < 0 || y < 0 || x > rect.width || y > rect.height)) {
            gates = gates.filter(g => g.id !== draggingGate.id);
        } else {
            // If it was a click (no movement) on a switch, toggle it
            if (!dragMoved && draggingGate.type === 'SWITCH') {
                toggleSwitch(draggingGate);
            } else {
                saveState();
            }
        }
        
        draggingGate = null;
        draggingFromPalette = false;
        dragMoved = false;
        render();
    }
}

// ========== WIRE CONNECTIONS ==========
function startConnection(gate, portIndex, portType) {
    // If already connecting
    if (connectingWire) {
        // Try to complete connection
        if (connectingWire.fromType === 'output' && portType === 'input') {
            completeConnection(gate, portIndex);
        } else if (connectingWire.fromType === 'input' && portType === 'output') {
            // Reverse - connecting from input to output
            completeConnectionReverse(gate, portIndex);
        } else {
            // Same type - cancel
            cancelConnection();
        }
        return;
    }
    
    // Start new connection
    connectingWire = {
        fromGate: gate,
        fromPort: portIndex,
        fromType: portType
    };
}

function completeConnection(toGate, toPort) {
    const fromGate = connectingWire.fromGate;
    
    // Prevent self-connection
    if (fromGate.id === toGate.id) {
        cancelConnection();
        return;
    }
    
    // Prevent duplicate connections
    const exists = wires.some(w => 
        w.from.gateId === fromGate.id && 
        w.to.gateId === toGate.id && 
        w.to.port === toPort
    );
    
    if (exists) {
        cancelConnection();
        return;
    }
    
    // Remove existing connection to this input (only one wire per input)
    wires = wires.filter(w => !(w.to.gateId === toGate.id && w.to.port === toPort));
    
    // Create wire
    wires.push({
        id: nextWireId++,
        from: { gateId: fromGate.id, port: connectingWire.fromPort },
        to: { gateId: toGate.id, port: toPort },
        signal: 0
    });
    
    cancelConnection();
    saveState();
    propagateSignals();
    render();
}

function completeConnectionReverse(fromGate, fromPort) {
    const toGate = connectingWire.fromGate;
    const toPort = connectingWire.fromPort;
    
    if (fromGate.id === toGate.id) {
        cancelConnection();
        return;
    }
    
    const exists = wires.some(w => 
        w.from.gateId === fromGate.id && 
        w.to.gateId === toGate.id && 
        w.to.port === toPort
    );
    
    if (exists) {
        cancelConnection();
        return;
    }
    
    wires = wires.filter(w => !(w.to.gateId === toGate.id && w.to.port === toPort));
    
    wires.push({
        id: nextWireId++,
        from: { gateId: fromGate.id, port: fromPort },
        to: { gateId: toGate.id, port: toPort },
        signal: 0
    });
    
    cancelConnection();
    saveState();
    propagateSignals();
    render();
}

function cancelConnection() {
    connectingWire = null;
    previewWire = null;
    renderWires();
}

// ========== SIGNAL PROPAGATION ==========
function propagateSignals() {
    // Reset all inputs
    gates.forEach(g => {
        const info = GATE_INFO[g.type];
        g.inputs = new Array(info.inputs).fill(0);
    });
    
    // Propagate multiple times to handle chains
    for (let i = 0; i < gates.length; i++) {
        // Set inputs from wires
        wires.forEach(wire => {
            const fromGate = gates.find(g => g.id === wire.from.gateId);
            const toGate = gates.find(g => g.id === wire.to.gateId);
            
            if (fromGate && toGate) {
                toGate.inputs[wire.to.port] = fromGate.output;
                wire.signal = fromGate.output;
            }
        });
        
        // Evaluate gates
        gates.forEach(gate => {
            const info = GATE_INFO[gate.type];
            if (gate.type === 'SWITCH') {
                // Switch output is set manually
            } else if (gate.type === 'LED') {
                gate.output = gate.inputs[0] || 0;
            } else {
                gate.output = info.evaluate(...gate.inputs);
            }
        });
    }
    
    checkLevelCompletion();
}

function toggleSwitch(gate) {
    if (gate.type !== 'SWITCH') return;
    gate.output = gate.output ? 0 : 1;
    saveState();
    propagateSignals();
    render();
}

// ========== RENDERING ==========
function render() {
    renderGates();
    renderWires();
}

function renderGates() {
    gateLayer.innerHTML = '';
    
    gates.forEach(gate => {
        const el = document.createElement('div');
        el.className = `placed-gate ${gate.type.toLowerCase()}-gate`;
        if (gate.selected) el.classList.add('selected');
        if (gate.type === 'NOT' || gate.type === 'LED') el.classList.add('single-input');
        if (gate.type === 'SWITCH' && gate.output) el.classList.add('on');
        if (gate.type === 'LED' && gate.output) el.classList.add('on');
        
        el.style.left = gate.x + 'px';
        el.style.top = gate.y + 'px';
        
        // Label
        const label = document.createElement('div');
        label.className = 'gate-label';
        label.textContent = gate.type;
        el.appendChild(label);
        
        // Body
        const body = document.createElement('div');
        body.className = 'gate-body';
        
        // Gate-specific content
        if (gate.type === 'SWITCH') {
            const toggle = document.createElement('div');
            toggle.className = 'switch-toggle';
            body.appendChild(toggle);
            el.addEventListener('click', (e) => {
                if (!e.target.classList.contains('port')) {
                    toggleSwitch(gate);
                }
            });
        } else if (gate.type === 'LED') {
            const bulb = document.createElement('div');
            bulb.className = 'led-bulb';
            body.appendChild(bulb);
        }
        
        // Input ports
        const info = GATE_INFO[gate.type];
        for (let i = 0; i < info.inputs; i++) {
            const port = document.createElement('div');
            port.className = `port input input-${i}`;
            if (gate.inputs[i]) port.classList.add('active');
            port.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                startConnection(gate, i, 'input');
            });
            body.appendChild(port);
        }
        
        // Output port (except LED)
        if (gate.type !== 'LED') {
            const port = document.createElement('div');
            port.className = 'port output output-0';
            if (gate.output) port.classList.add('active');
            port.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                startConnection(gate, 0, 'output');
            });
            body.appendChild(port);
        }
        
        el.appendChild(body);
        
        // Drag handling
        el.addEventListener('pointerdown', (e) => startDragGate(e, gate));
        
        // Tooltip
        el.addEventListener('pointerenter', (e) => showTooltip(e, gate.type));
        el.addEventListener('pointerleave', hideTooltip);
        
        gateLayer.appendChild(el);
    });
}

function renderWires() {
    wireLayer.innerHTML = '';
    
    // Render actual wires
    wires.forEach(wire => {
        const fromGate = gates.find(g => g.id === wire.from.gateId);
        const toGate = gates.find(g => g.id === wire.to.gateId);
        
        if (!fromGate || !toGate) return;
        
        const fromPos = getPortPosition(fromGate, 'output', wire.from.port);
        const toPos = getPortPosition(toGate, 'input', wire.to.port);
        
        const path = createWirePath(fromPos, toPos);
        path.classList.add(wire.signal ? 'wire-on' : 'wire-off');
        
        wireLayer.appendChild(path);
    });
    
    // Render preview wire
    if (connectingWire && previewWire) {
        const fromGate = connectingWire.fromGate;
        const fromPos = getPortPosition(fromGate, connectingWire.fromType, connectingWire.fromPort);
        
        const path = createWirePath(fromPos, previewWire);
        path.classList.add('wire-preview');
        
        wireLayer.appendChild(path);
    }
}

function getPortPosition(gate, type, index) {
    const gateWidth = 70;
    const gateHeight = 50;
    
    if (type === 'output') {
        return {
            x: gate.x + gateWidth + 2,
            y: gate.y + gateHeight / 2 + 10
        };
    } else {
        const info = GATE_INFO[gate.type];
        if (info.inputs === 1) {
            return {
                x: gate.x - 2,
                y: gate.y + gateHeight / 2 + 10
            };
        } else {
            const yOffset = index === 0 ? gateHeight * 0.25 : gateHeight * 0.75;
            return {
                x: gate.x - 2,
                y: gate.y + yOffset + 10
            };
        }
    }
}

function createWirePath(from, to) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    
    // Bezier curve
    const dx = Math.abs(to.x - from.x);
    const controlOffset = Math.max(50, dx * 0.4);
    
    const d = `M ${from.x} ${from.y} C ${from.x + controlOffset} ${from.y}, ${to.x - controlOffset} ${to.y}, ${to.x} ${to.y}`;
    
    path.setAttribute('d', d);
    return path;
}

// ========== TOOLTIP ==========
function showTooltip(e, type) {
    const info = GATE_INFO[type];
    if (!info) return;
    
    tooltipTitle.textContent = info.name;
    tooltipDesc.textContent = info.description;
    
    // Build truth table
    tooltipTable.innerHTML = '';
    const thead = document.querySelector('#tooltip-table thead tr');
    
    if (info.truthTable.length > 0) {
        // Update headers
        if (info.inputs === 1) {
            thead.innerHTML = '<th>In</th><th>Out</th>';
        } else {
            thead.innerHTML = '<th>A</th><th>B</th><th>Out</th>';
        }
        
        info.truthTable.forEach(row => {
            const tr = document.createElement('tr');
            row.forEach(val => {
                const td = document.createElement('td');
                td.textContent = val;
                tr.appendChild(td);
            });
            tooltipTable.appendChild(tr);
        });
        document.getElementById('tooltip-table').style.display = 'table';
    } else {
        document.getElementById('tooltip-table').style.display = 'none';
    }
    
    // Position tooltip
    const rect = canvasContainer.getBoundingClientRect();
    tooltip.style.left = (e.clientX - rect.left + 15) + 'px';
    tooltip.style.top = (e.clientY - rect.top + 15) + 'px';
    tooltip.classList.remove('hidden');
}

function hideTooltip() {
    tooltip.classList.add('hidden');
}

// ========== UNDO / CLEAR ==========
function saveState() {
    const state = JSON.stringify({ gates, wires, nextGateId, nextWireId });
    history.push(state);
    if (history.length > 50) history.shift(); // Limit history
}

function undo() {
    if (history.length <= 1) return;
    
    history.pop(); // Remove current state
    const prevState = history[history.length - 1];
    
    if (prevState) {
        const parsed = JSON.parse(prevState);
        gates = parsed.gates;
        wires = parsed.wires;
        nextGateId = parsed.nextGateId;
        nextWireId = parsed.nextWireId;
        
        propagateSignals();
        render();
    }
}

function clearCanvas() {
    gates = [];
    wires = [];
    nextGateId = 1;
    nextWireId = 1;
    history = [];
    saveState();
    render();
    
    if (mode === 'tutorial') {
        loadLevel(currentLevel);
    }
}

// ========== SHARE / SAVE ==========
function showShareModal() {
    const data = {
        mode,
        level: currentLevel,
        gates: gates.map(g => ({ type: g.type, x: Math.round(g.x), y: Math.round(g.y), output: g.output })),
        wires: wires.map(w => ({ from: w.from, to: w.to }))
    };
    
    const encoded = btoa(JSON.stringify(data));
    const url = window.location.origin + window.location.pathname + '?circuit=' + encoded;
    
    shareUrlInput.value = url;
    shareModal.classList.remove('hidden');
}

function copyShareURL() {
    shareUrlInput.select();
    navigator.clipboard.writeText(shareUrlInput.value).then(() => {
        document.getElementById('copy-url-btn').textContent = '✓ Copied!';
        setTimeout(() => {
            document.getElementById('copy-url-btn').textContent = '📋 Copy Link';
        }, 2000);
    });
}

function loadFromURL() {
    const params = new URLSearchParams(window.location.search);
    const circuitData = params.get('circuit');
    
    if (circuitData) {
        try {
            const data = JSON.parse(atob(circuitData));
            
            mode = data.mode || 'sandbox';
            currentLevel = data.level || 0;
            
            gates = [];
            wires = [];
            nextGateId = 1;
            nextWireId = 1;
            
            // Recreate gates
            const idMap = {};
            data.gates.forEach((g, i) => {
                const newGate = createGate(g.type, g.x, g.y, false);
                idMap[i] = newGate.id;
                if (g.type === 'SWITCH') {
                    newGate.output = g.output || 0;
                }
            });
            
            // Recreate wires with mapped IDs
            data.wires.forEach(w => {
                wires.push({
                    id: nextWireId++,
                    from: { gateId: idMap[w.from.gateId - 1] || w.from.gateId, port: w.from.port },
                    to: { gateId: idMap[w.to.gateId - 1] || w.to.gateId, port: w.to.port },
                    signal: 0
                });
            });
            
            // Update UI
            document.getElementById('tutorial-btn').classList.toggle('active', mode === 'tutorial');
            document.getElementById('sandbox-btn').classList.toggle('active', mode === 'sandbox');
            tutorialPanel.classList.toggle('hidden', mode === 'sandbox');
            
            if (mode === 'tutorial') {
                const level = LEVELS[currentLevel];
                levelNumEl.textContent = level.id;
                levelTitleEl.textContent = level.title;
                levelDescEl.innerHTML = `<p>${level.description}</p><p><strong>Goal:</strong> ${level.goal}</p>`;
            }
            
            saveState();
            propagateSignals();
            
        } catch (e) {
            console.error('Failed to load circuit from URL', e);
        }
    }
}

// ========== START ==========
init();
