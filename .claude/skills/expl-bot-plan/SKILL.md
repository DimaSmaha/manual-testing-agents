---
name: expl-bot-plan
description: >
  Planning stage of the expl-bot exploratory-testing crew (explorbot's Planner on Claude Code). Turns a page's
  UI map (and optionally expl1 requirements/test cases) into 3-12 prioritised scenarios in explorbot's plan
  format, using the rotating styles normal -> curious -> psycho, ranked data change > state change > UI-only,
  with own-data-only scenarios. Use when the user says "plan tests for this page", "/expl-bot-plan",
  "make an exploration plan", or as step 3 of expl-bot-orchestrator. Shows the plan for approval.
---

# expl-bot-plan

> Recommended settings: **Opus · Effort: High · Extended thinking: On** (scenario judgement). Sonnet is
> acceptable for a re-plan of an already known page.

Usage: `/expl-bot-plan [<url|path>] [--focus "…"] [--style normal|curious|psycho] [--max-tests N] [--from <ISSUEKEY>] [--run <RUN_ID>]`

Input — the page's research file `SITE/research/<page-key>.md` (run `expl-bot-research` first if missing),
`SITE/state.json`, `SITE/experience/<page-key>.md`, knowledge files; with `--from` also the expl1 artifacts.
Output — `RUN/plan.md` in explorbot's plan format, and the style/state bookkeeping.

## Rules

- Read `run-context.md`, then `planner-rules.md` and the **one** style file `planner-styles/<style>.md`, then
  `data-protection.md`, `capability-grounding.md`, `memory-formats.md` ("Plan file").
- English. Chat is short; the plan file carries the detail.
- With `--independent`: follow "Independent mode" in `run-context.md` — no approval checkpoint, no questions;
  `--max-tests` defaults to 5.
- Stage skills ask the user questions; never answer them on the user's behalf.
- The plan never contains credentials or real-user data. Names of created data use the placeholder `<RUN_ID>`,
  filled in with the real run id when writing the file.
- Re-running this stage deletes and recreates `RUN/plan.md`; it does not merge.
- Stop after the approval step. Do not execute scenarios here.

## Workflow

1. **Resolve** run, host, page (`run-context.md`). Read the research file. If missing or older than 6 h with a
   different `state_key` — tell the user and offer `/expl-bot-research` first (do not plan from guesses).
2. **Pick the style**: `--style` wins; else `SITE/state.json` → `styleIndex` → `normal|curious|psycho`; if the
   file does not exist yet — `normal`. Read the style file.
3. **Focus**: restate `--focus` as a testing brief (feature boundary + goal + behaviours that matter + what to
   leave out). If it is a bare keyword — show your restatement and ask the user to confirm or sharpen it.
4. **Inputs for dedup/curious**: load FLOW titles and `>` discoveries from the experience file, and
   `testedScenarios[<page-key>]` from `state.json`.
5. **`--from <ISSUEKEY>`**: read `-2-requirements.md` and `-4-test-cases.md` read-only; ~70% of scenarios
   exercise documented behaviour (cite `REQ-N` / `TC-N` under `## Requirements` after the URL), the rest explore
   beyond. If the files are missing say so in one line and continue without them.
6. **Write the scenarios** per `planner-rules.md`: 3–12 (default 6 or `--max-tests`), ranked by outcome strength,
   ≤ 2 per feature area, data-changing first, each capability grounded in the research, edit/delete scenarios
   create their own target named `<RUN_ID> …`, priorities assigned, unique wrt. earlier plans. Read-only focus
   → read-only scenarios.
7. **Write `RUN/plan.md`** in the explorbot format (`memory-formats.md`) with the real `RUN_ID`, the style and
   the focus in the title/comments. Add under each test an HTML comment line
   `<!-- area: <feature area> · outcome: data|state|ui · covers: REQ-3,TC-7 -->` (explorbot ignores comments).
8. **Approval checkpoint** (semi-auto): show the user a compact table — `# | priority | outcome | scenario` —
   plus the style and focus, and ask: approve / drop N / change priority / add a scenario / change the style.
   Apply the edits to `plan.md`. Do not start testing until the user approves.
9. **Bookkeeping** after approval: `SITE/state.json` → `lastStyle`, `styleIndex = (index + 1) % 3`,
   `lastRun`. (`testedScenarios` is updated after execution, by the orchestrator / `expl-bot-learn`.)
10. **Final response**: path of `plan.md`, style used, number of scenarios by outcome category, next step
    (`/expl-bot-test <plan.md>`).

## Output checks (before showing the plan)

- Every scenario heading is a business outcome, every `## Expected` item is verifiable.
- No scenario touches pre-existing data or the entity under the page URL; no sign-in/sign-up/password pages.
- Not more than 2 scenarios per feature area; no scenario duplicates an earlier one.
- Priorities use only `critical|important|high|normal|low`.
