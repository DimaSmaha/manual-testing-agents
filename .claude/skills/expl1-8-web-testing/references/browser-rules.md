# Browser interaction rules (playwright-cli)

The skill drives the browser with `playwright-cli`. These rules are mandatory for every
interaction with a page. Command reference: the `playwright-cli` skill.

## General principle

Behave like a real user. Do not rush.
Wait for loading before acting. Wait for the result
after an action. The browser is visible to the user — they may click in it too, so
always re-read the page state before acting.

## Session and mode

- Every command: `playwright-cli -s=<SESSION> <command>` where `<SESSION>` = `qa-<ISSUEKEY>`
  (the session tag, for example `qa-TASK-114`).
- Open once, headed, persistent profile:
  `playwright-cli -s=<SESSION> open <URL> --headed --persistent`
- `playwright-cli list` shows running sessions. Reuse a running session; do not open a second one.
- Close: `playwright-cli -s=<SESSION> close` (only at the end, after asking the user).
- On Windows a URL with `&` must be escaped: in PowerShell use `--%`
  (`playwright-cli --% -s=<SESSION> goto "https://host/?a=1&b=2"`).
- One simple command per call: no `cd`, no `&&`/`;` chains, no env-var prefixes.

## Commands used by this skill

| Purpose | Command |
|---------|---------|
| Open the browser | `open <url> --headed --persistent` |
| Go to a URL | `goto <url>` |
| Page state with element refs | `snapshot` |
| Search the page for text | `find "<text>"` / `find --regex "<re>"` |
| Click / fill / select | `click <ref>` / `fill <ref> "<value>"` / `select <ref> "<value>"` |
| Press a key | `press <key>` |
| Browser Back / Forward / Reload | `go-back` / `go-forward` / `reload` |
| Read a value, size, style | `eval "el => ..." <ref>` |
| New tab / switch | `tab-new <url>` / `tab-list` / `tab-select <n>` |
| Dialogs | `dialog-accept` / `dialog-dismiss` |
| Screenshot (FAIL evidence only) | `screenshot --filename=<path>` |
| Console / network (for findings) | `console` / `requests` |

## Interaction pattern

For every action (click, input, selection) follow this sequence:

1. **See** — `snapshot` (or `find`) to see the current state and get fresh refs.
   Refs change after the page changes — never reuse an old ref after navigation or a re-render.
2. **Locate** — make sure the target element is in the snapshot.
   If it is not — scroll (`mousewheel 0 300`) or open the needed section and snapshot again.
3. **Act** — `click` / `fill` / `select` / `press`.
4. **Verify** — a new `snapshot`, `find`, or `eval` to see the result of the action.

Never skip steps 1 and 4.

## Waiting

- After `goto` / a click that navigates — `snapshot` and look for a key element
  of the new page (title, heading, main control). Do not act before it appears.
- After a click that opens a modal, dropdown, or menu — `snapshot` and find the element
  that appears before the next action.
- Do not use fixed sleeps. Wait for a specific element or text: repeat `snapshot`/`find`
  (at most 2 extra attempts), then ask the user.

## Finding elements

Priority:
1. Refs from the latest `snapshot`.
2. `find "<text or role name>"` to locate an element in a large page.
3. Playwright locators when refs are unreliable:
   `click "getByRole('button', { name: 'Add to cart' })"`.
4. CSS selectors as a last resort.

If the element is not found on the first attempt: scroll, take a fresh `snapshot`, retry.
After 2 failed attempts — ask the user for help; if none, BLOCKED.

## Entering data

- `fill <ref> "<value>"` replaces the field content. Add `--submit` only if the test case
  step says to submit.
- Dropdowns: `select <ref> "<value>"` for a native `<select>`;
  for custom dropdowns click the control and then the option.
- Checkboxes: `check <ref>` / `uncheck <ref>`.

## Verifying expected results

1. **Text on the page** — `find "<text>"` or read the `snapshot`.
2. **Presence of an element** — present in the `snapshot`.
3. **State of an element** — the snapshot shows attributes (disabled, checked, selected);
   for anything else use `eval "el => el.<prop>" <ref>`.
4. **Absence of an element** — not in the `snapshot` / `find` returns no match.
5. **URL** — the `Page URL` line printed after each command, or `eval "location.href"`.
6. **Size / styling** — `eval "el => { const r = el.getBoundingClientRect(); return r.width + 'x' + r.height }" <ref>`
   and `eval "el => getComputedStyle(el).fontFamily" <ref>` (or `color`, `fontSize`, ...).

If the expected result cannot be verified by any method — ask the user to look at the
screen; if they cannot, mark BLOCKED with a description of what exactly cannot be verified.

## Screenshots

- Take a screenshot only for FAIL and FAIL CONFIRMED —
  as evidence of the discrepancy:
  `screenshot --filename=.workflow-artifacts/<ISSUEKEY>/web-testing/<TC-ID>.png`.
- Do not take screenshots for PASS, BLOCKED, FAIL REJECTED, OBSERVATION.

## Login (human-assisted)

The user logs in themselves in the headed window:
1. Open the app (`open ... --headed --persistent`) and `snapshot`.
2. If the page is a login page — ask the user to log in in the browser window and tell you when done.
3. After "done" — `snapshot` and confirm the logged-in state (for example the inventory page).
4. The persistent profile keeps the session, so next runs normally skip this.

Never type credentials unless the user gave them in the chat for this run
or `login-config.md` explicitly allows it.

## Asking for help

When something is blocked or unclear, stop and ask a short question in chat saying what
you need and what you will do next. After the user acts in the browser, take a new `snapshot`
and continue. See "Asking the user for help" in SKILL.md.

## New tabs

If a click opens a new tab:
1. `tab-list` — check the list of tabs.
2. `tab-select <index>` — switch to the new tab.
3. `snapshot` — wait for a key element.
4. Continue working in the new tab.

## Navigation memory

The file `navigation_paths.json` (in the skill directory) stores the paths
to the product pages.

Format:
```json
{
  "navigation_paths": {
    "Page Name": {
      "url": "https://...",
      "login_required": true,
      "navigation_steps": [
        "Step 1: describe the action",
        "Step 2: describe the action"
      ],
      "last_used": "2026-06-18T12:00:00Z"
    }
  }
}
```

Rules:
- Paths are saved after the first successful pass.
- Existing paths are not overwritten without a request from the user.
- If a path from memory does not work (element not found,
  the page changed) — ask the user for the new path
  and update the entry.
