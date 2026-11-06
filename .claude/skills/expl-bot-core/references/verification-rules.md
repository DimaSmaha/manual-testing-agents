# Verification rules (ported from explorbot `rules/navigator/verification-actions.md`)

Every expected result must be checked with **evidence** and recorded back to the result block **verbatim**.
The vocabulary below is closed: if a claim cannot be expressed with it, say `NOT VERIFIED — cannot express`,
do not weaken the claim.

## How each claim is checked in playwright-cli

| Claim | Check |
|---|---|
| Text is visible in an area | `find "<text>"` (scoped by a container locator), or the latest `snapshot` |
| Text is NOT visible | `find "<text>"` returns nothing in that container |
| Element is present / absent | a Playwright locator `count()` through `run-code`, or the snapshot |
| Input holds a value | `eval "el => el.value" <ref>` — the ONLY reliable way to check field values |
| Page title | `eval "document.title"` |
| URL / route | the `Page URL` line printed after the action |
| Control state (disabled, checked, readonly, required, selected, expanded) | `eval "el => ({disabled: el.disabled, checked: el.checked, expanded: el.getAttribute('aria-expanded')})" <ref>`, or an attribute selector such as `button[aria-label="Submit"][disabled]` counted with `run-code` |
| Text no visible element carries | `eval "document.documentElement.innerText.includes('…')"` — plain text only, never markup |
| Computed style / size | `eval "el => getComputedStyle(el).<prop>" <ref>` / `getBoundingClientRect()` |
| Clipboard | `run-code` with `navigator.clipboard.readText()` |
| Persisted (data change) | reload (`reload`) or navigate away and back, then check the data is still there |

## Rules

- Be strict; avoid false positives. A passed click only means the command ran — if a required field is empty,
  submit stays disabled, or the expected text is not visible, the action did not complete.
- Presence of an element says nothing about its **state**. For state claims use the state checks above.
- A claim with a concrete quoted value (name, id, title, email, URL) must be checked with the **whole** value.
  Never shorten user-created values. Partial text is not evidence for a claim about the full value.
- Text checks need a **context** (container). A bare "page contains Welcome" can be satisfied by a
  completely different element.
- One claim, one check. Do not run two checks that assert the same fact in different shapes.
- If a check fails, a screenshot is equally valid evidence for visual state (active tab, selected item, count,
  colour). Prefer a screenshot over DOM checks for purely visual claims.
- **"Cannot express" is not "failed".** If no check above can prove or disprove the claim, the status is
  `NOT VERIFIED`, with the reason. Do not mark it PASSED and do not mark it FAILED.
- Never record success after a failed check. A failed check means the outcome is not confirmed.
- Filter / tab / sort scenarios need BOTH: the requested state is evidenced by a selected control, URL/query or
  another explicit indicator, AND the list content matches that state. One signal is not enough.
- Empty-state text ("No matched items") proves a filter only when the requested filter state is explicit.
- Associate validation feedback with a field only through explicit evidence: the field label in the message, an
  accessibility relationship, focus on the invalid control. Not through DOM order or proximity.
- Selection pickers: counters like `Selected 0`, `Matched 0` or a disabled Save/Apply mean the selection did not
  register.
