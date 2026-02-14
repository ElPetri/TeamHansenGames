CREATE TABLE IF NOT EXISTS suggestions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    suggestion_text TEXT NOT NULL,
    player_name TEXT,
    created_at TEXT NOT NULL,
    ip_hash TEXT
);

CREATE INDEX IF NOT EXISTS idx_suggestions_created_at
    ON suggestions (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_suggestions_rate_limit
    ON suggestions (ip_hash, created_at DESC);
