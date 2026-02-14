(function () {
    const form = document.getElementById('suggestion-form');
    const nameInput = document.getElementById('suggestion-name');
    const textInput = document.getElementById('suggestion-text');
    const statusEl = document.getElementById('status');
    const listEl = document.getElementById('suggestions-list');
    const charCountEl = document.getElementById('char-count');

    const API_CANDIDATES = [
        `${window.location.origin}/api/suggestions`,
        'https://teamhansengames.hizzouserocka.workers.dev/api/suggestions'
    ];

    async function fetchSuggestionsApi(init) {
        let lastError = null;

        for (const url of API_CANDIDATES) {
            try {
                const response = await fetch(url, init);
                const data = await response.json().catch(() => ({}));
                if (!response.ok) {
                    throw new Error(data.error || 'Request failed');
                }
                return data;
            } catch (error) {
                lastError = error;
            }
        }

        throw lastError || new Error('Unable to reach suggestions API');
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

        items.slice(0, 5).forEach((item, index) => {
            const li = document.createElement('li');

            const text = document.createElement('p');
            text.className = 'suggestion-text';
            text.textContent = item.suggestion_text || '';

            const meta = document.createElement('p');
            meta.className = 'suggestion-meta';
            const by = item.player_name ? `by ${item.player_name} · ` : '';
            meta.textContent = `#${index + 1} ${by}${formatTime(item.created_at)}`.trim();

            li.appendChild(text);
            li.appendChild(meta);
            listEl.appendChild(li);
        });
    }

    async function loadSuggestions() {
        try {
            const data = await fetchSuggestionsApi({ method: 'GET' });
            renderSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
        } catch (error) {
            setStatus(error.message || 'Unable to load suggestions', 'error');
        }
    }

    async function submitSuggestion(event) {
        event.preventDefault();
        const name = (nameInput.value || '').trim();
        const text = (textInput.value || '').trim();

        if (!text) {
            setStatus('Suggestion is required.', 'error');
            return;
        }

        if (text.length > 140) {
            setStatus('Suggestion must be 140 characters or less.', 'error');
            return;
        }

        setStatus('Submitting…');

        try {
            await fetchSuggestionsApi({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, text })
            });

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
