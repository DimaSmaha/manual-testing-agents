// Feedback-loop gate for the expl1 stage artifacts (write trigger).
//
//   node .claude/hooks/artifact-gate.mjs        (PostToolUse hook input JSON on stdin)
//
// Registered in .claude/settings.json as a PostToolUse hook on Write|Edit, with two `if:` file matchers per artifact:
// `Write(**/*-<stage>.md)` and `Edit(**/*-<stage>.md)` (the tool name is matched literally and a leading-slash path never
// matched); this script filters by file name too and is a silent no-op for other files. Because it is a project hook (not a skill-frontmatter hook) it fires the same way when a stage runs from
// expl1-orchestrator (inline, through the Skill tool) or on its own (/expl1-2-requirements-grooming …), and for
// every later Write/Edit of the file, including the agent's own fixes.
//
// Config: .claude/hooks/artifact-gate.json — one entry per artifact file-name suffix after "<ISSUEKEY>-":
//   "2-requirements.md": { "skill": …, "validator": "lib/validate-requirements.mjs", "max_retries": 3 }
//   "4-test-cases.md":   { …, "validator": "lib/validate-test-cases.mjs",
//                          "reviewer": { "agent": "expl1-test-cases-reviewer", "timeout_ms": 240000 } }
//
// Layers, cheapest first — the reviewer subagent is called only for a finished file that passed the script layer:
//   1. validator (script) `validateArtifact(absPath) → { errors, warnings?, unverified?, pending?, source?, inputs?, fixHint? }`
//        unverified → the ground-truth file (the previous stage's artifact) is not next to it: status UNVERIFIED,
//                     systemMessage for the user, no block, no retry spent
//        pending    → the file is not finished yet (stages 4 and 8: no "## Statistics" section): status PENDING,
//                     silent, nothing else runs — so a stage that writes in pieces is not reviewed on every piece
//        errors     → feedback (block) without calling the reviewer
//   2. reviewer (optional) — .claude/agents/<agent>.md run through `claude -p --agent` (lib/review-subagent.mjs).
//        Verdict cache: the same agent rules + artifact + ground truth (sha256) in the same session → the last verdict
//        is reused, no model call (`cached: true`). Reviewer could not run → UNVERIFIED, not a retry.
//
// Feedback: {"decision":"block","reason":…} on stdout (exit 0). The file is already written; the reason is shown
// next to the Write/Edit result, so the agent sees it straight away and fixes the file in place.
// Bounded loop per (session, run folder, artifact): up to max_retries feedback blocks, then one last block asking for a
// "<NAME> VALIDATION FAILED after N retries — <path>" reply, then no more feedback (later writes re-validate silently,
// so the status can still flip to PASSED). A PASS resets the count: a later failure is a new problem.
// Progress is free: a script-layer failure with fewer problems than the previous script-layer check still gets
// feedback but does not use up a retry (stage 8 adding executed test cases one by one must not hit FAILED).
// Status: <run_dir>/<ISSUEKEY>-<stage>.validation.json (latest check, overwritten)   State + log: .workflow-artifacts/.hook-state/
// History: <run_dir>/validations/<ISSUEKEY>-<stage>.validation-<NNN>.json — one numbered file per check (PENDING, RETRYING,
//          PASSED, FAILED, UNVERIFIED alike), never overwritten, so every validation the loop ran stays on disk.
// Every path exits 0: a gate bug never wedges the session (it is reported as a systemMessage instead).
// Recursion guard: EXPL1_REVIEW_CHILD=1 (set for the nested reviewer session) makes this gate a no-op.
// Test cases: .claude/hooks/test/run-artifact-gate-cases.mjs (npm run test:artifact-gate).
// Ported from the artifact-gate / us-json-gate / tc-gate of user-story-to-test-case-agent-generator (write trigger only).

import { readFileSync, writeFileSync, appendFileSync, mkdirSync, readdirSync } from "node:fs";
import { join, dirname, relative, isAbsolute, resolve } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolveProjectDir } from "./lib/paths.mjs";
import { reviewWithSubagent, REVIEW_TIMEOUT_MS } from "./lib/review-subagent.mjs";

const HOOKS_DIR = dirname(fileURLToPath(import.meta.url));
// ARTIFACT_GATE_CONFIG: test seam — lets a runner point the gate at another config without editing the real one.
const CONFIG_PATH = process.env.ARTIFACT_GATE_CONFIG ? resolve(process.env.ARTIFACT_GATE_CONFIG) : join(HOOKS_DIR, "artifact-gate.json");
const WRITE_TOOLS = new Set(["Write", "Edit", "MultiEdit"]);
const ARTIFACT_NAME = /^((?:TASK|BUG)-\d+)-(.+)$/i;
const DEFAULT_MAX_RETRIES = 3;
const MAX_LISTED_ERRORS = 20;

let projectDir = process.cwd();
let stateDir = join(projectDir, ".workflow-artifacts", ".hook-state");
let logContext = {};

async function main() {
  const input = parseJson(readStdin()) ?? {};
  if (input.tool_name && !WRITE_TOOLS.has(input.tool_name)) return;
  const fp = input.tool_input?.file_path;
  if (typeof fp !== "string" || fp === "") return;

  // ── 1. Is this a configured stage artifact in a run folder ─────────────────
  const name = fileName(fp);
  const m = ARTIFACT_NAME.exec(name);
  if (!m) return;
  const config = loadConfig();
  const suffix = Object.keys(config).find((s) => s.toLowerCase() === m[2].toLowerCase());
  if (!suffix) return; // another stage's file: no output, no log

  projectDir = resolve(resolveProjectDir(input));
  stateDir = join(projectDir, ".workflow-artifacts", ".hook-state");
  const filePath = resolve(projectDir, fp);
  const runDir = runDirOf(filePath);
  if (!runDir) return; // not .workflow-artifacts/<folder>/<file>

  const entry = config[suffix];
  const sessionId = String(input.session_id || "unknown");
  const rel = toRel(filePath);
  const stem = name.replace(/\.md$/i, ""); // TASK-114-2-requirements
  const label = suffix.replace(/^\d+-/, "").replace(/\.md$/i, "").toUpperCase(); // REQUIREMENTS
  const maxRetries = Number.isInteger(entry.max_retries) && entry.max_retries >= 0 ? entry.max_retries : DEFAULT_MAX_RETRIES;
  logContext = { artifact: name, path: rel, session_id: sessionId };

  // ── 2. Retry state (per session + run folder + artifact) ───────────────────
  const statePath = join(stateDir, `artifact-gate-${safe(runDir.id)}-${safe(stem)}.json`);
  let state = parseJson(readOrNull(statePath));
  if (!state || state.session_id !== sessionId) state = { attempts: 0, reported: false, session_id: sessionId };
  const saveState = () => writeJson(statePath, { ...state, path: rel, updated_at: new Date().toISOString() });

  // ── 3. Layer 1: script ─────────────────────────────────────────────────────
  const v = await runValidator(entry.validator, filePath);
  const validationPath = join(runDir.dir, `${stem}.validation.json`);
  const validationRel = toRel(validationPath);
  let layer = "script";
  let checkedBy = `script .claude/hooks/${entry.validator}`;
  let notes = v.errors;
  let review = {}; // review_ms, review_cost_usd, cached

  // Every check writes two files: the latest status `<stem>.validation.json` (overwritten, read by the orchestrators)
  // and a numbered history file `validations/<stem>.validation-<NNN>.json` that is never overwritten.
  const record = (status, extra = {}) => {
    const body = {
      status,
      retries: state.attempts,
      max_retries: maxRetries,
      layer,
      checked_by: checkedBy,
      checked_against: v.source ?? null,
      path: rel,
      notes,
      ...(v.warnings.length ? { warnings: v.warnings } : {}),
      ...review,
      ...extra,
      checked_at: new Date().toISOString(),
    };
    let historyRel = null;
    try {
      const historyDir = join(runDir.dir, "validations");
      const seq = nextSequence(historyDir, stem);
      const historyPath = join(historyDir, `${stem}.validation-${String(seq).padStart(3, "0")}.json`);
      historyRel = toRel(historyPath);
      writeJson(historyPath, { sequence: seq, tool: input.tool_name ?? null, session_id: sessionId, ...body });
      body.sequence = seq;
      body.history = historyRel;
    } catch {
      /* the history must never break the gate; the latest status below is still written */
    }
    writeJson(validationPath, body);
  };

  if (v.unverified) {
    notes = [];
    record("UNVERIFIED", { unverified: v.unverified });
    log({ result: "UNVERIFIED", layer, reason: v.unverified });
    emit({ systemMessage: `${name} NOT VERIFIED by the feedback loop: ${v.unverified}` });
    return;
  }
  if (v.pending) {
    record("PENDING", { pending: v.pending });
    log({ result: "PENDING", reason: v.pending });
    return; // silent: the stage is still writing the file
  }

  // ── 4. Layer 2: reviewer subagent (only when the script layer passed) ──────
  if (notes.length === 0 && entry.reviewer?.agent) {
    const agent = entry.reviewer.agent;
    layer = "reviewer";
    checkedBy = `reviewer subagent ${agent} (.claude/agents/${agent}.md)`;
    const digest = digestOf([join(projectDir, ".claude", "agents", `${agent}.md`), filePath, ...(v.inputs ?? [])]);
    if (digest && state.last_review?.digest === digest) {
      notes = state.last_review.notes;
      review = { cached: true };
    } else {
      const t0 = Date.now();
      const sourceRel = v.inputs?.[0] ? toRel(v.inputs[0]) : null;
      const r = await reviewWithSubagent({
        projectDir,
        agent,
        prompt: `Review ${rel}.${sourceRel ? ` Its ground truth is ${sourceRel} in the same folder.` : ""} Read both files in full, apply your rules, and return the verdict.`,
        timeoutMs: Number.isInteger(entry.reviewer.timeout_ms) ? entry.reviewer.timeout_ms : REVIEW_TIMEOUT_MS,
      });
      review = { cached: false, review_ms: Date.now() - t0 };
      if ("error" in r) {
        record("UNVERIFIED", { reviewer_error: r.error });
        log({ result: "UNVERIFIED", layer, reviewer_error: r.error, ...review });
        emit({ systemMessage: `${name}: the reviewer ${agent} could not run (not counted as a retry): ${r.error}` });
        return;
      }
      review.review_cost_usd = r.cost_usd;
      notes = r.verdict === "FAIL" ? (r.notes.length ? r.notes : ["reviewer returned FAIL without notes"]) : [];
      if (digest) state.last_review = { digest, notes };
      saveState();
    }
  }

  // ── 5. Decide ──────────────────────────────────────────────────────────────
  if (notes.length === 0) {
    record("PASSED"); // retries = feedback rounds this fix took
    log({ result: "PASSED", layer, retries: state.attempts, ...review, ...(v.warnings.length ? { warnings: v.warnings } : {}) });
    // A pass ends the failure episode: a later failure (another edit, same session) starts at retry 1 again.
    if (state.attempts || state.reported || state.last_count !== undefined) {
      state = { attempts: 0, reported: false, session_id: sessionId, ...(state.last_review ? { last_review: state.last_review } : {}) };
      saveState();
    }
    if (v.warnings.length) emit({ systemMessage: `${name} PASSED, but some checks were skipped: ${v.warnings.join("; ")}` });
    return;
  }

  // Failure already reported: no more feedback, keep the status current.
  if (state.reported) {
    record("FAILED");
    log({ result: "FAILED_SILENT", layer, retries: state.attempts, notes, ...review });
    return;
  }

  // Progress on the script layer is free: fewer problems than the last script check → feedback, no retry used.
  const progress = layer === "script" && state.last_layer === "script" && Number.isInteger(state.last_count) && notes.length < state.last_count;
  const before = state.last_count;
  state.last_count = notes.length;
  state.last_layer = layer;

  const listed = listErrors(notes, entry.validator, rel, layer);
  const against = v.source ? ` against ${v.source}` : "";
  const hint = typeof v.fixHint === "function" ? v.fixHint({ name, source: v.source ?? "the input file", rel }) : defaultFixHint(name, v.source);
  const nextLayer =
    layer === "script" && entry.reviewer?.agent
      ? [`When these script checks pass, the reviewer subagent ${entry.reviewer.agent} reviews the content of the finished file.`]
      : [];
  const cachedLine = review.cached
    ? [`The files are unchanged since the last review, so its verdict was reused — change the file to get a new review.`]
    : [];

  if (progress || state.attempts < maxRetries) {
    if (!progress) state.attempts += 1;
    saveState();
    record("RETRYING", progress ? { progress: `${before} → ${notes.length} problems` } : {});
    log({ result: progress ? "BLOCK_PROGRESS" : "BLOCK", layer, retries: state.attempts, notes, ...review });
    block(
      [
        progress
          ? `${name} validation FAILED (progress: ${before} → ${notes.length} problems, not counted as a retry; ${state.attempts}/${maxRetries} retries used) — ${rel}`
          : `${name} validation FAILED (retry ${state.attempts}/${maxRetries}) — ${rel}`,
        `Checked by: ${checkedBy}${against}`,
        ...listed,
        ``,
        ...cachedLine,
        ...hint,
        ...nextLayer,
      ].join("\n"),
    );
    return;
  }

  // Retries used up: one last block asking for a failure report; `reported` silences later runs.
  state.reported = true;
  saveState();
  record("FAILED");
  log({ result: "FAILED", layer, retries: state.attempts, notes, ...review });
  block(
    [
      `${name} validation FAILED — all ${maxRetries} retries are used up — ${rel}`,
      `Checked by: ${checkedBy}${against}`,
      `Stop fixing it and do not continue with work that depends on it. Reply now with a message starting with this line:`,
      `${label} VALIDATION FAILED after ${maxRetries} retries — ${rel}`,
      `followed by these unresolved problems:`,
      ...listed,
      `Details: ${validationRel}`,
    ].join("\n"),
    `${name} still invalid after ${maxRetries} retries — see ${validationRel}`,
  );
}

// ── feedback ────────────────────────────────────────────────────────────────

function block(reason, systemMessage) {
  emit({ decision: "block", reason, ...(systemMessage ? { systemMessage } : {}) });
}

function defaultFixHint(name, source) {
  return [
    `Fix ${name} in place (same folder, same path) so every point above is resolved.${source ? ` Do not edit ${source}.` : ""}`,
    `If something outside your control blocks the fix (e.g. ${source ?? "the input file"} itself is wrong, or a tool is denied), stop and tell the user why instead.`,
  ];
}

function listErrors(errors, validator, rel, layer) {
  const shown = errors.slice(0, MAX_LISTED_ERRORS).map((e) => `- ${e}`);
  if (errors.length > MAX_LISTED_ERRORS) {
    const where = layer === "script" ? `full list: node .claude/hooks/${validator} "${rel}"` : "full list in the .validation.json file";
    shown.push(`- … and ${errors.length - MAX_LISTED_ERRORS} more (${where})`);
  }
  return shown;
}

async function runValidator(validator, absPath) {
  if (typeof validator !== "string" || !validator) throw new Error('config entry has no "validator" module path');
  const mod = await import(pathToFileURL(join(HOOKS_DIR, validator)).href);
  if (typeof mod.validateArtifact !== "function") throw new Error(`${validator} does not export validateArtifact(absPath)`);
  const res = await mod.validateArtifact(absPath);
  return {
    errors: res?.errors ?? [],
    warnings: res?.warnings ?? [],
    unverified: res?.unverified ?? null,
    pending: res?.pending ?? null,
    source: res?.source ?? null,
    inputs: res?.inputs ?? [],
    fixHint: res?.fixHint ?? null,
  };
}

/** sha256 of the files a review depends on (agent rules, artifact, ground truth); null if one cannot be read. */
function digestOf(paths) {
  const hash = createHash("sha256");
  for (const p of paths) {
    const text = readOrNull(p);
    if (text === null) return null;
    hash.update(`${toRel(p)}\0${text.replace(/\r\n/g, "\n")}\0`);
  }
  return hash.digest("hex");
}

/** { dir, id } when absPath is .workflow-artifacts/<folder…>/<file> (no dot-folders such as .hook-state), else null. */
function runDirOf(absPath) {
  const parts = toRel(absPath).split("/");
  if (parts[0] !== ".workflow-artifacts" || parts.length < 3) return null;
  const dirs = parts.slice(1, -1);
  if (dirs.some((d) => d === "" || d.startsWith("."))) return null;
  return { dir: dirname(absPath), id: dirs.join("/") };
}

// ── io helpers ──────────────────────────────────────────────────────────────

function loadConfig() {
  const config = parseJson(readOrNull(CONFIG_PATH));
  if (!config || typeof config !== "object" || Array.isArray(config)) throw new Error(`cannot read config ${CONFIG_PATH}`);
  return config;
}

function log(fields) {
  try {
    mkdirSync(stateDir, { recursive: true });
    appendFileSync(join(stateDir, "artifact-gate.log"), JSON.stringify({ ts: new Date().toISOString(), ...logContext, ...fields }) + "\n");
  } catch {
    /* logging must never break the gate */
  }
}

function emit(obj) {
  process.stdout.write(JSON.stringify(obj) + "\n");
}

/** Next number for `<stem>.validation-<NNN>.json` in the history folder (1 when there is none yet). */
function nextSequence(historyDir, stem) {
  let max = 0;
  try {
    const prefix = `${stem}.validation-`;
    for (const f of readdirSync(historyDir)) {
      if (!f.startsWith(prefix)) continue;
      const n = Number.parseInt(f.slice(prefix.length), 10);
      if (Number.isInteger(n) && n > max) max = n;
    }
  } catch {
    /* folder does not exist yet */
  }
  return max + 1;
}

function writeJson(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(obj, null, 2) + "\n");
}

function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function readOrNull(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
}

function parseJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text.replace(/^\uFEFF/, ""));
  } catch {
    return null;
  }
}

function fileName(p) {
  return p.split(/[\\/]/).pop();
}

function toRel(p) {
  const r = isAbsolute(p) ? relative(projectDir, p) : p;
  return r.split("\\").join("/");
}

function safe(s) {
  return String(s).replace(/[^\w.-]/g, "_");
}

// ── entry (last, so every module-level const above is initialised) ──────────

// Recursion guard: the nested reviewer session must never run this gate.
if (!process.env.EXPL1_REVIEW_CHILD) {
  main().catch((e) => {
    // Never wedge the session on a gate bug: allow, but say so.
    emit({ systemMessage: `artifact-gate crashed (allowed): ${e?.message ?? e}` });
    log({ result: "GATE_ERROR", error: String(e?.stack ?? e) });
    process.exitCode = 0;
  });
}
