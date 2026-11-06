---
name: expl-bot-report
description: >
  Reporting stage of the expl-bot exploratory-testing crew (explorbot's Analyst + Historian on Claude Code).
  Reads the scenario result blocks of a run and writes a terse report with fixed sections (Coverage, What
  works, Defects [High/Medium/Low], UX issues, Execution Issues, Data created), clustering by root cause and
  separating product defects from automation problems. Optionally turns passing scenarios into runnable
  Playwright draft tests under tests/expl-bot/. Use when the user says "write the report", "/expl-bot-report",
  "turn the passed scenarios into tests", or as step 5 of expl-bot-orchestrator.
---

# expl-bot-report

> Recommended settings: **Opus · Effort: High · Extended thinking: On** (classification of defects vs.
> automation issues).

Usage: `/expl-bot-report [--run <RUN_ID>] [--tests]`

Input — `RUN/plan.md`, `RUN/results/*.md`, screenshots. Output — `RUN/report.md`; with `--tests` (or when the
user asks) `tests/expl-bot/<scenario-slug>.spec.ts` drafts.

## Rules

- Read `run-context.md` and `.claude/skills/expl-bot-core/references/report-format.md` (the template and the
  brevity rules are binding), `verification-rules.md` for "NOT VERIFIED".
- Report sources are only the result blocks and screenshots. No new browsing, no guessing. If a block is
  missing for a planned scenario, list it under Execution Issues as "not executed".
- No emoji. Severity as `[High]`/`[Medium]`/`[Low]`. Scenarios referenced as `` `S<n> <title>` ``.
- Product defects are separated from automation problems; a solitary failure whose neighbours on the same
  feature passed is an Execution issue.
- Re-running deletes and recreates `RUN/report.md`.
- With `--independent`: follow "Independent mode" in `run-context.md`; write test drafts only if `--tests` is
  explicitly passed.
- Stop after saving. Do not start learning/updating memory here (`expl-bot-learn` does that).

## Workflow

1. **Resolve** the run. Read `plan.md` (titles, priorities, outcome categories) and every `results/<n>.md`.
   If `RUN/pages.md` exists (multi-page run), read it too: it feeds *Coverage* and *Not covered*
   (`report-format.md`, "Multi-page runs").
2. **Walk every scenario** by the rules in `report-format.md`:
   - PASSED: verified goal + all expected results PASSED/justified NOT VERIFIED → *What works*; a PASSED
     with an empty or vacuous check, or where submitted data ≠ title → *Execution Issues* (false positive).
   - FAILED: first matching rule wins (mis-verified, automation, preconditions/data, wrong environment,
     else Defect).
   - STUCK / BLOCKED → *Execution Issues* (BLOCKED names the missing precondition/capability).
3. **Cluster by root cause**: one Defect entry for several scenarios with the same cause. Title is the bug.
   Severity: High blocks a core flow, Medium degrades a flow with a workaround, Low cosmetic/edge.
   Reproduce steps are imperative one-liners from the `CODE:`/`EXPECTED` evidence; Evidence is one short
   observation (+ screenshot path). Console/network errors from `NOTES` go into Evidence, not into a separate
   section.
4. **UX issues**: only observations from `NOTES` (`> …`) that describe confusing behaviour of a feature and are
   not defects.
5. **Coverage**: pages from the plan, features from the *What works*/*Defects* entries.
6. **Data created by this run**: union of `CREATED:` minus `DELETED/EDITED`; mark `removed` / `left in place`.
   Leftover records are listed, not hidden. (Deleting them is allowed only for the run's own records and only on
   the user's request here.)
7. Write `RUN/report.md` with the template, omitting empty sections (not *Data created*). Check: one
   top-level heading, headline ≤ 2 sentences without counts, no banned words from the brevity rules.
8. **Historian**. Without `--tests` and when the user has not already said no: in an interactive run
   (no `--independent`) ask once, recommending yes: "Write runnable Playwright drafts for the passed
   scenarios into `tests/expl-bot/`? (new files in this repo)". With `--independent` never ask and write
   drafts only when `--tests` is passed. For each PASSED scenario write
   `tests/expl-bot/<scenario-slug>.spec.ts` per the "Historian" part of `report-format.md`, from the `CODE:`
   lines and the verified expected results. Create the folder with the Write tool. Logins come from the
   environment (`process.env`), in one shared `tests/expl-bot/helpers.ts`; mark locators the result blocks
   did not record as `NOT VERIFIED`. **A PASSED scenario that is cited in a report Defect** (its `Affects:` line
   or the `>` notes behind it) is written with the **correct-behaviour assertion**, not with the buggy behaviour
   it observed, and is marked as a known failing test that points to the Defect (`report-format.md`,
   "Historian"). These are drafts; do not run them against the user's app unless asked. After writing, list the
   files, say which ones are expected to fail and why — they are new tracked files in this repo, so say so.
9. **Final response**: path of the report, counters of defects by severity, execution issues count, leftover
   data, and the test drafts if any. Offer `/expl-bot-learn`.
