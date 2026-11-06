# Memory formats (explorbot-compatible)

Everything lives in `.workflow-artifacts/expl-bot/` (git-ignored, persists across runs). Knowledge and the
plan use **explorbot's own formats** so Flow 3 (`npx explorbot`) reads the same files.

```
.workflow-artifacts/expl-bot/
  sites/<host>/knowledge/*.md             human facts (frontmatter url: glob)
  sites/<host>/experience/<page-key>.md   FLOW / ACTION blocks, read as a TOC
  sites/<host>/research/<page-key>.md     UI maps (ui-map-format.md)
  sites/<host>/state.json                 style rotation + tested scenarios
  sites/<host>/auth.json                  optional playwright-cli state-save (cookies = a login secret; only with the user's yes)
  runs/<RUN_ID>/plan.md  test-cases.md  results/<n>.md  report.md  screenshots/  scripts/  out/
```

`<host>` = hostname with the port when not default (`localhost-3000`). `<page-key>` is defined in
`ui-map-format.md`.

## Knowledge (human facts)

`sites/<host>/knowledge/<slug>.md`:

```markdown
---
url: /checkout
title: Checkout
---

Credit card field requires the format XXXX-XXXX-XXXX-XXXX.
Use the sandbox card 4111 1111 1111 1111 with any future expiry.
```

URL patterns (frontmatter `url:`):

| Pattern | Matches |
|---|---|
| `/login` | exact path |
| `/admin/*` | any path starting with `/admin/` |
| `*` | all pages |
| `^/users/\d+` | regex |
| `~dashboard~` | regex "dashboard" anywhere in the URL |

Rules:
- Knowledge is written by the **user** (or by `expl-bot-learn` at the user's request) and never invented.
- **No secrets on disk** unless the user explicitly asks for it. Per-run credentials stay in the chat or in
  `EXPL_BOT_AUTH` (kept in memory only).
- Load every file whose pattern matches the current URL before researching / planning / testing, and also the
  `*` ones. Matching knowledge is given to the researcher, planner and tester as a short "Known facts" block.

## Experience (what worked on this page)

`sites/<host>/experience/<page-key>.md`. Written by `expl-bot-learn` from tester result blocks. Two kinds of
block:

```markdown
---
url: /products
state_key: /products|-|Products>Filters
updated: 2026-11-06
---

## FLOW: Create a product and find it in the list

* Click 'New product'
* Fill 'Name' with the product name
* Click 'Save'
* Search the list for the product name

```js
await page.getByRole('button', { name: 'New product' }).click();
await page.getByLabel('Name').fill('…');
await page.getByRole('button', { name: 'Save' }).click();
```

> Side panel 'Tags' appears after Save
> 'Price' accepts max 2 decimals

---

## ACTION: Close the product modal

Solution: the close icon has no text; use the aria-label.
```js
await page.getByRole('button', { name: 'Close' }).click();
```

---
```

- **FLOW** — a multi-step imperative how-to that really passed. Steps + working code + `>` discovery lines.
- **ACTION** — a single-step recipe, optionally with a `Solution:` line explaining a non-obvious locator or
  trick, and one `js` block.
- Titles are imperative ("Create…", "Close…"), so a table of contents is meaningful.
- Experience is read as a **TOC** (list the `## FLOW:` / `## ACTION:` titles) and individual blocks are pulled
  on demand. Do not paste whole experience files into a subagent prompt.
- Never store data values that belong to a real user. Created-record names with a RUN_ID are replaced by
  `<name>` in code.
- Compaction: when a file exceeds ~40 blocks or ~400 lines, merge duplicates, keep the shortest working
  recipe, keep all `>` discoveries, drop failed variants.

## state.json

```json
{
  "styleIndex": 1,
  "lastStyle": "normal",
  "lastRun": "eb-261106-1432",
  "testedScenarios": {
    "products": [
      { "run": "eb-261106-1432", "title": "Create a product", "area": "products",
        "outcome": "data", "status": "PASSED", "steps": ["Click 'New product'", "Fill 'Name'", "Click 'Save'"] }
    ]
  },
  "researchedAt": { "products": "2026-11-06T14:32:00Z" }
}
```

Updated by the orchestrator after each run (not by subagents). `outcome` is `data | state | ui`.

## Plan file (`runs/<RUN_ID>/plan.md`) — explorbot test-plan format

```markdown
<!-- suite -->
# Exploration plan — <host> / <page> — <style> — <RUN_ID>

### Prerequisite

* URL: /relative-path

<!-- test
priority: critical
-->
# Create a product named with the run id and find it in the list

## Requirements
/relative-path

## Steps
* Click 'New product'
* Fill 'Name' with "<RUN_ID> Product A"
* Click 'Save'
* Search the list for "<RUN_ID> Product A"

## Expected
* The product "<RUN_ID> Product A" appears in the list
* A success message is shown

<!-- test
priority: normal
-->
# …next scenario
```

Rules:
- Valid priorities: `critical`, `important`, `high`, `normal`, `low`.
- The suite URL is relative to the base URL (starts with `/`). Each test has its own `## Requirements` URL.
- `#` scenario heading = a business outcome sentence, not a click path.
- `## Steps` are guidance; `## Expected` items must be verifiable (a data change, a state change, or a UI
  change with a side effect).
- Scenarios are numbered `S1…Sn` by order for the report and results files (`results/<n>.md`); the number is not
  written into the heading.
- The `<RUN_ID>` placeholder is replaced by the real run id when writing the file.
