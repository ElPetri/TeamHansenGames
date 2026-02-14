const STORAGE_KEY = 'snowWay_predictions';
const RESULTS_KEY = 'snowWay_results';
const LAST_NAME_KEY = 'snowWay_lastName';
const LOCATION_KEY = 'snowWay_location';
const LOOKUP_CACHE_KEY = 'snowWay_lookupCache';
const DEADLINE_KEY = 'snowWay_deadline';

const predictionForm = document.getElementById('prediction-form');
const resultsForm = document.getElementById('results-form');
const formError = document.getElementById('form-error');
const lockedMessage = document.getElementById('locked-message');
const slotsRemaining = document.getElementById('slots-remaining');
const multiplierDisplay = document.getElementById('current-multiplier');
const multiplierNote = document.getElementById('multiplier-note');
const predictionsBody = document.getElementById('predictions-body');
const resultsError = document.getElementById('results-error');
const resultsSummary = document.getElementById('results-summary');
const winnerName = document.getElementById('winner-name');
const winnerDetails = document.getElementById('winner-details');
const resetButton = document.getElementById('reset-button');
const resultsActions = document.getElementById('results-actions');
const copyScoresButton = document.getElementById('copy-scores');
const shareButton = document.getElementById('share-button');
const scoreboardPanel = document.getElementById('scoreboard-panel');
const scoreboard = document.getElementById('scoreboard');

const lookupForm = document.getElementById('lookup-form');
const locationInput = document.getElementById('snow-location');
const rangeSelect = document.getElementById('range-type');
const customRange = document.getElementById('custom-range');
const rangeStartInput = document.getElementById('range-start');
const rangeEndInput = document.getElementById('range-end');
const lookupButton = document.getElementById('lookup-button');
const lookupError = document.getElementById('lookup-error');
const lookupWarning = document.getElementById('lookup-warning');
const lookupResult = document.getElementById('lookup-result');
const lookupValue = document.getElementById('lookup-value');
const lookupRange = document.getElementById('lookup-range');
const useLookupButton = document.getElementById('use-lookup');

const shareModal = document.getElementById('share-modal');
const shareUrlInput = document.getElementById('share-url');
const shareCopyButton = document.getElementById('share-copy');
const shareCloseButton = document.getElementById('share-close');

const nameInput = document.getElementById('name');
const snowfallInput = document.getElementById('snowfall');
const returnDateInput = document.getElementById('return-date');
const submissionDateInput = document.getElementById('submission-date');
const deadlineDateInput = document.getElementById('deadline-date');
const actualSnowfallInput = document.getElementById('actual-snowfall');
const actualReturnInput = document.getElementById('actual-return');

function getLocalDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getMultiplier(submissionDateString, deadlineDateString) {
    if (!submissionDateString || !deadlineDateString) return 1;

    const daysLate = dateDiffSigned(submissionDateString, deadlineDateString);
    if (daysLate > 0) return 0.5;

    const daysEarly = Math.abs(daysLate);
    if (daysEarly >= 2) return 3;
    if (daysEarly === 1) return 2;
    if (daysEarly === 0) return 1;
    return 0.5;
}

function toLocalDate(dateString) {
    if (!dateString) return new Date();
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
}

function loadPredictions() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (error) {
        return [];
    }
}

function loadDeadline() {
    const raw = localStorage.getItem(DEADLINE_KEY);
    return raw || '';
}

function saveDeadline(deadlineDate) {
    if (!deadlineDate) {
        localStorage.removeItem(DEADLINE_KEY);
        return;
    }
    localStorage.setItem(DEADLINE_KEY, deadlineDate);
}

function savePredictions(predictions) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(predictions));
}

function loadResults() {
    try {
        const raw = localStorage.getItem(RESULTS_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        return null;
    }
}

function saveResults(results) {
    localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
}

function normalizeName(name) {
    return name.trim().toLowerCase();
}

function parseDateParts(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    return { year, month, day };
}

function daysBetween(dateA, dateB) {
    const a = parseDateParts(dateA);
    const b = parseDateParts(dateB);
    const utcA = Date.UTC(a.year, a.month - 1, a.day);
    const utcB = Date.UTC(b.year, b.month - 1, b.day);
    return Math.round(Math.abs(utcA - utcB) / 86400000);
}

function dateDiffSigned(dateA, dateB) {
    const a = parseDateParts(dateA);
    const b = parseDateParts(dateB);
    const utcA = Date.UTC(a.year, a.month - 1, a.day);
    const utcB = Date.UTC(b.year, b.month - 1, b.day);
    return Math.round((utcA - utcB) / 86400000);
}

function addDays(date, days) {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
}

function addDaysString(dateString, days) {
    return getLocalDateString(addDays(toLocalDate(dateString), days));
}

function compareDateStrings(dateA, dateB) {
    if (dateA === dateB) return 0;
    return dateA < dateB ? -1 : 1;
}

function loadLookupCache() {
    try {
        const raw = localStorage.getItem(LOOKUP_CACHE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch (error) {
        return {};
    }
}

function saveLookupCache(cache) {
    localStorage.setItem(LOOKUP_CACHE_KEY, JSON.stringify(cache));
}

function normalizeLocation(location) {
    return location.trim().toLowerCase();
}

function formatDate(dateString) {
    if (!dateString) return '—';
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function formatDateTime(isoString) {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}

function updateMultiplierDisplay() {
    const submittedDate = submissionDateInput.value || getLocalDateString();
    const deadlineDate = deadlineDateInput.value || loadDeadline();

    if (!deadlineDate) {
        multiplierDisplay.textContent = '—';
        if (multiplierNote) {
            multiplierNote.textContent = 'Set a deadline date to enable multipliers.';
        }
        return;
    }

    const multiplier = getMultiplier(submittedDate, deadlineDate);
    multiplierDisplay.textContent = `${multiplier}x`;

    if (multiplierNote) {
        const daysLate = dateDiffSigned(submittedDate, deadlineDate);
        if (daysLate > 0) {
            multiplierNote.textContent = `Deadline was ${formatDate(deadlineDate)}. Late entries are 0.5x.`;
        } else if (daysLate === 0) {
            multiplierNote.textContent = `Deadline is ${formatDate(deadlineDate)}. Entries today are 1x.`;
        } else {
            const daysEarly = Math.abs(daysLate);
            multiplierNote.textContent = `Deadline: ${formatDate(deadlineDate)}. ${daysEarly} day${daysEarly === 1 ? '' : 's'} early.`;
        }
    }
}

function syncDeadlineState() {
    const predictions = loadPredictions();
    let deadline = loadDeadline();

    if (!deadline && predictions.length > 0) {
        const firstSubmitted = predictions
            .map((entry) => entry?.submittedAt)
            .filter(Boolean)
            .sort((a, b) => new Date(a) - new Date(b))[0];
        if (firstSubmitted) {
            deadline = getLocalDateString(new Date(firstSubmitted));
            saveDeadline(deadline);
        }
    }

    deadlineDateInput.value = deadline;

    const shouldLockDeadline = predictions.length > 0;
    deadlineDateInput.disabled = shouldLockDeadline;
    const deadlineButton = document.querySelector('.date-button[data-target="deadline-date"]');
    if (deadlineButton) {
        deadlineButton.disabled = shouldLockDeadline;
    }
}

function populateResultsForm() {
    const results = loadResults();
    if (!results) return;
    actualSnowfallInput.value = results.actualSnowfall;
    actualReturnInput.value = results.actualReturnDate;
}

function updateSlots(predictions) {
    slotsRemaining.textContent = `Entries: ${predictions.length}`;
    slotsRemaining.style.color = predictions.length === 0 ? 'var(--text-dim)' : 'var(--accent)';
    predictionForm.querySelector('button').disabled = false;
}

function calculateScores(predictions, results) {
    if (!results) return null;
    return predictions.map((prediction) => {
        const snowError = Math.abs(prediction.snowfall - results.actualSnowfall);
        const dateError = daysBetween(prediction.returnDate, results.actualReturnDate);
        const snowScore = 1 / (1 + snowError);
        const dateScore = 1 / (1 + dateError);
        const totalScore = (snowScore + dateScore) * prediction.multiplier * 100;
        return {
            ...prediction,
            snowError,
            dateError,
            totalScore
        };
    });
}

function getSelectedRange() {
    const today = getLocalDateString();
    if (rangeSelect.value === 'custom') {
        const startDate = rangeStartInput.value;
        const endDate = rangeEndInput.value;
        return { startDate, endDate, label: `${formatDate(startDate)} → ${formatDate(endDate)}` };
    }
    const hours = parseInt(rangeSelect.value, 10);
    const days = Math.max(1, Math.round(hours / 24));
    const endDate = today;
    const startDate = getLocalDateString(addDays(new Date(), -(days - 1)));
    return { startDate, endDate, label: `Last ${hours} hours` };
}

function updateLookupWarning(endDate) {
    const today = getLocalDateString();
    const cutoff = addDaysString(today, -1);
    lookupWarning.hidden = compareDateStrings(endDate, cutoff) < 0;
}

async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Network error while retrieving snowfall data.');
    }
    return response.json();
}

async function geocodeLocation(location) {
    // Only use city name (first word before comma)
    const city = location.split(',')[0].trim();
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
    const data = await fetchJson(url);
    if (!data.results || data.results.length === 0) {
        throw new Error('City not found. Try a larger or more well-known city.');
    }
    const match = data.results[0];
    return {
        latitude: match.latitude,
        longitude: match.longitude,
        name: match.name,
        admin1: match.admin1,
        country: match.country
    };
}
// --- URL Shortener (is.gd) ---
async function shortenUrl(longUrl) {
    try {
        const resp = await fetch(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(longUrl)}`);
        if (!resp.ok) throw new Error('Shortener error');
        const shortUrl = await resp.text();
        if (!shortUrl.startsWith('http')) throw new Error('Shortener error');
        return shortUrl;
    } catch {
        return longUrl;
    }
}
// --- CSV Export ---
function exportPredictionsCSV() {
    const predictions = loadPredictions();
    if (!predictions.length) return;
    const results = loadResults();
    const scored = calculateScores(predictions, results) || predictions;
    const header = ['#','Name','Snowfall','Return Date','Multiplier','Submitted','Score'];
    const rows = scored.map((p, i) => [
        i+1,
        p.name,
        (p.snowfall || '').toFixed(1),
        formatDate(p.returnDate),
        p.multiplier + 'x',
        formatDateTime(p.submittedAt),
        p.totalScore !== undefined ? p.totalScore.toFixed(3) : ''
    ]);
    const csv = [header, ...rows].map(r => r.map(x => '"'+String(x).replace(/"/g,'""')+'"').join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'snow-way-predictions.csv';
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>a.remove(), 100);
}
// --- Remove Dark/Light Mode Toggle ---
// (Removed themeToggle button and setTheme/getTheme logic)
// --- Confetti (CDN) ---
function loadConfettiScript() {
    if (window.confetti) return;
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
    s.async = true;
    document.body.appendChild(s);
}
loadConfettiScript();
function showConfetti() {
    if (window.confetti) {
        window.confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.7 }
        });
    }
}
// --- Snow Burst Animation ---
function showSnowBurst() {
    // Remove any existing burst
    const old = document.getElementById('snow-burst-canvas');
    if (old) old.remove();
    const canvas = document.createElement('canvas');
    canvas.id = 'snow-burst-canvas';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '1001';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const cx = window.innerWidth/2, cy = window.innerHeight/2;
    const flakes = Array.from({length: 36}, () => {
        const angle = Math.random() * 2 * Math.PI;
        const speed = 3 + Math.random() * 3;
        return {
            x: cx,
            y: cy,
            r: 2 + Math.random() * 3,
            dx: Math.cos(angle) * speed,
            dy: Math.sin(angle) * speed,
            o: 0.8 + Math.random() * 0.2
        };
    });
    let frame = 0;
    function draw() {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        for (const f of flakes) {
            ctx.globalAlpha = f.o;
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.r, 0, 2*Math.PI);
            ctx.fillStyle = '#fff';
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
    function update() {
        for (const f of flakes) {
            f.x += f.dx;
            f.y += f.dy;
            f.dy += 0.12;
            f.o *= 0.97;
        }
    }
    function loop() {
        update(); draw();
        frame++;
        if (frame < 45) {
            requestAnimationFrame(loop);
        } else {
            canvas.remove();
        }
    }
    loop();
}
// --- Subtle CSS Snowfall ---
function createSnow() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (document.getElementById('snow-canvas')) return;
    const canvas = document.createElement('canvas');
    canvas.id = 'snow-canvas';
    document.body.appendChild(canvas);
    document.body.classList.add('snow-bg');
    let w = window.innerWidth, h = window.innerHeight;
    let ctx = canvas.getContext('2d');
    let flakes = Array.from({length: 18}, () => ({
        x: Math.random()*w,
        y: Math.random()*h,
        r: 1.5+Math.random()*2.5,
        d: 0.5+Math.random()*1.5,
        o: 0.15+Math.random()*0.25
    }));
    function resize() {
        w = window.innerWidth; h = window.innerHeight;
        canvas.width = w; canvas.height = h;
    }
    window.addEventListener('resize', resize);
    resize();
    function draw() {
        ctx.clearRect(0,0,w,h);
        for (const f of flakes) {
            ctx.globalAlpha = f.o;
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.r, 0, 2*Math.PI);
            ctx.fillStyle = '#fff';
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
    function update() {
        for (const f of flakes) {
            f.y += f.d;
            f.x += Math.sin(f.y/30)*0.5;
            if (f.y > h+5) { f.y = -5; f.x = Math.random()*w; }
        }
    }
    function loop() {
        update(); draw(); requestAnimationFrame(loop);
    }
    loop();
}
createSnow();
// --- Sort Buttons ---
let scoreboardSort = 'desc';
let boardSort = 'desc';
function renderScoreboard(scored, winnerId) {
    if (!scored || scored.length === 0) {
        scoreboardPanel.hidden = true;
        scoreboard.innerHTML = '';
        return;
    }
    const sorted = [...scored].sort((a, b) => scoreboardSort === 'desc' ? b.totalScore - a.totalScore : a.totalScore - b.totalScore);
    const maxScore = Math.max(...sorted.map(item => item.totalScore));
    scoreboard.innerHTML = sorted.map((item) => {
        const width = maxScore ? (item.totalScore / maxScore) * 100 : 0;
        const rowClass = item.id === winnerId ? 'score-row winner' : 'score-row';
        return `
            <div class="${rowClass}">
                <div class="score-name">
                    <span>${item.name}</span>
                    <span class="multiplier-badge">${item.multiplier}x</span>
                </div>
                <div class="score-bar">
                    <div class="score-fill" style="width: ${width}%;"></div>
                </div>
                <div class="score-value">${item.totalScore.toFixed(3)}</div>
            </div>
        `;
    }).join('');
    scoreboardPanel.hidden = false;
}

function addSortButtons() {
    // Scoreboard sort
    const panel = document.getElementById('scoreboard-panel');
    if (panel) {
        const btn = panel.querySelector('.sort-btn');
        if (btn) btn.remove();
    }
    // Prediction board sort
    const ths = document.querySelectorAll('.predictions-table th');
    ths.forEach((th, i) => {
        if (th.textContent === 'Score' && !th.querySelector('.sort-btn')) {
            const btn = document.createElement('button');
            btn.className = 'secondary sort-btn';
            btn.textContent = '⇅';
            btn.style.marginLeft = '0.5em';
            btn.onclick = (e) => {
                e.preventDefault();
                boardSort = boardSort === 'desc' ? 'asc' : 'desc';
                renderPredictions();
                // No animation here
            };
            th.appendChild(btn);
        }
    });
}
// --- Enhance Date Range Preset Sync ---
rangeSelect.addEventListener('change', () => {
    const isCustom = rangeSelect.value === 'custom';
    customRange.hidden = !isCustom;
    rangeStartInput.required = isCustom;
    rangeEndInput.required = isCustom;
    if (!isCustom) {
        const today = getLocalDateString();
        const hours = parseInt(rangeSelect.value, 10);
        const days = Math.max(1, Math.round(hours / 24));
        rangeEndInput.value = today;
        rangeStartInput.value = getLocalDateString(addDays(new Date(), -(days - 1)));
    }
});
// --- Calendar Picker Buttons for Date Inputs ---
document.querySelectorAll('.date-button').forEach((button) => {
    button.addEventListener('click', () => {
        const targetId = button.getAttribute('data-target');
        const input = document.getElementById(targetId);
        if (!input) return;
        if (typeof input.showPicker === 'function') {
            input.showPicker();
        } else {
            input.focus();
        }
    });
});
// --- Add CSV Export and Sort Buttons on DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', () => {
    addSortButtons();
    // Add Export CSV button
    const predPanel = document.querySelector('.panel.full .panel-header');
    if (predPanel && !document.getElementById('export-csv-btn')) {
        const btn = document.createElement('button');
        btn.className = 'secondary';
        btn.id = 'export-csv-btn';
        btn.textContent = 'Export CSV';
        btn.onclick = exportPredictionsCSV;
        predPanel.appendChild(btn);
    }
});
// --- Share Modal: Use is.gd and CreepyLink suggestion ---
shareButton.addEventListener('click', async () => {
    const predictions = loadPredictions();
    const results = loadResults();
    if (!predictions.length || !results) {
        resultsError.textContent = 'Compute scores before sharing.';
        resultsError.hidden = false;
        return;
    }
    const data = {
        v: 1,
        predictions,
        results,
        lastName: localStorage.getItem(LAST_NAME_KEY)
    };
    const encoded = encodeShareData(data);
    // Use location.href up to ? for correct sharing
    const base = window.location.origin + window.location.pathname;
    const url = `${base}?share=${encoded}`;
    const shortUrl = await shortenUrl(url);
    openShareModal(shortUrl);
    // Add CreepyLink suggestion
    if (!document.getElementById('creepylink-tip')) {
        const tip = document.createElement('div');
        tip.id = 'creepylink-tip';
        tip.style.fontSize = '0.9em';
        tip.style.color = 'var(--text-dim)';
        tip.style.marginTop = '0.5em';
        tip.innerHTML = 'Or use <a href="https://creepylink.com/" target="_blank" rel="noopener">CreepyLink.com</a> for a spooky link!';
        shareUrlInput.parentNode.appendChild(tip);
    }
});

function sumDailySnowfall(daily, startDate, endDate) {
    if (!daily || !daily.time || !daily.snowfall_sum) {
        throw new Error('Snowfall data unavailable for that range.');
    }
    let total = 0;
    daily.time.forEach((day, index) => {
        if (compareDateStrings(day, startDate) >= 0 && compareDateStrings(day, endDate) <= 0) {
            total += Number(daily.snowfall_sum[index] || 0);
        }
    });
    return total;
}

async function fetchForecastSnowfall(lat, lon, startDate, endDate) {
    const today = getLocalDateString();
    const pastDays = Math.max(0, dateDiffSigned(today, startDate));
    const forecastDays = Math.max(1, dateDiffSigned(endDate, today) + 1);
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=snowfall_sum&past_days=${pastDays}&forecast_days=${forecastDays}&timezone=auto`;
    const data = await fetchJson(url);
    return sumDailySnowfall(data.daily, startDate, endDate);
}

async function fetchHistoricalSnowfall(lat, lon, startDate, endDate) {
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startDate}&end_date=${endDate}&daily=snowfall_sum&timezone=auto`;
    const data = await fetchJson(url);
    return sumDailySnowfall(data.daily, startDate, endDate);
}

async function fetchSnowfallRange(lat, lon, startDate, endDate) {
    if (compareDateStrings(startDate, endDate) > 0) {
        throw new Error('Start date must be before end date.');
    }

    const today = getLocalDateString();
    const maxForecastDate = addDaysString(today, 16);
    if (compareDateStrings(endDate, maxForecastDate) > 0) {
        throw new Error('Forecast data is only available up to 16 days ahead.');
    }

    const forecastStart = addDaysString(today, -92);
    let total = 0;

    if (compareDateStrings(startDate, forecastStart) < 0) {
        const historicalEnd = compareDateStrings(endDate, forecastStart) < 0
            ? endDate
            : addDaysString(forecastStart, -1);
        total += await fetchHistoricalSnowfall(lat, lon, startDate, historicalEnd);
    }

    if (compareDateStrings(endDate, forecastStart) >= 0) {
        const forecastStartDate = compareDateStrings(startDate, forecastStart) < 0
            ? forecastStart
            : startDate;
        total += await fetchForecastSnowfall(lat, lon, forecastStartDate, endDate);
    }

    return total;
}

function renderScoreboard(scored, winnerId) {
    if (!scored || scored.length === 0) {
        scoreboardPanel.hidden = true;
        scoreboard.innerHTML = '';
        return;
    }

    const sorted = [...scored].sort((a, b) => b.totalScore - a.totalScore);
    const maxScore = Math.max(...sorted.map(item => item.totalScore));
    scoreboard.innerHTML = sorted.map((item) => {
        const width = maxScore ? (item.totalScore / maxScore) * 100 : 0;
        const rowClass = item.id === winnerId ? 'score-row winner' : 'score-row';
        return `
            <div class="${rowClass}">
                <div class="score-name">
                    <span>${item.name}</span>
                    <span class="multiplier-badge">${item.multiplier}x</span>
                </div>
                <div class="score-bar">
                    <div class="score-fill" style="width: ${width}%;"></div>
                </div>
                <div class="score-value">${item.totalScore.toFixed(3)}</div>
            </div>
        `;
    }).join('');
    scoreboardPanel.hidden = false;
}

function buildScoresText(scored, results) {
    if (!scored || !results) return '';
    const sorted = [...scored].sort((a, b) => b.totalScore - a.totalScore);
    const winner = sorted[0];
    const lines = [
        'Snow Way Results',
        `Actual snowfall: ${results.actualSnowfall.toFixed(1)} in`,
        `Actual return date: ${formatDate(results.actualReturnDate)}`,
        `Winner: ${winner.name} (${winner.totalScore.toFixed(3)} pts, ${winner.multiplier}x)`,
        '',
        'Scores:'
    ];
    sorted.forEach((item, index) => {
        lines.push(`${index + 1}. ${item.name} - ${item.totalScore.toFixed(3)} pts (${item.multiplier}x)`);
    });
    return lines.join('\n');
}

function encodeShareData(data) {
    return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
}

function decodeShareData(encoded) {
    return JSON.parse(decodeURIComponent(escape(atob(encoded))));
}

function openShareModal(url) {
    shareUrlInput.value = url;
    shareModal.classList.remove('hidden');
    shareModal.setAttribute('aria-hidden', 'false');
}

function closeShareModal() {
    shareModal.classList.add('hidden');
    shareModal.setAttribute('aria-hidden', 'true');
}

function renderPredictions() {
    let predictions = loadPredictions();
    // Sort for Prediction Board
    const results = loadResults();
    const scored = calculateScores(predictions, results);
    if (scored && boardSort) {
        predictions = [...scored].sort((a, b) => boardSort === 'desc' ? b.totalScore - a.totalScore : a.totalScore - b.totalScore);
    } else {
        predictions = predictions.sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));
    }
    // ...existing code...
    const lastName = localStorage.getItem(LAST_NAME_KEY);
    const highlightName = lastName ? normalizeName(lastName) : null;

    updateSlots(predictions);

    if (predictions.length === 0) {
        predictionsBody.innerHTML = '<tr><td colspan="7" class="empty-state">No predictions yet. Claim the first slot for max points!</td></tr>';
        resultsSummary.hidden = true;
        resultsActions.hidden = true;
        renderScoreboard(null, null);
        return;
    }

    let winnerId = null;
    if (scored) {
        const sortedByScore = [...scored].sort((a, b) => {
            if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
            return new Date(a.submittedAt) - new Date(b.submittedAt);
        });
        winnerId = sortedByScore[0]?.id ?? null;
    }

    predictionsBody.innerHTML = predictions.map((prediction, index) => {
        const scoreRow = scored?.find(item => item.id === prediction.id);
        const totalScore = scoreRow ? scoreRow.totalScore.toFixed(3) : '—';
        const isWinner = winnerId && prediction.id === winnerId;
        const isHighlight = highlightName && normalizeName(prediction.name) === highlightName;
        const rowClass = isWinner ? 'winner' : (isHighlight ? 'highlight' : '');

        return `
            <tr class="${rowClass}">
                <td>${index + 1}</td>
                <td>${prediction.name}</td>
                <td>${prediction.snowfall.toFixed(1)} in</td>
                <td>${formatDate(prediction.returnDate)}</td>
                <td>${prediction.multiplier}x</td>
                <td>${formatDateTime(prediction.submittedAt)}</td>
                <td>${totalScore}</td>
            </tr>
        `;
    }).join('');

    if (scored) {
        const winner = scored.sort((a, b) => {
            if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
            return new Date(a.submittedAt) - new Date(b.submittedAt);
        })[0];
        resultsSummary.hidden = false;
        winnerName.textContent = winner.name;
        winnerDetails.textContent = `${winner.totalScore.toFixed(3)} pts • ${winner.multiplier}x multiplier`;
        resultsActions.hidden = false;
        renderScoreboard(scored, winner.id);
        showConfetti();
    } else {
        resultsSummary.hidden = true;
        resultsActions.hidden = true;
        renderScoreboard(null, null);
    }
}

function clearMessages() {
    formError.hidden = true;
    resultsError.hidden = true;
}

function clearLookupMessages() {
    lookupError.hidden = true;
    lookupWarning.hidden = true;
}

predictionForm.addEventListener('submit', (event) => {
    event.preventDefault();
    clearMessages();

    const predictions = loadPredictions();

    const name = nameInput.value.trim();
    const snowfall = parseFloat(snowfallInput.value);
    const returnDate = returnDateInput.value;
    const submissionDate = submissionDateInput.value || getLocalDateString();
    const deadlineDate = loadDeadline() || deadlineDateInput.value;

    if (!deadlineDate) {
        formError.textContent = 'Please set a deadline date first.';
        formError.hidden = false;
        return;
    }

    if (!name || !Number.isFinite(snowfall) || !returnDate || !submissionDate || !deadlineDate) {
        formError.textContent = 'Please complete all fields.';
        formError.hidden = false;
        return;
    }

    const normalized = normalizeName(name);
    const alreadySubmitted = predictions.some(entry => normalizeName(entry.name) === normalized);
    if (alreadySubmitted) {
        formError.textContent = 'That name already has a locked prediction.';
        formError.hidden = false;
        return;
    }

    const prediction = {
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name,
        snowfall,
        returnDate,
        multiplier: getMultiplier(submissionDate, deadlineDate),
        submittedAt: toLocalDate(submissionDate).toISOString()
    };

    predictions.push(prediction);
    if (!loadDeadline()) {
        saveDeadline(deadlineDate);
    }
    savePredictions(predictions);
    localStorage.setItem(LAST_NAME_KEY, name);

    lockedMessage.textContent = `Your prediction is locked, ${name}!`;
    lockedMessage.hidden = false;

    const persistedDeadline = loadDeadline();
    predictionForm.reset();
    deadlineDateInput.value = persistedDeadline;
    syncDeadlineState();
    renderPredictions();
    updateMultiplierDisplay();
    showSnowBurst(); // Only snow burst, not confetti
});

resultsForm.addEventListener('submit', (event) => {
    event.preventDefault();
    resultsError.hidden = true;

    const predictions = loadPredictions();
    if (predictions.length === 0) {
        resultsError.textContent = 'No predictions to score yet.';
        resultsError.hidden = false;
        return;
    }

    const actualSnowfall = parseFloat(actualSnowfallInput.value);
    const actualReturnDate = actualReturnInput.value;

    if (!Number.isFinite(actualSnowfall) || !actualReturnDate) {
        resultsError.textContent = 'Enter both actual snowfall and return date.';
        resultsError.hidden = false;
        return;
    }

    saveResults({
        actualSnowfall,
        actualReturnDate
    });

    renderPredictions();
});

lookupForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearLookupMessages();
    lookupResult.hidden = true;

    const location = locationInput.value.trim();
    if (!location) {
        lookupError.textContent = 'Enter a city and state to look up snowfall.';
        lookupError.hidden = false;
        return;
    }

    const { startDate, endDate, label } = getSelectedRange();
    if (!startDate || !endDate) {
        lookupError.textContent = 'Select a valid date range.';
        lookupError.hidden = false;
        return;
    }

    updateLookupWarning(endDate);

    const cache = loadLookupCache();
    const cacheKey = `${normalizeLocation(location)}|${startDate}|${endDate}`;
    const cached = cache[cacheKey];

    lookupButton.disabled = true;
    lookupButton.textContent = 'Looking up...';

    try {
        let inches = cached?.inches;
        let displayLocation = cached?.displayLocation;

        if (!Number.isFinite(inches)) {
            const geo = await geocodeLocation(location);
            const totalCm = await fetchSnowfallRange(geo.latitude, geo.longitude, startDate, endDate);
            inches = totalCm * 0.393700787;
            displayLocation = geo.admin1 ? `${geo.name}, ${geo.admin1}` : geo.name;

            cache[cacheKey] = {
                inches,
                displayLocation,
                fetchedAt: new Date().toISOString()
            };
            saveLookupCache(cache);
        }

        lookupValue.textContent = `${inches.toFixed(2)} in`;
        lookupRange.textContent = `${displayLocation} • ${label}`;
        lookupResult.hidden = false;
        lookupResult.dataset.inches = inches.toFixed(2);
        localStorage.setItem(LOCATION_KEY, location);
    } catch (error) {
        lookupError.textContent = error.message || 'Unable to retrieve snowfall data.';
        lookupError.hidden = false;
    } finally {
        lookupButton.disabled = false;
        lookupButton.textContent = 'Lookup Snowfall';
    }
});

useLookupButton.addEventListener('click', () => {
    const inches = Number.parseFloat(lookupResult.dataset.inches || '');
    if (!Number.isFinite(inches)) return;
    actualSnowfallInput.value = inches.toFixed(1);
    resultsError.hidden = true;
});

rangeSelect.addEventListener('change', () => {
    const isCustom = rangeSelect.value === 'custom';
    customRange.hidden = !isCustom;
    rangeStartInput.required = isCustom;
    rangeEndInput.required = isCustom;
});

copyScoresButton.addEventListener('click', async () => {
    const predictions = loadPredictions();
    const results = loadResults();
    const scored = calculateScores(predictions, results);
    if (!scored || scored.length === 0) {
        resultsError.textContent = 'Compute scores before copying.';
        resultsError.hidden = false;
        return;
    }
    const text = buildScoresText(scored, results);
    try {
        await navigator.clipboard.writeText(text);
        const original = copyScoresButton.textContent;
        copyScoresButton.textContent = 'Copied!';
        setTimeout(() => {
            copyScoresButton.textContent = original;
        }, 1500);
    } catch (error) {
        resultsError.textContent = 'Unable to copy scores. Try again.';
        resultsError.hidden = false;
    }
});

shareButton.addEventListener('click', () => {
    const predictions = loadPredictions();
    const results = loadResults();
    if (!predictions.length || !results) {
        resultsError.textContent = 'Compute scores before sharing.';
        resultsError.hidden = false;
        return;
    }

    const data = {
        v: 1,
        predictions,
        results,
        lastName: localStorage.getItem(LAST_NAME_KEY)
    };
    const encoded = encodeShareData(data);
    const url = `${window.location.origin}${window.location.pathname}?share=${encoded}`;
    openShareModal(url);
});

shareCopyButton.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(shareUrlInput.value);
        const original = shareCopyButton.textContent;
        shareCopyButton.textContent = 'Copied!';
        setTimeout(() => {
            shareCopyButton.textContent = original;
        }, 1500);
    } catch (error) {
        resultsError.textContent = 'Unable to copy the share link.';
        resultsError.hidden = false;
    }
});

shareCloseButton.addEventListener('click', closeShareModal);
shareModal.addEventListener('click', (event) => {
    if (event.target === shareModal) {
        closeShareModal();
    }
});

[nameInput, snowfallInput, returnDateInput, submissionDateInput, deadlineDateInput].forEach((input) => {
    input.addEventListener('input', () => {
        formError.hidden = true;
        lockedMessage.hidden = true;
    });
});

resetButton.addEventListener('click', () => {
    if (!confirm('Reset all predictions and results? This cannot be undone.')) {
        return;
    }
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(RESULTS_KEY);
    localStorage.removeItem(LAST_NAME_KEY);
    localStorage.removeItem(DEADLINE_KEY);
    predictionForm.reset();
    resultsForm.reset();
    resultsSummary.hidden = true;
    lockedMessage.hidden = true;
    syncDeadlineState();
    updateMultiplierDisplay();
    renderPredictions();
});

document.querySelectorAll('.date-button').forEach((button) => {
    button.addEventListener('click', () => {
        const targetId = button.getAttribute('data-target');
        const input = document.getElementById(targetId);
        if (!input) return;
        if (typeof input.showPicker === 'function') {
            input.showPicker();
        } else {
            input.focus();
        }
    });
});

submissionDateInput.value = getLocalDateString();
syncDeadlineState();
updateMultiplierDisplay();
submissionDateInput.addEventListener('change', updateMultiplierDisplay);
deadlineDateInput.addEventListener('change', () => {
    if (deadlineDateInput.disabled) return;
    saveDeadline(deadlineDateInput.value);
    updateMultiplierDisplay();
});
customRange.hidden = true;
rangeSelect.dispatchEvent(new Event('change'));
rangeStartInput.value = getLocalDateString(addDays(new Date(), -2));
rangeEndInput.value = getLocalDateString();
locationInput.value = localStorage.getItem(LOCATION_KEY) || 'Hampton';
populateResultsForm();
renderPredictions();

function loadSharedResults() {
    const params = new URLSearchParams(window.location.search);
    const shareData = params.get('share');
    if (!shareData) return;
    try {
        const data = decodeShareData(shareData);
        if (Array.isArray(data.predictions)) {
            savePredictions(data.predictions);
        }
        if (data.results) {
            saveResults(data.results);
        }
        if (data.lastName) {
            localStorage.setItem(LAST_NAME_KEY, data.lastName);
        }
        populateResultsForm();
        renderPredictions();
    } catch (error) {
        return;
    }
}

loadSharedResults();
syncDeadlineState();
updateMultiplierDisplay();

const lookupAttribution = document.querySelector('.lookup-attribution');
if (lookupAttribution) {
    lookupAttribution.innerHTML = 'Snowfall data from <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo.com</a>';
}
