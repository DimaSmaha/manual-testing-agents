---
name: expl-bot-independent-orchestrator
description: >
  EXPLICIT-INVOCATION ONLY. Headless, never-ask twin of expl-bot-orchestrator (Flow 2). Runs research -> plan ->
  test -> report -> learn for one page with the same expl-bot-core rules, the same stage skills and the same
  expl-bot-researcher / expl-bot-tester subagents, but without a plan-approval checkpoint and without ever
  asking the user: missing input means stop-and-report. Emits a PHASE COMPACT block after each phase. Normally
  started by scripts/expl-bot-run.ts (Claude Agent SDK); can also be invoked in chat when the caller explicitly
  asks for an unattended run.
---

# expl-bot-independent-orchestrator

EXPLICIT-INVOCATION ONLY.

> **NEVER ask the user for input, confirmation or clarification during execution.** Decisions come from the
> arguments, the environment and the artifacts. Stop-and-report is the only permitted response to missing input.

Usage:
`/expl-bot-independent-orchestrator <url> [--focus "…"] [--style normal|curious|psycho] [--max-tests N] [--max-duration M] [--deep] [--headed] [--from <ISSUEKEY>]`

Auth (never from the prompt): `SITE/auth.json` (from `playwright-cli state-save`, produced once in Flow 1) and/or
the env var `EXPL_BOT_AUTH` (free-form text, kept in memory only).

## Execution contract

```
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
init      research  plan      test      report    learn + final
```

- Never stop between phases. After a phase completes, begin the next one immediately.
- Only Phase 5 writes the final user-facing reply. Other phases emit their compact block only.
- Abort is allowed only for: missing/invalid URL (Phase 0), no usable session or login that needs a human
  (Phase 0/1), research failure (Phase 1), plan failure (Phase 2). Test, report and learn failures are logged and
  the run goes on.
- Every stage skill is invoked with `--independent` (see "Independent mode" in
  `.claude/skills/expl-bot-core/references/run-context.md` — the binding overrides). Subagent prompts also say
  "independent mode: never return a question, return NEEDS_USER with the exact need".

## Rules

- Read `run-context.md` (names, run, browser, scratch, **Independent mode**) and `data-protection.md` first.
  Own data only; any doubt → read-only/`BLOCKED`.
- English. Chat output stays terse: this run is read from a terminal log.
- Tools: `playwright-cli` only (named session, persistent, headless unless `--headed`). Scripts are files via
  Write; each command is one simple command (no `cd`, no `&&`/`;`, no env prefixes); outputs in `RUN/out/`.
- Credentials: only from `EXPL_BOT_AUTH` (via `printenv EXPL_BOT_AUTH`) or `SITE/auth.json`. Never write them to a
  file; never echo them back; never put them into a subagent prompt (log in yourself in Phase 0/1 and let the
  session carry the cookies).
- The orchestrator does not do stage work and does not edit stage artifacts; it launches skills with the Skill
  tool, checks handoff files, emits compacts.

## Phases

### Phase 0 — Initialize

1. Parse arguments. No valid absolute `http(s)` URL → `STOP: URL is required` (Phase 5 reply, exit path).
   Defaults: `--max-tests 5`, `--max-duration 30`, headless.
2. Resolve `HOST`, `SESSION`, `RUN_ID`; write `RUN/meta.md` (arguments, start epoch seconds from `date +%s`).
3. `playwright-cli list`; open or reuse the session (`--persistent`, plus `--headed` only if asked). If
   `SITE/auth.json` exists, `state-load` it and `goto` the URL.
4. `snapshot`. Login page → use `EXPL_BOT_AUTH` as described in Independent mode; still blocked →
   `STOP: login required (no usable SITE/auth.json or EXPL_BOT_AUTH)`.
5. Load knowledge/experience paths. With `--from` check the expl1 files (read-only) and note what was found.

Emit:
```json
<!-- PHASE COMPACT: Phase 0 init -->
{ "phase": "Phase 0 init", "status": "SUCCESS", "host": "…", "session": "…", "run_id": "…", "headed": false,
  "auth": "state-file | env | none", "knowledge_files": 0, "experience": false }
```

### Phase 1 — Research

Skill `expl-bot-research <url> --independent [--deep] [--focus …] --run <RUN_ID>`. Handoff: research file with ≥ 1
`> Container:` line. A `STOP:`/missing file → abort (compact `FAILED`, Phase 5).

```json
<!-- PHASE COMPACT: Phase 1 research -->
{ "phase": "Phase 1 research", "status": "SUCCESS", "page_key": "…", "sections": 4, "locators_ok": 31,
  "locators_total": 34, "cache": "hit|miss" }
```

### Phase 2 — Plan

Skill `expl-bot-plan --independent --run <RUN_ID> [--style …] [--focus …] [--max-tests N] [--from …]`. No approval
checkpoint. Handoff: `RUN/plan.md` with ≥ 1 test block. No scenarios (e.g. a sign-in page) → compact `FAILED`
with the reason, abort.

```json
<!-- PHASE COMPACT: Phase 2 plan -->
{ "phase": "Phase 2 plan", "status": "SUCCESS", "style": "normal", "scenario_count": 5,
  "data_change": 3, "state_change": 1, "ui_only": 1 }
```

### Phase 3 — Test

Skill `expl-bot-test RUN/plan.md '*' --independent --run <RUN_ID> --max-duration M`. It enforces the budgets
(`--max-tests` already limits the plan; the duration is checked before every scenario). Emit **one compact per
scenario** as soon as its result is known, then a summary compact.

```json
<!-- PHASE COMPACT: Phase 3 test -->
{ "phase": "Phase 3 test", "scenario_index": 2, "status": "SUCCESS", "result": "PASSED|FAILED|STUCK|BLOCKED",
  "title": "…", "created": 1 }
```

`status` is `SUCCESS` for PASSED, `FAILED` for FAILED/STUCK/BLOCKED (the product verdict is in `result`).
Then:
```json
<!-- PHASE COMPACT: Phase 3 summary -->
{ "phase": "Phase 3 summary", "status": "SUCCESS", "passed": 3, "failed": 1, "stuck": 1, "blocked": 0,
  "skipped_over_budget": 0, "duration_s": 412 }
```

### Phase 4 — Report

Skill `expl-bot-report --independent --run <RUN_ID>` (add `--tests` only if the caller passed it). Handoff:
`RUN/report.md`.

```json
<!-- PHASE COMPACT: Phase 4 report -->
{ "phase": "Phase 4 report", "status": "SUCCESS", "defects_high": 0, "defects_medium": 1, "defects_low": 0,
  "execution_issues": 2, "data_left_over": 1 }
```

### Phase 5 — Learn and final reply

1. Skill `expl-bot-learn experience --independent --run <RUN_ID>` (compact `learn`, fields `flows_added`,
   `actions_added`). Update `SITE/state.json` is done by `expl-bot-test`/`learn`; verify it exists.
2. Do **not** close the browser here: the runner script closes the session (it knows the name); in chat mode
   leave it open and say so. Never `delete-data`.
3. Final reply (the only non-compact text): paths of `plan.md`, `report.md`, `results/`; counters; the
   headline defects (title + severity); leftover data; any `STOP:` reason; the exact next-run hint.
   If the run stopped early, start the reply with `STOPPED: <reason>` and still report what exists.
4. **Run cost** (part of the final reply, not a compact; no compact field changes). If `.claude/hooks/` is
   registered for this session, run `node .claude/hooks/metrics-report.mjs <RUN_ID> --save` once (it also writes
   `RUN/metrics.md` + `RUN/metrics.json`) and append its table unedited. If it prints `No metrics recorded` (a headless runner that did not load project hooks), write
   `Run cost: not recorded` and go on. Never ask, never wait, never fail the run over it.

## Hard rules

- Never ask the user. Never wait. Never call a tool that prompts.
- Never create/edit/delete anything the run did not create (`data-protection.md`).
- A failed phase after Phase 2 never aborts the run; log `FAILED` in its compact and continue.
- Do not print credentials, `SITE/auth.json` contents, or `EXPL_BOT_AUTH` — not even in compacts.
- Compacts are valid JSON, one per phase (and one per scenario in Phase 3), emitted exactly as shown so the
  runner script can parse them.
