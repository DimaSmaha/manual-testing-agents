# Planner rules (ported from explorbot `docs/web-testing/planner.md`, `src/ai/planner.ts`, `rules/planner/*`)

Read this first, then the ONE style file for the current run: `planner-styles/<style>.md`.

## Style rotation

`normal → curious → psycho → normal …` Each plan run advances the style, stored per site in
`sites/<host>/state.json` (`styleIndex`, `lastStyle`). `--style` overrides it for one run. Run again and the
planner adds scenarios in a different style and **skips scenarios that already exist** (see dedup below).

| Style | Focus |
|---|---|
| normal | Complete user workflows: CRUD, full commit flows, filter + verify. Spread across feature areas. UI-only tests last. |
| curious | Coverage gaps: compare previous tests with the research and attack the controls never touched. Variation and dismissal scenarios stay separate. |
| psycho | Invalid / extreme input into **every reachable control in one scenario**, then commit. Never "bad data then cancel". |

## Input mapping for the style files

The style files were written for explorbot's prompt and use these tags. In this repo they mean:

| Tag in a style file | Here |
|---|---|
| `<page_research>` | `sites/<host>/research/<page-key>.md` (UI map + Extended Research) |
| `<previously_tested_flows>` | `## FLOW:` blocks (and `>` discovery lines) in `sites/<host>/experience/<page-key>.md` |
| `<tested_scenarios>` | `testedScenarios[<page-key>]` in `sites/<host>/state.json` (titles + the steps that ran) |
| "Menu/Navigation section" | the `menu` and `navigation` sections of the UI map |
| "Extended Research" | the `## Extended Research` part of the research file |
| "the Type column shows the ARIA role" | the `ARIA` column of the UI map |

## Output ranking (all styles)

Rank every scenario by outcome strength, strongest first:

1. **Data change** — a record is created, edited or deleted; a setting is persisted; a message is sent; a job
   is triggered; an item is shared or exported.
2. **State change** — route/URL change, filter or sort applied to real data, a mode the app remembers.
3. **UI-only change** — opens, closes, cancels, hovers, toggles for display. Last, and only when it has a
   verifiable side effect (warning prompt, persisted draft, rollback, badge).

Rules:
- 3–12 scenarios per plan (default target = `--max-tests`, else 6).
- At most **2** scenarios per feature area. Data-changing scenarios first.
- Skip navigation/menu: the page under test is THIS page.
- Every Extended Research section (modal, dropdown, panel) with actionable features deserves a scenario.
- Multiple ways to create or modify data (types, forms, options) → one scenario each.
- Scenarios that modify or delete something must create their own target first (`data-protection.md`);
  the scenario text says "create X named `<RUN_ID> …`, then edit it".
- Capabilities must be grounded in the research (`capability-grounding.md`).
- Do not plan tests for sign in / sign up / password recovery pages (`ignored pages`). If the page shows a
  login form instead of the content its URL is for, set the plan's prerequisite and ask the user (login).
- Focus is a **testing brief**, not a keyword: one feature boundary + user goal + behaviours that matter, and
  what to leave out. `--focus "checkout"` alone is ambiguous — ask the user to sharpen it or restate it
  yourself and show it in the plan header.
- Read-only focus ("do not change data", "search only") → every scenario is read-only (`data-protection.md` 5).

## Priorities

| Priority | Meaning |
|---|---|
| critical | Blocks the core purpose of the page; data loss / corruption risk |
| important | Main user workflows |
| high | Common secondary flows, validation of key forms |
| normal | Default |
| low | Cosmetic / rare edge cases |

## Dedup against earlier plans

Before writing a scenario, compare with `testedScenarios` and the experience FLOW titles. A scenario is a
duplicate if it uses the same feature area, the same controls and the same outcome category. Reworded
duplicates are still duplicates. New scenarios must use controls / outcomes not covered yet (this is what the
`curious` style mines for).

## `--from <ISSUEKEY>` (expl1 link)

If `.workflow-artifacts/<ISSUEKEY>/<ISSUEKEY>-2-requirements.md` and/or `-4-test-cases.md` exist:
- ~70% of scenarios exercise the documented behaviour (cite the `REQ-N` / `TC-N` in the scenario's
  `## Requirements` section after the URL), ~30% explore beyond it (explorbot Scout `docsWeight` idea).
- Never change those files; never renumber `REQ-N`.
- If the files are missing, say so in one line and plan from the research alone.

## Plan file

Write `runs/<RUN_ID>/plan.md` in **explorbot's plan format** so `npx explorbot test <plan.md> '*'` (Flow 3)
can run it. Format details and a template are in `memory-formats.md` ("Plan file").
