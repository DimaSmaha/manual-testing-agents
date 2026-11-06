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
- **Never silently skip an optional feature.** Every feature in "Optional features" below is either chosen by
  the user (argument or answer) or offered once at its moment. Ask with the AskUserQuestion tool (short
  options, recommended default first). A "no" is final for this run; record it in `RUN/meta.md` under
  `Declined:` and list it in the final response. Do not ask again for the same feature.

## Optional features (what the orchestrator must offer)

| Feature | Offered | Default / recommended |
|---|---|---|
| Research depth: standard or `--deep` (opens and closes hidden UI: menus, tabs, dropdowns, modals) | Step 1; again in Step 2 if the research shows unexplored hidden UI and `--deep` was not chosen | `--deep` when the page has hidden UI, else standard |
| Style: `normal` / `curious` / `psycho` (or the next one in rotation) | Step 1 | Next in rotation (`state.json`); first run `normal` |
| Runnable Playwright drafts (`expl-bot-report --tests`, writes `tests/expl-bot/*.spec.ts`, new tracked files) | Step 1; again in Step 5 if not chosen | Yes |
| Focus, `--max-tests`, `--from <ISSUEKEY>` | Step 1, as one line the user can ignore ("Also available: …") | None |
| Human knowledge to store (`expl-bot-learn knowledge`) | Step 6 | Ask |
| Another round with the next style (new run, research reused while fresh) | Step 7 | Offer |
| Save login state (`auth.json`) | Step 7 | Ask; never without a yes |
| Close the browser session | Step 7 | Ask |

Arguments already given answer the matching question; do not ask it again.

## Handoff files (the checks you run between steps)

| After | File must exist and be non-empty |
|---|---|
| 2 research | `SITE/research/<page-key>.md` with ≥ 1 `> Container:` line |
| 3 plan | `RUN/plan.md` with ≥ 1 `<!-- test` block, approved by the user; `RUN/test-cases.md` with the same scenarios |
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
6. **Options** (once, one AskUserQuestion call; skip the questions that arguments already answered):
   research depth (standard / deep), style (next in rotation / normal / curious / psycho), runnable
   Playwright drafts at the end (yes / no). After the call add one chat line: "Also available: `--focus`,
   `--max-tests`, `--from <ISSUEKEY>` — tell me if you want any." Write the answers to `RUN/meta.md`
   (Write tool; `Declined:` for every "no").

### Step 2 — Research

Run the Skill `expl-bot-research` with the page URL, `--deep` if chosen, `--focus`, the run id. Relay
`NEEDS_USER` questions. Check the handoff file. Report: purpose, sections, `LOCATORS ok/total`, risks.
If the research shows a sign-in form instead of the page → stop and ask the user.
If the mode was standard and the research names hidden UI that was not explored (burger menu, tabs,
dropdowns, modals), ask once: "Run deep research to open and map it?" Yes → run `expl-bot-research --deep
--fresh` again (it only opens and closes, nothing is submitted).

### Step 3 — Plan (checkpoint: user approves)

Run the Skill `expl-bot-plan` (style as chosen in Step 1, else rotation; `--max-tests`, `--from`, `--focus`).
The skill writes `plan.md` and the readable `test-cases.md`, shows the plan and asks for approval/edits.
**Do not continue until the user approves.** Check both handoff files.

### Step 4 — Test

Run the Skill `expl-bot-test` on `RUN/plan.md` (all scenarios). It runs one tester at a time; on `STUCK` it
acts as Pilot (≤ 2 resumes), relays `NEEDS_USER`. Check `results/<n>.md` exist. Report counters
`PASSED / FAILED / STUCK / BLOCKED` and one line per non-passed scenario.

### Step 5 — Report

Run the Skill `expl-bot-report`, with `--tests` when the user chose runnable tests (Step 1 or here). If they
were not chosen yet, ask once now: "Write runnable Playwright drafts for the passed scenarios into
`tests/expl-bot/`? (new files in this repo)". Check `RUN/report.md` (and the drafts if requested). Report:
defects by severity, execution issues, data left over, drafts written.

### Step 6 — Learn

Run the Skill `expl-bot-learn experience --run <RUN_ID>`. Check the files. Ask the user whether they have
human facts about this site to store (`expl-bot-learn knowledge …`), for example preconditions, test data or
rules the app does not show. Never invent them.

### Step 7 — Wrap up

0. Ask the wrap-up questions in one AskUserQuestion call:
   - **Another round?** "Run another round now with the next style (`<style>`)? It starts a new run, reuses
     the fresh research, and skips scenarios already covered." Yes → go back to Step 3 with a new `RUN_ID`
     (write its `meta.md`), keeping the browser session.
   - **Save the login state** of this session for headless runs (`expl-bot-independent-*`)? It is stored as
     cookies in `SITE/auth.json` (git-ignored, but it is a login secret — do not share it). If yes —
     `playwright-cli -s=<SESSION> state-save .workflow-artifacts/expl-bot/sites/<HOST>/auth.json`. Never save
     it without the user's yes.
   - **Close the browser session** `<SESSION>`? (The login stays in the persistent profile.) If yes —
     `playwright-cli -s=<SESSION> close`. `delete-data` only if the user asks.
1. Delete the scratch you created (`RUN/scripts/`, `RUN/out/`), keep the rest. Check `git status --porcelain`
   shows nothing new (except `tests/expl-bot/` if drafts were written).
2. **Final response** (short): paths of `plan.md`, `test-cases.md`, `report.md`, results folder (and the
   drafts); counters; top defects (title + severity); what was offered and declined; next-run hint ("Run
   again: the next style is `<style>`; new scenarios skip what is already covered").

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
