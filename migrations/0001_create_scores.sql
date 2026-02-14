CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game TEXT NOT NULL,
    mode TEXT NOT NULL,
    player_name TEXT NOT NULL,
    score INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    day_key TEXT NOT NULL,
    week_key TEXT NOT NULL,
    month_key TEXT NOT NULL,
    ip_hash TEXT
);

CREATE INDEX IF NOT EXISTS idx_scores_period_lookup
    ON scores (game, mode, day_key, week_key, month_key, score DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_scores_player_lookup
    ON scores (game, mode, player_name, day_key, week_key, month_key, score DESC);

CREATE INDEX IF NOT EXISTS idx_scores_rate_limit
    ON scores (ip_hash, game, created_at DESC);
