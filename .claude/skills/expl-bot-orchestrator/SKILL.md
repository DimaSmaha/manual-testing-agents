---
name: expl-bot-orchestrator
description: >
  Orchestrator of the semi-automatic exploratory-testing flow (explorbot's crew on Claude Code, no API key).
  Opens a headed playwright-cli session, then runs expl-bot-research -> expl-bot-plan (user approves) ->
  expl-bot-test -> expl-bot-report -> expl-bot-learn for one page or area, with Sonnet subagents doing the
  heavy browser work and this session acting as Captain/Pilot. Own data only. Use when the user says
  "explore this page", "exploratory test <url>", "/expl-bot-orchestrator <url>", "run the expl-bot crew", or
  "continue the exploration run". Optional --from <ISSUEKEY> grounds scenarios in expl1 requirements.
---

# expl-bot-orchestrator

> Recommended settings: **Opus · Effort: High · Extended thinking: On** (this session is Captain, Pilot,
> Planner judgement and Analyst; the subagents run on Sonnet).

Usage:
`/expl-bot-orchestrator <url|path> [--focus "…"] [--style normal|curious|psycho] [--max-tests N] [--deep] [--from <ISSUEKEY>] [--run <RUN_ID>]`

Flow 1 of three (see `CLAUDE.md`): semi-auto in this chat. Flow 2 (`expl-bot-independent-*`) is the headless
twin; Flow 3 is explorbot as-is. The `expl1-*` pipeline is unrelated and unchanged.

## What the orchestrator does and does not do

- It **launches stage skills** (Skill tool), checks their handoff files, reports counters, and asks before
  advancing past the checkpoints. It is the Captain (decides what next, unblocks) and the Pilot (inside
  `expl-bot-test`).
- It does **not** edit the research/plan/result/report files itself, does not click in the browser, does not
  answer questions the stage skills put to the user, and does not invent data.
- Subagents (`expl-bot-researcher`, `expl-bot-tester`) are launched by the stage skills. One browser, so one
  subagent at a time.

## Rules

- Read `.claude/skills/expl-bot-core/references/run-context.md` and `data-protection.md` first.
- English. Short chat messages. Ask the user whenever you need help (login, ambiguity, missing data); never
  guess, never bypass a login, never type credentials that were not given.
- Own data only for the whole run. Anything that would touch pre-existing data stops the scenario.
- Playwright: `playwright-cli` only, headed, `-s=<SESSION>`, `--persistent`. Not Playwright MCP / Chrome ext.
- Scripts: files via Write, one simple command each, outputs in `RUN/out/` (see `run-context.md`).
- Re-running a stage deletes and recreates that stage's file; it never merges.

## Handoff files (the checks you run between steps)

| After | File must exist and be non-empty |
|---|---|
| 2 research | `SITE/research/<page-key>.md` with ≥ 1 `> Container:` line |
| 3 plan | `RUN/plan.md` with ≥ 1 `<!-- test` block, approved by the user |
| 4 test | `RUN/results/<n>.md` for every executed scenario |
| 5 report | `RUN/report.md` |
| 6 learn | `SITE/experience/<page-key>.md` (when ≥ 1 scenario PASSED) and updated `SITE/state.json` |

## Workflow

### Step 1 — Preflight

1. Parse the arguments. No URL → ask the user. A relative path → ask for / read the base URL (`SITE`
   knowledge, `state.json`, `RUN/meta.md`).
2. Resolve `HOST`, `SESSION`, `RUN_ID`; write `RUN/meta.md` (Write tool) with all arguments
   (`run-context.md`).
3. `playwright-cli list`; open or reuse the headed persistent session; `snapshot`. A login page → ask the user
   to log in in the open window ("Please log in, tell me when you are on <page>"). Wait for "done".
4. Load knowledge for the URL (paths only) and tell the user the line `Knowledge: N files · Experience:
   <yes/no> · Research cache: <fresh/stale/none> · Style: <style> · Session: <SESSION> · Run: <RUN_ID>`.
5. `--from <ISSUEKEY>`: check the expl1 files exist (read-only); say what was found.

### Step 2 — Research

Run the Skill `expl-bot-research` with the page URL, `--deep` if given, `--focus`, the run id. Relay
`NEEDS_USER` questions. Check the handoff file. Report: purpose, sections, `LOCATORS ok/total`, risks.
If the research shows a sign-in form instead of the page → stop and ask the user.

### Step 3 — Plan (checkpoint: user approves)

Run the Skill `expl-bot-plan` (style from rotation unless `--style`, `--max-tests`, `--from`, `--focus`). The
skill shows the plan and asks for approval/edits. **Do not continue until the user approves.** Check the
handoff file.

### Step 4 — Test

Run the Skill `expl-bot-test` on `RUN/plan.md` (all scenarios). It runs one tester at a time; on `STUCK` it
acts as Pilot (≤ 2 resumes), relays `NEEDS_USER`. Check `results/<n>.md` exist. Report counters
`PASSED / FAILED / STUCK / BLOCKED` and one line per non-passed scenario.

### Step 5 — Report

Run the Skill `expl-bot-report` (add `--tests` only if the user asked for runnable tests). Check
`RUN/report.md`. Report: defects by severity, execution issues, data left over.

### Step 6 — Learn

Run the Skill `expl-bot-learn experience --run <RUN_ID>`. Check the files. Ask the user whether to store any
new human knowledge they mentioned during the run (`expl-bot-learn knowledge …`).

### Step 7 — Wrap up

0. Offer once: "Save the login state of this session for headless runs (`expl-bot-independent-*`)?" It is
   stored as cookies in `SITE/auth.json` (git-ignored, but it is a login secret — do not share it). If yes —
   `playwright-cli -s=<SESSION> state-save .workflow-artifacts/expl-bot/sites/<HOST>/auth.json`. Never save it
   without the user's yes.
1. Ask: "Close the browser session `<SESSION>`? (The login stays in the persistent profile.)" If yes —
   `playwright-cli -s=<SESSION> close`. `delete-data` only if the user asks.
2. Delete the scratch you created (`RUN/scripts/`, `RUN/out/`), keep the rest. Check `git status --porcelain`
   shows nothing new (except `tests/expl-bot/` if tests were requested).
3. **Final response** (short): paths of `plan.md`, `report.md`, results folder; counters; top defects
   (title + severity); next-run hint ("Run again: the next style is `<style>`; new scenarios skip what is already
   covered").

## Stage settings (recommended)

| Stage | Where it runs | Model |
|---|---|---|
| 2 research | `expl-bot-researcher` subagent | Sonnet |
| 3 plan | this session | Opus + thinking |
| 4 test | `expl-bot-tester` subagents; Pilot = this session | Sonnet (workers), Opus (Pilot) |
| 5 report | this session | Opus + thinking |
| 6 learn | this session | Sonnet is enough |

If the user wants the whole run on one model, say that quality of planning and defect classification drops on
smaller models; do not switch models yourself.

## Failure handling

- Session lost (`playwright-cli list` shows nothing): reopen the same `SESSION` with `--persistent`, ask for
  login if needed, continue from the current step.
- A stage skill returns without its handoff file: report which file is missing and ask whether to re-run the
  stage; do not create the file yourself.
- A scenario keeps failing for automation reasons: after the Pilot resumes, it stays `STUCK`; the report lists
  it under Execution Issues. Do not loop.
- User says stop: finish the current scenario's bookkeeping, write the report for what ran, then ask about the
  browser.
