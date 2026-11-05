# Browser interaction rules

The skill uses the Claude in Chrome extension for all
browser actions. These rules are mandatory for every
interaction with a page.

## General principle

Behave like a real user. Do not rush.
Wait for loading before acting. Wait for the result
after an action.

## Tools

Names of the Claude in Chrome extension tools:

| Tool | Purpose |
|------|---------|
| `navigate` | Go to a URL |
| `find` | Find an element by a description in natural language |
| `read_page` | Page structure (accessibility tree) |
| `computer` action: `screenshot` | Screenshot (only for FAIL evidence) |
| `computer` action: `left_click` | Click by coordinates or ref |
| `computer` action: `type` | Type text |
| `computer` action: `key` | Press a key |
| `computer` action: `scroll` | Scroll |
| `computer` action: `scroll_to` | Scroll to an element by ref |
| `form_input` | Set the value of a form field by ref |
| `get_page_text` | Get the page text |
| `tabs_context_mcp` | List of tabs |
| `tabs_create_mcp` | Create a new tab |

## Interaction pattern

For every action (click, input, selection) follow
this sequence:

1. **See** — `read_page` or `find` to see the
   current state of the page and find the element.
2. **Locate** — make sure the target element is visible.
   If it is not visible — `computer scroll` and repeat the search.
3. **Act** — `computer left_click`, `computer type`,
   `form_input`, etc.
4. **Verify** — `find` or `read_page` or
   `get_page_text` to see the result of the action.

Never skip steps 1 and 4.

## Waiting

- After `navigate` to a new page — `find` a key
  element that confirms the page has loaded.
  Do not start actions before confirmation.
- After a click that opens a modal, dropdown, or menu —
  `find` the element that appears before the next action.
- After submitting a form — `find` the success message,
  the validation error, or check `navigate` to a new URL.
- Do not use `computer wait` with fixed
  seconds. Always wait for a specific element or text.

## Finding elements

Priority:
1. `find` with a description in natural language — the most reliable.
   Examples: `find "Save button"`, `find "Email input field"`,
   `find "dropdown with label Region"`.
2. `read_page` with `filter: "interactive"` — to review
   all interactive elements.
3. `read_page` with `ref_id` — to focus
   on a specific part of the page.

If the element is not found on the first attempt:
- `computer scroll` down and try `find` again.
- `read_page` to check whether the page has loaded.
- After 2 failed attempts — BLOCKED for this test case.

## Entering data

- For text fields: `find` the field → `form_input` with ref
  and value. Or `computer triple_click` to select
  → `computer type` with the new text.
- Before typing into a filled field — clear it:
  `computer triple_click` → `computer type` with the new
  value.
- For dropdowns: `find` the dropdown → `computer left_click`
  → `find` the option → `computer left_click`.
  Or `form_input` with a value if it is an HTML select.
- For checkboxes: `find` the checkbox → check the
  current state → `computer left_click` only if
  it needs to be changed.

## Verifying expected results

Methods for verifying the expected result:

1. **Text on the page** — `find` with the text
   or `get_page_text` and look for a substring.
   Example: "Record saved" is expected → `find "Record saved"`.

2. **Presence of an element** — `find` the element by description.
   Example: a new field is expected → `find "new field label"`.

3. **State of an element** — `read_page` and check
   the attributes (disabled, checked, selected).

4. **Absence of an element** — `find` returns
   an empty result. Or `get_page_text` and check
   that the text is NOT present.

5. **URL changed** — after navigation check
   the current URL via `read_page` or `get_page_text`.

If the expected result cannot be verified by
any method — mark BLOCKED with a description of what exactly
cannot be verified.

## Screenshots

- Take a screenshot only for FAIL and FAIL CONFIRMED —
  as evidence of the discrepancy.
- Do not take screenshots for PASS, BLOCKED, FAIL REJECTED,
  OBSERVATION.
- Do not show screenshots to the user in the chat — they are
  only for the agent's internal analysis.

## Login

Login sequence:
1. `navigate` to the login URL from login-config.md.
2. `find` the username/email field — wait for it.
3. `form_input` or `computer type` — enter the username.
4. `find` the password field.
5. `form_input` or `computer type` — enter the password.
6. `find` the login button.
7. `computer left_click` on the button.
8. `find` an element that confirms a successful login
   (dashboard, welcome message, user avatar).

Credentials are taken from the source specified
in login-config.md (environment variables, .env file, etc.).

## Registration

If a test case needs a new user:
1. Read the registration instructions from login-config.md.
2. Perform the registration steps.
3. Save the new user's credentials in the context
   for the following test cases.

## New tabs

If a click opens a new tab:
1. `tabs_context_mcp` — check the list of tabs.
2. Switch to the new tab.
3. `find` a key element — wait for loading.
4. Continue working in the new tab.

## Navigation memory

The file `navigation_paths.json` stores the paths
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
