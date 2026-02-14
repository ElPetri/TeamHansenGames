var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker/profanity.js
var BLOCKED_TERMS = [
  "ass",
  "asshole",
  "bastard",
  "bitch",
  "bollocks",
  "boner",
  "boob",
  "boobs",
  "bullshit",
  "clit",
  "cock",
  "coon",
  "crap",
  "cuck",
  "cum",
  "cunt",
  "dam",
  "damn",
  "dic",
  "dick",
  "dik",
  "dildo",
  "douche",
  "fag",
  "faggot",
  "fck",
  "fk",
  "fuc",
  "fuck",
  "fucker",
  "fucking",
  "fuk",
  "goddamn",
  "hell",
  "homo",
  "idiot",
  "jackass",
  "jerkoff",
  "jiz",
  "jizz",
  "jyz",
  "kike",
  "klit",
  "kum",
  "kunt",
  "loser",
  "mf",
  "mfer",
  "motherfucker",
  "nazi",
  "nigga",
  "nigger",
  "nutsack",
  "paki",
  "penis",
  "piss",
  "porn",
  "prick",
  "pus",
  "puss",
  "pussy",
  "retard",
  "scrotum",
  "sex",
  "shit",
  "slut",
  "sperm",
  "spic",
  "spurm",
  "suck",
  "tit",
  "tits",
  "twat",
  "vagina",
  "wank",
  "whore"
];
var LEET_MAP = {
  "@": "a",
  "4": "a",
  "3": "e",
  "1": "i",
  "!": "i",
  "0": "o",
  "$": "s",
  "5": "s",
  "7": "t"
};
var NAME_REGEX = /^[A-Za-z0-9 ]{3,10}$/;
function normalizeName(value) {
  const base = value.toLowerCase();
  let normalized = "";
  for (const ch of base) {
    normalized += LEET_MAP[ch] || ch;
  }
  return normalized.replace(/\s+/g, "");
}
__name(normalizeName, "normalizeName");
function validatePlayerName(name) {
  if (typeof name !== "string") {
    return { valid: false, reason: "Name not allowed" };
  }
  const trimmed = name.trim();
  if (trimmed.length < 3 || trimmed.length > 10) {
    return { valid: false, reason: "Name must be 3-10 characters" };
  }
  if (!NAME_REGEX.test(trimmed)) {
    return { valid: false, reason: "Use letters, numbers, and spaces only" };
  }
  const normalized = normalizeName(trimmed);
  const blocked = BLOCKED_TERMS.some((term) => normalized.includes(term));
  if (blocked) {
    return { valid: false, reason: "Name not allowed" };
  }
  return { valid: true, name: trimmed };
}
__name(validatePlayerName, "validatePlayerName");

// worker/index.js
var ALLOWED_GAMES = {
  balloon: /* @__PURE__ */ new Set(["classic", "chaos"]),
  snake: /* @__PURE__ */ new Set(["classic", "capture"]),
  math: /* @__PURE__ */ new Set(["standard"])
};
var SCORE_LIMITS = {
  balloon: 999999,
  snake: 99999,
  math: 99999
};
var PERIOD_CONFIG = {
  daily: { limit: 10, keyColumn: "day_key" },
  weekly: { limit: 3, keyColumn: "week_key" },
  monthly: { limit: 3, keyColumn: "month_key" },
  alltime: { limit: 3, keyColumn: null }
};
var ET_TIMEZONE = "America/New_York";
function json(data, status = 200, origin = "*") {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type"
    }
  });
}
__name(json, "json");
function getOrigin(request) {
  const origin = request.headers.get("Origin");
  return origin || "*";
}
__name(getOrigin, "getOrigin");
function getETDateParts(date = /* @__PURE__ */ new Date()) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: ET_TIMEZONE,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const parts = formatter.formatToParts(date);
  const map = {};
  for (const part of parts) {
    if (part.type !== "literal") map[part.type] = part.value;
  }
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    weekdayShort: map.weekday
  };
}
__name(getETDateParts, "getETDateParts");
function isoWeekForDate(year, month, day) {
  const date = new Date(Date.UTC(year, month - 1, day));
  const weekday = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - weekday);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date - yearStart) / 864e5 + 1) / 7);
  return {
    weekYear: date.getUTCFullYear(),
    week: weekNo
  };
}
__name(isoWeekForDate, "isoWeekForDate");
function pad(value) {
  return String(value).padStart(2, "0");
}
__name(pad, "pad");
function getPeriodKeys(now = /* @__PURE__ */ new Date()) {
  const et = getETDateParts(now);
  const week = isoWeekForDate(et.year, et.month, et.day);
  return {
    day_key: `${et.year}-${pad(et.month)}-${pad(et.day)}`,
    week_key: `${week.weekYear}-W${pad(week.week)}`,
    month_key: `${et.year}-${pad(et.month)}`,
    created_at: now.toISOString()
  };
}
__name(getPeriodKeys, "getPeriodKeys");
function validateGameMode(game, mode) {
  if (!ALLOWED_GAMES[game]) return false;
  return ALLOWED_GAMES[game].has(mode);
}
__name(validateGameMode, "validateGameMode");
function parseScore(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : NaN;
}
__name(parseScore, "parseScore");
async function sha256Hex(value) {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(sha256Hex, "sha256Hex");
function getPeriodFilter(period, keys) {
  const config = PERIOD_CONFIG[period] || PERIOD_CONFIG.daily;
  if (!config.keyColumn) return { whereSql: "", params: [], limit: config.limit };
  const keyValue = keys[config.keyColumn];
  return {
    whereSql: `AND ${config.keyColumn} = ?`,
    params: [keyValue],
    limit: config.limit
  };
}
__name(getPeriodFilter, "getPeriodFilter");
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
  if (player && typeof player === "string") {
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
__name(getLeaderboard, "getLeaderboard");
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
__name(computeRank, "computeRank");
async function handleGetScores(request, env) {
  const origin = getOrigin(request);
  const url = new URL(request.url);
  const game = (url.searchParams.get("game") || "").toLowerCase();
  const mode = (url.searchParams.get("mode") || "").toLowerCase();
  const period = (url.searchParams.get("period") || "daily").toLowerCase();
  const player = url.searchParams.get("player") || "";
  if (!validateGameMode(game, mode)) {
    return json({ error: "Invalid game or mode" }, 400, origin);
  }
  if (!PERIOD_CONFIG[period]) {
    return json({ error: "Invalid period" }, 400, origin);
  }
  const keys = getPeriodKeys();
  const payload = await getLeaderboard(env, game, mode, period, player, keys);
  return json(payload, 200, origin);
}
__name(handleGetScores, "handleGetScores");
async function handlePostScores(request, env) {
  const origin = getOrigin(request);
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400, origin);
  }
  const game = (body.game || "").toLowerCase();
  const mode = (body.mode || "").toLowerCase();
  const score = parseScore(body.score);
  const nameValidation = validatePlayerName(body.name || "");
  if (!validateGameMode(game, mode)) {
    return json({ error: "Invalid game or mode" }, 400, origin);
  }
  if (!nameValidation.valid) {
    return json({ error: nameValidation.reason || "Name not allowed" }, 400, origin);
  }
  if (!Number.isFinite(score) || score < 0) {
    return json({ error: "Invalid score" }, 400, origin);
  }
  if (score > (SCORE_LIMITS[game] || 99999)) {
    return json({ error: "Score exceeds allowed range" }, 400, origin);
  }
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const ipHash = await sha256Hex(ip);
  const throttleCutoff = new Date(Date.now() - 3e4).toISOString();
  const throttleStmt = env.DB.prepare(
    `SELECT id FROM scores WHERE ip_hash = ? AND game = ? AND created_at >= ? ORDER BY created_at DESC LIMIT 1`
  );
  const throttleHit = await throttleStmt.bind(ipHash, game, throttleCutoff).first();
  if (throttleHit) {
    return json({ error: "Too many submissions. Try again in a moment." }, 429, origin);
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
    computeRank(env, game, mode, score, "daily", keys),
    computeRank(env, game, mode, score, "weekly", keys),
    computeRank(env, game, mode, score, "monthly", keys),
    computeRank(env, game, mode, score, "alltime", keys)
  ]);
  return json({
    success: true,
    ranks: { daily, weekly, monthly, alltime }
  }, 200, origin);
}
__name(handlePostScores, "handlePostScores");
var worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS" && url.pathname.startsWith("/api/")) {
      return json({}, 204, getOrigin(request));
    }
    if (url.pathname === "/api/scores" && request.method === "GET") {
      return handleGetScores(request, env);
    }
    if (url.pathname === "/api/scores" && request.method === "POST") {
      return handlePostScores(request, env);
    }
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }
    return new Response("Not found", { status: 404 });
  }
};

// ../../.npm/_npx/d77349f55c2be1c0/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../.npm/_npx/d77349f55c2be1c0/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-R1cIby/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// ../../.npm/_npx/d77349f55c2be1c0/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-R1cIby/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
