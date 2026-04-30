// =============================================================================
// script.js — Network Journey engine
// State machine, SVG topology, packet animation, packet inspector, quiz
// =============================================================================

'use strict';

// ---------------------------------------------------------------------------
// STATE
// ---------------------------------------------------------------------------
let gameState   = 'HUB';        // 'HUB' | 'TOUR' | 'QUIZ'
let currentChapterId = null;
let currentChapter   = null;
let currentStepIndex = 0;
let dnsMode          = 'basic'; // 'basic' | 'advanced'
let inspectorVisible = false;
let animationSpeed   = 700;     // ms per hop (each device-to-device leg)
let isAnimating      = false;
let isFullJourney    = false;
let fullJourneySteps = [];
let fullJourneyIndex = 0;

// Completed chapters (for Full Journey unlock)
const completedChapters = new Set(
    JSON.parse(localStorage.getItem('nj_completed') || '[]')
);

// Quiz state
let quizSteps     = [];
let quizIndex     = 0;
let quizScore     = 0;

// Previous inspector values for changed-field highlighting
let prevInspectorData = null;

// ---------------------------------------------------------------------------
// DOM REFS
// ---------------------------------------------------------------------------
const hubScreen    = document.getElementById('hub-screen');
const tourScreen   = document.getElementById('tour-screen');
const quizScreen   = document.getElementById('quiz-screen');

const tourTitle         = document.getElementById('tour-title');
const tourChapterLabel  = document.getElementById('tour-chapter-label');
const stepOl            = document.getElementById('step-ol');
const topoSvg           = document.getElementById('topology-svg');
const quizTopoSvg       = document.getElementById('quiz-topology-svg');
const natLabelEl        = document.getElementById('nat-label');
const explanationTitle  = document.getElementById('explanation-title');
const explanationBody   = document.getElementById('explanation-body');
const simplNote         = document.getElementById('simplification-note');
const simplToggle       = simplNote.querySelector('.simplification-toggle');
const simplContent      = simplNote.querySelector('.simplification-content');
const packetInspector   = document.getElementById('packet-inspector');
const inspectorToggle   = document.getElementById('inspector-toggle');
const dnsModeToggle     = document.getElementById('dns-mode-toggle');
const dnsModeLabel      = document.getElementById('dns-mode-label');
const speedSelect       = document.getElementById('speed-select');
const stepCounter       = document.getElementById('step-counter');
const prevBtn           = document.getElementById('prev-step-btn');
const nextBtn           = document.getElementById('next-step-btn');
const backToHub         = document.getElementById('back-to-hub');

const quizTitle         = document.getElementById('quiz-title');
const quizProgressLabel = document.getElementById('quiz-progress-label');
const quizQuestionText  = document.getElementById('quiz-question-text');
const quizOptions       = document.getElementById('quiz-options');
const quizFeedback      = document.getElementById('quiz-feedback');
const quizFeedbackIcon  = document.getElementById('quiz-feedback-icon');
const quizFeedbackText  = document.getElementById('quiz-feedback-text');
const quizNextBtn       = document.getElementById('quiz-next-btn');
const quizResult        = document.getElementById('quiz-result');
const resultScoreDisplay= document.getElementById('result-score-display');
const resultTitle       = document.getElementById('result-title');
const resultMessage     = document.getElementById('result-message');
const retryTourBtn      = document.getElementById('retry-tour-btn');
const nextChapterBtn    = document.getElementById('next-chapter-btn');
const quizBackBtn       = document.getElementById('quiz-back-btn');
const fullJourneyCard   = document.getElementById('full-journey-card');

// Inspector field refs
const l2Fields  = document.getElementById('l2-fields');
const l3Fields  = document.getElementById('l3-fields');
const l4Fields  = document.getElementById('l4-fields');
const l7Fields  = document.getElementById('l7-fields');

// ---------------------------------------------------------------------------
// SCREEN MANAGEMENT
// ---------------------------------------------------------------------------
function showScreen(name) {
    hubScreen.classList.toggle('hidden', name !== 'HUB');
    tourScreen.classList.toggle('hidden', name !== 'TOUR');
    quizScreen.classList.toggle('hidden', name !== 'QUIZ');
    gameState = name;
}

// ---------------------------------------------------------------------------
// HUB
// ---------------------------------------------------------------------------
function initHub() {
    updateFullJourneyLock();
    updateChapterBadges();
}

function updateFullJourneyLock() {
    const chaptersNeeded = ['dns', 'tcp', 'tls', 'http'];
    const allDone = chaptersNeeded.every(c => completedChapters.has(c));
    if (allDone) {
        fullJourneyCard.classList.remove('locked');
        fullJourneyCard.classList.add('unlocked');
        const lockIcon = fullJourneyCard.querySelector('.status-icon');
        if (lockIcon) lockIcon.textContent = '▶';
        const lockTag = fullJourneyCard.querySelector('.tag-locked');
        if (lockTag) lockTag.textContent = 'All chapters complete!';
    }
}

function updateChapterBadges() {
    completedChapters.forEach(id => {
        const card = document.querySelector(`.chapter-card[data-chapter="${id}"]`);
        if (card) {
            card.classList.add('completed');
            const icon = card.querySelector('.status-icon');
            if (icon) icon.textContent = '✓';
        }
    });
}

// ---------------------------------------------------------------------------
// TOPOLOGY RENDERING
// ---------------------------------------------------------------------------
const DEVICE_RADIUS = 28;
const DEVICE_BOX_W  = 64;
const DEVICE_BOX_H  = 52;

function buildTopologySVG(svgEl, includeDnsDevices) {
    svgEl.innerHTML = '';

    // Draw links first (below devices)
    const linkGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    LINKS.forEach(link => {
        const from = DEVICES.find(d => d.id === link.from);
        const to   = DEVICES.find(d => d.id === link.to);
        if (!from || !to) return;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', from.x);
        line.setAttribute('y1', from.y);
        line.setAttribute('x2', to.x);
        line.setAttribute('y2', to.y);
        line.setAttribute('class', 'topo-link');
        linkGroup.appendChild(line);
    });
    svgEl.appendChild(linkGroup);

    // DNS server cloud (shown only in DNS chapter)
    if (includeDnsDevices) {
        const dnsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        dnsGroup.setAttribute('id', 'dns-cloud-group');

        // Draw dashed lines connecting ISP → resolver → root → tld → auth
        const dnsChain = [
            { from: DEVICES.find(d => d.id === 'isp'), to: DNS_DEVICES[0] },
            { from: DNS_DEVICES[0], to: DNS_DEVICES[1] },
            { from: DNS_DEVICES[1], to: DNS_DEVICES[2] },
            { from: DNS_DEVICES[2], to: DNS_DEVICES[3] },
        ];
        dnsChain.forEach(({ from, to }) => {
            if (!from || !to) return;
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', from.x);
            line.setAttribute('y1', from.y);
            line.setAttribute('x2', to.x);
            line.setAttribute('y2', to.y);
            line.setAttribute('class', 'topo-link');
            line.setAttribute('stroke-dasharray', '5,4');
            line.setAttribute('opacity', '0.45');
            dnsGroup.appendChild(line);
        });

        DNS_DEVICES.forEach(dev => {
            dnsGroup.appendChild(buildDeviceGroup(dev));
        });
        svgEl.appendChild(dnsGroup);
    }

    // Draw device nodes
    const deviceGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    DEVICES.forEach(dev => {
        deviceGroup.appendChild(buildDeviceGroup(dev));
    });
    svgEl.appendChild(deviceGroup);
}

function buildDeviceGroup(dev) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'topo-device-group');
    g.setAttribute('id', `dev-${dev.id}`);
    g.setAttribute('transform', `translate(${dev.x}, ${dev.y})`);

    // Background rect
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('class', 'topo-device-body');
    rect.setAttribute('x', -DEVICE_BOX_W / 2);
    rect.setAttribute('y', -DEVICE_BOX_H / 2);
    rect.setAttribute('width', DEVICE_BOX_W);
    rect.setAttribute('height', DEVICE_BOX_H);
    rect.setAttribute('rx', '8');
    g.appendChild(rect);

    // Emoji
    const emoji = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    emoji.setAttribute('class', 'topo-device-emoji');
    emoji.setAttribute('x', '0');
    emoji.setAttribute('y', '-6');
    emoji.textContent = dev.emoji;
    g.appendChild(emoji);

    // Label
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('class', 'topo-device-label');
    label.setAttribute('x', '0');
    label.setAttribute('y', DEVICE_BOX_H / 2 + 14);
    label.textContent = dev.label;
    g.appendChild(label);

    // Sublabel
    if (dev.sublabel) {
        const sublabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        sublabel.setAttribute('class', 'topo-device-sublabel');
        sublabel.setAttribute('x', '0');
        sublabel.setAttribute('y', DEVICE_BOX_H / 2 + 25);
        sublabel.textContent = dev.sublabel;
        g.appendChild(sublabel);
    }

    return g;
}

function highlightDevices(svgEl, activeIds) {
    const allGroups = svgEl.querySelectorAll('.topo-device-group');
    allGroups.forEach(g => g.classList.remove('active'));
    if (!activeIds) return;
    activeIds.forEach(id => {
        const g = svgEl.querySelector(`#dev-${id}`);
        if (g) g.classList.add('active');
    });
}

// ---------------------------------------------------------------------------
// PACKET ANIMATION
// ---------------------------------------------------------------------------
function getDevicePosition(id) {
    const dev = [...DEVICES, ...DNS_DEVICES].find(d => d.id === id);
    return dev ? { x: dev.x, y: dev.y } : null;
}

function animatePacketBetween(svgEl, fromId, toId, color, duration) {
    return new Promise(resolve => {
        const from = getDevicePosition(fromId);
        const to   = getDevicePosition(toId);
        if (!from || !to) { resolve(); return; }

        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('class', 'packet-dot');
        dot.setAttribute('r', '7');
        dot.setAttribute('fill', color || 'var(--accent)');
        dot.setAttribute('cx', from.x);
        dot.setAttribute('cy', from.y);
        svgEl.appendChild(dot);

        const start = performance.now();
        function frame(now) {
            const elapsed = now - start;
            const t = Math.min(elapsed / duration, 1);
            const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // ease in-out

            const cx = from.x + (to.x - from.x) * eased;
            const cy = from.y + (to.y - from.y) * eased;
            dot.setAttribute('cx', cx);
            dot.setAttribute('cy', cy);

            if (t < 1) {
                requestAnimationFrame(frame);
            } else {
                dot.remove();
                resolve();
            }
        }
        requestAnimationFrame(frame);
    });
}

async function runPacketAnimation(svgEl, packetDef) {
    if (!packetDef) return;

    const { from, to, color } = packetDef;
    const duration = animationSpeed;

    // Build path: find the ordered list of devices between from and to
    const allDeviceIds = DEVICES.map(d => d.id);
    const fromIdx = allDeviceIds.indexOf(from);
    const toIdx   = allDeviceIds.indexOf(to);

    if (fromIdx === -1 || toIdx === -1) {
        // DNS devices — animate directly, one hop
        await animatePacketBetween(svgEl, from, to, color, duration);
        return;
    }

    const path = fromIdx < toIdx
        ? allDeviceIds.slice(fromIdx, toIdx + 1)
        : allDeviceIds.slice(toIdx, fromIdx + 1).reverse();

    // Each hop gets the full per-hop duration so longer paths feel proportionally longer
    for (let i = 0; i < path.length - 1; i++) {
        await animatePacketBetween(svgEl, path[i], path[i + 1], color, duration);
    }
}

// ---------------------------------------------------------------------------
// CHAPTER STEPS
// ---------------------------------------------------------------------------
function getChapterSteps(chapter) {
    if (chapter.id !== 'dns') return chapter.steps;
    if (dnsMode === 'basic') {
        // Basic mode: exclude steps marked dnsOnly
        return chapter.steps.filter(s => !s.dnsOnly);
    }
    return chapter.steps;
}

// ---------------------------------------------------------------------------
// TOUR — LOAD CHAPTER
// ---------------------------------------------------------------------------
function loadChapter(chapterId) {
    const chapter = CHAPTERS.find(c => c.id === chapterId);
    if (!chapter) return;

    currentChapterId  = chapterId;
    currentChapter    = chapter;
    currentStepIndex  = 0;
    prevInspectorData = null;
    isAnimating       = false;
    isFullJourney     = false;

    const isDns = chapterId === 'dns';
    const steps = getChapterSteps(chapter);

    // Header
    tourChapterLabel.textContent = chapter.subtitle;
    tourTitle.textContent        = chapter.title;

    // DNS toggle
    dnsModeToggle.classList.toggle('hidden', !chapter.showDnsModeToggle);
    dnsModeLabel.textContent = dnsMode === 'basic' ? 'Basic' : 'Advanced';
    dnsModeToggle.classList.toggle('active', dnsMode === 'advanced');

    // Build topology SVGs
    buildTopologySVG(topoSvg, isDns);
    buildTopologySVG(quizTopoSvg, isDns);

    // Build step list
    buildStepList(steps);

    showScreen('TOUR');
    goToStep(0);
}

function buildStepList(steps) {
    stepOl.innerHTML = '';
    steps.forEach((step, i) => {
        const li = document.createElement('li');
        const num = document.createElement('span');
        num.className = 'step-num';
        num.textContent = i + 1;
        li.appendChild(num);
        const text = document.createTextNode(step.label);
        li.appendChild(text);
        li.addEventListener('click', () => { if (!isAnimating) goToStep(i); });
        stepOl.appendChild(li);
    });
}

function goToStep(index) {
    const steps = getChapterSteps(currentChapter);
    if (index < 0 || index >= steps.length) return;

    currentStepIndex = index;
    const step = steps[index];

    // Step list highlighting
    const lis = stepOl.querySelectorAll('li');
    lis.forEach((li, i) => {
        li.classList.toggle('active', i === index);
        if (i < index) li.classList.add('visited');
    });

    // Counter
    const stepLabel = currentChapterId === 'overview' ? 'Concept' : 'Step';
    stepCounter.textContent = `${stepLabel} ${index + 1} of ${steps.length}`;

    // Navigation buttons
    prevBtn.disabled = index === 0;
    const isLastStep = index === steps.length - 1;
    if (currentChapterId === 'overview') {
        nextBtn.textContent = isLastStep ? 'Back to Hub →' : 'Next →';
    } else {
        nextBtn.textContent = isLastStep ? (currentChapter.hasQuiz ? 'Take Quiz →' : 'Finish →') : 'Next →';
    }

    // Highlight devices
    highlightDevices(topoSvg, step.activeDevices);

    // Explanation panel
    renderExplanation(step);

    // Packet inspector
    renderInspector(step.inspector);

    // NAT label
    natLabelEl.classList.add('hidden');
    if (step.natEvent && step.natLabel) {
        natLabelEl.textContent = step.natLabel;
        natLabelEl.classList.remove('hidden');
        // Label stays visible until the user navigates to a different step
    }

    // Packet animation
    if (step.packet) {
        isAnimating = true;
        nextBtn.disabled = true;
        prevBtn.disabled = true;
        runPacketAnimation(topoSvg, step.packet).then(() => {
            isAnimating = false;
            nextBtn.disabled = false;
            prevBtn.disabled = currentStepIndex === 0;
        });
    }
}

function renderExplanation(step) {
    explanationTitle.textContent = step.explanation.title;
    explanationBody.innerHTML    = step.explanation.body;

    simplNote.classList.add('hidden');
    simplContent.classList.add('hidden');

    if (step.simplification) {
        simplNote.classList.remove('hidden');
        simplContent.innerHTML = step.simplification.note;
        if (step.simplification.learnMoreUrl) {
            simplContent.innerHTML += ` <a href="${step.simplification.learnMoreUrl}" target="_blank" rel="noopener noreferrer">Learn more ↗</a>`;
        }
    } else if (step.advancedDetail && dnsMode === 'advanced') {
        simplNote.classList.remove('hidden');
        simplContent.innerHTML = step.advancedDetail.body;
        if (step.advancedDetail.learnMoreUrl) {
            simplContent.innerHTML += ` <a href="${step.advancedDetail.learnMoreUrl}" target="_blank" rel="noopener noreferrer">Learn more ↗</a>`;
        }
    }
    linkifyAcronyms(explanationBody);
    if (!simplNote.classList.contains('hidden')) linkifyAcronyms(simplContent);
}

// ---------------------------------------------------------------------------
// PACKET INSPECTOR
// ---------------------------------------------------------------------------
function renderInspector(data) {
    [
        [l2Fields, data && data.l2, 'l2'],
        [l3Fields, data && data.l3, 'l3'],
        [l4Fields, data && data.l4, 'l4'],
        [l7Fields, data && data.l7, 'l7'],
    ].forEach(([container, layerData, layerId]) => {
        container.innerHTML = '';
        if (!layerData) {
            const empty = document.createElement('span');
            empty.className = 'inspector-empty';
            empty.textContent = '—';
            container.appendChild(empty);
            return;
        }
        Object.entries(layerData).forEach(([key, val]) => {
            const row = document.createElement('div');
            row.className = 'field-row';

            const keyEl = document.createElement('span');
            keyEl.className = 'field-key';
            keyEl.textContent = key;

            const valEl = document.createElement('span');
            valEl.className = 'field-val';
            valEl.textContent = val;

            // Highlight changed fields
            const prev = prevInspectorData && prevInspectorData[layerId];
            if (prev && prev[key] !== undefined && prev[key] !== val) {
                valEl.classList.add('changed');
            }

            // Mark encrypted fields
            if (typeof val === 'string' && val.startsWith('🔒')) {
                valEl.classList.add('encrypted');
            }

            row.appendChild(keyEl);
            row.appendChild(valEl);
            container.appendChild(row);
        });
    });

    // Store current as previous for next render
    if (data) {
        prevInspectorData = {
            l2: data.l2 ? { ...data.l2 } : null,
            l3: data.l3 ? { ...data.l3 } : null,
            l4: data.l4 ? { ...data.l4 } : null,
            l7: data.l7 ? { ...data.l7 } : null,
        };
    } else {
        prevInspectorData = null;
    }
}

// ---------------------------------------------------------------------------
// QUIZ
// ---------------------------------------------------------------------------
function startQuiz() {
    if (!currentChapter || !currentChapter.hasQuiz) {
        markChapterComplete(currentChapterId);
        showScreen('HUB');
        return;
    }

    quizSteps  = [...currentChapter.quiz];
    quizIndex  = 0;
    quizScore  = 0;

    quizTitle.textContent = `${currentChapter.title} — Quiz`;
    quizResult.classList.add('hidden');

    // Mirror topology in quiz
    buildTopologySVG(quizTopoSvg, currentChapterId === 'dns');

    showScreen('QUIZ');
    renderQuizQuestion();
}

function renderQuizQuestion() {
    if (quizIndex >= quizSteps.length) {
        showQuizResult();
        return;
    }

    const q = quizSteps[quizIndex];
    quizProgressLabel.textContent = `Question ${quizIndex + 1} of ${quizSteps.length}`;
    quizQuestionText.innerHTML = q.question;
    linkifyAcronyms(quizQuestionText);
    quizFeedback.classList.add('hidden');
    quizFeedback.className = 'hidden';

    quizOptions.innerHTML = '';
    q.options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = 'quiz-option';
        btn.textContent = opt;
        btn.addEventListener('click', () => handleAnswer(i, q));
        quizOptions.appendChild(btn);
    });
}

function handleAnswer(selectedIdx, question) {
    const correct = selectedIdx === question.correct;
    if (correct) quizScore++;

    // Disable all options
    const optBtns = quizOptions.querySelectorAll('.quiz-option');
    optBtns.forEach((btn, i) => {
        btn.disabled = true;
        if (i === question.correct) btn.classList.add('correct');
        if (i === selectedIdx && !correct) btn.classList.add('wrong');
    });

    // Show feedback
    quizFeedback.classList.remove('hidden');
    quizFeedback.className = correct ? 'correct-fb' : 'wrong-fb';
    quizFeedbackIcon.textContent = correct ? '✅' : '❌';
    quizFeedbackText.innerHTML = question.explanation;
    linkifyAcronyms(quizFeedbackText);
}

function showQuizResult() {
    const total = quizSteps.length;
    const pct   = Math.round((quizScore / total) * 100);
    const passed = pct >= 60;

    resultScoreDisplay.textContent = `${quizScore}/${total}`;
    resultTitle.textContent = passed ? 'Nice work!' : 'Keep practicing!';
    resultMessage.textContent = passed
        ? `You answered ${quizScore} out of ${total} questions correctly (${pct}%). Chapter complete!`
        : `You answered ${quizScore} out of ${total} correctly (${pct}%). Review the tour and try again.`;

    if (passed) markChapterComplete(currentChapterId);

    // Next chapter navigation
    const chapterIds = CHAPTERS.map(c => c.id);
    const currentIdx = chapterIds.indexOf(currentChapterId);
    const nextId     = chapterIds[currentIdx + 1];
    nextChapterBtn.textContent  = nextId ? `Next Chapter →` : 'Back to Hub →';
    nextChapterBtn.dataset.next = nextId || '';

    quizResult.classList.remove('hidden');
}

function markChapterComplete(id) {
    completedChapters.add(id);
    localStorage.setItem('nj_completed', JSON.stringify([...completedChapters]));
    updateChapterBadges();
    updateFullJourneyLock();
}

// ---------------------------------------------------------------------------
// FULL JOURNEY MODE
// ---------------------------------------------------------------------------
function buildFullJourneySteps() {
    const result = [];
    CHAPTERS.filter(c => FULL_JOURNEY_CHAPTERS.includes(c.id)).forEach(chapter => {
        result.push({ type: 'chapter-header', chapterTitle: chapter.title, chapterSubtitle: chapter.subtitle });
        const steps = chapter.id === 'dns'
            ? chapter.steps.filter(s => !s.dnsOnly)
            : chapter.steps;
        steps.forEach(step => result.push({ type: 'step', chapterTitle: chapter.title, step }));
    });
    return result;
}

function loadFullJourney() {
    isFullJourney     = true;
    fullJourneySteps  = buildFullJourneySteps();
    fullJourneyIndex  = 0;
    prevInspectorData = null;

    tourChapterLabel.textContent = 'End-to-end visualization';
    tourTitle.textContent        = '🚀 Full Journey';
    dnsModeToggle.classList.add('hidden');
    stepOl.innerHTML = '';
    simplNote.classList.add('hidden');
    natLabelEl.classList.add('hidden');

    buildTopologySVG(topoSvg, true);
    showScreen('TOUR');
    goToFullJourneyStep(0);
}

function goToFullJourneyStep(index) {
    if (index < 0 || index >= fullJourneySteps.length) return;
    fullJourneyIndex = index;
    const item  = fullJourneySteps[index];
    const total = fullJourneySteps.length;

    stepCounter.textContent = `Journey: ${index + 1} of ${total}`;
    prevBtn.disabled = index === 0;
    nextBtn.disabled = false;
    nextBtn.textContent = index === total - 1 ? 'Finish ★' : 'Next →';
    natLabelEl.classList.add('hidden');

    if (item.type === 'chapter-header') {
        highlightDevices(topoSvg, []);
        explanationTitle.textContent = item.chapterTitle;
        explanationBody.innerHTML    = `<em>${item.chapterSubtitle}</em>`;
        simplNote.classList.add('hidden');
        renderInspector(null);
        tourChapterLabel.textContent = item.chapterTitle;
        linkifyAcronyms(explanationBody);
    } else {
        const { step, chapterTitle } = item;
        tourChapterLabel.textContent = chapterTitle;
        highlightDevices(topoSvg, step.activeDevices);
        renderExplanation(step);
        renderInspector(step.inspector);
        if (step.natEvent && step.natLabel) {
            natLabelEl.textContent = step.natLabel;
            natLabelEl.classList.remove('hidden');
        }
        if (step.packet) {
            isAnimating = true;
            nextBtn.disabled = true;
            prevBtn.disabled = true;
            runPacketAnimation(topoSvg, step.packet).then(() => {
                isAnimating = false;
                nextBtn.disabled = false;
                prevBtn.disabled = fullJourneyIndex === 0;
            });
        }
    }
}

// ---------------------------------------------------------------------------
// ACRONYM TOOLTIPS
// ---------------------------------------------------------------------------
function linkifyAcronyms(el) {
    if (!el || typeof ACRONYMS === 'undefined') return;
    const sortedKeys = Object.keys(ACRONYMS).sort((a, b) => b.length - a.length);
    const pattern    = new RegExp(`\\b(${sortedKeys.join('|')})\\b`, 'g');

    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes  = [];
    let node;
    while ((node = walker.nextNode())) {
        let parent = node.parentElement;
        let skip   = false;
        while (parent && parent !== el) {
            if (['CODE', 'A', 'BUTTON'].includes(parent.tagName) ||
                parent.classList.contains('acronym')) {
                skip = true;
                break;
            }
            parent = parent.parentElement;
        }
        if (!skip) nodes.push(node);
    }

    nodes.forEach(textNode => {
        const text = textNode.textContent;
        pattern.lastIndex = 0;
        if (!pattern.test(text)) return;
        pattern.lastIndex = 0;
        const frag = document.createDocumentFragment();
        let last = 0, m;
        while ((m = pattern.exec(text)) !== null) {
            if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
            const span = document.createElement('span');
            span.className = 'acronym';
            span.textContent = m[0];
            span.setAttribute('data-def', ACRONYMS[m[0]]);
            frag.appendChild(span);
            last = pattern.lastIndex;
        }
        if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
        textNode.parentNode.replaceChild(frag, textNode);
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// EVENT LISTENERS
// ---------------------------------------------------------------------------
function setupEvents() {
    // Hub chapter cards
    document.querySelectorAll('.chapter-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.dataset.chapter;
            if (!id) return;
            if (card.classList.contains('locked')) return;

            if (id === 'journey') {
                loadFullJourney();
            } else {
                loadChapter(id);
            }
        });
    });

    // Tour navigation
    nextBtn.addEventListener('click', () => {
        if (isAnimating) return;
        if (isFullJourney) {
            if (fullJourneyIndex < fullJourneySteps.length - 1) {
                goToFullJourneyStep(fullJourneyIndex + 1);
            } else {
                isFullJourney = false;
                showScreen('HUB');
            }
            return;
        }
        const steps = getChapterSteps(currentChapter);
        if (currentStepIndex < steps.length - 1) {
            goToStep(currentStepIndex + 1);
        } else {
            if (currentChapter && currentChapter.hasQuiz) {
                startQuiz();
            } else {
                markChapterComplete(currentChapterId);
                showScreen('HUB');
            }
        }
    });

    prevBtn.addEventListener('click', () => {
        if (isAnimating) return;
        if (isFullJourney) {
            if (fullJourneyIndex > 0) goToFullJourneyStep(fullJourneyIndex - 1);
            return;
        }
        if (currentStepIndex > 0) goToStep(currentStepIndex - 1);
    });

    backToHub.addEventListener('click', () => {
        isFullJourney = false;
        showScreen('HUB');
    });

    // Inspector toggle
    inspectorToggle.addEventListener('click', () => {
        inspectorVisible = !inspectorVisible;
        packetInspector.classList.toggle('hidden', !inspectorVisible);
        inspectorToggle.classList.toggle('active', inspectorVisible);
    });

    // DNS mode toggle
    dnsModeToggle.addEventListener('click', () => {
        dnsMode = dnsMode === 'basic' ? 'advanced' : 'basic';
        dnsModeLabel.textContent = dnsMode === 'basic' ? 'Basic' : 'Advanced';
        dnsModeToggle.classList.toggle('active', dnsMode === 'advanced');
        // Rebuild step list and go to step 0
        const steps = getChapterSteps(currentChapter);
        buildStepList(steps);
        buildTopologySVG(topoSvg, true);
        prevInspectorData = null;
        goToStep(0);
    });

    // Speed control
    speedSelect.addEventListener('change', () => {
        animationSpeed = parseInt(speedSelect.value, 10);
    });

    // Simplification toggle
    simplToggle.addEventListener('click', () => {
        simplContent.classList.toggle('hidden');
    });

    // Quiz feedback next
    quizNextBtn.addEventListener('click', () => {
        quizIndex++;
        renderQuizQuestion();
    });

    // Quiz back to hub
    quizBackBtn.addEventListener('click', () => showScreen('HUB'));

    // Quiz result buttons
    retryTourBtn.addEventListener('click', () => {
        loadChapter(currentChapterId);
    });

    nextChapterBtn.addEventListener('click', () => {
        const nextId = nextChapterBtn.dataset.next;
        if (nextId) {
            loadChapter(nextId);
        } else {
            showScreen('HUB');
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', e => {
        if (gameState === 'TOUR') {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault();
                nextBtn.click();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                prevBtn.click();
            } else if (e.key === 'Escape') {
                isFullJourney = false;
                showScreen('HUB');
            }
        }
    });
}

// ---------------------------------------------------------------------------
// INIT
// ---------------------------------------------------------------------------
function init() {
    // Acronym tooltip element (created once, reused on every click)
    const tip = document.createElement('div');
    tip.id        = 'acronym-tooltip';
    tip.className = 'acronym-tooltip hidden';
    document.body.appendChild(tip);

    // Use capture phase so clicks on acronyms inside buttons don't also fire the button
    document.addEventListener('click', e => {
        const tipEl = document.getElementById('acronym-tooltip');
        if (e.target.classList.contains('acronym')) {
            const def = e.target.getAttribute('data-def');
            tipEl.innerHTML = `<strong>${e.target.textContent}</strong> — ${def}`;
            tipEl.classList.remove('hidden');
            const rect = e.target.getBoundingClientRect();
            tipEl.style.top  = `${rect.bottom + 6}px`;
            tipEl.style.left = `${rect.left}px`;
            // Clamp to viewport so it doesn't overflow right edge
            requestAnimationFrame(() => {
                const tw = tipEl.offsetWidth;
                if (rect.left + tw > window.innerWidth - 8) {
                    tipEl.style.left = `${Math.max(8, window.innerWidth - tw - 8)}px`;
                }
            });
            e.stopPropagation();
        } else if (!tipEl.classList.contains('hidden')) {
            tipEl.classList.add('hidden');
        }
    }, true); // capture = true

    // Set the external back link destination based on where the user came from.
    // Default to the main homepage; only use the games sub-page if the referrer
    // explicitly shows the user navigated here from /games/.
    const backLink = document.querySelector('a.back-btn');
    if (backLink) {
        const ref = document.referrer;
        const fromGames = ref && new URL(ref).pathname.includes('/games/');
        backLink.href      = fromGames ? '../games/index.html' : '../index.html';
        backLink.textContent = fromGames ? '← Games' : '← Home';
    }

    setupEvents();
    initHub();
    showScreen('HUB');
}

init();
