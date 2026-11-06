#!/usr/bin/env node
/**
 * Run-metrics hook: records what happened, from outside the conversation. One script, several modes.
 *
 * An agent cannot measure itself, and the caller only sees the agent's text. Ported from the mock's
 * `agent-metrics.mjs` (same philosophy: the hook only RECORDS events, the report reads the real bill off
 * the transcripts), extended because here the stages are skills in the main session, not subagents:
 *
 *   --skill-start  PreToolUse   (Skill)       a skill launched by the model (the orchestrators do this)
 *   --turn-start   UserPromptSubmit           a user turn begins (needed for ACTIVE time); ALSO the only
 *                                             place a skill the user TYPED (`/expl1-3-qa-checklist …`) is
 *                                             visible, because a slash command is not a Skill tool call
 *   --turn-end     Stop                       the turn ended; prints a one-line SKILL_RUN_METRICS summary
 *   --pre          PreToolUse   (Task|Agent)  a subagent launch  (expl-bot-researcher / expl-bot-tester)
 *   --post         PostToolUse  (Task|Agent)  the subagent finished — or, in the background, was launched
 *   --failed       PostToolUseFailure         the subagent was interrupted / failed / timed out
 *
 * Events go to `.workflow-artifacts/metrics/_events/<session_id>.jsonl`. Nothing is priced here: a skill's
 * cost is the assistant messages of the main transcript inside its window, and a subagent's cost is its own
 * transcript, and `lib/report-model.mjs` sums them when asked. Recording only means a crash, a resume in a
 * new chat or a late background agent can never leave a wrong number behind — only a missing transcript,
 * which the report counts instead of guessing.
 *
 * Events are only kept for sessions that launched at least one skill (the file is created by the first
 * `--skill-start`), so an unrelated chat in this repository costs nothing.
 *
 * NEVER FAILS A TOOL CALL. Every path exits 0, and silence is not one of the paths: every early return
 * writes a line to `.workflow-artifacts/metrics/_diagnostics.jsonl` saying which one it was (the mock's
 * hook once recorded nothing for its whole life because its guards returned silently).
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveProjectDir, eventsDir, eventsFile, sidecarFile, diagnosticsFile } from "./lib/paths.mjs";
import { isSkillTool, isSubagentTool, looksLikeSubagentLaunch } from "./lib/tracked-tools.mjs";
import { analyzeSession, buildKeyReport, readEvents, loadSnapshot } from "./lib/report-model.mjs";
import { saveReport } from "./lib/report-render.mjs";
import { formatUsd } from "./lib/pricing.mjs";

const DIAGNOSTICS_CAP = 200;
const DIAGNOSTICS_KEEP = 100;

function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

/** Say why nothing was recorded. Own try/catch and capped: a diagnostics failure must never fail a call. */
function writeDiag(projectDir, entry) {
  try {
    const file = diagnosticsFile(projectDir);
    mkdirSync(path.dirname(file), { recursive: true });
    let lines = existsSync(file) ? readFileSync(file, "utf8").split("\n").filter((l) => l.trim()) : [];
    lines.push(JSON.stringify({ ts: new Date().toISOString(), ...entry }));
    if (lines.length > DIAGNOSTICS_CAP) lines = lines.slice(-DIAGNOSTICS_KEEP);
    writeFileSync(file, `${lines.join("\n")}\n`, "utf8");
  } catch {
    /* a diagnostic that cannot be written is not worth failing a run over */
  }
}

function bail(projectDir, reason, payload, extra = {}) {
  writeDiag(projectDir, {
    reason,
    mode: extra.mode ?? null,
    tool_name: payload?.tool_name ?? null,
    tool_use_id: payload?.tool_use_id ?? null,
    hook_event: payload?.hook_event_name ?? null,
    payload_keys: payload && typeof payload === "object" ? Object.keys(payload) : [],
    input_keys:
      payload?.tool_input && typeof payload.tool_input === "object" ? Object.keys(payload.tool_input) : [],
    ...extra,
  });
}

function appendEvent(projectDir, sessionId, event) {
  mkdirSync(eventsDir(projectDir), { recursive: true });
  appendFileSync(
    eventsFile(projectDir, sessionId),
    `${JSON.stringify({ ts: new Date().toISOString(), session_id: sessionId, ...event })}\n`,
    "utf8",
  );
}

const sessionHasEvents = (projectDir, sessionId) => existsSync(eventsFile(projectDir, sessionId));

// ---------------------------------------------------------------------------------------------
// Modes
// ---------------------------------------------------------------------------------------------

function runSkillStart(payload, projectDir, sessionId) {
  const skill = payload?.tool_input?.skill;
  if (typeof skill !== "string" || !skill) {
    bail(projectDir, "skill_name_missing", payload, { mode: "skill-start" });
    return;
  }
  // The first skill of a session creates the log. The turn that launched it began BEFORE this event, and
  // `--turn-start` could not log it (no file yet) — so it left a sidecar, which is replayed here.
  if (!sessionHasEvents(projectDir, sessionId)) {
    try {
      const side = JSON.parse(readFileSync(sidecarFile(projectDir, sessionId), "utf8"));
      appendEvent(projectDir, sessionId, { type: "turn_start", ...side, ts: side.ts });
    } catch {
      /* no sidecar: the first turn's active time will read as zero, which the report can live with */
    }
  }
  appendEvent(projectDir, sessionId, {
    type: "skill_start",
    tool_use_id: payload?.tool_use_id ?? null,
    skill,
    args: typeof payload?.tool_input?.args === "string" ? payload.tool_input.args : "",
    transcript_path: payload?.transcript_path ?? null,
    cwd: payload?.cwd ?? null,
    payload_keys: Object.keys(payload ?? {}),
    input_keys: Object.keys(payload?.tool_input ?? {}),
  });
}

/**
 * A skill the user TYPED (`/expl1-3-qa-checklist TASK-114`) is not a Skill tool call: the harness expands it
 * into the user message itself, so no PreToolUse(Skill) ever fires for it. It is only visible here, in the
 * prompt of UserPromptSubmit. Only names of skills that exist in this project count — `/help`, `/clear`
 * and friends are built-in commands, not skills, and must not open a row.
 */
function typedSkill(payload, projectDir) {
  const prompt = typeof payload?.prompt === "string" ? payload.prompt : "";
  const m = prompt.match(/^\s*\/([A-Za-z0-9][A-Za-z0-9_.-]*)(?:\s+([\s\S]*))?$/);
  if (!m) return null;
  if (!existsSync(path.join(projectDir, ".claude", "skills", m[1], "SKILL.md"))) return null;
  return { skill: m[1], args: (m[2] ?? "").trim() };
}

function runTurnStart(payload, projectDir, sessionId) {
  const side = { ts: new Date().toISOString(), transcript_path: payload?.transcript_path ?? null };
  mkdirSync(eventsDir(projectDir), { recursive: true });
  writeFileSync(sidecarFile(projectDir, sessionId), JSON.stringify(side), "utf8");
  const typed = typedSkill(payload, projectDir);
  if (sessionHasEvents(projectDir, sessionId) || typed) {
    appendEvent(projectDir, sessionId, { type: "turn_start", transcript_path: side.transcript_path });
  }
  if (typed) {
    appendEvent(projectDir, sessionId, {
      type: "skill_start",
      via: "slash_command",
      tool_use_id: `slash-${Date.now()}`,
      skill: typed.skill,
      args: typed.args,
      transcript_path: payload?.transcript_path ?? null,
      cwd: payload?.cwd ?? null,
    });
  }
}

/** The one line a user (and the orchestrator's final report) reads after a turn. */
export function summaryLine(row, report) {
  const mine = report.rows.find((r) => r.rowId === row.rowId) ?? row;
  const secs = (v) => `${(v / 1000).toFixed(1)}s`;
  const cost = (r) => (r.price?.usd != null ? formatUsd(r.price.usd) : "unavailable");
  const name = mine.kind === "group" ? `${mine.skill} (own turns)` : mine.skill;
  const t = report.totals;
  return (
    `SKILL_RUN_METRICS: skill=${name} key=${mine.key} run=${mine.run ?? 1}/${mine.runsForSkill ?? 1} ` +
    `model=${mine.billed?.model ?? "unavailable"} active=${secs(mine.activeMs)} ` +
    `tokens=${mine.billed ? mine.billed.total.toLocaleString("en-US") : "unavailable"} cost=${cost(mine)} ` +
    `api_calls=${mine.billed ? mine.billed.api_calls : "unavailable"} ` +
    `tool_uses=${mine.billed ? mine.billed.tool_uses : "unavailable"} subagents=${mine.subagents.length} ` +
    `| ${t.orchestrator_rows ? "orchestrator" : "key"} total so far: tokens=${t.tokens.toLocaleString("en-US")} ` +
    `cost=${t.usd === null ? "unavailable" : formatUsd(t.usd)} active=${secs(t.active_ms)}`
  );
}

function runTurnEnd(payload, projectDir, sessionId) {
  if (!sessionHasEvents(projectDir, sessionId)) return; // no skill ran in this session
  appendEvent(projectDir, sessionId, { type: "turn_end", transcript_path: payload?.transcript_path ?? null });

  const { rows } = analyzeSession(sessionId, readEvents(eventsFile(projectDir, sessionId)));
  if (rows.length === 0) return;
  // The current row is the one whose last slice ends latest (an orchestrator's between-stage turns count).
  const lastEnd = (r) => Math.max(...r.slices.map((s) => s.end));
  const current = rows.reduce((a, b) => (lastEnd(b) >= lastEnd(a) ? b : a));
  const report = buildKeyReport(projectDir, current.key, { snapshot: loadSnapshot(projectDir, current.key) });

  // Save the snapshot next to the key's artifacts after EVERY turn: a typed `/skill` has no orchestrator to
  // run `--save`, and the last Stop of a stage is then the final state. A failed write is a diagnostic, never
  // a failed turn.
  let savedNote = "";
  try {
    const saved = saveReport(projectDir, report, current.key);
    savedNote = saved
      ? ` | saved=${path.relative(projectDir, saved.md).replace(/\\/g, "/")}`
      : ` | saved=no (key ${current.key} has no artifact folder)`;
  } catch (err) {
    bail(projectDir, "save_failed", payload, { mode: "turn-end", message: String(err?.message ?? err) });
    savedNote = " | saved=failed (see _diagnostics.jsonl)";
  }
  process.stdout.write(JSON.stringify({ systemMessage: summaryLine(current, report) + savedNote }));
}

function runAgentPre(payload, projectDir, sessionId) {
  if (!sessionHasEvents(projectDir, sessionId)) return;
  if (!payload?.tool_use_id) {
    bail(projectDir, "no_tool_use_id", payload, { mode: "pre" });
    return;
  }
  appendEvent(projectDir, sessionId, {
    type: "agent_pre",
    tool_use_id: payload.tool_use_id,
    agent: payload?.tool_input?.subagent_type ?? "unknown",
    description: payload?.tool_input?.description ?? "",
  });
}

/** The harness may hand the result back as the object, as `{ toolUseResult }`, or as raw content. */
function responseOf(payload) {
  for (const c of [payload?.tool_response, payload?.toolUseResult, payload?.tool_result]) {
    if (c && typeof c === "object" && !Array.isArray(c)) return c;
  }
  return null;
}

function runAgentPost(payload, projectDir, sessionId) {
  if (!sessionHasEvents(projectDir, sessionId)) return;
  const response = responseOf(payload);
  if (!response) {
    bail(projectDir, "no_result", payload, { mode: "post" });
    return;
  }
  // A background agent returns from the tool call at once: `isAsync`, an `agentId`, no cost. The report
  // finishes it from its transcript later; the launch is recorded as a completion with `async: true`.
  appendEvent(projectDir, sessionId, {
    type: "agent_post",
    tool_use_id: payload?.tool_use_id ?? null,
    agent: response.agentType ?? payload?.tool_input?.subagent_type ?? "unknown",
    status: response.isAsync === true ? "background" : (response.status ?? "unknown"),
    async: response.isAsync === true,
    agent_id: response.agentId ?? null,
    duration_ms: response.totalDurationMs ?? payload?.duration_ms ?? null,
    tool_uses: response.totalToolUseCount ?? null,
  });
}

function runAgentFailed(payload, projectDir, sessionId) {
  if (!sessionHasEvents(projectDir, sessionId)) return;
  appendEvent(projectDir, sessionId, {
    type: "agent_failed",
    tool_use_id: payload?.tool_use_id ?? null,
    agent: payload?.tool_input?.subagent_type ?? "unknown",
    status: payload?.is_interrupt ? "interrupted" : payload?.is_timeout ? "timed_out" : "failed",
    duration_ms: payload?.duration_ms ?? null,
    error: payload?.error ?? null,
  });
}

const MODES = {
  "--skill-start": "skill-start",
  "--turn-start": "turn-start",
  "--turn-end": "turn-end",
  "--pre": "pre",
  "--failed": "failed",
  "--post": "post",
};

function main() {
  const mode = Object.entries(MODES).find(([flag]) => process.argv.includes(flag))?.[1] ?? "post";

  const raw = readStdin();
  if (!raw.trim()) {
    bail(resolveProjectDir(null), "no_stdin", null, { mode });
    return;
  }
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    bail(resolveProjectDir(null), "bad_json", null, { mode, bytes: raw.length });
    return;
  }

  const projectDir = resolveProjectDir(payload);
  const sessionId = payload?.session_id;
  if (!sessionId) {
    bail(projectDir, "no_session_id", payload, { mode });
    return;
  }

  if (mode === "turn-start") return runTurnStart(payload, projectDir, sessionId);
  if (mode === "turn-end") return runTurnEnd(payload, projectDir, sessionId);

  if (mode === "skill-start") {
    if (!isSkillTool(payload?.tool_name)) {
      bail(projectDir, "not_a_skill_tool", payload, { mode });
      return;
    }
    return runSkillStart(payload, projectDir, sessionId);
  }

  if (!isSubagentTool(payload?.tool_name)) {
    // A broad matcher legitimately delivers other tools; a payload shaped like a subagent launch under a
    // name this hook does not know means the wiring has rotted — that one is news.
    if (looksLikeSubagentLaunch(payload)) bail(projectDir, "unrecognised_subagent_tool", payload, { mode });
    return;
  }
  if (mode === "pre") runAgentPre(payload, projectDir, sessionId);
  else if (mode === "failed") runAgentFailed(payload, projectDir, sessionId);
  else runAgentPost(payload, projectDir, sessionId);
}

const invokedDirectly =
  Boolean(process.argv[1]) && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (invokedDirectly) {
  try {
    main();
  } catch (err) {
    bail(resolveProjectDir(null), "threw", null, {
      message: String(err?.message ?? err),
      stack: String(err?.stack ?? "").split("\n").slice(0, 3).join(" | "),
    });
  }
  process.exit(0);
}
