CREATE TABLE IF NOT EXISTS suggestion_votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    suggestion_id INTEGER NOT NULL,
    voter_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    ip_hash TEXT,
    FOREIGN KEY (suggestion_id) REFERENCES suggestions(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_suggestion_votes_one_vote_per_voter
    ON suggestion_votes (voter_hash);

CREATE INDEX IF NOT EXISTS idx_suggestion_votes_suggestion
    ON suggestion_votes (suggestion_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_suggestion_votes_ip
    ON suggestion_votes (ip_hash, created_at DESC);
