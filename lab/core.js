(function () {
    const Storage = {
        getJSON(key, fallback) {
            try {
                const value = localStorage.getItem(key);
                return value ? JSON.parse(value) : fallback;
            } catch (err) {
                return fallback;
            }
        },
        setJSON(key, value) {
            localStorage.setItem(key, JSON.stringify(value));
        },
        getNumber(key, fallback) {
            const value = Number(localStorage.getItem(key));
            return Number.isFinite(value) ? value : fallback;
        },
        setNumber(key, value) {
            localStorage.setItem(key, String(value));
        }
    };

    function formatTime(seconds) {
        const clamped = Math.max(0, Math.floor(seconds));
        const mins = Math.floor(clamped / 60).toString().padStart(2, '0');
        const secs = (clamped % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function Timer(duration, onTick, onComplete) {
        this.duration = duration;
        this.remaining = duration;
        this.running = false;
        this._interval = null;
        this._startTime = null;
        this._lastTick = 0;

        this.start = () => {
            if (this.running) return;
            this.running = true;
            this._startTime = performance.now();
            this._lastTick = this._startTime;
            this._interval = setInterval(() => {
                if (!this.running) return;
                const now = performance.now();
                const elapsed = (now - this._startTime) / 1000;
                this.remaining = Math.max(0, this.duration - elapsed);
                onTick?.(this.remaining, elapsed);
                if (this.remaining <= 0) {
                    this.stop();
                    onComplete?.();
                }
                this._lastTick = now;
            }, 100);
        };

        this.stop = () => {
            this.running = false;
            if (this._interval) {
                clearInterval(this._interval);
                this._interval = null;
            }
        };

        this.reset = (duration) => {
            this.stop();
            this.duration = duration;
            this.remaining = duration;
        };

        this.getElapsed = () => this.duration - this.remaining;
    }

    window.LabCore = {
        Storage,
        formatTime,
        clamp,
        Timer
    };
})();
