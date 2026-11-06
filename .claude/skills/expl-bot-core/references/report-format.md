# Report format (ported from explorbot `src/ai/session-analyst.ts`)

The Analyst role: a TERSE end-of-run report. The reader is a developer or QA who wants to understand the
FEATURE — what works, what is broken, what is unclear. Every word earns its place.

Output Markdown. No JSON, no preamble, no closing summary. **No emoji.** Severity as plain text:
`[High]`, `[Medium]`, `[Low]`.

## Reporting unit

Report at the level of FEATURES / FLOWS / PAGES. Scenarios are evidence, not the unit. Several scenarios
covering the same flow → ONE entry citing all of them.

## Walk every scenario

- **PASSED**: did all steps run, was the goal actually verified, did the user-visible goal happen? All yes →
  contributes to *What works*. Any no → *Execution Issues* (false positive).
- **FAILED**, first match wins:
  1. goal achieved but mis-verified → Execution
  2. automation failure (locator / timeout / loop / modal / a11y) → Execution
  3. bad preconditions or data → Execution
  4. wrong URL / environment → Execution
  5. the app contradicted the expected outcome → **Defect**
- **STUCK** → Execution Issues always. **BLOCKED** → Execution Issues, with the missing precondition or
  capability named.

Crucial distinction: "the app misbehaved" vs "the automation could not interact with the app". ONLY the
first is a Defect. Timeouts, retries exhausted, dead loop, cannot click or find an element = Execution issue,
whatever the log calls it.

The action log is more authoritative than the scenario title. If the data actually submitted, the page state
or the action sequence does not match the title, classify as Execution and do not list it under *What works*.
Do not infer a Defect or UX issue from behaviour caused by wrong test data or an automation mismatch.
Negative test data is valid when it matches a negative scenario (psycho style).

A solitary failure where adjacent scenarios on the same feature passed → Execution, not Defect.

## Severity (defects only)

`[High]` blocks a core flow · `[Medium]` degrades a flow but a workaround exists · `[Low]` cosmetic / edge case.

## Naming scenarios

Reference every scenario by `S<n> <title>` in backticks — the number and title from `plan.md`. Backticks
only, never bold. Never a bare `S2`.

## Template (`runs/<RUN_ID>/report.md`)

```markdown
# Exploration report — <host> · <RUN_ID>

<ONE or TWO sentences describing the FEATURE STATE — what was explored, whether the core flow holds, what the
standout problem is. No counts, no "N tests run". Talk about the product, not the run.>

## Coverage
- Pages: <paths>
- Features: <capabilities>
- Not covered: <page — reason; only when RUN/pages.md exists and has such rows>

## What works
- **<feature>** — `S2 <title>`, `S7 <title>`

## Defects

### [Medium] <plain-English bug title>
Affects: `S3 <title>`, `S5 <title>`
Reproduce:
  1. <concrete UI step>
  2. <next>
Evidence: <one short observation, screenshot path if any>

## UX issues
- **<feature>** — <what is confusing> (`S7 <title>`)

## Execution Issues
- `S2 <title>` — <≤10 words, what was unreliable>

## Data created by this run
- <name> — removed | left in place
```

## Multi-page runs

When `RUN/pages.md` exists:

- *Coverage → Pages* lists every page that had at least one executed scenario (path only).
- *Coverage → Not covered* has one entry per row with status `skipped-cap`, `unselected` or `needs-data`, as
  `<page-key> — <reason>` (for example `checkout-step-two — needs a form submit`, `about — over the page limit`).
  `external` and `ignored` rows are not listed. A page that was researched but whose scenarios were all
  `BLOCKED`/not executed is listed under *Execution Issues*, not under *Not covered*.
- *What works* groups by feature, not by page; one entry may cite scenarios from several pages.
- Defect titles name the feature, and `Reproduce` names the page where it happened.

## Brevity rules

- Headline: 2 sentences MAX. About the feature, not the run. No counts. Never use the words "exercised",
  "comprehensive", "notably", "this session", "module", "targeted", "covered creation".
- *What works*: feature name + scenario refs. NO parentheticals, NO caveats. If there is a caveat, the entry
  does not belong here.
- Defect title is the BUG ("Search returns non-matching results"), never the scenario name.
- Reproduce steps: imperative one-liners drawn from the log.
- Evidence: one short factual observation. Never quote the raw result block.
- Execution Issues: ONE line per scenario, ≤ 10 words, plain ("passed vacuously, no list assertion", "dead
  loop on Save click"). No prefixes, no nested explanation.
- Omit any empty section, except *Data created by this run*, which is always present (write `none`).
- Section order: Coverage → What works → Defects (severity desc) → UX issues → Execution Issues → Data
  created.

## Historian (optional output): scenarios to Playwright tests

For each `PASSED` scenario, `expl-bot-report` may write `tests/expl-bot/<scenario-slug>.spec.ts` from the
`CODE:` lines of its result block:

- One `test('<scenario title>', async ({ page }) => { … })` per scenario; start with
  `await page.goto('<absolute url>')`.
- Only lines from actions that worked, in order. Drop duplicate/failed attempts and snapshot-only commands.
- Record each verified expected result as an `expect(...)` that mirrors the check you ran. If a check cannot be
  expressed in Playwright, add `// NOT VERIFIED: <expected>` instead of a weaker assertion.
- Names that carry the RUN_ID become `\`${runId}\`` or a const at the top; the test must create its own data.
- **A PASSED scenario that exposed a defect** (it is named in a `### [Severity]` entry of the same report under
  `Affects:`, or its `NOTES` describe the bug behind that entry) must **not** assert the buggy behaviour: such a
  test would pass today and break when the bug is fixed. Write the steps that ran, then assert what the app
  **should** do. The scenario's own `EXPECTED` lines that passed and are not about the bug stay as they are.
  Mark the test as a known failing test and point to the report:
  - header comment: `// Defect: "<Defect title>" — .workflow-artifacts/expl-bot/runs/<RUN_ID>/report.md, Defects`
  - first line of the test body: `test.fail(true, 'Known defect: <Defect title> (see report.md)');`
    (Playwright then counts the run green while the bug exists and flags it as soon as the test starts to pass;
    deleting that line makes the test a plain red test.)
  - the expected behaviour must come from the report entry or the run's evidence (an error message shown, the
    URL unchanged). Do not invent a message text the run never saw; assert only that an error element is
    visible and the URL did not change, and mark the rest `NOT VERIFIED`.
  - never click a control that places an order or ends the session to "finish" the flow; if the test fails at the
    defect assertion, nothing after it runs, so write steps that leave nothing behind.
  List these drafts in the final response as "expected to fail".
- Never include credentials. Use `process.env.<NAME>` placeholders and a comment. Put the login in one shared
  `tests/expl-bot/helpers.ts` (with the other locator helpers) instead of repeating it in every spec; a locator
  the result blocks did not record is marked `NOT VERIFIED` in a comment at the top of the spec.
- These are drafts: do not run them against the user's app unless the user asks.
