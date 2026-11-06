/**
 * List prices for the models the metrics report prices, and the function that applies them.
 *
 * Ported from the mock's `pricing.mjs`; the design is unchanged:
 *
 *   - `priceBilled` prices a `billed` block (every API call of a run summed from a transcript, see
 *     `transcript-usage.mjs`) per model, with the cache-write TTL split honoured.
 *   - UNKNOWN MODEL MEANS NO PRICE. Not a guess at a tier from the name, not the nearest neighbour,
 *     not zero. `usd: null` plus a reason; the report counts how many rows went that way.
 *   - Speed other than `standard` is unpriced (fast mode reprices the model; this table holds list rates).
 *
 * What changed for this repository:
 *   - Rates were refreshed from the `claude-api` skill's model table (cached 2026-10-06).
 *   - Cache READ is not a flat 0.1x any more: Opus 5.5 / Sonnet 5.5 bill it at $0.20/MTok and Fable 5.1 at
 *     $0.25/MTok, so a model may carry an explicit `cache_read` rate. Without one, 0.1x input is used.
 *   - Cache WRITE multipliers (1.25x for 5m, 2x for 1h) are the documented defaults; they have not been
 *     re-verified for the 5.x models. Change `CACHE_WRITE_MULTIPLIER` if the bill disagrees.
 *   - Haiku 5.5 prices $0.10/$0.50 only for prompts up to 100K tokens ($0.50/$2.50 above). The billed block
 *     counts calls over 100K per model (`calls_over_100k`); a model in `LONG_PROMPT_MODELS` with such a
 *     call is left unpriced instead of being under-priced.
 *   - The mock's dated Sonnet 5 rate step (2026-09-01) is gone: the model table above lists Sonnet 5 at a
 *     flat $2/$10. The dated-period mechanism is kept for the next price change.
 */

/** The day this table was last checked against published pricing. Bump it when a rate changes. */
export const RATES_AS_OF = "2026-10-06";

/** Default cache-read multiplier of the input rate (a model may override with an explicit `cache_read`). */
export const CACHE_READ_MULTIPLIER = 0.1;
export const CACHE_WRITE_MULTIPLIER = { "5m": 1.25, "1h": 2 };

/** The TTL assumed for a cache write whose TTL was not recorded — the API default. */
export const ASSUMED_CACHE_TTL = "5m";

/** Models whose list price depends on prompt size; see the header. */
export const LONG_PROMPT_MODELS = new Set(["claude-haiku-5-5"]);

/**
 * US dollars per million tokens, per model, per period. `from` inclusive, `until` exclusive,
 * `until: null` = still current. `cache_read` is optional (see header).
 */
export const RATES = {
  "claude-fable-5-1": [{ from: null, until: null, input: 10, output: 50, cache_read: 0.25 }],
  "claude-fable-5": [{ from: null, until: null, input: 10, output: 50 }],
  "claude-mythos-5-1": [{ from: null, until: null, input: 10, output: 50, cache_read: 0.25 }],
  "claude-mythos-5": [{ from: null, until: null, input: 10, output: 50 }],
  "claude-opus-5-5": [{ from: null, until: null, input: 4, output: 20, cache_read: 0.2 }],
  "claude-opus-5": [{ from: null, until: null, input: 5, output: 25 }],
  "claude-opus-4-8": [{ from: null, until: null, input: 5, output: 25 }],
  "claude-opus-4-7": [{ from: null, until: null, input: 5, output: 25 }],
  "claude-opus-4-6": [{ from: null, until: null, input: 5, output: 25 }],
  "claude-opus-4-5": [{ from: null, until: null, input: 5, output: 25 }],
  "claude-sonnet-5-5": [{ from: null, until: null, input: 2, output: 10, cache_read: 0.2 }],
  "claude-sonnet-5": [{ from: null, until: null, input: 2, output: 10 }],
  "claude-sonnet-4-6": [{ from: null, until: null, input: 3, output: 15 }],
  "claude-sonnet-4-5": [{ from: null, until: null, input: 3, output: 15 }],
  "claude-haiku-5-5": [{ from: null, until: null, input: 0.1, output: 0.5 }],
  "claude-haiku-4-5": [{ from: null, until: null, input: 1, output: 5 }],
};

/**
 * Strip what a model string carries beyond its identity: a `[1m]`-style context marker and a trailing
 * date snapshot. Anything left unmatched stays unmatched (unknown-model rule).
 */
export function normalizeModel(model) {
  if (typeof model !== "string" || !model.trim()) return null;
  const bare = model.trim().replace(/\[[^\]]*\]$/, "");
  if (RATES[bare]) return bare;
  const dateless = bare.replace(/-\d{8}$/, "");
  return RATES[dateless] ? dateless : null;
}

/** The rate period covering `at` (an ISO date string), or `null`. */
export function rateFor(model, at) {
  const key = normalizeModel(model);
  if (!key) return null;
  const when = Date.parse(at ?? "");
  if (!Number.isFinite(when)) return null;
  for (const period of RATES[key]) {
    const from = period.from === null ? -Infinity : Date.parse(period.from);
    const until = period.until === null ? Infinity : Date.parse(period.until);
    if (when >= from && when < until) {
      return {
        model: key,
        input: period.input,
        output: period.output,
        cache_read: typeof period.cache_read === "number" ? period.cache_read : period.input * CACHE_READ_MULTIPLIER,
      };
    }
  }
  return null;
}

const perToken = (perMillion) => perMillion / 1_000_000;
const q = (v) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

/**
 * Price a `billed` block — the transcript sum, per model, with the TTL split honoured.
 * Returns `{ usd, models, rates_as_of, assumed_ttl_tokens }` or `{ usd: null, reason }`.
 */
export function priceBilled(billed, at) {
  if (!billed || typeof billed !== "object") return { usd: null, reason: "no_billed_block" };
  if (billed.speed && billed.speed !== "standard") return { usd: null, reason: `speed:${billed.speed}` };
  const byModel = billed.by_model && typeof billed.by_model === "object" ? billed.by_model : null;
  if (!byModel || Object.keys(byModel).length === 0) return { usd: null, reason: "no_model_split" };

  let usd = 0;
  let assumedTtlTokens = 0;
  const models = [];
  for (const [model, t] of Object.entries(byModel)) {
    const rate = rateFor(model, at);
    if (!rate) {
      const known = normalizeModel(model) !== null;
      return { usd: null, reason: known ? "no_start_date" : `unknown_model:${model}` };
    }
    if (LONG_PROMPT_MODELS.has(rate.model) && q(t.calls_over_100k) > 0) {
      return { usd: null, reason: `long_prompt_tier:${rate.model}` };
    }
    const unknownTtl = q(t.cache_write_unknown_ttl);
    assumedTtlTokens += unknownTtl;
    usd +=
      q(t.input) * perToken(rate.input) +
      q(t.output) * perToken(rate.output) +
      q(t.cache_read) * perToken(rate.cache_read) +
      q(t.cache_write_5m) * perToken(rate.input * CACHE_WRITE_MULTIPLIER["5m"]) +
      q(t.cache_write_1h) * perToken(rate.input * CACHE_WRITE_MULTIPLIER["1h"]) +
      unknownTtl * perToken(rate.input * CACHE_WRITE_MULTIPLIER[ASSUMED_CACHE_TTL]);
    models.push(rate.model);
  }
  return { usd, models, rates_as_of: RATES_AS_OF, assumed_ttl_tokens: assumedTtlTokens, scope: "run_list_price" };
}

/** `$7.38` at cent precision once a figure reaches a cent, `$0.0042` below it, `<$0.0001` for dust. */
export function formatUsd(usd) {
  if (typeof usd !== "number" || !Number.isFinite(usd)) return "—";
  if (usd > 0 && usd < 0.0001) return "<$0.0001";
  if (usd >= 0.01) return `$${usd.toFixed(2)}`;
  return `$${usd.toFixed(4)}`;
}
