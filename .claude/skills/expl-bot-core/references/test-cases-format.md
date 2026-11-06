# Test cases file (human-readable view of the plan)

`runs/<RUN_ID>/plan.md` stays in explorbot's format (`memory-formats.md`): the tester and Flow 3 read it. People
read `runs/<RUN_ID>/test-cases.md`, written by `expl-bot-plan` from the same scenarios, in the style of the
`expl1-4` test cases (table of step / test data / expected result).

## Rules

- **Derived, never a second source.** `plan.md` is the source of truth. Write `test-cases.md` right after
  `plan.md`, and again after every edit the user makes at the approval checkpoint (drop, reorder, add, change
  priority). Re-running deletes and recreates the file; it never merges. Nobody edits it by hand; the tester
  and the report do not read it.
- **No invented content.** Everything comes from the plan scenario and the research file. Preconditions are the
  suite prerequisite plus the state the steps assume (for example "the cart is empty"). No new checks.
- **IDs**: `TC-S<n>` where `<n>` is the scenario number (`S1…Sn` by plan order), the same number as
  `results/<n>.md` and the report's `` `S<n> <title>` `` references.
- **One row per `## Steps` item**, in order. Every `## Expected` item appears **verbatim** in the *Expected
  result* column of the row where it first becomes checkable (the last row if unsure, and for an item that
  spans several checks, such as "3 after the adds, then 2 after the remove"). Never annotate or split an
  expected item. A row with no check gets `—`.
- **Test data**: concrete values the step uses, in quotes (product names, sort options). Otherwise `—`.
  Names of created records carry the real RUN_ID, as in the plan. No credentials.
- **Cleanup**: steps that restore state (remove what the scenario added) are normal rows. *Postcondition* names
  the final state (for example "cart empty, sort = Name (A to Z)"); omit it when nothing changed.
- English. No emoji. The title is the plan heading, unchanged.

## Template

```markdown
# Test cases — <host> · <page> · <RUN_ID>

Plan: plan.md · Style: <style> · Generated: <YYYY-MM-DD>
Focus: <one-line restatement from the plan header>
Source of truth: plan.md. This file is generated from it; do not edit.

## Overview

| ID | Priority | Area | Outcome | Title |
|---|---|---|---|---|
| TC-S1 | critical | add to cart | data | <plan heading> |

For a multi-page plan add a `Page` column after `ID` (the scenario's `## Requirements` path, for example
`/cart.html`) and keep the scenarios in plan order.

---

## TC-S1: <plan heading>

**Priority:** critical · **Area:** add to cart · **Outcome:** data · **Covers:** REQ-3, TC-7 (or `—`)
**Page:** /inventory.html
**Precondition:** <what must be true before step 1>

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | <step> | <data or —> | <expected item verbatim, or —> |
| 2 | <step> | <data or —> | <expected item verbatim, or —> |

**Postcondition:** <final state — only if it changed>

---

## Summary

- Scenarios: <N> (data <n>, state <n>, ui <n>)
- Priorities: critical <n>, important <n>, high <n>, normal <n>, low <n>
```
