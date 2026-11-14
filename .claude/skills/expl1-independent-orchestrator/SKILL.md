---
name: expl1-independent-orchestrator
description: >
  EXPLICIT-INVOCATION ONLY. Autonomous, never-ask twin of expl1-orchestrator. Runs the stage skills
  expl1-1-task-context → expl1-2-requirements-grooming → expl1-3-qa-checklist → expl1-4-qa-test-cases →
  expl1-5-pr-summary → expl1-6-code-review → expl1-7-impact-analysis → expl1-8-web-testing one after another
  without any question, confirmation or pause, and writes everything to a new timestamped folder
  `.workflow-artifacts/<ISSUEKEY>-<YYYYMMDD-HHMMSS>/`. The playwright-cli browser is headed. Use when the user says
  "run the QA pipeline autonomously", "run all 8 stages without asking", "unattended QA run for <KEY>", or
  "/expl1-independent-orchestrator <KEY>".
---

# expl1-independent-orchestrator

EXPLICIT-INVOCATION ONLY.

> **NEVER ask the user for input, confirmation or clarification during execution.** Decisions come from the
> arguments, the files and `references/autonomous-mode.md`. Stop-and-report is the only permitted response to
> missing input. Never call a tool that prompts.

Usage:
`/expl1-independent-orchestrator <TASK-id | BUG-id | tracker URL> [--pr <PR URL | branch>] [--repo <owner/name>] [--app-url <url>] [--base <tracker base URL>] [--from-stage N] [--to-stage N] [--run-dir <existing run folder>] [--skip-impact]`

| Argument | Meaning |
|----------|---------|
| item | `TASK-<id>`, `BUG-<id>`, or `<BASE>/tasks/<id>` / `<BASE>/bugs/<id>`. A bare number is probed in both id spaces (below). |
| `--pr` | PR URL, or a branch name (then `--repo` is required). **Without a PR or branch given at the start, stages 5, 6 and 7 are skipped and the run is stages 1, 2, 3, 4, 8** (see "Stage plan"). |
| `--repo` | `owner/name` for branch mode. Not needed with a PR URL. `--repo` alone (no `--pr`) is not a code reference: stages 5–7 are still skipped. |
| `--app-url` | Start URL of the app for stage 8. Without it (and without a Base URL in `login-config.md` or a saved path) the run stops before stage 8, see Pre-flight. |
| `--base` | Tracker base URL (default `http://localhost:3000`; a tracker URL as the item sets it). |
| `--from-stage` / `--to-stage` | Run only stages N..M (default 1..8). `--from-stage` > 1 needs `--run-dir`. |
| `--run-dir` | Reuse an existing run folder (resume a run) instead of creating a new one. |
| `--skip-impact` | Skip stage 7 (the Opus-heavy optional stage). Default: it runs when stages 5–6 ran. |

## What differs from `expl1-orchestrator`

| | `expl1-orchestrator` | this skill |
|---|---|---|
| Questions / pauses between stages | yes, every stage | none |
| Artifact folder | `.workflow-artifacts/<ISSUEKEY>/` (reused) | `.workflow-artifacts/<ISSUEKEY>-<YYYYMMDD-HHMMSS>/` (new per run) |
| Optional helpers (`qa-*`) | offered | never run (run them by hand afterwards) |
| Validation not PASSED | wait for the user | log it, continue, flag it in the final report |
| Browser | headed, user helps | **headed**, persistent profile, nobody helps |

Stage output formats, requirement ids (`REQ-N`), the feedback-loop hooks and the "own data only" rule are unchanged.
The orchestrator itself does no stage work and edits no stage artifact; it launches skills with the Skill tool, checks
handoff files, reads hook-owned status files, and writes only its own run log.

## Rules

- English. Chat output stays terse: this run is read from a log.
- Read `references/autonomous-mode.md` once at the start. Every stage skill is launched with
  `--autonomous --run-dir <RUN_DIR>` and reads its own section of that file.
- **Never stop between stages.** After a stage ends, check its handoff and start the next one at once.
- A stage reply that starts with `STOP:` is a blocker, not a question: apply "Failure policy". Never answer a stage's
  output as if it were a question to you, and never relay one to the user.
- Do not do a stage's work yourself and do not "fix" an artifact, a `.validation.json` or a metrics file.
- Do not change the order of stages. Skipped stages are listed as skipped, never silently dropped.
- **Browser: `playwright-cli` only, always headed** (`playwright-cli -s=qa-<ISSUEKEY> open <URL> --headed --persistent`).
  Headless is not offered. Scripts are files written with the Write tool into `<RUN_DIR>/web-testing/`; every command is
  one simple command (no `cd`, no `&&`/`;`, no env prefixes).
- Credentials: never taken from chat or arguments, never printed. The only sources are the persistent browser profile
  and `login-config.md` when it says "Agent may type credentials: yes".

## Phase 0 — Initialize

1. **Parse the arguments.** No item → `STOP: item (TASK-/BUG- key or tracker URL) is required` (go to the final report).
   Resolve `ISSUEKEY` (`TASK-<id>` / `BUG-<id>`) and `BASE` as in
   `.claude/skills/expl1-1-task-context/references/issue-tracker.md`.
   **Bare number**: probe `GET <BASE>/tasks/<id>` and `GET <BASE>/bugs/<id>` with
   `curl -s --max-time 5 -o /dev/null -w "%{http_code}" <URL>` (one command each). Exactly one 200 → that kind. Both or
   neither → `STOP: ambiguous / unknown item <id>`.
2. **Timestamp and run folder.** Unless `--run-dir` is given:
   run `date +%Y%m%d-%H%M%S` (one simple command) → `TS`. Then
   `RUN_KEY = <ISSUEKEY>-<TS>` (for example `TASK-112-20261114-153042`) and `RUN_DIR = .workflow-artifacts/<RUN_KEY>`.
   With `--run-dir`: `RUN_DIR` is that folder and `RUN_KEY` is its name; it must exist and hold the earlier stages'
   files (else `STOP: run folder not found`). `RUN_KEY` is the key under which the metrics hooks bill this run, so
   **always pass `--run-dir <RUN_DIR>` as the FIRST argument of every stage skill** (see below).
3. **Pre-flight** (once; skipped checks for stages that will not run):
   - Tracker (stages 1 only): `curl -s --max-time 5 <BASE>/`. Empty → `STOP: tracker not reachable at <BASE>`.
   - PR / code reference (stages 5–7): decided **only from the arguments given at the start**; never ask for a PR or a
     branch later and never look for one in the tracker or the task text. No `--pr` → stages 5, 6, 7 are
     `skipped (no PR)` and the **stage plan is 1, 2, 3, 4, 8** (see "Stage plan"). With `--pr`: run `gh auth status`;
     failing → stages 5, 6, 7 are `skipped (gh not available)`. A branch without `--repo` →
     `skipped (branch given without --repo)`. In every skipped case the plan is again 1, 2, 3, 4, 8.
   - App (stage 8): `APP_URL` = `--app-url`, else the Base URL in
     `.claude/skills/expl1-8-web-testing/references/login-config.md` if it is set, else the `url` of a saved page in
     `.claude/skills/expl1-8-web-testing/navigation_paths.json`. None and stage 8 is in range →
     `STOP: app URL unknown (pass --app-url, fill login-config.md, or use --to-stage 7)` **before running any stage**
     (stages 1–7 are not worth an hour of model time if stage 8 cannot start).
   - `playwright-cli list` is not needed here; stage 8 opens the session.
4. **Write the run log** `<RUN_DIR>/<ISSUEKEY>-x-auto-run.md` with the Write tool: arguments (no credentials),
   `RUN_KEY`, start time, resolved `BASE`, PR / repo / `APP_URL` (or "none"), stages in range, the stage plan
   (for example `1, 2, 3, 4, 8 (5–7 skipped: no PR)`), pre-flight outcome, and a
   `## Autonomous decisions` heading that later gets the `AUTO-DECISION:` lines. The orchestrator owns this file and
   may rewrite it as the run goes; it is not a stage artifact and the hooks ignore it.
5. Print two lines: `RUN <RUN_KEY> → <RUN_DIR>` and `PLAN <stages>` (for example `PLAN 1, 2, 3, 4, 8`), and go on.

## Stage plan

The plan is fixed in Phase 0 and printed in one line (`PLAN 1, 2, 3, 4, 8` or `PLAN 1–8`):

| Start arguments | Plan |
|-----------------|------|
| `--pr` given and usable (`gh` works; branch has `--repo`) | 1, 2, 3, 4, 5, 6, 7, 8 (7 also dropped by `--skip-impact`) |
| no `--pr`, or `--pr` not usable | **1, 2, 3, 4, 8** — stages 5, 6, 7 are listed as `skipped (<reason>)` in the run log and the final table, never silently dropped |

`--from-stage` / `--to-stage` then cut the plan further. With stages 5–7 skipped, stage 8 gets no `-6-code-review.md`, so
it runs every test case of stage 4 with Source `QA` (no FAIL items, no IMPACT rows). That is the normal path, not a
failure: it is logged as `AUTO-DECISION: stages 5-7 skipped (no PR); stage 8 runs all test cases with Source QA`.

## Stages

Launch each with the Skill tool; the arguments always start with the run folder so the metrics key resolves to
`RUN_KEY`:

| # | Skill | Arguments | Hand-off needed before | Output |
|---|-------|-----------|------------------------|--------|
| 1 | `expl1-1-task-context` | `--run-dir <RUN_DIR> --autonomous <ISSUEKEY> --base <BASE>` | tracker reachable | `<ISSUEKEY>-1-context.md` |
| 2 | `expl1-2-requirements-grooming` | `--run-dir <RUN_DIR> --autonomous <ISSUEKEY>` | `-1-context.md` | `<ISSUEKEY>-2-requirements.md` |
| 3 | `expl1-3-qa-checklist` | `--run-dir <RUN_DIR> --autonomous <ISSUEKEY>` | `-2-requirements.md` | `<ISSUEKEY>-3-checklist.md` |
| 4 | `expl1-4-qa-test-cases` | `--run-dir <RUN_DIR> --autonomous <ISSUEKEY>` | `-3-checklist.md` | `<ISSUEKEY>-4-test-cases.md` |
| 5 | `expl1-5-pr-summary` | `--run-dir <RUN_DIR> --autonomous <ISSUEKEY> --pr <PR> [--repo <owner/name>]` | PR usable | `<ISSUEKEY>-5-pr-summary.md` |
| 6 | `expl1-6-code-review` | same as 5 | `-4-test-cases.md`, PR usable | `<ISSUEKEY>-6-code-review.md` |
| 7 | `expl1-7-impact-analysis` | same as 5 | `-4-`, `-5-`, `-6-` files, PR usable | `<ISSUEKEY>-7-impact-analysis.md` |
| 8 | `expl1-8-web-testing` | `--run-dir <RUN_DIR> --autonomous <ISSUEKEY> --app-url <APP_URL>` | `-4-test-cases.md` | `<ISSUEKEY>-8-web-testing.md` |

Handoff check before each stage: the required files exist in `<RUN_DIR>` and are non-empty (use Glob/Read; stage 6's
`-5-` file and stage 8's `-6-`, `-7-`, `-3-` files are optional, as in `expl1-orchestrator`). Stage 7 is also skipped
when stage 5 or 6 did not produce its file, or with `--skip-impact`.

After each stage, in this order, with no pause:
1. Check the output file exists and is non-empty. Missing/empty or a `STOP:` reply → "Failure policy".
2. Collect the stage's `AUTO-DECISION:` lines and append them under `## Autonomous decisions` in the run log.
3. For stages 2, 3, 4 and 8 read `<RUN_DIR>/<ISSUEKEY>-<n>-<name>.validation.json` (read-only) and note its `status`:
   `PASSED` → fine; `UNVERIFIED` → one line, fine; `PENDING` / `RETRYING` / `FAILED` / missing → log
   `VALIDATION <status> after stage <n>: <notes>` in the run log and **continue**. The hook already gave the stage its
   bounded retries; the orchestrator never reruns a stage on its own and never edits the artifact.
4. Print one line: `Stage <n> <skill>: done · <output path> · <key counter> · validation <status>`.
5. Start the next stage.

## Failure policy (no one to ask)

| Situation | Action |
|-----------|--------|
| Stage 1 fails (`STOP:`, no file) | abort the run → final report |
| Stage 2, 3 or 4 fails (`STOP:`, no or empty file) | abort the run → final report (nothing downstream can be built) |
| Stage 5 or 6 fails | mark 5, 6, 7 as `failed`/`skipped`, go to stage 8 (every test case then runs with Source `QA`) |
| Stage 7 fails | mark `failed`, go to stage 8 |
| Stage 8 fails or is `BLOCKED` throughout | no abort; it is the last stage → final report |
| Validation not `PASSED` (any stage) | continue, flag in the final report (downstream stages used an unvalidated file) |

A stage that failed is not retried automatically. The final report names the one command to resume from it:
`/expl1-independent-orchestrator <ISSUEKEY> --run-dir <RUN_DIR> --from-stage <N> …`.

## Final report (the only free-form text)

Always produced, on every exit (complete, aborted, stopped in Phase 0). If it stopped in Phase 0, start it with
`STOPPED: <reason>` and list what exists.

1. Header: `RUN_KEY`, `RUN_DIR`, start and end time.
2. The stage table (real values only):

| Stage | Status | Output | Key result |
|-------|--------|--------|------------|
| 1 expl1-1-task-context | run / skipped (reason) / failed | `<ISSUEKEY>-1-context.md` | N requirements in the context |
| 2 … 8 | … | … | counters from the stage's own final summary, `validation <status>` |
| 5, 6, 7 without a PR | skipped (no PR) | — | stage 8 ran with Source `QA` |

3. `## Autonomous decisions`: the `AUTO-DECISION:` lines (or "none").
4. `## Needs attention`: every validation status that was not `PASSED`, every `BLOCKED` / `FAIL` headline from stage 8
   (title + one clause), any "login required" or "app URL unknown" outcome with the exact fix (for example "log in
   once in the session `qa-<ISSUEKEY>`, then run `… --run-dir <RUN_DIR> --from-stage 8`"), and the leftover state:
   the browser session `qa-<ISSUEKEY>` is left open (headed); nothing was created in the app.
5. Optional helpers not run: `qa-thinking`, `qa-detect-useless-tests`, `qa-review-pr` can be run by hand on `<RUN_DIR>`.
6. **Run cost** (read-only; no stage skill knows about the metrics). Run once:

```
node .claude/hooks/metrics-report.mjs <RUN_KEY> --save
```

   and print its table unedited. `--save` writes `<RUN_KEY>-metrics.md` and `<RUN_KEY>-metrics.json` into `<RUN_DIR>`
   (script-owned files). If it prints `No metrics recorded`, write `Run cost: not recorded (hooks not loaded in this
   session)` and finish. Never fail or wait over it.

## Hard rules

- Never ask the user. Never wait. Never relay a stage's question.
- Never create, edit or delete anything in the app that a test case does not call for (`data-protection.md` rules of the
  repo apply: own data only). The seeder `qa-data-seeder` is never run here.
- Never print or store credentials. Never delete `<RUN_DIR>`.
- Never edit another stage's artifact, a `.validation.json`, a metrics file, or `navigation_paths.json`.
