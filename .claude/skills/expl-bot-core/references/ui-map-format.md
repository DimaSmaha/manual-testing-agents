# UI map format (ported from explorbot `docs/web-testing/researcher.md`, `rules/researcher/*`)

The researcher turns one page into a compact UI map: sections, containers and a table of controls whose
locators have been **tested against the live page**. The map is the only thing the planner and tester need
about the page; they never read full HTML.

## File: `sites/<host>/research/<page-key>.md`

```markdown
---
url: /products
title: Products
state_key: /products|-|Products>Filters
researched_at: 2026-11-06T14:32:00Z
mode: standard | deep
---

# Products

One or two sentences: what this page is FOR (business purpose), what a user comes here to do.

## Focus
<only when --focus was given: the focus text, and which sections it targets>

## List

Product catalog with sorting and filtering.

> Container: '.product-list'
> Pagination: controls

| Element | Type | ARIA | CSS |
|---|---|---|---|
| 'Sort by price' | button | { role: 'button', text: 'Sort by price' } | '.sort-btn' |
| 'Add to cart' | button | { role: 'button', text: 'Add to cart' } | '.add-btn' |

## Extended Research

### Add product (opened by: click 'New product')
> Container: '[role="dialog"]'
| Element | Type | ARIA | CSS |
| ... |

## Locator check
Checked N locators: N ok, N fixed, N unverified (see list). Containers: N ok / N broken.
```

`Type` is the ARIA role of the element (`button`, `link`, `textbox`, `combobox`, `checkbox`, `tab`, …). The
curious planner style reads this column to find coverage gaps.

## Section order (priority, highest first)

`overlay` > `list` > `detail` > `panes` > `content` > `menu` > `navigation`

- **overlay** — an open modal / drawer / popover. If present, everything else is behind it: research the
  overlay first and treat the rest as secondary.
- **list** — repeated items (rows, cards). Add `> Pagination: controls` (page numbers, prev/next, "load more")
  or `> Pagination: infinite` (loads on scroll). Omit the line when all items are shown. Sorting, filtering and
  tabs are not pagination.
- **detail** — the single-entity view / form.
- **panes** — split layouts (master/detail, side panel).
- **content** — main body not covered above (forms, text, charts).
- **menu** — toolbars, dropdown menus, user menu.
- **navigation** — global nav, breadcrumbs, footer.

Every section has a `> Container: '<css>'` blockquote line before its table (see container rules in
`locator-rules.md`). A section whose container cannot be verified gets `> Container: -` and its CSS column is
used containerless.

## Table rules

- Columns are exactly `Element | Type | ARIA | CSS` (add `Coordinates | Color | Icon` only if you took a
  screenshot pass; keep them IN the table).
- `Element` — human-readable name in quotes.
- `ARIA` — `{ role: '…', text: '…' }`, key is `text` (not `name`); icon buttons use `aria-label`/`title`; no
  accessible name → `-` and rely on CSS; never empty text.
- `CSS` — unique within the section, points to the interactive element itself (`input`, `button`, `a`,
  `select`), not to a wrapper. Prefer `type`, `value`, `name`, `href` parts and `aria-label` over wrapper ids.
  For buttons with similar text, include `type`/`value`/form context.
- Every row must match exactly ONE element. Repeated structures are disambiguated with `:has-text("…")`.
- Iframes: one row of type `iframe` inside the section that contains them.
- Do not list all text on the page. Controls only (and the headings that name sections).

## Pipeline (explorbot's 5 stages, adapted)

| # | Stage | Here |
|---|---|---|
| 1 | Research | `run-code --filename=…/scripts/page-state.js` and `…/scripts/interactive-map.js` + one `snapshot` → draft the sections and tables |
| 2 | Test | write `locator-check.js` (copy of `scripts/locator-check.template.js` with the draft's locators inlined) into the run folder and run it. Containers first, then locators. Record counts: 0 = broken, 1 = ok, >1 = ambiguous |
| 3 | Fix | for each broken / ambiguous locator, fix it from the interactive map (attributes, text) and re-run the check; max 2 rounds. If > 80% broken or all containers broken: redo stage 1 once |
| 4 | Visual (optional) | `screenshot` and Read it only if a control cannot be described from the DOM (canvas, icon-only toolbars). Add Coordinates/Color/Icon columns |
| 5 | Backfill | still-broken rows: use the element's id/name/data-testid from the interactive map to produce an XPath; containers still broken are set to `-` |

## Deep mode (`--deep`)

Click expandable controls to reveal hidden UI (dropdowns, tabs, accordions, "More" menus, row action menus).
Budget: **10 clicks**. For each click: `snapshot`, record what appeared under `## Extended Research` with the
revealing action ("opened by: click 'New product'"), then close it again (`press Escape` / the close
control). Do not submit anything while exploring; a deep pass opens, reads and closes. Reuse earlier deep
findings from the existing research file instead of repeating the clicks.

## Cache

`sites/<host>/research/<page-key>.md` is reused when it is **< 6 hours old** AND its `state_key` equals the
current `state_key` (from `page-state.js`). Explicit `/expl-bot-research` always runs fresh. A mismatch in
`state_key` means a different page state (modal open, different tab) → research that state under a distinct
`<page-key>` (e.g. `products--modal-add`).

## `page-key`

Slug of the URL path with ids collapsed: `/products/42/edit` → `products-id-edit`; `/` → `home`. A modal or
tab state appends `--<state>`. Used for file names in `research/`, `experience/` and `state.json`.
