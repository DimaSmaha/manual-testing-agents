/**
 * The real cost of a run, read off a transcript the harness already keeps.
 *
 * Ported from the mock's `transcript-usage.mjs`. Two sources are summed here:
 *
 *   - a SUBAGENT transcript, `~/.claude/projects/<slug>/<session_id>/subagents/agent-<agentId>.jsonl`
 *     (the whole file is the run) — `billedForRun`, unchanged from the mock;
 *   - a WINDOW of the MAIN session transcript, `~/.claude/projects/<slug>/<session_id>.jsonl`
 *     (new here) — `summarizeWindow`. A skill is not a subagent: it runs as ordinary turns of the main
 *     conversation, so its usage is the assistant messages inside the time window it was active.
 *
 * TWO THINGS THAT MAKE THE SUM WRONG IF FORGOTTEN (both from the mock):
 *   - The transcript writes one line per content block, and every block of the same message repeats the
 *     message's `usage`. Usage is summed once per `message.id`, taking the record with the largest
 *     `output_tokens` (a streamed message's early lines can carry a partial count).
 *   - Tool uses are counted over lines, not messages — each `tool_use` block is its own line.
 *
 * ONE THING NEW HERE: a message belongs to the window that contains its FIRST line's timestamp, so a message
 * streamed across a window boundary is counted exactly once and never split.
 *
 * Messages with model `<synthetic>` (harness-generated error placeholders, zero usage) are skipped — they
 * would otherwise surface as an "unknown model" and leave a row unpriced.
 *
 * Nothing here estimates. A transcript that is not on this machine yields `null`.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import os from "node:os";

/** Prompt size above which Haiku 5.5 changes price tier; counted per model so pricing can refuse to guess. */
export const LONG_PROMPT_TOKENS = 100_000;

/** Where Claude Code keeps per-project session data. `CLAUDE_CONFIG_DIR` overrides the default. */
export function claudeProjectsDir() {
  const cfg = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), ".claude");
  return path.join(cfg, "projects");
}

function safeReaddir(dir) {
  try {
    return readdirSync(dir);
  } catch {
    return [];
  }
}

function readMeta(file) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

/** Find the transcript of one subagent run, by `agentId` or through the sibling `.meta.json` by `toolUseId`. */
export function locateTranscript({ sessionId, agentId = null, toolUseId = null, projectsDir = claudeProjectsDir() }) {
  if (!sessionId || !existsSync(projectsDir)) return null;
  for (const slug of safeReaddir(projectsDir)) {
    const dir = path.join(projectsDir, slug, sessionId, "subagents");
    if (!existsSync(dir)) continue;
    if (agentId) {
      const transcript = path.join(dir, `agent-${agentId}.jsonl`);
      if (existsSync(transcript)) {
        return { transcript, agentId, meta: readMeta(path.join(dir, `agent-${agentId}.meta.json`)) };
      }
    }
    if (toolUseId) {
      for (const name of safeReaddir(dir)) {
        if (!name.endsWith(".meta.json")) continue;
        const meta = readMeta(path.join(dir, name));
        if (meta?.toolUseId !== toolUseId) continue;
        const id = name.slice("agent-".length, -".meta.json".length);
        const transcript = path.join(dir, `agent-${id}.jsonl`);
        if (existsSync(transcript)) return { transcript, agentId: id, meta };
      }
    }
  }
  return null;
}

const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

/** Parse a transcript into `[{ r, raw, t }]` (record, raw line, timestamp ms). `null` when unreadable. */
export function parseTranscript(file) {
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    return null;
  }
  const out = [];
  for (const raw of text.split("\n")) {
    if (!raw.trim()) continue;
    let r;
    try {
      r = JSON.parse(raw);
    } catch {
      continue; // a torn line is a line, not a reason to lose the run
    }
    const t = Date.parse(r?.timestamp ?? "");
    out.push({ r, raw, t: Number.isFinite(t) ? t : null });
  }
  return out;
}

const FIELDS = [
  "api_calls",
  "input",
  "output",
  "cache_read",
  "cache_write",
  "cache_write_5m",
  "cache_write_1h",
  "cache_write_unknown_ttl",
  "calls_over_100k",
];
const emptyBucket = () => Object.fromEntries(FIELDS.map((f) => [f, 0]));

/**
 * Sum parsed transcript entries into a `billed` block, or `null` when they hold no usage.
 * `by_model` keeps the split per model so a run that switched models is priced per call.
 */
export function summarizeRecords(entries, file = null) {
  const byMessage = new Map();
  const modelOf = new Map();
  let toolUses = 0;
  let first = null;
  let last = null;
  let lastStop = null;
  let lastLine = null;
  const speeds = new Set();
  const tiers = new Set();

  for (const { r, t } of entries) {
    if (t !== null) {
      if (first === null || t < first) first = t;
      if (last === null || t > last) last = t;
    }
    if (r?.type === "user") lastLine = { type: "user" };
    if (r?.type !== "assistant" || !r.message) continue;
    const m = r.message;
    if (m.model === "<synthetic>") continue;
    const blocks = Array.isArray(m.content) ? m.content : [];
    toolUses += blocks.filter((b) => b?.type === "tool_use").length;
    if (m.stop_reason) lastStop = m.stop_reason;
    lastLine = { type: "assistant", block: blocks.at(-1)?.type ?? null, stop: m.stop_reason ?? null };
    if (m.usage && m.id) {
      const prev = byMessage.get(m.id);
      if (!prev || num(m.usage.output_tokens) > num(prev.output_tokens)) byMessage.set(m.id, m.usage);
      if (m.model) modelOf.set(m.id, m.model);
    }
  }

  if (byMessage.size === 0) return null;

  const add = (acc, u) => {
    acc.api_calls += 1;
    acc.input += num(u.input_tokens);
    acc.output += num(u.output_tokens);
    acc.cache_read += num(u.cache_read_input_tokens);
    const write = num(u.cache_creation_input_tokens);
    acc.cache_write += write;
    const split = u.cache_creation;
    if (split && typeof split === "object") {
      acc.cache_write_5m += num(split.ephemeral_5m_input_tokens);
      acc.cache_write_1h += num(split.ephemeral_1h_input_tokens);
    } else {
      acc.cache_write_unknown_ttl += write;
    }
    if (num(u.input_tokens) + num(u.cache_read_input_tokens) + write > LONG_PROMPT_TOKENS) acc.calls_over_100k += 1;
    if (u.speed) speeds.add(u.speed);
    if (u.service_tier) tiers.add(u.service_tier);
  };

  const total = emptyBucket();
  const byModel = {};
  for (const [id, u] of byMessage) {
    add(total, u);
    const model = modelOf.get(id) ?? "unknown";
    byModel[model] ??= emptyBucket();
    add(byModel[model], u);
  }

  const one = (set) => (set.size === 1 ? [...set][0] : set.size === 0 ? null : "mixed");
  const models = Object.keys(byModel);
  return {
    scope: "run",
    source: file ? "subagent_transcript" : "session_window",
    transcript: file,
    ...total,
    total: total.input + total.output + total.cache_read + total.cache_write,
    tool_uses: toolUses,
    by_model: byModel,
    model: models.length === 1 ? models[0] : "mixed",
    speed: one(speeds),
    service_tier: one(tiers),
    started_at: first === null ? null : new Date(first).toISOString(),
    finished_at: last === null ? null : new Date(last).toISOString(),
    duration_ms: first === null || last === null ? null : last - first,
    last_stop_reason: lastStop,
    complete:
      lastLine?.type === "assistant" &&
      lastLine.block === "text" &&
      (lastLine.stop === null || lastLine.stop === "end_turn" || lastLine.stop === "stop_sequence"),
  };
}

/** Sum a whole subagent transcript file. */
export function summarizeTranscript(file) {
  const entries = parseTranscript(file);
  return entries ? summarizeRecords(entries, file) : null;
}

/**
 * Sum the assistant messages of the main session whose FIRST line falls in `[fromMs, toMs)`.
 * `entries` is the output of `parseTranscript` for the session transcript.
 */
export function summarizeWindow(entries, fromMs, toMs) {
  if (!entries) return null;
  const firstTs = new Map();
  for (const e of entries) {
    const id = e.r?.message?.id;
    if (e.r?.type === "assistant" && id && e.t !== null && !firstTs.has(id)) firstTs.set(id, e.t);
  }
  const picked = entries.filter((e) => {
    if (e.r?.type !== "assistant") return false;
    const id = e.r.message?.id;
    const t = id && firstTs.has(id) ? firstTs.get(id) : e.t;
    return t !== null && t !== undefined && t >= fromMs && t < toMs;
  });
  return summarizeRecords(picked);
}

/** Add several `billed` blocks into one (skill window + its subagents, several slices of one orchestrator). */
export function mergeBilled(list) {
  const parts = list.filter(Boolean);
  if (parts.length === 0) return null;
  if (parts.length === 1) return parts[0];
  const total = emptyBucket();
  const byModel = {};
  let toolUses = 0;
  let first = null;
  let last = null;
  const speeds = new Set();
  const tiers = new Set();
  for (const b of parts) {
    for (const f of FIELDS) total[f] += num(b[f]);
    toolUses += num(b.tool_uses);
    for (const [model, t] of Object.entries(b.by_model ?? {})) {
      byModel[model] ??= emptyBucket();
      for (const f of FIELDS) byModel[model][f] += num(t[f]);
    }
    if (b.speed) speeds.add(b.speed);
    if (b.service_tier) tiers.add(b.service_tier);
    const s = Date.parse(b.started_at ?? "");
    const e = Date.parse(b.finished_at ?? "");
    if (Number.isFinite(s) && (first === null || s < first)) first = s;
    if (Number.isFinite(e) && (last === null || e > last)) last = e;
  }
  const one = (set) => (set.size === 1 ? [...set][0] : set.size === 0 ? null : "mixed");
  const models = Object.keys(byModel);
  return {
    scope: "merged",
    source: "merged",
    transcript: null,
    ...total,
    total: total.input + total.output + total.cache_read + total.cache_write,
    tool_uses: toolUses,
    by_model: byModel,
    model: models.length === 1 ? models[0] : "mixed",
    speed: one(speeds),
    service_tier: one(tiers),
    started_at: first === null ? null : new Date(first).toISOString(),
    finished_at: last === null ? null : new Date(last).toISOString(),
    duration_ms: first === null || last === null ? null : last - first,
    complete: parts.every((p) => p.complete !== false),
  };
}

/** Locate and summarize one subagent run. `null` when either half fails. */
export function billedForRun(args) {
  const found = locateTranscript(args);
  if (!found) return null;
  const billed = summarizeTranscript(found.transcript);
  if (!billed) return null;
  return { ...billed, agent_id: found.agentId, request_shape: found.meta?.requestShape ?? null };
}
