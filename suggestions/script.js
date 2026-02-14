(function () {
    const form = document.getElementById('suggestion-form');
    const nameInput = document.getElementById('suggestion-name');
    const textInput = document.getElementById('suggestion-text');
    const statusEl = document.getElementById('status');
    const listEl = document.getElementById('suggestions-list');
    const topBodyEl = document.getElementById('top-suggestions-body');
    const charCountEl = document.getElementById('char-count');
    const VOTER_TOKEN_KEY = 'suggestions_voterToken';
    const SUBMIT_COOLDOWN_KEY = 'suggestions_lastSubmitAt';
    const SUBMIT_COOLDOWN_MS = 120000;
    const SUGGESTIONS_LIMIT = 10;

    let votedSuggestionId = null;

    const API_CANDIDATES = [
        `${window.location.origin}/api/suggestions`,
        'https://teamhansengames.hizzouserocka.workers.dev/api/suggestions'
    ];

    const VOTE_API_CANDIDATES = API_CANDIDATES.map(url => `${url}/vote`);

    function getVoterToken() {
        let token = '';
        try {
            token = localStorage.getItem(VOTER_TOKEN_KEY) || '';
        } catch {
            token = '';
        }

        if (token) return token;

        token = (window.crypto && window.crypto.randomUUID)
            ? window.crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;

        try {
            localStorage.setItem(VOTER_TOKEN_KEY, token);
        } catch {
            // Ignore storage failure; token still works for this session.
        }

        return token;
    }

    async function fetchSuggestionsApi(method, body, queryParams) {
        let lastNetworkError = null;

        for (const baseUrl of API_CANDIDATES) {
            let response;
            try {
                const url = new URL(baseUrl);
                if (queryParams) {
                    Object.entries(queryParams).forEach(([key, value]) => {
                        if (value !== undefined && value !== null && value !== '') {
                            url.searchParams.set(key, String(value));
                        }
                    });
                }

                response = await fetch(url.toString(), {
                    method,
                    headers: body ? { 'Content-Type': 'application/json' } : undefined,
                    body: body ? JSON.stringify(body) : undefined
                });
            } catch (error) {
                lastNetworkError = error;
                continue;
            }

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                if (response.status === 404 || response.status === 405) {
                    continue;
                }

                const error = new Error(data.error || 'Request failed');
                error.code = response.status;
                error.data = data;
                throw error;
            }

            return data;
        }

        throw lastNetworkError || new Error('Unable to reach suggestions service. Check your connection and try again.');
    }

    async function fetchVoteApi(payload) {
        let lastError = null;

        for (const url of VOTE_API_CANDIDATES) {
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await response.json().catch(() => ({}));
                if (!response.ok) {
                    const error = new Error(data.error || 'Unable to submit vote');
                    error.code = response.status;
                    error.data = data;
                    throw error;
                }

                return data;
            } catch (error) {
                lastError = error;
            }
        }

        throw lastError || new Error('Unable to submit vote');
    }

    function setStatus(message, type) {
        statusEl.textContent = message || '';
        statusEl.classList.remove('error', 'success');
        if (type) statusEl.classList.add(type);
    }

    function formatTime(isoString) {
        const date = new Date(isoString);
        if (Number.isNaN(date.getTime())) return '';
        return date.toLocaleString();
    }

    function getRemainingSubmitCooldownMs() {
        try {
            const raw = localStorage.getItem(SUBMIT_COOLDOWN_KEY) || '';
            const last = Number.parseInt(raw, 10);
            if (!Number.isFinite(last) || last <= 0) return 0;
            return Math.max(0, SUBMIT_COOLDOWN_MS - (Date.now() - last));
        } catch {
            return 0;
        }
    }

    function setSubmitCooldownNow() {
        try {
            localStorage.setItem(SUBMIT_COOLDOWN_KEY, String(Date.now()));
        } catch {
            // Ignore storage failures.
        }
    }

    function createVoteButton(item) {
        const button = document.createElement('button');
        button.className = 'vote-btn';
        button.type = 'button';

        if (votedSuggestionId) {
            button.disabled = true;
            button.textContent = Number(item.id) === Number(votedSuggestionId) ? 'Voted' : 'Locked';
            return button;
        }

        button.textContent = 'Vote';
        button.addEventListener('click', async () => {
            try {
                setStatus('Submitting vote…');
                await fetchVoteApi({
                    suggestionId: item.id,
                    voterToken: getVoterToken()
                });
                setStatus('Vote submitted!', 'success');
                await loadSuggestions();
            } catch (error) {
                if (error.code === 409 && error.data && Number.isFinite(Number(error.data.votedSuggestionId))) {
                    votedSuggestionId = Number(error.data.votedSuggestionId);
                    setStatus('You already used your vote.', 'error');
                    await loadSuggestions();
                    return;
                }
                setStatus(error.message || 'Unable to submit vote', 'error');
            }
        });

        return button;
    }

    function createTopVoteButton(item) {
        const button = document.createElement('button');
        button.className = 'vote-btn';
        button.type = 'button';

        if (votedSuggestionId) {
            button.disabled = true;
            button.textContent = Number(item.id) === Number(votedSuggestionId) ? 'Voted' : 'Locked';
            return button;
        }

        button.textContent = 'Vote';
        button.addEventListener('click', async () => {
            try {
                setStatus('Submitting vote…');
                await fetchVoteApi({
                    suggestionId: item.id,
                    voterToken: getVoterToken()
                });
                setStatus('Vote submitted!', 'success');
                await loadSuggestions();
            } catch (error) {
                if (error.code === 409 && error.data && Number.isFinite(Number(error.data.votedSuggestionId))) {
                    votedSuggestionId = Number(error.data.votedSuggestionId);
                    setStatus('You already used your vote.', 'error');
                    await loadSuggestions();
                    return;
                }
                setStatus(error.message || 'Unable to submit vote', 'error');
            }
        });

        return button;
    }

    function renderSuggestions(items) {
        listEl.innerHTML = '';

        if (!Array.isArray(items) || !items.length) {
            const li = document.createElement('li');
            const text = document.createElement('p');
            text.className = 'suggestion-text';
            text.textContent = 'No suggestions yet. Be the first to add one.';
            li.appendChild(text);
            listEl.appendChild(li);
            return;
        }

        items.slice(0, SUGGESTIONS_LIMIT).forEach((item, index) => {
            const li = document.createElement('li');
            const row = document.createElement('div');
            row.className = 'suggestion-row';

            const content = document.createElement('div');

            const text = document.createElement('p');
            text.className = 'suggestion-text';
            text.textContent = item.suggestion_text || '';

            const meta = document.createElement('p');
            meta.className = 'suggestion-meta';
            const by = item.player_name ? `by ${item.player_name} · ` : '';
            const votes = Number(item.votes) || 0;
            meta.textContent = `#${index + 1} ${by}${formatTime(item.created_at)} · ${votes} vote${votes === 1 ? '' : 's'}`.trim();

            content.appendChild(text);
            content.appendChild(meta);

            const voteWrap = document.createElement('div');
            voteWrap.className = 'vote-wrap';
            voteWrap.appendChild(createVoteButton(item));

            const voteNote = document.createElement('p');
            voteNote.className = 'vote-note';
            voteNote.textContent = votedSuggestionId ? 'One vote total' : 'Cast one vote';
            voteWrap.appendChild(voteNote);

            row.appendChild(content);
            row.appendChild(voteWrap);

            li.appendChild(row);
            listEl.appendChild(li);
        });
    }

    function renderTopSuggestions(items) {
        topBodyEl.innerHTML = '';

        if (!Array.isArray(items) || !items.length) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 4;
            cell.className = 'top-empty';
            cell.textContent = 'No voted suggestions yet.';
            row.appendChild(cell);
            topBodyEl.appendChild(row);
            return;
        }

        items.slice(0, SUGGESTIONS_LIMIT).forEach((item, index) => {
            const row = document.createElement('tr');

            const rank = document.createElement('td');
            rank.textContent = `#${index + 1}`;

            const suggestion = document.createElement('td');
            const by = item.player_name ? ` (by ${item.player_name})` : '';
            suggestion.textContent = `${item.suggestion_text || ''}${by}`;

            const votes = document.createElement('td');
            votes.textContent = String(Number(item.votes) || 0);

            const action = document.createElement('td');
            action.appendChild(createTopVoteButton(item));

            row.appendChild(rank);
            row.appendChild(suggestion);
            row.appendChild(votes);
            row.appendChild(action);
            topBodyEl.appendChild(row);
        });
    }

    async function loadSuggestions() {
        try {
            const data = await fetchSuggestionsApi('GET', null, {
                voter: getVoterToken()
            });
            votedSuggestionId = Number.isFinite(Number(data.votedSuggestionId))
                ? Number(data.votedSuggestionId)
                : null;
            renderSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
            renderTopSuggestions(Array.isArray(data.topSuggestions) ? data.topSuggestions : []);
        } catch (error) {
            setStatus(error.message || 'Unable to load suggestions', 'error');
        }
    }

    async function submitSuggestion(event) {
        event.preventDefault();
        const name = (nameInput.value || '').trim();
        const text = (textInput.value || '').trim();
        const remainingMs = getRemainingSubmitCooldownMs();
        if (remainingMs > 0) {
            const seconds = Math.ceil(remainingMs / 1000);
            setStatus(`Please wait ${seconds}s before posting another suggestion.`, 'error');
            return;
        }

        if (!text) {
            setStatus('Suggestion is required.', 'error');
            return;
        }

        if (text.length < 5) {
            setStatus('Suggestion must be at least 5 characters.', 'error');
            return;
        }

        if (text.length > 140) {
            setStatus('Suggestion must be 140 characters or less.', 'error');
            return;
        }

        setStatus('Submitting…');

        try {
            await fetchSuggestionsApi('POST', { name, text });
            setSubmitCooldownNow();

            setStatus('Suggestion submitted!', 'success');
            textInput.value = '';
            charCountEl.textContent = '0 / 140';
            await loadSuggestions();
        } catch (error) {
            setStatus(error.message || 'Unable to submit suggestion', 'error');
        }
    }

    textInput.addEventListener('input', () => {
        charCountEl.textContent = `${textInput.value.length} / 140`;
    });

    form.addEventListener('submit', submitSuggestion);
    loadSuggestions();
})();
