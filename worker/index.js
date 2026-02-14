import { validatePlayerName } from './profanity.js';

const ALLOWED_GAMES = {
    balloon: new Set(['classic', 'chaos']),
    snake: new Set(['classic', 'capture']),
    math: new Set(['standard'])
};

const SCORE_LIMITS = {
    balloon: 999999,
    snake: 99999,
    math: 99999
};

const PERIOD_CONFIG = {
    daily: { limit: 10, keyColumn: 'day_key' },
    weekly: { limit: 3, keyColumn: 'week_key' },
    monthly: { limit: 3, keyColumn: 'month_key' },
    alltime: { limit: 3, keyColumn: null }
};

const ET_TIMEZONE = 'America/New_York';

function json(data, status = 200, origin = '*') {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'content-type': 'application/json; charset=utf-8',
            'access-control-allow-origin': origin,
            'access-control-allow-methods': 'GET,POST,OPTIONS',
            'access-control-allow-headers': 'content-type'
        }
    });
}

function getOrigin(request) {
    const origin = request.headers.get('Origin');
    return origin || '*';
}

function getETDateParts(date = new Date()) {
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: ET_TIMEZONE,
        weekday: 'short',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });

    const parts = formatter.formatToParts(date);
    const map = {};
    for (const part of parts) {
        if (part.type !== 'literal') map[part.type] = part.value;
    }

    return {
        year: Number(map.year),
        month: Number(map.month),
        day: Number(map.day),
        weekdayShort: map.weekday
    };
}

function isoWeekForDate(year, month, day) {
    const date = new Date(Date.UTC(year, month - 1, day));
    const weekday = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - weekday);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
    return {
        weekYear: date.getUTCFullYear(),
        week: weekNo
    };
}

function pad(value) {
    return String(value).padStart(2, '0');
}

function getPeriodKeys(now = new Date()) {
    const et = getETDateParts(now);
    const week = isoWeekForDate(et.year, et.month, et.day);

    return {
        day_key: `${et.year}-${pad(et.month)}-${pad(et.day)}`,
        week_key: `${week.weekYear}-W${pad(week.week)}`,
        month_key: `${et.year}-${pad(et.month)}`,
        created_at: now.toISOString()
    };
}

function validateGameMode(game, mode) {
    if (!ALLOWED_GAMES[game]) return false;
    return ALLOWED_GAMES[game].has(mode);
}

function parseScore(value) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : NaN;
}

async function sha256Hex(value) {
    const data = new TextEncoder().encode(value);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function getPeriodFilter(period, keys) {
    const config = PERIOD_CONFIG[period] || PERIOD_CONFIG.daily;
    if (!config.keyColumn) return { whereSql: '', params: [], limit: config.limit };

    const keyValue = keys[config.keyColumn];
    return {
        whereSql: `AND ${config.keyColumn} = ?`,
        params: [keyValue],
        limit: config.limit
    };
}

async function getLeaderboard(env, game, mode, period, player, keys) {
    const cfg = getPeriodFilter(period, keys);

    const listStmt = env.DB.prepare(
        `SELECT player_name, score
         FROM scores
         WHERE game = ? AND mode = ? ${cfg.whereSql}
         ORDER BY score DESC, created_at ASC
         LIMIT ?`
    );

    const listResult = await listStmt.bind(game, mode, ...cfg.params, cfg.limit).all();
    const rows = listResult.results || [];
    const leaderboard = rows.map((row, index) => ({
        rank: index + 1,
        name: row.player_name,
        score: row.score
    }));

    let personalBest = null;
    if (player && typeof player === 'string') {
        const normalizedPlayer = player.trim();
        if (normalizedPlayer) {
            const bestStmt = env.DB.prepare(
                `SELECT MAX(score) AS best_score
                 FROM scores
                 WHERE game = ? AND mode = ? ${cfg.whereSql} AND LOWER(player_name) = LOWER(?)`
            );
            const bestResult = await bestStmt.bind(game, mode, ...cfg.params, normalizedPlayer).first();
            const bestScore = bestResult?.best_score;

            if (Number.isFinite(bestScore)) {
                const rankStmt = env.DB.prepare(
                    `SELECT COUNT(*) AS ahead
                     FROM scores
                     WHERE game = ? AND mode = ? ${cfg.whereSql} AND score > ?`
                );
                const rankResult = await rankStmt.bind(game, mode, ...cfg.params, bestScore).first();
                personalBest = {
                    score: bestScore,
                    rank: (rankResult?.ahead || 0) + 1
                };
            }
        }
    }

    return { leaderboard, personalBest };
}

async function computeRank(env, game, mode, score, period, keys) {
    const cfg = getPeriodFilter(period, keys);
    const stmt = env.DB.prepare(
        `SELECT COUNT(*) AS ahead
         FROM scores
         WHERE game = ? AND mode = ? ${cfg.whereSql} AND score > ?`
    );
    const result = await stmt.bind(game, mode, ...cfg.params, score).first();
    return (result?.ahead || 0) + 1;
}

async function handleGetScores(request, env) {
    const origin = getOrigin(request);
    const url = new URL(request.url);
    const game = (url.searchParams.get('game') || '').toLowerCase();
    const mode = (url.searchParams.get('mode') || '').toLowerCase();
    const period = (url.searchParams.get('period') || 'daily').toLowerCase();
    const player = url.searchParams.get('player') || '';

    if (!validateGameMode(game, mode)) {
        return json({ error: 'Invalid game or mode' }, 400, origin);
    }

    if (!PERIOD_CONFIG[period]) {
        return json({ error: 'Invalid period' }, 400, origin);
    }

    const keys = getPeriodKeys();
    const payload = await getLeaderboard(env, game, mode, period, player, keys);
    return json(payload, 200, origin);
}

async function handlePostScores(request, env) {
    const origin = getOrigin(request);
    let body;
    try {
        body = await request.json();
    } catch {
        return json({ error: 'Invalid JSON body' }, 400, origin);
    }

    const game = (body.game || '').toLowerCase();
    const mode = (body.mode || '').toLowerCase();
    const score = parseScore(body.score);
    const nameValidation = validatePlayerName(body.name || '');

    if (!validateGameMode(game, mode)) {
        return json({ error: 'Invalid game or mode' }, 400, origin);
    }

    if (!nameValidation.valid) {
        return json({ error: nameValidation.reason || 'Name not allowed' }, 400, origin);
    }

    if (!Number.isFinite(score) || score < 0) {
        return json({ error: 'Invalid score' }, 400, origin);
    }

    if (score > (SCORE_LIMITS[game] || 99999)) {
        return json({ error: 'Score exceeds allowed range' }, 400, origin);
    }

    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    const ipHash = await sha256Hex(ip);
    const throttleCutoff = new Date(Date.now() - 30000).toISOString();
    const throttleStmt = env.DB.prepare(
        `SELECT id FROM scores WHERE ip_hash = ? AND game = ? AND created_at >= ? ORDER BY created_at DESC LIMIT 1`
    );
    const throttleHit = await throttleStmt.bind(ipHash, game, throttleCutoff).first();
    if (throttleHit) {
        return json({ error: 'Too many submissions. Try again in a moment.' }, 429, origin);
    }

    const keys = getPeriodKeys();
    const insertStmt = env.DB.prepare(
        `INSERT INTO scores (game, mode, player_name, score, created_at, day_key, week_key, month_key, ip_hash)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    await insertStmt.bind(
        game,
        mode,
        nameValidation.name,
        score,
        keys.created_at,
        keys.day_key,
        keys.week_key,
        keys.month_key,
        ipHash
    ).run();

    const [daily, weekly, monthly, alltime] = await Promise.all([
        computeRank(env, game, mode, score, 'daily', keys),
        computeRank(env, game, mode, score, 'weekly', keys),
        computeRank(env, game, mode, score, 'monthly', keys),
        computeRank(env, game, mode, score, 'alltime', keys)
    ]);

    return json({
        success: true,
        ranks: { daily, weekly, monthly, alltime }
    }, 200, origin);
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (request.method === 'OPTIONS' && url.pathname.startsWith('/api/')) {
            return json({}, 204, getOrigin(request));
        }

        if (url.pathname === '/api/scores' && request.method === 'GET') {
            return handleGetScores(request, env);
        }

        if (url.pathname === '/api/scores' && request.method === 'POST') {
            return handlePostScores(request, env);
        }

        if (env.ASSETS) {
            return env.ASSETS.fetch(request);
        }

        return new Response('Not found', { status: 404 });
    }
};
