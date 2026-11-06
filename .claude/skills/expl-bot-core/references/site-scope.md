# Site scope (what "the app" means for a run)

The stage skills (`research`, `plan`, `test`) work on **pages**. A run decides **which pages** with a scope.
This file is the single source for scope, page discovery and the per-page loop. Both orchestrators follow it.

## Scope modes

| `--scope` | Meaning | Who may use it |
|---|---|---|
| `page` | Only the URL given (the old behaviour). | Flow 1, Flow 2 |
| `pick` | Discover the pages, show the list, the **user chooses** which to cover. | Flow 1 only |
| `site` | Discover the pages and cover all of them up to `--max-pages`, no list review. | Flow 1, Flow 2 |

Related arguments:

- `--max-pages N` — most pages in scope, **including the start page** (default **8**).
- `--pages "<path>,<path>"` — extra pages named by the user (paths relative to the start origin, ids allowed:
  `/inventory-item.html?id=4`). Skips crawling; the start page is always included. Counts as an answered scope
  question (`pick` with a ready answer). `--pages` together with `--scope site` → still crawl, then add them.
- No `--scope` and no `--pages`: **Flow 1 asks** (orchestrator Step 1, recommended `pick`). **Flow 2 uses `site`**
  (it never asks). A URL that points deep into the app does not change this: the question is always asked.

## Discovery (skill `expl-bot-discover`, subagent mode `discover`)

Read-only. It finds the pages of the same origin and writes `RUN/pages.md`. It never mutates anything
(`data-protection.md`) and it never leaves the origin.

Sources, in order:

1. The start page's research file (`SITE/research/<page-key>.md`): link / menu / tab rows, the sidebar and footer.
   **Research the start page first**, deep when the user chose it, so hidden menus are in the file.
2. `run-code --filename=.claude/skills/expl-bot-core/scripts/discover-links.js`: every visible `a[href]` with its
   text and whether it is same-origin.
3. **Following navigation controls.** Many apps navigate from buttons or `href="#"` links (cart icon, product
   title, menu entries). Click such a control once, record `url`, title and first heading, then `go-back` (or
   `goto` the page it came from). Repeat on each newly found page (depth 2 at most).

Budgets: **15 navigation clicks**, depth ≤ 2, at most `max-pages × 2` candidates considered.

Never clicked, whatever the page: anything named or labelled like log out / sign out, reset, delete, remove,
clear, cancel order, add to cart / buy / pay / place order / finish, submit, save, send, confirm, continue (a
form's submit), and every control that sends a form. **Entry buttons** that only open a form (Checkout, Proceed,
Next step) may be clicked once; the form behind them is never submitted. Downloads, `mailto:`, `tel:`, `javascript:`
and file URLs are ignored.

Normalising: `page-key` as in `ui-map-format.md` (ids and query values collapsed:
`/inventory-item.html?id=3` → `inventory-item`). **One row per page-key**: keep the first URL as the sample.

Status of each row:

| Status | Meaning |
|---|---|
| `in-scope` | Reachable read-only with a plain URL load while logged in; will be researched, planned and tested. |
| `skipped-cap` | In scope by nature but over `--max-pages` (first `max-pages` in discovery order are kept). |
| `unselected` | `pick` mode: the user left it out. |
| `needs-data` | Only reachable after a state change or a form submit (second step of a checkout, a confirmation page). Not researched, listed in the report as not covered. |
| `external` | Another origin. Never opened beyond the one click that revealed it. |
| `ignored` | Sign-in / sign-up / password pages, logout. |

## `RUN/pages.md`

Written by the discoverer (Write tool). Re-running discovery recreates it; it never merges. A later round of the
same site copies the previous `pages.md` instead of crawling again.

```markdown
# Pages — <host> — <RUN_ID>

Scope: site | pick | page · Start: /inventory.html · Max pages: 8 · Discovered: <ISO time>

| # | page-key | URL (sample) | Title | Via | Status | Note |
|---|---|---|---|---|---|---|
| 1 | inventory | /inventory.html | Swag Labs | start | in-scope | |
| 2 | cart | /cart.html | Swag Labs | header cart link | in-scope | |
| 3 | inventory-item | /inventory-item.html?id=4 | Swag Labs | product title link | in-scope | one sample of six ids |
| 4 | checkout-step-one | /checkout-step-one.html | | cart 'Checkout' (entry button) | in-scope | form opened, not submitted |
| 5 | checkout-step-two | | | after submitting step one | needs-data | needs a form submit |
```

The start page is always row 1. `URL` is relative to the origin; for a repeated entity say so in `Note`.

## Per-page loop

For every `in-scope` row, in table order:

1. **Research** the page (`expl-bot-research <url> [--deep] --run <RUN_ID>`), one page per subagent call, one at a
   time (shared browser). A page that redirects to the login page or fails to load is reported
   (Flow 1: ask the user; Flow 2: mark that page `SKIPPED` and go on). Only the **start page** failing aborts the run.
2. **Plan once for the whole run** (`expl-bot-plan --pages`): one `plan.md`, each test carries its own page in
   `## Requirements`. See the "Multi-page plans" part of `planner-rules.md`.
3. **Test** the plan in order (`expl-bot-test`); each scenario starts at its own page.
4. **Report / learn** per run; experience and `state.json` are keyed per page-key, so they carry over.

## Budgets and defaults

| | Flow 1 | Flow 2 |
|---|---|---|
| `--max-pages` | 8 | 8 |
| `--max-tests` | 3 per page, at most 24 (user can override) | 3 per page, at most 24 (caller can override) |
| `--max-duration` | none | 60 minutes when scope is `site` (30 for `page`), checked before each scenario |

Pages beyond the budget are not dropped silently: they appear in the report under *Coverage → Not covered*.

## Data and safety

- Discovery and research never submit or change data. Pages that need data (`needs-data`) are **not covered**
  in this version; the report says so. Do not invent a way to reach them.
- A scenario on a discovered page follows `data-protection.md` like any other: it creates its own target first,
  names it with the RUN_ID and never touches pre-existing data.
- `Logout` is never planned or clicked in a multi-page run (it would end the session for the pages after it).
