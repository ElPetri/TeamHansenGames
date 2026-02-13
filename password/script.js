const passwordInput = document.getElementById('password-input');
const toggleVisibility = document.getElementById('toggle-visibility');
const meterFill = document.getElementById('meter-fill');
const strengthLabel = document.getElementById('strength-label');
const entropyLabel = document.getElementById('entropy-label');
const criteriaList = document.getElementById('criteria-list');
const crackTime = document.getElementById('crack-time');
const crackDetail = document.getElementById('crack-detail');
const dictAttack = document.getElementById('dict-attack');
const warningsEl = document.getElementById('warnings');
const attackSelect = document.getElementById('attack-speed');
const hashTypeSelect = document.getElementById('hash-type');
const breachBtn = document.getElementById('breach-btn');
const breachResult = document.getElementById('breach-result');
const sparkline = document.getElementById('sparkline');
const sparklineCtx = sparkline.getContext('2d');
const entropyToggle = document.getElementById('entropy-toggle');
const entropyInfo = document.getElementById('entropy-info');

const criteria = [
    { id: 'length', label: '12+ characters', test: (value) => value.length >= 12 },
    { id: 'lower', label: 'Lowercase letters', test: (value) => /[a-z]/.test(value) },
    { id: 'upper', label: 'Uppercase letters', test: (value) => /[A-Z]/.test(value) },
    { id: 'number', label: 'Numbers', test: (value) => /\d/.test(value) },
    { id: 'symbol', label: 'Symbols', test: (value) => /[^A-Za-z0-9]/.test(value) }
];

const attackDescriptions = {
    10000000: 'Offline (CPU) at 10M guesses/sec.',
    10000000000: 'Offline (1 GPU) at 10B guesses/sec.',
    20000000000: 'Offline (2 GPUs) at 20B guesses/sec.',
    40000000000: 'Offline (4 GPUs) at 40B guesses/sec.',
    100000000000: 'Offline (10 GPUs) at 100B guesses/sec.'
};

const hashProfiles = {
    fast: { multiplier: 1, label: 'Fast hash (MD5/SHA-1)' },
    sha256: { multiplier: 0.3, label: 'SHA-256' },
    bcrypt: { multiplier: 0.00001, label: 'bcrypt (cost 10)' },
    argon2: { multiplier: 0.000005, label: 'Argon2 (moderate params)' }
};

const PUBLIC_WORDLIST_SIZE = 50000000;

let strengthHistory = [];
let breachState = {
    checked: false,
    compromised: false,
    count: 0
};

function initCriteria() {
    criteriaList.innerHTML = '';
    criteria.forEach((criterion) => {
        const item = document.createElement('div');
        item.className = 'pw-criterion';
        item.dataset.id = criterion.id;
        item.textContent = criterion.label;
        criteriaList.appendChild(item);
    });
}

function updateCriteria(value) {
    criteria.forEach((criterion) => {
        const item = criteriaList.querySelector(`[data-id="${criterion.id}"]`);
        const active = criterion.test(value);
        item.classList.toggle('active', active);
    });
}

function calculatePoolSize(value) {
    let pool = 0;
    if (/[a-z]/.test(value)) pool += 26;
    if (/[A-Z]/.test(value)) pool += 26;
    if (/\d/.test(value)) pool += 10;
    if (/[^A-Za-z0-9]/.test(value)) pool += 33;
    if (/[^\x00-\x7F]/.test(value)) pool += 50;
    return pool || 0;
}

function calculateEntropy(value) {
    const pool = calculatePoolSize(value);
    if (!pool || !value.length) return 0;
    return Math.log2(pool) * value.length;
}

function scoreFromEntropy(entropy) {
    const score = Math.min(100, (entropy / 80) * 100);
    return Math.round(score);
}

function strengthLabelFromScore(score) {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Strong';
    if (score >= 55) return 'Good';
    if (score >= 35) return 'Fair';
    if (score > 0) return 'Weak';
    return '—';
}

function formatEntropy(entropy) {
    if (entropy >= 200) return '200+ bits';
    return `${Math.round(entropy)} bits`;
}

function formatDurationFromLog10(log10Seconds) {
    if (log10Seconds <= 0) return 'Instant';
    const log10Year = Math.log10(31536000);
    if (log10Seconds >= log10Year + 12) return 'Trillions of years';
    if (log10Seconds >= log10Year + 9) return 'Billions of years';
    if (log10Seconds >= log10Year + 6) return 'Millions of years';

    const units = [
        { label: 'second', value: 1 },
        { label: 'minute', value: 60 },
        { label: 'hour', value: 3600 },
        { label: 'day', value: 86400 },
        { label: 'week', value: 604800 },
        { label: 'month', value: 2628000 },
        { label: 'year', value: 31536000 },
        { label: 'century', value: 3153600000 }
    ];
    let unit = units[0];
    for (let i = units.length - 1; i >= 0; i -= 1) {
        if (log10Seconds >= Math.log10(units[i].value)) {
            unit = units[i];
            break;
        }
    }
    const amount = Math.pow(10, log10Seconds - Math.log10(unit.value));
    const rounded = amount >= 100 ? Math.round(amount) : Math.round(amount * 10) / 10;
    return `${rounded.toLocaleString()} ${unit.label}${rounded !== 1 ? 's' : ''}`;
}

function estimateCrackTime(value) {
    if (!value.length) return { label: 'Instant', seconds: 0 };
    const pool = calculatePoolSize(value);
    if (!pool) return { label: 'Instant', seconds: 0 };
    const log10Guesses = value.length * Math.log10(pool);
    const speed = getEffectiveSpeed();
    const log10Seconds = log10Guesses - Math.log10(speed);
    if (log10Seconds <= 0) {
        return { label: 'Instant', seconds: 0 };
    }
    return { label: formatDurationFromLog10(log10Seconds), seconds: log10Seconds };
}

function formatDurationFromSeconds(seconds) {
    if (seconds <= 1) return 'Instant';
    return formatDurationFromLog10(Math.log10(seconds));
}

function formatSpeed(value) {
    if (value >= 1e9) return `${(value / 1e9).toFixed(value >= 1e10 ? 0 : 1)}B guesses/sec`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(value >= 1e7 ? 0 : 1)}M guesses/sec`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(value >= 1e4 ? 0 : 1)}K guesses/sec`;
    return `${Math.max(1, Math.round(value)).toLocaleString()} guesses/sec`;
}

function getEffectiveSpeed() {
    const base = Number(attackSelect.value);
    const profile = hashProfiles[hashTypeSelect.value] || hashProfiles.fast;
    return Math.max(1, base * profile.multiplier);
}

function normalizeLeet(value) {
    return value
        .toLowerCase()
        .replace(/[@4]/g, 'a')
        .replace(/3/g, 'e')
        .replace(/[1!]/g, 'i')
        .replace(/0/g, 'o')
        .replace(/[5$]/g, 's')
        .replace(/7/g, 't');
}

function detectRuleBasedPattern(value) {
    if (!value) return null;

    if (/^[A-Z]?[a-z]{4,}$/.test(value)) {
        return {
            message: 'Word-only pattern detected. Attackers use huge public wordlists before brute-force.',
            ruleSpace: 300
        };
    }

    if (/^[A-Z]?[a-z]{4,}\d{1,4}$/.test(value)) {
        return {
            message: 'Word + digits pattern detected. This is a top rule-based attack target.',
            ruleSpace: 2000
        };
    }

    if (/^[A-Z]?[a-z]{4,}(19\d{2}|20\d{2})[!@#$%^&*._-]{0,2}$/.test(value)) {
        return {
            message: 'Word + year pattern detected. Attack tools prioritize years and seasons.',
            ruleSpace: 2500
        };
    }

    if (/^[A-Z]?[a-z]{4,}\d{1,4}[!@#$%^&*._-]{1,2}$/.test(value) || /^[!@#$%^&*._-]{1,2}[A-Z]?[a-z]{4,}\d{1,4}$/.test(value)) {
        return {
            message: 'Word + digits + symbol pattern detected. Hydra/Hashcat rules try these quickly.',
            ruleSpace: 5000
        };
    }

    const leet = normalizeLeet(value);
    if (leet !== value.toLowerCase() && /^[a-z]{4,}\d{0,4}[!@#$%^&*._-]{0,2}$/.test(leet)) {
        return {
            message: 'Leet-style word pattern detected. Rule engines test these substitutions automatically.',
            ruleSpace: 7000
        };
    }

    return null;
}

function estimateRuleBasedTime(value) {
    const pattern = detectRuleBasedPattern(value);
    if (!pattern) return null;
    const speed = getEffectiveSpeed();
    const guesses = PUBLIC_WORDLIST_SIZE * pattern.ruleSpace;
    return {
        ...pattern,
        seconds: guesses / speed
    };
}

function getWarnings(value) {
    const warnings = [];
    const lower = value.toLowerCase();

    if (value.length > 0 && /^\d+$/.test(value)) {
        warnings.push('Only numbers detected.');
    }

    if (/(.)\1\1/.test(value)) {
        warnings.push('Repeated characters reduce strength.');
    }

    if (/(0123|1234|2345|3456|4567|5678|6789|7890)/.test(value)) {
        warnings.push('Sequential numbers detected.');
    }

    if (/(abcd|bcde|cdef|defg|efgh|fghi|ghij|hijk|ijkl|jklm|klmn|lmno|mnop|nopq|opqr|pqrs|qrst|rstu|stuv|tuvw|uvwx|vwxy|wxyz)/.test(lower)) {
        warnings.push('Sequential letters detected.');
    }

    const keyboardPatterns = ['qwerty', 'asdfgh', 'zxcvbn', 'qazwsx', '1qaz2wsx', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm', '147258', '159753'];
    if (keyboardPatterns.some((pattern) => lower.includes(pattern))) {
        warnings.push('Keyboard pattern detected.');
    }

    if (window.PASSWORD_WORDLIST) {
        const match = window.PASSWORD_WORDLIST.find((word) => word.length >= 4 && lower.includes(word));
        if (match) warnings.push(`Common password pattern: "${match}".`);
    }

    if (/\b(19\d{2}|20\d{2})\b/.test(value)) {
        warnings.push('Year pattern detected.');
    }

    if (/[^\x00-\x7F]/.test(value)) {
        warnings.push('Emoji/unicode detected: extra entropy, but some systems may reject it.');
    }

        const rulePattern = detectRuleBasedPattern(value);
        if (rulePattern) {
            warnings.push(rulePattern.message);
        }

    return warnings;
}

function getDictionaryMatch(value) {
    const lower = value.toLowerCase();
    if (!window.PASSWORD_WORDLIST || !lower) return null;
    return window.PASSWORD_WORDLIST.find((word) => word.length >= 4 && lower.includes(word)) || null;
}

function isSimpleMangling(value, match) {
    const lower = value.toLowerCase();
    const index = lower.indexOf(match);
    if (index === -1) return false;
    const prefix = value.slice(0, index);
    const suffix = value.slice(index + match.length);
    const onlySimple = (text) => text.length <= 3 && /^[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]+$/.test(text);
    const onlyDigits = (text) => text.length <= 4 && /^\d+$/.test(text);
    const simpleCase = value.slice(index, index + match.length).toLowerCase() === match;

    return simpleCase && (onlySimple(prefix) || prefix.length === 0) && (onlySimple(suffix) || onlyDigits(suffix) || suffix.length === 0);
}

function drawSparkline() {
    const width = sparkline.clientWidth;
    const height = sparkline.clientHeight;
    sparklineCtx.clearRect(0, 0, width, height);
    if (strengthHistory.length < 2) return;

    sparklineCtx.strokeStyle = 'rgba(0, 240, 255, 0.8)';
    sparklineCtx.lineWidth = 2;
    sparklineCtx.beginPath();

    strengthHistory.forEach((value, index) => {
        const x = (index / (strengthHistory.length - 1)) * width;
        const y = height - (value / 100) * height;
        if (index === 0) sparklineCtx.moveTo(x, y);
        else sparklineCtx.lineTo(x, y);
    });

    sparklineCtx.stroke();
}

function resizeSparkline() {
    const rect = sparkline.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    sparkline.width = rect.width * dpr;
    sparkline.height = rect.height * dpr;
    sparklineCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawSparkline();
}

function updateUI() {
    const value = passwordInput.value;
    const entropy = calculateEntropy(value);
    const score = scoreFromEntropy(entropy);
    const profile = hashProfiles[hashTypeSelect.value] || hashProfiles.fast;
    const speed = getEffectiveSpeed();

    meterFill.style.width = `${score}%`;
    strengthLabel.textContent = `Entropy Strength: ${strengthLabelFromScore(score)}`;
    entropyLabel.textContent = `Entropy: ${formatEntropy(entropy)}`;
    meterFill.parentElement.classList.remove('compromised');

    updateCriteria(value);

    const crackEstimate = estimateCrackTime(value);
    const dictMatch = getDictionaryMatch(value);
    const dictSize = window.PASSWORD_WORDLIST ? window.PASSWORD_WORDLIST.length : 1000;
    const baseDictSeconds = dictSize / speed;
    const ruleMultiplier = dictMatch && isSimpleMangling(value, dictMatch) ? 2000 : 200;
    const dictSeconds = baseDictSeconds * (dictMatch ? ruleMultiplier : 1);
    const ruleBasedEstimate = estimateRuleBasedTime(value);

    if (dictMatch || ruleBasedEstimate) {
        const dictLikeSeconds = dictMatch ? dictSeconds : Infinity;
        const ruleSeconds = ruleBasedEstimate ? ruleBasedEstimate.seconds : Infinity;
        const likelySeconds = Math.min(dictLikeSeconds, ruleSeconds);
        const likelyLabel = formatDurationFromSeconds(likelySeconds);
        const bruteLabel = crackEstimate.label;
        crackTime.textContent = `Likely: ${likelyLabel}`;
        crackDetail.textContent = `Brute-force: ${bruteLabel} · Rule-based likely: ${likelyLabel}`;
    } else {
        crackTime.textContent = crackEstimate.label;
        crackDetail.textContent = `${attackDescriptions[attackSelect.value]} · ${profile.label} at ${formatSpeed(speed)}.`;
    }

    if (!value.length) {
        dictAttack.textContent = 'Dictionary attack: Instant';
    } else if (dictMatch) {
        dictAttack.textContent = `Dictionary+rules: ~${formatDurationFromSeconds(Math.max(dictSeconds, 1e-9))} (matched “${dictMatch}”)`;
    } else if (ruleBasedEstimate) {
        dictAttack.textContent = `Rule-based attack: ~${formatDurationFromSeconds(Math.max(ruleBasedEstimate.seconds, 1e-9))}. Attackers use public lists + mangling rules.`;
    } else {
        dictAttack.textContent = 'No strong wordlist pattern detected. Still assume attackers try leaked lists first.';
    }

    if (breachState.compromised && value.length) {
        meterFill.style.width = '100%';
        meterFill.parentElement.classList.add('compromised');
        strengthLabel.textContent = 'Entropy Strength: Compromised';
        crackTime.textContent = 'Instant (Leaked Password)';
        crackDetail.textContent = `Found in ${breachState.count.toLocaleString()} breaches. Attackers test leaked lists first.`;
        dictAttack.textContent = 'Known leaked password: treat as immediately guessable.';
    }

    const warnings = getWarnings(value);
    warningsEl.innerHTML = '';
    if (warnings.length === 0) {
        warningsEl.innerHTML = '<div class="pw-muted">No warnings yet.</div>';
    } else {
        warnings.forEach((warning) => {
            const item = document.createElement('div');
            item.className = 'pw-warning';
            item.textContent = warning;
            warningsEl.appendChild(item);
        });
    }

    if (!value.length) {
        strengthHistory = [];
        drawSparkline();
        return;
    }

    strengthHistory.push(score);
    if (strengthHistory.length > 25) strengthHistory.shift();
    drawSparkline();
}

async function sha1(message) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

async function checkBreach() {
    const value = passwordInput.value;
    if (!value) {
        breachResult.textContent = 'Enter a password to check.';
        return;
    }
    breachResult.textContent = 'Checking...';
    const hash = await sha1(value);
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    try {
        const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
        if (!response.ok) throw new Error('Network');
        const text = await response.text();
        const lines = text.split('\n');
        const match = lines.find((line) => line.startsWith(suffix));
        if (match) {
            const count = Number(match.split(':')[1]?.trim() || '0');
            breachState = {
                checked: true,
                compromised: true,
                count
            };
            breachResult.innerHTML = `⚠️ Found in ${count.toLocaleString()} breaches. <a href="https://haveibeenpwned.com/Passwords" target="_blank" rel="noopener">Learn more</a>`;
            breachResult.classList.add('compromised');
        } else {
            breachState = {
                checked: true,
                compromised: false,
                count: 0
            };
            breachResult.textContent = '✅ Not found in known breaches.';
            breachResult.classList.remove('compromised');
        }
    } catch (err) {
        breachState = {
            checked: false,
            compromised: false,
            count: 0
        };
        breachResult.textContent = 'Could not reach breach service. Try again later.';
        breachResult.classList.remove('compromised');
    }

    updateUI();
}

passwordInput.addEventListener('input', () => {
    breachState = {
        checked: false,
        compromised: false,
        count: 0
    };
    breachResult.textContent = 'Not checked.';
    breachResult.classList.remove('compromised');
    updateUI();
});

attackSelect.addEventListener('change', () => {
    updateUI();
});

hashTypeSelect.addEventListener('change', () => {
    updateUI();
});

breachBtn.addEventListener('click', () => {
    checkBreach();
});

toggleVisibility.addEventListener('click', () => {
    const showing = passwordInput.type === 'text';
    passwordInput.type = showing ? 'password' : 'text';
    toggleVisibility.textContent = showing ? 'Show' : 'Hide';
});

entropyToggle.addEventListener('click', () => {
    entropyInfo.classList.toggle('show');
    entropyToggle.textContent = entropyInfo.classList.contains('show') ? 'Hide entropy info' : 'What is entropy?';
});

initCriteria();
updateUI();
resizeSparkline();

window.addEventListener('resize', () => {
    resizeSparkline();
});
