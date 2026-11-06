# Action mapping: explorbot `I.*` → playwright-cli

Explorbot drives CodeceptJS (`I.click`, `I.fillField`, …). In this repo the hands are `playwright-cli`.
Always pass `-s=<SESSION>`. Read the `playwright-cli` skill for the full command list; this table is the
translation the crew uses.

| Explorbot | playwright-cli |
|---|---|
| `I.click(loc, ctx)` | `click <ref>` or `click "<playwright locator>"` |
| `I.fillField(loc, text)` | `fill <ref> "<text>"` (add `--submit` only when the step says to press Enter) |
| `I.type(text)` (focused element) | `type "<text>"` |
| `I.pressKey('Enter')` | `press Enter` (`press Control+a`, `press ArrowDown`) |
| `I.selectOption(loc, v)` | `select <ref> "<value>"` |
| `I.checkOption` / `I.uncheckOption` | `check <ref>` / `uncheck <ref>` (idempotent — never `click` a checkbox) |
| `I.attachFile(loc, path)` | `upload <path>` after the file chooser is triggered (see playwright-cli skill) |
| `I.moveCursorTo(loc)` | `hover <ref>` — then `snapshot` to see tooltips / menus |
| `I.scrollTo(loc)` | `eval "el => el.scrollIntoView()" <ref>` |
| `I.switchTo(iframe)` | Playwright locator via `frameLocator('<iframe css>')`, or `run-code` with `contentFrame()` |
| `I.refreshPage()` | `reload` |
| `I.closeOtherTabs()` / `switchToNextTab()` | `tab-list`, `tab-select <i>`, `tab-close <i>` |
| `I.seeInClipboard` | `run-code` with `navigator.clipboard.readText()` (needs `grantPermissions`) |
| back (`back()` tool) | `go-back` |
| `reset()` tool | `goto <start url>` — last resort, see tester loop |
| `see()` (screenshot look) | `screenshot --filename=<file>` then Read the image |
| `context()` / `research()` tools | `snapshot`, `find "<text>"`, `run-code --filename=…/interactive-map.js` |
| `xpathCheck` | `run-code` with `page.locator('<xpath>').count()` (a one-off script file, see locator-check template) |
| `visualClick` | `mousemove x y` + `mousedown` + `mouseup` on coordinates read from `snapshot --boxes` / screenshot |

## Typing rules

- Fill complete form fields with `fill` (works for rich-text and code editors too). `type` only when there is
  no locator you can pass (command palette, autocomplete that steals focus, canvas).
- To clear a field before typing: `fill <ref> ""` or `press Control+a` then `press Backspace`.
- Combobox / search-and-select needs a SEQUENCE of separate calls: focus the trigger → type to filter →
  click the option. Never one multi-action call.
- Do not use wait/sleep as a fix. After an action the next `snapshot` is the state; if data is still loading,
  take another snapshot after a short `run-code` wait on a concrete condition (`locator.waitFor`).

## Data-bearing output

Every action prints the new page status and a snapshot path. The **latest snapshot is the only context you
keep** (see `tester-loop.md`). Save a snapshot you need as evidence with
`snapshot --filename=<run folder>/screenshots/<name>.yaml`.

## Playwright code for reports

playwright-cli prints the equivalent Playwright code for each action (`### Ran Playwright code`). The tester
copies the code lines of the actions that **worked** into its result block; `expl-bot-report` turns those
into `tests/expl-bot/<scenario>.spec.ts` (Historian role).
