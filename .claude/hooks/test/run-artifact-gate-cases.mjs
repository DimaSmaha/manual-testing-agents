// Offline test cases for the expl1 feedback loops (.claude/hooks/artifact-gate.mjs, write trigger):
//   requirements — loop 1: <KEY>-2-requirements.md against <KEY>-1-context.md   (script: lib/validate-requirements.mjs)
//   checklist    — loop 2: <KEY>-3-checklist.md against <KEY>-2-requirements.md (script: lib/validate-checklist.mjs)
//   test-cases   — loop 3: <KEY>-4-test-cases.md against <KEY>-3-checklist.md   (script: lib/validate-test-cases.mjs,
//                          then the reviewer subagent .claude/agents/expl1-test-cases-reviewer.md)
//   web-testing  — loop 4: <KEY>-8-web-testing.md against <KEY>-4-test-cases.md (script: lib/validate-web-testing.mjs,
//                          then the reviewer subagent .claude/agents/expl1-web-testing-reviewer.md)
//
//   node .claude/hooks/test/run-artifact-gate-cases.mjs [--artifact <kind>[,<kind>]] [--reviewer fake|real]
//                                                       [--case <substr>[,<substr>]] [--verbose] [--keep] [--json <out.json>]
//   npm run test:artifact-gate                 # all loops, fake reviewer (free, deterministic, seconds)
//   npm run test:artifact-gate:real            # loops 3-4 with the real reviewer subagents (model calls, minutes, costs)
//
// Reviewer: "fake" (default) points CLAUDE_BIN at fake-claude.mjs, which judges a file only by
// <!-- fake-review: FAIL … --> markers — it tests the loop mechanics (layers, cache, retries, UNVERIFIED). "real" runs
// `claude -p --agent <reviewer>` like the live hook — it tests the reviewers themselves against labelled examples:
// a mismatch is a false pass (missed a labelled defect) or a false fail (flagged a correct file).
//
// No skill runs here — the runner plays the agent. fixtures/<kind>/_base/ holds a valid run folder built from the real
// TASK-114 run: the ground-truth file and the artifact. Each case folder holds case.json and, optionally, its own copy
// of a _base file (a full override):
//   description   what the case is about
//   edits         [{ find, replace }] applied to the _base artifact → the "bad" version (each find must occur once)
//   versions      { name: [{ find, replace }] } more named versions, each built from the _base artifact
//   fix           true → after a BLOCK the "agent" writes the clean _base artifact (closes the loop)
//   writes        explicit sequence of versions to write, e.g. ["bad", "fixed", "bad"] (overrides fix)
//   remove        ground-truth files left out of the run folder
//   location      "outside" → the run folder is under .workflow-artifacts/.hook-test/ (a dot-folder, not a run folder)
//   env           extra environment for the gate (e.g. CLAUDE_BIN pointing nowhere)
//   expect        outcome sequence (one per gate call) for every reviewer mode, or { fake: [...], real: [...] }
//   skip_reason   { fake|real: why the case does not apply to that reviewer mode }
//   assert        { retries, notes_count, notes_match, reason_includes, last_reason_includes,
//                   reviewer_calls (fake only), cached, layers }
// Each written version = one PostToolUse(Write) call of the real gate.
// Outcomes:
//   PASS        status PASSED                        BLOCK       feedback, status RETRYING
//   FINAL       feedback, status FAILED (retries used up: "reply with the failure report")
//   SILENT      no feedback, status FAILED           UNVERIFIED  ground truth missing or the reviewer could not run
//   PENDING     status PENDING: the file is not finished yet (no "## Statistics"), nothing checked
//   IGNORED     not a run-folder artifact, no status written
//   GATE_ERROR  the gate crashed or exited non-zero
// Exit code 1 on any mismatch.

import { writeFileSync, mkdirSync, rmSync, existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import {
  HERE, ROOT, ARTIFACTS, OUTSIDE, STATE_DIR, parseArgs, listCases, checkAsserts, mismatchKind, printRow, printSummary,
  removeOutsideDirIfEmpty, lastJsonLine, readJson, readOrNull, parseJson, fatal,
} from "./harness-lib.mjs";

const GATE = join(ROOT, ".claude", "hooks", "artifact-gate.mjs");
const FAKE_CLAUDE = join(HERE, "fake-claude.mjs");
const KINDS = {
  requirements: { artifact: "TASK-114-2-requirements.md", ground: ["TASK-114-1-context.md"] },
  checklist: { artifact: "TASK-114-3-checklist.md", ground: ["TASK-114-2-requirements.md"] },
  "test-cases": { artifact: "TASK-114-4-test-cases.md", ground: ["TASK-114-3-checklist.md"] },
  "web-testing": { artifact: "TASK-114-8-web-testing.md", ground: ["TASK-114-4-test-cases.md"] },
};
const REVIEWERS = ["fake", "real"];
const ENDS = new Set(["PASS", "IGNORED", "UNVERIFIED", "PENDING", "GATE_ERROR"]);

const args = parseArgs(process.argv.slice(2), { "--artifact": "artifact", "--reviewer": "reviewer" });
const reviewer = (args.reviewer ?? "fake").toLowerCase();
if (!REVIEWERS.includes(reviewer)) fatal(`--reviewer must be one of ${REVIEWERS.join("|")}, got "${reviewer}"`);
const kinds = args.artifact ? args.artifact.split(",").filter(Boolean) : Object.keys(KINDS);
for (const k of kinds) if (!Object.hasOwn(KINDS, k)) fatal(`--artifact must be one of ${Object.keys(KINDS).join("|")}, got "${k}"`);

console.log(`artifact-gate cases — reviewer: ${reviewer}${reviewer === "real" ? " (claude -p --agent: real model calls)" : " (fake-claude.mjs)"}`);

const all = [];
let anyCase = false;
try {
  for (const kind of kinds) {
    const fixtures = join(HERE, "fixtures", kind);
    const cases = listCases(fixtures, args.case);
    if (cases.length === 0) continue;
    anyCase = true;
    console.log(`\n${kind} (${KINDS[kind].artifact} against ${KINDS[kind].ground.join(", ")})\n`);
    const results = [];
    for (const name of cases) {
      const r = runCase(kind, fixtures, name);
      results.push(r);
      printRow(r, { verbose: args.verbose, width: 34 });
    }
    printSummary(results, kind);
    all.push(...results.map((r) => ({ kind, ...r })));
  }
} finally {
  if (!args.keep) removeOutsideDirIfEmpty();
}

if (!anyCase) fatal(`no fixture matches --case ${args.case?.join(",")}`);
if (args.json) writeFileSync(resolve(args.json), JSON.stringify({ reviewer, results: all }, null, 2) + "\n");
process.exit(all.some((r) => r.result === "MISMATCH") ? 1 : 0);

// ── one case ──────────────────────────────────────────────────────────────────

function runCase(kind, fixtures, name) {
  const { artifact, ground } = KINDS[kind];
  const dir = join(fixtures, name);
  const spec = readJson(join(dir, "case.json"));
  const expected = Array.isArray(spec.expect) ? spec.expect : spec.expect?.[reviewer];
  if (!Array.isArray(expected) || expected.length === 0) {
    return { name, result: "skipped", note: spec.skip_reason?.[reviewer] ?? `no expectation for the ${reviewer} reviewer` };
  }

  const runId = `gate-test-${kind}-${name}`;
  const runDir = spec.location === "outside" ? join(OUTSIDE, runId) : join(ARTIFACTS, runId);
  const target = join(runDir, artifact);
  const statusPath = join(runDir, artifact.replace(/\.md$/, ".validation.json"));
  const sessionId = `harness-${kind}-${name}-${Date.now()}`;
  const reviewLog = join(OUTSIDE, `${runId}.reviews.jsonl`);

  let versions;
  try {
    const clean = fixtureText(fixtures, dir, artifact);
    versions = { bad: applyEdits(clean, spec.edits ?? []), fixed: clean };
    for (const [v, edits] of Object.entries(spec.versions ?? {})) versions[v] = applyEdits(clean, edits);
  } catch (e) {
    return { name, expected, actual: [], result: "MISMATCH", kind: `fixture error: ${e.message}`, assert_errors: [], retries: null, ms: [], steps: [] };
  }

  rmSync(runDir, { recursive: true, force: true });
  mkdirSync(runDir, { recursive: true });
  mkdirSync(OUTSIDE, { recursive: true });
  rmSync(reviewLog, { force: true });
  for (const f of ground) if (!(spec.remove ?? []).includes(f)) writeFileSync(join(runDir, f), fixtureText(fixtures, dir, f));

  const steps = [];
  let fixApplied = false;
  try {
    for (let i = 0; i < expected.length; i++) {
      let version;
      if (spec.writes) {
        if (i >= spec.writes.length) break;
        version = spec.writes[i];
      } else if (spec.fix && !fixApplied && ["BLOCK", "FINAL"].includes(steps.at(-1)?.outcome)) {
        version = "fixed"; // the "agent" fixes the file in place
        fixApplied = true;
      } else {
        version = fixApplied ? "fixed" : "bad";
      }
      if (!Object.hasOwn(versions, version)) fatal(`${kind}/${name}: unknown version "${version}" in writes`);
      writeFileSync(target, versions[version]);
      const step = callGate({ sessionId, statusPath, target, env: gateEnv(spec, reviewLog) });
      step.label = spec.edits?.length || spec.versions ? `writes ${version} ${artifact}` : `writes ${artifact}`;
      steps.push(step);
      if (!spec.writes && ENDS.has(step.outcome)) break;
    }
  } finally {
    rmSync(join(STATE_DIR, `artifact-gate-${runId}-${artifact.replace(/\.md$/, "")}.json`), { force: true });
    if (!args.keep) rmSync(runDir, { recursive: true, force: true });
  }

  const reviewerCalls = reviewer === "fake" ? (readOrNull(reviewLog) ?? "").split("\n").filter(Boolean).length : null;
  if (!args.keep) rmSync(reviewLog, { force: true });

  const actual = steps.map((s) => s.outcome);
  const sameSequence = actual.join(" ") === expected.join(" ");
  const assertErrors = sameSequence ? checkAsserts(spec.assert ?? {}, steps, { reviewerCalls }) : [];
  const lastStatus = [...steps].reverse().find((s) => s.status)?.status ?? null;
  const reviewed = steps.filter((s) => s.status?.layer === "reviewer" && s.status?.cached === false);
  return {
    name,
    expected,
    actual,
    result: sameSequence && assertErrors.length === 0 ? "ok" : "MISMATCH",
    kind: sameSequence ? (assertErrors.length ? "assertion failed" : null) : mismatchKind(expected, actual),
    assert_errors: assertErrors,
    fix_applied: fixApplied,
    retries: lastStatus?.retries ?? null,
    reviews: reviewed.length,
    review_cost_usd: reviewed.reduce((n, s) => n + (s.status.review_cost_usd ?? 0), 0),
    ms: steps.map((s) => s.ms),
    steps: steps.map(({ outcome, ms, status, reason, label }) => ({ outcome, ms, label, layer: status?.layer ?? null, notes: status?.notes ?? [], reason })),
  };
}

/** Environment of one gate call: the reviewer mode, then the case's own overrides. */
function gateEnv(spec, reviewLog) {
  const env = { ...process.env, CLAUDE_PROJECT_DIR: ROOT };
  delete env.EXPL1_REVIEW_CHILD; // the gate is a no-op when this is set
  delete env.ARTIFACT_GATE_CONFIG;
  if (reviewer === "fake") {
    env.CLAUDE_BIN = FAKE_CLAUDE;
    env.FAKE_REVIEW_LOG = reviewLog;
  } else {
    delete env.CLAUDE_BIN;
    delete env.FAKE_REVIEW_LOG;
  }
  return { ...env, ...(spec.env ?? {}) };
}

/** A fixture file: the case folder's own copy if it has one, else _base. Line endings normalised to LF. */
function fixtureText(fixtures, dir, file) {
  const own = join(dir, file);
  const path = existsSync(own) ? own : join(fixtures, "_base", file);
  if (!existsSync(path)) fatal(`fixture file ${file} not found in ${dir} or _base`);
  return readFileSync(path, "utf8").replace(/^﻿/, "").replace(/\r\n/g, "\n");
}

function applyEdits(text, edits) {
  let out = text;
  edits.forEach(({ find, replace }, i) => {
    const count = out.split(find).length - 1;
    if (count !== 1) throw new Error(`edit #${i + 1} "find" occurs ${count} times (must be exactly once): ${JSON.stringify(find.slice(0, 60))}`);
    out = out.replace(find, () => replace);
  });
  return out;
}

// ── one gate call ────────────────────────────────────────────────────────────

function callGate({ sessionId, statusPath, target, env }) {
  const before = readOrNull(statusPath);
  const input = {
    session_id: sessionId,
    transcript_path: "",
    cwd: ROOT,
    permission_mode: "default",
    hook_event_name: "PostToolUse",
    tool_name: "Write",
    tool_input: { file_path: target, content: "…" },
    tool_response: { type: "update", filePath: target },
  };

  const t0 = Date.now();
  const run = spawnSync(process.execPath, [GATE], { cwd: ROOT, input: JSON.stringify(input), env, encoding: "utf8", timeout: 330_000, windowsHide: true });
  const ms = Date.now() - t0;

  const out = lastJsonLine(run.stdout);
  const after = readOrNull(statusPath);
  const status = parseJson(after);
  const blocked = out.decision === "block";
  const reason = String(out.reason ?? out.systemMessage ?? "");

  let outcome;
  if (run.error || run.status !== 0 || String(out.systemMessage ?? "").startsWith("artifact-gate crashed")) outcome = "GATE_ERROR";
  else if (blocked) outcome = status?.status === "FAILED" ? "FINAL" : "BLOCK";
  else if (after === before) outcome = "IGNORED";
  else if (status?.status === "PASSED") outcome = "PASS";
  else if (status?.status === "UNVERIFIED") outcome = "UNVERIFIED";
  else if (status?.status === "PENDING") outcome = "PENDING";
  else if (status?.status === "FAILED") outcome = "SILENT";
  else outcome = `UNKNOWN(${status?.status ?? "no status"})`;

  return {
    outcome,
    ms,
    status: after === before ? null : status,
    feedback: blocked,
    reason: outcome === "GATE_ERROR" ? reason || run.stderr || String(run.error) : reason,
  };
}
