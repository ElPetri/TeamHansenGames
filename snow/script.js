const MAX_ENTRIES = 10;
const STORAGE_KEY = 'snowWay_predictions';
const RESULTS_KEY = 'snowWay_results';
const LAST_NAME_KEY = 'snowWay_lastName';

const predictionForm = document.getElementById('prediction-form');
const resultsForm = document.getElementById('results-form');
const formError = document.getElementById('form-error');
const lockedMessage = document.getElementById('locked-message');
const slotsRemaining = document.getElementById('slots-remaining');
const multiplierDisplay = document.getElementById('current-multiplier');
const predictionsBody = document.getElementById('predictions-body');
const resultsError = document.getElementById('results-error');
const resultsSummary = document.getElementById('results-summary');
const winnerName = document.getElementById('winner-name');
const winnerDetails = document.getElementById('winner-details');
const resetButton = document.getElementById('reset-button');

const nameInput = document.getElementById('name');
const snowfallInput = document.getElementById('snowfall');
const returnDateInput = document.getElementById('return-date');
const submissionDateInput = document.getElementById('submission-date');
const actualSnowfallInput = document.getElementById('actual-snowfall');
const actualReturnInput = document.getElementById('actual-return');

function getLocalDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getMultiplier(date = new Date()) {
    const key = getLocalDateString(date);
    if (key === '2026-01-28') return 3;
    if (key === '2026-01-29') return 2;
    if (key === '2026-01-30') return 1;
    if (key < '2026-01-28') return 3;
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
    const multiplier = getMultiplier(toLocalDate(submittedDate));
    multiplierDisplay.textContent = `${multiplier}x`;
}

function populateResultsForm() {
    const results = loadResults();
    if (!results) return;
    actualSnowfallInput.value = results.actualSnowfall;
    actualReturnInput.value = results.actualReturnDate;
}

function updateSlots(predictions) {
    const remaining = MAX_ENTRIES - predictions.length;
    slotsRemaining.textContent = `Slots remaining: ${remaining}`;
    slotsRemaining.style.color = remaining === 0 ? 'var(--warning)' : 'var(--success)';
    predictionForm.querySelector('button').disabled = remaining === 0;
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

function renderPredictions() {
    const predictions = loadPredictions().sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));
    const results = loadResults();
    const scored = calculateScores(predictions, results);
    const lastName = localStorage.getItem(LAST_NAME_KEY);
    const highlightName = lastName ? normalizeName(lastName) : null;

    updateSlots(predictions);

    if (predictions.length === 0) {
        predictionsBody.innerHTML = '<tr><td colspan="7" class="empty-state">No predictions yet. Claim the first slot for max points!</td></tr>';
        resultsSummary.hidden = true;
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
    } else {
        resultsSummary.hidden = true;
    }
}

function clearMessages() {
    formError.hidden = true;
    resultsError.hidden = true;
}

predictionForm.addEventListener('submit', (event) => {
    event.preventDefault();
    clearMessages();

    const predictions = loadPredictions();
    if (predictions.length >= MAX_ENTRIES) {
        formError.textContent = 'All 10 prediction slots are filled.';
        formError.hidden = false;
        return;
    }

    const name = nameInput.value.trim();
    const snowfall = parseFloat(snowfallInput.value);
    const returnDate = returnDateInput.value;
    const submissionDate = submissionDateInput.value || getLocalDateString();

    if (!name || !Number.isFinite(snowfall) || !returnDate || !submissionDate) {
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
        multiplier: getMultiplier(toLocalDate(submissionDate)),
        submittedAt: toLocalDate(submissionDate).toISOString()
    };

    predictions.push(prediction);
    savePredictions(predictions);
    localStorage.setItem(LAST_NAME_KEY, name);

    lockedMessage.textContent = `Your prediction is locked, ${name}!`;
    lockedMessage.hidden = false;

    predictionForm.reset();
    renderPredictions();
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

[nameInput, snowfallInput, returnDateInput, submissionDateInput].forEach((input) => {
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
    predictionForm.reset();
    resultsForm.reset();
    resultsSummary.hidden = true;
    lockedMessage.hidden = true;
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
updateMultiplierDisplay();
submissionDateInput.addEventListener('change', updateMultiplierDisplay);
populateResultsForm();
renderPredictions();
