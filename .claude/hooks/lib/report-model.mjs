/**
 * Turns the raw events the hooks recorded, plus the transcripts the harness keeps, into report rows.
 * Shared by `metrics-report.mjs` (the table) and `agent-metrics.mjs --turn-end` (the one-line summary).
 *
 * THE MODEL. A skill is not a subagent: it has no transcript of its own, it runs as ordinary turns of the
 * main conversation. So a skill run is a WINDOW of the session:
 *
 *   - it opens at its `Skill` PreToolUse event and closes where the next skill starts;
 *   - while an orchestrator is open, the turn in which the next stage is launched (the user's "continue",
 *     the orchestrator's counters, the launch) is the ORCHESTRATOR's own turn, not the stage's — the
 *     stage window ends at the start of that turn;
 *   - tokens are the assistant messages in the window (see `summarizeWindow`), plus every subagent
 *     (`expl-bot-researcher` / `expl-bot-tester`) launched inside it, which have their own transcripts;
 *   - ACTIVE time is the sum of `UserPromptSubmit -> Stop` turns clipped to the window, so the time the
 *     user spends thinking between stages is not billed to a stage. WALL is first launch -> last Stop.
 *
 * An orchestrator therefore appears as `<name> (own turns)` — its setup before the first stage plus its
 * between-stage turns — next to one row per stage; Σ over the key is the orchestrator's overall result.
 *
 * KNOWN LIMIT, stated in the report footnote: attribution is by time window in a shared conversation.
 * Two skills cannot run in parallel in one session, but an off-topic chat between stages lands in the
 * surrounding window.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { eventsDir } from "./paths.mjs";
import { isGroupSkill, bareSkillName } from "./tracked-tools.mjs";
import { keyFromArgs, keyFromRecords, UNASSIGNED } from "./keys.mjs";
import { parseTranscript, summarizeWindow, mergeBilled, billedForRun } from "./transcript-usage.mjs";
import { priceBilled } from "./pricing.mjs";

export function readEvents(file) {
  if (!existsSync(file)) return [];
  const out = [];
  for (const line of readFileSync(file, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      out.push(JSON.parse(line));
    } catch {
      /* torn line */
    }
  }
  return out;
}

/** Every session that has an events file: `[{ sessionId, events }]`. */
export function loadAllSessions(projectDir) {
  const dir = eventsDir(projectDir);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((n) => n.endsWith(".jsonl"))
    .map((n) => {
      const events = readEvents(path.join(dir, n));
      return { sessionId: events.find((e) => e.session_id)?.session_id ?? n.replace(/\.jsonl$/, ""), events };
    })
    .filter((s) => s.events.length > 0);
}

const ms = (e) => Date.parse(e.ts);

/**
 * Analyse one session. Returns `{ rows, sessionEnd, transcriptFound }`; each row is one skill run
 * (or one orchestrator's own turns), already priced.
 */
export function analyzeSession(sessionId, events) {
  const starts = events.filter((e) => e.type === "skill_start");
  if (starts.length === 0) return { rows: [], sessionEnd: null, transcriptFound: false };

  const transcriptPath = events.find((e) => e.transcript_path)?.transcript_path ?? null;
  const recs = transcriptPath && existsSync(transcriptPath) ? parseTranscript(transcriptPath) : null;

  // --- turns -------------------------------------------------------------------------------------
  const turnStarts = events.filter((e) => e.type === "turn_start").map(ms).sort((a, b) => a - b);
  const intervals = [];
  let open = null;
  for (const e of events) {
    if (e.type === "turn_start") open = ms(e);
    else if (e.type === "turn_end" && open !== null) {
      intervals.push([open, ms(e)]);
      open = null;
    }
  }
  const lastEventMs = Math.max(...events.map(ms).filter(Number.isFinite));
  const turnEnds = events.filter((e) => e.type === "turn_end").map(ms);
  let sessionEnd = turnEnds.length ? Math.max(...turnEnds, ms(starts.at(-1))) : lastEventMs;
  // A turn still in flight (the report is being run from inside it, as the orchestrators do at the very
  // end, or the session died before its Stop). Its end is the last thing the transcript saw — never
  // "now", or a crashed session would grow forever.
  if (open !== null) {
    const lastSeen = recs ? recs.reduce((a, e) => Math.max(a, e.t ?? 0), 0) : 0;
    const endOpen = Math.max(lastSeen, lastEventMs, open) + 1;
    intervals.push([open, endOpen]);
    sessionEnd = Math.max(sessionEnd, endOpen);
  }
  const turnStartBefore = (t) => {
    let b = t;
    for (const s of turnStarts) if (s <= t) b = s;
    return b;
  };
  const activeIn = (from, to) =>
    intervals.reduce((a, [s, e]) => a + Math.max(0, Math.min(e, to) - Math.max(s, from)), 0);
  const lastTurnEndIn = (from, to) => {
    let best = null;
    for (const t of turnEnds) if (t >= from && t <= to && (best === null || t > best)) best = t;
    return best;
  };

  // --- slices ------------------------------------------------------------------------------------
  const slices = [];
  let group = null;
  starts.forEach((s, i) => {
    const sMs = ms(s);
    const next = starts[i + 1];
    const nextMs = next ? ms(next) : sessionEnd;
    const rowId = s.tool_use_id ?? `skill-${i}`;
    if (isGroupSkill(s.skill)) {
      group = { id: rowId, skill: s.skill };
      slices.push({ rowId, kind: "group", skill: s.skill, args: s.args, start: sMs, end: Math.max(sMs, nextMs) });
      return;
    }
    let end = nextMs;
    let gap = null;
    if (group && next) {
      const b = Math.min(Math.max(turnStartBefore(nextMs), sMs), nextMs);
      end = b;
      gap = { rowId: group.id, kind: "group", skill: group.skill, args: null, start: b, end: nextMs, gap: true };
    }
    slices.push({
      rowId,
      kind: "leaf",
      skill: s.skill,
      args: s.args,
      start: sMs,
      end: Math.max(sMs, end),
      groupId: group?.id ?? null,
    });
    if (gap && gap.end > gap.start) slices.push(gap);
  });

  // --- rows from slices --------------------------------------------------------------------------
  const rows = new Map();
  for (const sl of slices) {
    let row = rows.get(sl.rowId);
    if (!row) {
      row = {
        sessionId,
        rowId: sl.rowId,
        kind: sl.kind,
        skill: bareSkillName(sl.skill),
        args: sl.args ?? "",
        groupId: sl.groupId ?? null,
        start: sl.start,
        slices: [],
        parts: [],
        subagents: [],
        activeMs: 0,
        wallEnd: null,
        noTranscript: !recs,
      };
      rows.set(sl.rowId, row);
    }
    if (sl.args && !row.args) row.args = sl.args;
    row.slices.push(sl);
    row.start = Math.min(row.start, sl.start);
    row.activeMs += activeIn(sl.start, sl.end);
    const lte = lastTurnEndIn(sl.start, sl.end);
    const candidate = lte ?? sl.end;
    if (row.wallEnd === null || candidate > row.wallEnd) row.wallEnd = candidate;
    if (recs) row.parts.push(summarizeWindow(recs, sl.start, sl.end));
  }

  // --- subagent runs -----------------------------------------------------------------------------
  const runs = new Map();
  for (const e of events) {
    if (!["agent_pre", "agent_post", "agent_failed"].includes(e.type) || !e.tool_use_id) continue;
    const run = runs.get(e.tool_use_id) ?? { toolUseId: e.tool_use_id };
    if (e.type === "agent_pre") Object.assign(run, { startMs: ms(e), agent: e.agent, description: e.description });
    if (e.type === "agent_post") {
      Object.assign(run, {
        status: e.status ?? "unknown",
        agentId: e.agent_id ?? null,
        durationMs: e.duration_ms ?? null,
        agent: run.agent ?? e.agent,
        async: Boolean(e.async),
        startMs: run.startMs ?? (ms(e) - (e.duration_ms ?? 0)),
      });
    }
    if (e.type === "agent_failed") {
      Object.assign(run, {
        status: e.status ?? "failed",
        durationMs: e.duration_ms ?? null,
        agent: run.agent ?? e.agent,
        startMs: run.startMs ?? (ms(e) - (e.duration_ms ?? 0)),
      });
    }
    runs.set(e.tool_use_id, run);
  }
  for (const run of runs.values()) {
    if (!Number.isFinite(run.startMs)) continue;
    const sl =
      slices.find((s) => run.startMs >= s.start && run.startMs < s.end) ??
      [...slices].reverse().find((s) => s.start <= run.startMs);
    const row = sl ? rows.get(sl.rowId) : null;
    if (!row) continue;
    run.status ??= "interrupted"; // a launch with no completion and no failure record
    const interrupted = ["interrupted", "timed_out", "failed"].includes(run.status);
    run.billed = interrupted ? null : billedForRun({ sessionId, agentId: run.agentId, toolUseId: run.toolUseId });
    run.agent = run.agent ?? "unknown";
    row.subagents.push(run);
    if (run.billed) row.parts.push(run.billed);
  }

  // --- keys --------------------------------------------------------------------------------------
  const ordered = [...rows.values()].sort((a, b) => a.start - b.start);
  for (const row of ordered) {
    row.key = keyFromArgs(row.args, row.skill);
    if (!row.key && row.kind === "leaf") {
      for (const sl of row.slices) {
        row.key = keyFromRecords(recs, sl.start, sl.end);
        if (row.key) break;
      }
    }
  }
  for (const row of ordered) {
    if (row.kind !== "group" || row.key) continue;
    const child = ordered.find((r) => r.kind === "leaf" && r.groupId === row.rowId && r.key);
    row.key = child?.key ?? null;
    if (!row.key) {
      for (const sl of row.slices) {
        row.key = keyFromRecords(recs, sl.start, sl.end);
        if (row.key) break;
      }
    }
  }
  let prevKey = null;
  for (const row of ordered) {
    if (!row.key && row.groupId) row.key = ordered.find((r) => r.rowId === row.groupId)?.key ?? null;
    if (!row.key) row.key = prevKey;
    row.key ??= UNASSIGNED;
    if (row.key !== UNASSIGNED) prevKey = row.key;
  }

  // --- price -------------------------------------------------------------------------------------
  for (const row of ordered) {
    row.billed = mergeBilled(row.parts);
    row.price = row.billed ? priceBilled(row.billed, new Date(row.start).toISOString()) : null;
    row.wallMs = row.kind === "leaf" && row.wallEnd !== null ? Math.max(0, row.wallEnd - row.start) : null;
    row.startIso = new Date(row.start).toISOString();
    row.finishIso = row.wallEnd === null ? null : new Date(row.wallEnd).toISOString();
    for (const run of row.subagents) {
      run.price = run.billed ? priceBilled(run.billed, new Date(run.startMs).toISOString()) : null;
    }
    delete row.parts;
  }
  return { rows: ordered, sessionEnd, transcriptFound: Boolean(recs) };
}

/**
 * Where a key's saved metrics live, next to the artifacts the key already owns:
 *   TASK-/BUG-<id>  ->  .workflow-artifacts/<KEY>/<KEY>-metrics.{md,json}
 *   eb-… RUN_ID     ->  .workflow-artifacts/expl-bot/runs/<RUN_ID>/metrics.{md,json}
 * `null` for `unassigned` (nowhere honest to put it).
 */
export function saveTargets(projectDir, key) {
  const root = path.join(projectDir, ".workflow-artifacts");
  if (/^(TASK|BUG)-\d+$/i.test(key)) {
    const dir = path.join(root, key.toUpperCase());
    return { dir, md: path.join(dir, `${key.toUpperCase()}-metrics.md`), json: path.join(dir, `${key.toUpperCase()}-metrics.json`) };
  }
  if (/^eb-\d{6}-\d{4}$/.test(key)) {
    const dir = path.join(root, "expl-bot", "runs", key);
    return { dir, md: path.join(dir, "metrics.md"), json: path.join(dir, "metrics.json") };
  }
  return null;
}

export const rowIdentity = (sessionId, startedAt, kind, skill) => `${sessionId}|${startedAt}|${kind}|${skill}`;

/** The previously saved JSON snapshot of a key as `Map<rowIdentity, savedRow>`, or `null`. */
export function loadSnapshot(projectDir, key) {
  const t = saveTargets(projectDir, key);
  if (!t || !existsSync(t.json)) return null;
  try {
    const saved = JSON.parse(readFileSync(t.json, "utf8"));
    const map = new Map();
    for (const r of saved.rows ?? []) map.set(rowIdentity(r.session_id, r.started_at, r.kind, r.skill), r);
    return map;
  } catch {
    return null;
  }
}

/** Rows of every session for one key, in time order, with `Run i/N` per skill and the key's totals. */
export function buildKeyReport(projectDir, key, { snapshot = null } = {}) {
  const sessions = loadAllSessions(projectDir);
  const all = [];
  const bySession = new Map();
  for (const s of sessions) {
    const { rows, sessionEnd } = analyzeSession(s.sessionId, s.events);
    bySession.set(s.sessionId, { rows, sessionEnd });
    for (const r of rows) all.push(r);
  }
  const wanted = String(key).toLowerCase();
  const rows = all.filter((r) => r.key.toLowerCase() === wanted).sort((a, b) => a.start - b.start);

  // A row whose transcript is gone (Claude Code cleans old sessions) is restored from the snapshot saved
  // earlier — only ever filling a MISSING bill, never overriding a freshly measured one.
  let restored = 0;
  if (snapshot) {
    for (const r of rows) {
      const saved = snapshot.get(rowIdentity(r.sessionId, r.startIso, r.kind, r.skill));
      if (!saved) continue;
      if (!r.billed && saved.billed) {
        r.billed = saved.billed;
        r.price = priceBilled(saved.billed, r.startIso);
        r.noTranscript = false;
        r.restored = true;
        restored += 1;
      }
      if (r.subagents.length === 0 && Array.isArray(saved.subagents)) {
        r.subagents = saved.subagents.map((a) => ({
          agent: a.agent,
          status: a.status,
          durationMs: a.duration_ms ?? null,
          billed: a.billed ?? null,
          price: a.billed ? priceBilled(a.billed, r.startIso) : null,
          restored: true,
        }));
      }
    }
  }

  const counts = new Map();
  for (const r of rows) counts.set(`${r.skill}|${r.kind}`, (counts.get(`${r.skill}|${r.kind}`) ?? 0) + 1);
  const seen = new Map();
  for (const r of rows) {
    const k = `${r.skill}|${r.kind}`;
    const i = (seen.get(k) ?? 0) + 1;
    seen.set(k, i);
    r.run = i;
    r.runsForSkill = counts.get(k);
  }

  const billedRows = rows.filter((r) => r.billed);
  const priced = billedRows.filter((r) => r.price?.usd != null);
  const sum = (list, f) => list.reduce((a, r) => a + (f(r) ?? 0), 0);
  const totals = {
    skill_runs: rows.filter((r) => r.kind === "leaf").length,
    orchestrator_rows: rows.filter((r) => r.kind === "group").length,
    subagent_runs: sum(rows, (r) => r.subagents.length),
    api_calls: sum(billedRows, (r) => r.billed.api_calls),
    tool_uses: sum(billedRows, (r) => r.billed.tool_uses),
    tokens: sum(billedRows, (r) => r.billed.total),
    input: sum(billedRows, (r) => r.billed.input),
    output: sum(billedRows, (r) => r.billed.output),
    cache_read: sum(billedRows, (r) => r.billed.cache_read),
    cache_write: sum(billedRows, (r) => r.billed.cache_write),
    active_ms: sum(rows, (r) => r.activeMs),
    usd: priced.length ? sum(priced, (r) => r.price.usd) : null,
    unpriced_rows: billedRows.length - priced.length,
    unpriced_reasons: [...new Set(billedRows.filter((r) => r.price?.usd == null).map((r) => r.price?.reason))],
    rows_without_transcript: rows.filter((r) => r.noTranscript || !r.billed).length,
    restored_from_snapshot: restored,
    interrupted_subagents: sum(rows, (r) =>
      r.subagents.filter((a) => ["interrupted", "timed_out", "failed"].includes(a.status)).length,
    ),
  };

  // Wall clock of the latest session that touched this key: first launch -> last finish.
  let wall = null;
  const bySess = new Map();
  for (const r of rows) {
    const s = bySess.get(r.sessionId) ?? { starts: [], ends: [], runs: 0 };
    s.starts.push(r.start);
    if (r.wallEnd !== null) s.ends.push(r.wallEnd);
    else s.ends.push(r.start);
    s.runs += 1;
    bySess.set(r.sessionId, s);
  }
  const latest = [...bySess.entries()].sort((a, b) => Math.max(...b[1].starts) - Math.max(...a[1].starts))[0];
  if (latest) {
    const s = latest[1];
    const end = Math.max(...s.ends, bySession.get(latest[0])?.sessionEnd ?? 0);
    wall = { ms: end - Math.min(...s.starts), runs: s.runs, sessions: bySess.size };
  }
  return { key, rows, totals, wall };
}

/** All keys that have at least one row, newest first, with the row count. */
export function listKeys(projectDir) {
  const found = new Map();
  for (const s of loadAllSessions(projectDir)) {
    for (const r of analyzeSession(s.sessionId, s.events).rows) {
      const f = found.get(r.key) ?? { key: r.key, rows: 0, last: 0 };
      f.rows += 1;
      f.last = Math.max(f.last, r.start);
      found.set(r.key, f);
    }
  }
  return [...found.values()].sort((a, b) => b.last - a.last);
}
