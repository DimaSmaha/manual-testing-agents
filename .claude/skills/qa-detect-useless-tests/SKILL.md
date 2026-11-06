---
name: qa-detect-useless-tests
description: >
  Optional helper for the QA pipeline (expl1-*). Reads the test cases of one task
  (`<ISSUEKEY>-4-test-cases.md`, or any set of tests the user points to) and lists the ones not
  worth keeping, judged against peers of the same level: Remove, Merge, Simplify or Move to
  lower-level automation. Read-only, candidates only. Use when the user says "which tests can we
  delete?", "find useless tests", "prune the test cases", or when the expl1-orchestrator offers
  it after stage 4. Adapted from testomatio/skills (MIT).
author: Testomat.io (adapted)
---

# Detect Useless Tests

> ⚙️ Recommended settings: **Sonnet · Effort: High · Extended thinking: Off**

Go through tests of the same level (unit, e2e or manual) and detect the useless ones. In the
pipeline the level is manual: the test cases of stage 4. Every test has trade-offs in execution
speed, conditions checked and coupling to implementation details, so judge tests against others
of the same level only.

Judge each test primarily by its value to an end-user business flow. Look first at tests that are
fragile to changes or rely on time-consuming operations (database, browser, long setup).

## Input

- Default: `.workflow-artifacts/<ISSUEKEY>/<ISSUEKEY>-4-test-cases.md`.
  Ask for `<ISSUEKEY>` if it is not clear from the chat.
- Or exact locations of the tests to check, given by the user. The user must say the level
  (unit, e2e, manual) if the files are not stage 4 output.
- Read `<ISSUEKEY>-2-requirements.md` too, when it exists, to know which wording and values a
  requirement fixes (see the first rule below).

## Rules

- English only. Chat messages are short.
- Read-only. Do not edit test cases or any pipeline artifact. The test cases carry stable
  `TC-REQ-N.N` ids and mandatory requirement links: report on them, never renumber or delete them.
- **A requirement beats this list.** If a requirement states a label, message text, color,
  value or wording, a test that checks it is valid. Never list it as cosmetic. The same for a test
  whose `REQ-N` is the only one covering that requirement: removing it leaves the requirement
  uncovered. Name this in the Why column instead of recommending `Remove`.
- No invented data. Name the exact test (id and title) and state the problem directly.

## Treat as likely useless

Flag tests that primarily cover:

- Internal observability, tracing, logging, metrics or diagnostic structure.
- Developer-only switches, escape hatches, debug modes, build paths or release internals.
- Cosmetic UI details such as wording, colors, shimmer, centering, labels, icons, breakpoints or
  transient status text (unless a requirement states them).
- Implementation workarounds rather than stable public behavior.
- Conditions with little or no impact on a customer workflow.
- Every variation of the same error, shortcut, platform, state transition or entry point.
- Behavior already exercised by another test.
- Setup persistence or state-retention details that only save the user minor effort.
- Expensive external-service, browser, installation, restart, release or multi-platform flows with
  weak business value.
- Regressions tied to an old implementation rather than the current public contract.
- Assertions that cannot meaningfully fail, or whose expected result is vague.
- Checks of exact success or error message text instead of success or error behavior.
- Implementation details not exposed through the public interface.

A test can be technically valid and still be useless. Do not preserve a test merely because:

- it once caught a regression;
- it has assertions;
- it covers a distinct code path;
- no other test is an exact duplicate.

Exception: keep tests whose title, tag or comment names a defect. A ticket or fix commit found in
history does not count.

A test whose steps are a strict subset of another test's steps is a `Merge` candidate: name the
test that should remain.

## Preserve only when justified

Keep a test only when it protects at least one of these:

- A critical end-user business flow.
- Data loss, security, permissions, billing or irreversible actions.
- A stable public API or documented product contract.
- A defect explicitly identified in the test by an issue or defect reference, or a clearly
  described failure with material user impact.
- A requirement that states what the test checks (see the rules).

A sentence such as "this used to happen" is not enough by itself.

When a defect needs protection, keep the smallest regression scenario possible. Merge permutations
instead of preserving every trigger.

## Review method

1. Read the complete contents of every file or section in scope.
2. Review the explicit test cases (steps and expected results), not just titles, priorities or metadata.
3. Compare intent, business outcome, setup cost, assertions and overlap.
4. Prefer removing a whole group when its subject is not appropriate for business-level testing.
5. For repetitive tests, select one canonical scenario and recommend merging or removing the others.

## Output file

Create `.workflow-artifacts/<ISSUEKEY>/<ISSUEKEY>-x-test-pruning.md` and tell the user the path.
If the tests are not stage 4 output (no `<ISSUEKEY>`), show the result in chat only. If the file
exists — delete it completely and create a new one.

Return only cleanup candidates, one row per test, grouped by area (requirement or file). Recommendations:
`Remove`, `Merge`, `Simplify`, `Move to lower-level automation`.

```
# Test pruning: <ISSUEKEY>

Source: <file(s) reviewed>

| Test | Requirement | Action | Why | Keep instead |
|------|-------------|--------|-----|--------------|
| TC-REQ-1.2: <title> | REQ-1 | Merge | <business-value problem> | TC-REQ-1.1 |

Totals: reviewed N · remove N · merge N · simplify N · move N
```

- Do not list tests that should simply be kept.
- For duplicates, name the test that should remain in `Keep instead`.
- End with totals only.

## Final response

Report the path and the totals. Apply nothing. If the user approves a change, the way to apply it is
to re-run `expl1-4-qa-test-cases`, which deletes and recreates its file.
