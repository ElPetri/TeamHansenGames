(function () {
    const API_PATH = '/api/scores';
    const PLAYER_NAME_KEY = 'leaderboard_playerName';
    const PERIOD_LABELS = {
        daily: 'Daily',
        weekly: 'Weekly',
        monthly: 'Monthly',
        alltime: 'All-Time'
    };

    const BLOCKED_TERMS = [
        'ass', 'asshole', 'bastard', 'bitch', 'bullshit', 'cock', 'coon', 'cuck', 'cum', 'cunt',
        'dam', 'dic', 'dick', 'dik', 'dildo', 'douche', 'fag', 'faggot', 'fck', 'fk', 'fuck',
        'fuk', 'hell', 'jerkoff', 'jiz', 'jizz', 'jyz', 'kike', 'klit', 'kum', 'kunt',
        'motherfucker', 'nazi', 'nigga', 'nigger', 'penis', 'piss', 'porn', 'prick', 'pus',
        'puss', 'pussy', 'retard', 'sex', 'shit', 'slut', 'sperm', 'spic', 'spurm', 'tit',
        'tits', 'twat', 'whore'
    ];

    const LEET_MAP = {
        '@': 'a',
        '4': 'a',
        '3': 'e',
        '1': 'i',
        '!': 'i',
        '0': 'o',
        '$': 's',
        '5': 's',
        '7': 't'
    };

    function normalizeName(value) {
        let normalized = '';
        const lower = value.toLowerCase();
        for (const ch of lower) {
            normalized += LEET_MAP[ch] || ch;
        }
        return normalized.replace(/\s+/g, '');
    }

    function validatePlayerName(name) {
        if (typeof name !== 'string') {
            return { valid: false, reason: 'Name not allowed' };
        }
        const trimmed = name.trim();
        if (trimmed.length < 3 || trimmed.length > 10) {
            return { valid: false, reason: 'Name must be 3-10 characters' };
        }
        if (!/^[A-Za-z0-9 ]{3,10}$/.test(trimmed)) {
            return { valid: false, reason: 'Use letters, numbers, and spaces only' };
        }
        const normalized = normalizeName(trimmed);
        if (BLOCKED_TERMS.some(term => normalized.includes(term))) {
            return { valid: false, reason: 'Name not allowed' };
        }
        return { valid: true, name: trimmed };
    }

    function getSavedName() {
        try {
            return localStorage.getItem(PLAYER_NAME_KEY) || '';
        } catch {
            return '';
        }
    }

    function saveName(name) {
        try {
            localStorage.setItem(PLAYER_NAME_KEY, name.trim());
        } catch {
            // Ignore storage errors.
        }
    }

    async function submitScore(game, mode, name, score) {
        const response = await fetch(API_PATH, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ game, mode, name, score })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.error || 'Unable to submit score');
        }
        return data;
    }

    async function fetchLeaderboard(game, mode, period, playerName) {
        const url = new URL(API_PATH, window.location.origin);
        url.searchParams.set('game', game);
        url.searchParams.set('mode', mode);
        url.searchParams.set('period', period);
        if (playerName) {
            url.searchParams.set('player', playerName);
        }

        const response = await fetch(url.toString());
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.error || 'Unable to load leaderboard');
        }
        return data;
    }

    function setFieldError(inputEl, errorEl, message) {
        if (!inputEl || !errorEl) return;
        if (message) {
            inputEl.classList.add('input-error');
            errorEl.classList.remove('hidden');
            errorEl.textContent = message;
            return;
        }
        inputEl.classList.remove('input-error');
        errorEl.classList.add('hidden');
        errorEl.textContent = '';
    }

    async function validateAndSubmit(options) {
        const {
            game,
            mode,
            name,
            score,
            inputElement,
            errorElement
        } = options;

        const validation = validatePlayerName(name);
        if (!validation.valid) {
            setFieldError(inputElement, errorElement, validation.reason);
            return { success: false, error: validation.reason };
        }

        setFieldError(inputElement, errorElement, '');

        try {
            const result = await submitScore(game, mode, validation.name, score);
            saveName(validation.name);
            showRankToast(result.ranks);
            return { success: true, data: result, name: validation.name };
        } catch (error) {
            setFieldError(inputElement, errorElement, error.message || 'Unable to submit score');
            return { success: false, error: error.message || 'Unable to submit score' };
        }
    }

    function getBestRankText(ranks) {
        if (!ranks) return '';
        const entries = [
            { key: 'daily', label: 'today' },
            { key: 'weekly', label: 'this week' },
            { key: 'monthly', label: 'this month' },
            { key: 'alltime', label: 'all-time' }
        ].filter(item => Number.isFinite(ranks[item.key]));

        if (!entries.length) return '';

        entries.sort((a, b) => ranks[a.key] - ranks[b.key]);
        const best = entries[0];
        return `You placed #${ranks[best.key]} ${best.label}!`;
    }

    function showRankToast(ranks) {
        const text = getBestRankText(ranks);
        if (!text) return;

        const toast = document.createElement('div');
        toast.className = 'rank-toast';
        toast.textContent = text;
        document.body.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 350);
        }, 2400);
    }

    function renderLeaderboardList(container, data, period) {
        container.innerHTML = '';

        const title = document.createElement('h3');
        title.className = 'leaderboard-title';
        title.textContent = `${PERIOD_LABELS[period]} Global Top ${period === 'daily' ? '10' : '3'}`;
        container.appendChild(title);

        const list = document.createElement('ol');
        list.className = 'leaderboard-list';

        const entries = Array.isArray(data.leaderboard) ? data.leaderboard : [];
        if (!entries.length) {
            const empty = document.createElement('p');
            empty.className = 'leaderboard-empty';
            empty.textContent = 'No scores yet for this period.';
            container.appendChild(empty);
        } else {
            entries.forEach((entry, index) => {
                const item = document.createElement('li');
                if (index === 0) item.classList.add('gold');
                if (index === 1) item.classList.add('silver');
                if (index === 2) item.classList.add('bronze');
                item.innerHTML = `<span>#${entry.rank} ${entry.name}</span><strong>${entry.score}</strong>`;
                list.appendChild(item);
            });
            container.appendChild(list);
        }

        if (data.personalBest && Number.isFinite(data.personalBest.score)) {
            const personal = document.createElement('p');
            personal.className = 'personal-best-row';
            personal.textContent = `Your best: #${data.personalBest.rank} — ${data.personalBest.score}`;
            container.appendChild(personal);
        }
    }

    async function renderTabbedLeaderboard(options) {
        const {
            container,
            game,
            mode,
            modes,
            playerName
        } = options;

        if (!container) return;

        container.innerHTML = '';

        let activeMode = mode;

        if (Array.isArray(modes) && modes.length > 1) {
            const modeRow = document.createElement('div');
            modeRow.className = 'leaderboard-modes';
            modes.forEach(m => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'leaderboard-mode-btn' + (m.value === activeMode ? ' active' : '');
                btn.dataset.mode = m.value;
                btn.textContent = m.label;
                btn.addEventListener('click', () => {
                    if (activeMode === m.value) return;
                    activeMode = m.value;
                    [...modeRow.children].forEach(b => b.classList.toggle('active', b.dataset.mode === activeMode));
                    loadPeriod(activePeriod);
                });
                modeRow.appendChild(btn);
            });
            container.appendChild(modeRow);
        }

        const tabs = document.createElement('div');
        tabs.className = 'leaderboard-tabs';
        const content = document.createElement('div');
        content.className = 'leaderboard-content';
        container.appendChild(tabs);
        container.appendChild(content);

        let activePeriod = 'daily';

        async function loadPeriod(period) {
            activePeriod = period;
            [...tabs.children].forEach(btn => {
                btn.classList.toggle('active', btn.dataset.period === activePeriod);
            });
            content.innerHTML = '<p class="leaderboard-loading">Loading…</p>';

            try {
                const data = await fetchLeaderboard(game, activeMode, activePeriod, playerName || getSavedName());
                renderLeaderboardList(content, data, activePeriod);
            } catch (error) {
                content.innerHTML = `<p class="leaderboard-empty">${error.message || 'Unable to load leaderboard'}</p>`;
            }
        }

        ['daily', 'weekly', 'monthly', 'alltime'].forEach(period => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'leaderboard-tab';
            btn.dataset.period = period;
            btn.textContent = PERIOD_LABELS[period];
            btn.addEventListener('click', () => {
                if (activePeriod === period) return;
                loadPeriod(period);
            });
            tabs.appendChild(btn);
        });

        await loadPeriod('daily');
    }

    async function renderHubDailyWidget(container) {
        if (!container) return;

        const combos = [
            { label: 'Pop Balloon (Classic)', game: 'balloon', mode: 'classic' },
            { label: 'Pop Balloon (Chaos)', game: 'balloon', mode: 'chaos' },
            { label: 'Snake (Classic)', game: 'snake', mode: 'classic' },
            { label: 'Snake (Capture)', game: 'snake', mode: 'capture' },
            { label: 'Math Blaster', game: 'math', mode: 'standard' },
            { label: 'Goomba Invaders', game: 'goomba', mode: 'standard' }
        ];

        container.innerHTML = '<p class="leaderboard-loading">Loading scores…</p>';

        try {
            const results = await Promise.all(combos.map(async combo => {
                const data = await fetchLeaderboard(combo.game, combo.mode, 'daily', '');
                return { combo, top: data.leaderboard || [] };
            }));

            container.innerHTML = '';
            const grid = document.createElement('div');
            grid.className = 'hub-score-grid';

            results.forEach(({ combo, top }) => {
                const card = document.createElement('div');
                card.className = 'hub-score-card';
                const rows = top.slice(0, 3).map((entry, i) => {
                    const cls = i === 0 ? 'gold' : (i === 1 ? 'silver' : (i === 2 ? 'bronze' : ''));
                    return `<li class="${cls}"><span>#${entry.rank} ${entry.name}</span><strong>${entry.score}</strong></li>`;
                }).join('');

                card.innerHTML = `
                    <h4>${combo.label}</h4>
                    <ol class="leaderboard-list compact">
                        ${rows || '<li><span>No scores yet</span><strong>—</strong></li>'}
                    </ol>
                `;
                grid.appendChild(card);
            });

            container.appendChild(grid);
        } catch (error) {
            container.innerHTML = `<p class="leaderboard-empty">${error.message || 'Unable to load scores'}</p>`;
        }
    }

    window.LeaderboardAPI = {
        getSavedName,
        saveName,
        validatePlayerName,
        validateAndSubmit,
        fetchLeaderboard,
        renderTabbedLeaderboard,
        renderHubDailyWidget
    };
})();
