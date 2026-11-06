---
name: expl-bot-learn
description: >
  Memory stage of the expl-bot exploratory-testing crew (explorbot's `learn`, Historian experience and
  ExperienceCompactor on Claude Code). Adds human knowledge for a site (frontmatter url: glob, like
  `explorbot learn`) and records/compacts experience (FLOW / ACTION blocks) from a run's passed scenarios, so
  the next research, plan and test runs start smarter. Use when the user says "remember that /checkout needs
  …", "/expl-bot-learn", "save what worked", "update experience", or as the last step of expl-bot-orchestrator.
---

# expl-bot-learn

> Recommended settings: **Sonnet · Effort: Medium · Extended thinking: Off**.

Usage:
- `/expl-bot-learn knowledge "<url-pattern>" "<fact>" [--host <HOST>]` — add a human fact.
- `/expl-bot-learn experience [--run <RUN_ID>]` — record experience from a run.
- `/expl-bot-learn compact [--host <HOST>]` — compact experience files.

Formats: `.claude/skills/expl-bot-core/references/memory-formats.md`. Paths: `SITE` from `run-context.md`.

## Rules

- Knowledge is written only at the user's request and with the user's words; never invented, never inferred
  from the app. **No secrets on disk** (passwords, tokens, card numbers that are not public sandbox values)
  unless the user explicitly says to store them — otherwise tell the user to pass them per run in chat or in
  `EXPL_BOT_AUTH` and store only a non-secret hint ("login with the QA account, ask the user").
- Experience comes only from scenarios with `STATUS: PASSED` and real `CODE:` lines.
- Show what you are about to write when it is more than one block; the user may drop blocks.
- Created record names carrying the RUN_ID become `<name>` in stored code and steps.
- English. Short chat. Stop after reporting what changed.
- With `--independent`: only the `experience` mode runs, with no preview or confirmation; never write
  knowledge; no secrets (follow "Independent mode" in `run-context.md`).

## Knowledge

1. Resolve `HOST` (ask if unknown). Pattern from the user (`/login`, `/admin/*`, `*`, regex `^/…`, `~word~`).
2. If a knowledge file for the same pattern exists in `SITE/knowledge/` — show it and append the new fact (do
   not duplicate). Otherwise create `SITE/knowledge/<slug>.md` with frontmatter `url:` (+ optional `title:`) and
   the fact as plain text. Slug from the pattern (`login`, `admin-all`, `all`).
3. Confirm with one line: file path + pattern.

## Experience

1. Read `RUN/results/*.md` and `RUN/plan.md`. Take PASSED scenarios.
2. For each, group by `page-key` (from the start URL) and write to `SITE/experience/<page-key>.md` (create with
   the frontmatter if missing; append, never overwrite other blocks):
   - `## FLOW: <imperative how-to that matches what the steps accomplished>` — the steps that ran (bulleted),
     one `js` block built from the `CODE:` lines (only actions that worked), then `>` discovery lines from
     `NOTES`, then `---`.
   - `## ACTION: <single-step imperative>` + `Solution:` line + one `js` block, only for non-obvious fixes the
     tester recorded (an icon-only control found via aria-label, a container that was needed, a search-and-select
     sequence).
3. Skip a block if an equal FLOW title already exists (update it only if the new code is shorter and passed).
4. Update `SITE/state.json` → `testedScenarios` for scenarios that are not yet listed (the orchestrator normally
   did this; check, do not duplicate).
5. If a file now exceeds ~40 blocks or ~400 lines, run **compact**.
6. Interactive run (no `--independent`): after writing, ask once whether the user has human facts for this site
   to store (preconditions, test data, rules the app does not show) and, if yes, continue with the
   **Knowledge** mode using their words. Do not ask when the orchestrator already did.

## Compact

Per experience file: merge duplicate FLOW/ACTION titles, keep the shortest working recipe for each, keep every
`>` discovery line (deduplicated), drop failed variants, keep the frontmatter, keep titles imperative. Write the
result back and report `before → after` block counts. Ask before compacting more than one file.

## Final response

What was added/updated (paths + counts), anything skipped and why, and that the next `expl-bot-plan` /
`expl-bot-research` / `expl-bot-test` will read it automatically.
