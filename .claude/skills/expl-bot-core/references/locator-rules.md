# Locator rules (ported from explorbot `src/ai/rules.ts`, rewritten for playwright-cli)

How to pick the thing you act on. Applies to the researcher (UI map), the tester (actions) and the
planner (it never writes locators, only names controls the way the UI map names them).

## Priority

1. **Snapshot ref** (`e15`) — the default for one-off actions right after a fresh `snapshot`. Refs die on
   every page change: take a new snapshot before each action.
2. **ARIA / role locator** — `getByRole('button', { name: 'Save' })`. Copy role and name **verbatim** from
   the snapshot or the UI map. Never guess the pair: a guessed role can silently match another element with
   the same text. If the element is named nowhere, use text or CSS instead.
3. **Text locator** — exact visible text, only when it is unique on the page. Skip if the text repeats.
4. **CSS** — semantic attributes: `id`, `name`, `data-testid`, `aria-label`, `placeholder`.
   Example: `#login-btn`, `[data-testid="submit"]`, `form#login input[name="email"]`.
5. **XPath** — last resort. Start with `//`. Positional indices (`[1]`) only as a last disambiguator.

Anything that is not a ref goes to playwright-cli as a Playwright locator string:
`playwright-cli -s=<S> click "getByRole('button', { name: 'Save' })"`.

**Permission-check caveat (selectors with quotes, brackets, parentheses or dots).** The CLI's permission check
cannot prove that an inline argument like `button[data-test='remove-sauce-labs-onesie']` or
`add-to-cart-test.allthethings()-t-shirt-(red)` is not a path computed at run time, so it can block the call
(`blockReadsOutsideWorkingDirectories`). Do not retry the same inline command. Use, in this order:
1. a snapshot ref (`click e54`) after a fresh `snapshot`;
2. a one-off `run-code` script file written with Write into `RUN/scripts/`, with the locator hardcoded
   (`await page.locator('button[data-test="remove-sauce-labs-onesie"]').click();`), run as one simple command:
   `playwright-cli --raw -s=<S> run-code --filename=.workflow-artifacts/expl-bot/runs/<RUN_ID>/scripts/<name>.js > .workflow-artifacts/expl-bot/runs/<RUN_ID>/out/<name>.out 2>&1`
   Group several actions of one step into one script when they are independent (for example removing every item
   the scenario added).

## Containers

- Add a container when the target may match several elements (`Save` in a modal and in the page form).
  In playwright-cli: `click "locator('[role=dialog]').getByRole('button', { name: 'Save' })"`.
- Skip the container when the locator is already unique (unique id, unique text, XPath).
- A wrong or stale container guarantees failure: always keep a containerless fallback.
- Container CSS must be a SINGLE semantic selector (one class, one id, or one attribute):
  - INVALID: bare tags (`div`, `section`), combinators (`div > .content`, `.a .b`), layout/utility classes
    (`flex-*`, `col-*`, `mt-*`, `p-*`, `bg-*`, `text-*`, `items-*`, `rounded-*`, Bootstrap `row`, `d-flex`).
  - VALID: `.product-list`, `.sidebar-menu`, `[role="dialog"]`, `#main-content`.
- Iframes are not sections. List each iframe as one row of type `iframe` inside the section that holds it.

## Disambiguation (several elements could match)

1. Match the context of recent actions — filling a form means elements of that same form.
2. Follow form flow — top-to-bottom, left-to-right; the next target is after the field you just filled.
3. Use the snapshot to read element state (focused, selected, expanded, disabled).
4. Prefer semantic proximity to the field you just touched.
5. When a locator matches N > 1 elements, nothing should be clicked. Pick by position from the list
   (`.nth(k)` / `>> nth=k`) and record which one you chose.

## Icon-only controls

- Use the `aria-label` or `title` value as the name: `getByRole('button', { name: 'Close' })`.
- No accessible name at all: ARIA column is `-`; use CSS/XPath: partial href `a[href*="settings"]`, or SVG
  class `a:has(svg.icon-settings)`.
- Never use an empty name. `{ role: 'button', name: '' }` is invalid and useless.
- In inline create/edit rows the confirm can be an icon-only control next to the field: anchor the locator to
  the same row/form as the field.

## Do not

- No generated ids / class names: Ember `#ember123`, React `#react-select-*`, `#rc-*`, Angular `#ng-*`,
  `#cdk-*`, `#mat-*`, Vue `data-v-*`, long random numbers, uuids, hashes.
- No CSS-framework utility classes as anchors (Tailwind, Bootstrap).
- No full absolute hrefs (`a[href="/items/12345/settings"]`) — use a path segment: `a[href*="settings"]`.
- No `onclick` or framework-specific tag paths (`//html/body/vue-button-123`).
- No positional pseudo classes in CSS: `:nth-of-type`, `:nth-child`, `:first`, `:last`, `:not`, `:empty`.
  Allowed: `:has-text("text")` and `:has(...)`.
- XPath and CSS for the same element must be **different strategies** (not the same selector in two syntaxes).
- Never put the `data-explorbot-eidx` attribute (explorbot's internal annotation) into any locator.

## List items

Every row of a UI map table must match exactly ONE element. For repeated structures (tabs, menu links, table
rows) disambiguate by visible text: `a.filter-tab:has-text("Manual")`, `a.node-link:has-text("IMR_API_Tests")`.
