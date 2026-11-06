---
name: expl-bot-test
description: >
  Execution stage of the expl-bot exploratory-testing crew (explorbot's Tester + Pilot on Claude Code). Runs
  one scenario or a whole plan.md in the headed playwright-cli session through the expl-bot-tester subagent,
  one tester at a time. The main session acts as Pilot: on a STUCK result it reads the stuck-pattern
  catalogue, answers PROGRESS/NEXT and resumes the tester (max 2 resumes). Own data only. Use when the user
  says "run the plan", "test this scenario", "/expl-bot-test <plan.md|text>", or as step 4 of
  expl-bot-orchestrator.
---

# expl-bot-test

> Recommended settings: **Opus · Effort: Medium · Extended thinking: On** (Pilot judgement on STUCK results;
> the clicking is done by Sonnet subagents).

Usage: `/expl-bot-test <plan.md> [<n>,<m>|'*'] [--run <RUN_ID>]` or `/expl-bot-test "<scenario text>" [--url <start url>]`

Input — an approved `RUN/plan.md` (all scenarios, a selection by number, or a pasted scenario). Output —
`RUN/results/<n>.md` per scenario (the tester's result block), screenshots, and an updated `SITE/state.json`.
The main context only ever sees the compact result blocks.

## Rules

- Read `run-context.md`, `data-protection.md`, `pilot-stuck-patterns.md`, `tester-loop.md` ("Result block").
- **Sequential**: one tester at a time (shared browser). Subagents cannot spawn subagents.
- Pilot answers are exactly `PROGRESS:` / `NEXT:`. Stage skills ask the user; never answer for them.
- A scenario that would touch pre-existing data is `BLOCKED`, not retried (`data-protection.md`).
- Never type credentials unless the user gave them in chat; login → ask the user.
- English, short chat. No invented data. Stop after the run summary.
- With `--independent`: follow "Independent mode" in `run-context.md` — a `NEEDS_USER` gets one unblock
  attempt, then `BLOCKED`; respect `--max-duration`; never ask the user.

## Workflow

1. **Resolve** run/host/session (`run-context.md`); make sure the browser session is open and logged in
   (`playwright-cli list`, `snapshot`; login → ask the user).
2. **Load the scenarios**: parse `plan.md` (format in `memory-formats.md`); a pasted scenario is wrapped into
   the same shape. Number them `S1…Sn` by order. Apply the selection. If `plan.md` does not exist — tell the
   user and offer `/expl-bot-plan`.
3. **Per scenario** (in plan order):
   a. Compute `START_URL` (base URL from `SITE`/`meta.md` + the scenario's `## Requirements` path, else the
      suite's prerequisite).
   b. Find the page's `page-key`; collect `RESEARCH`, `KNOWLEDGE` paths, `EXPERIENCE` path.
   c. Launch the subagent: `Agent` with `subagent_type: expl-bot-tester` and a prompt containing `SESSION`,
      `RUN_ID`, `HOST`, `N`, `START_URL`, the scenario block verbatim, and the three paths. Remember the agent
      id for a possible resume.
   d. Save the returned block to `RUN/results/<N>.md` if the tester did not (replace the file).
   e. **Act on the status**:
      - `PASSED` / `FAILED` → next scenario. Do not re-run a FAILED scenario "to be sure" unless the evidence
        line looks like an automation problem; then one re-run via a fresh tester is allowed and noted.
      - `STUCK` → be the **Pilot**: read the block's `STUCK_REASON`, `LAST_ACTIONS`, `STATE_KEY`, match it
        to `pilot-stuck-patterns.md`, answer `PROGRESS:` / `NEXT:` and resume the **same** tester with
        `SendMessage` to its agent id. If SendMessage is unavailable or the tester is gone, start a new
        tester with the scenario + a 5-line summary of what was done and the NEXT instruction. At most 2
        resumes per scenario; then keep `STUCK` and move on.
      - `BLOCKED` with `NEEDS_USER: …` → ask the user (login, data, ambiguity), then resume that tester.
        If the user says skip → keep `BLOCKED` with the reason.
      - `BLOCKED` otherwise (capability missing, precondition unmet, pre-existing data) → keep it, move on.
   f. After each scenario print one line: `S<n> <STATUS> — <title>`.
4. **Bookkeeping** (once, after the loop): append to `SITE/state.json` → `testedScenarios[<page-key>]`:
   title, area, outcome (from the plan comment), status, the steps that ran. Only the main session writes this
   file.
5. **Browser state check**: `snapshot` to see where the browser ended up; if a modal of the last scenario
   is still open, dismiss it (`popup-and-forms.md`). Do not close the session.
6. **Final response**: counters `PASSED / FAILED / STUCK / BLOCKED`, one line per non-PASSED scenario with the
   reason, records created (union of every `CREATED:`), the path of the results folder, and the next step
   (`/expl-bot-report`, then `/expl-bot-learn`).

## Do not

- Do not run two testers in parallel; do not click in the browser yourself (except dismissing a leftover modal
  and the Pilot's `snapshot` checks).
- Do not mark `PASSED` yourself. A scenario is `PASSED` only when the tester's block says so with evidence.
- Do not paste a result block's `CODE:` lines into chat; they go to `expl-bot-report`.
- Do not continue past 2 resumes or past the user's `--max-duration` if one was given.
