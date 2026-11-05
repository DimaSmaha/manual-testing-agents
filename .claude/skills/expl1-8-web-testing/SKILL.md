---
name: expl1-8-web-testing
description: >
  Eighth stage of task processing. Takes the QA items and FAIL items
  from the code review and the test cases, executes them in a headed browser
  through playwright-cli (with a named session), verifies the expected results,
  asks the user for help when needed (login, missing data, unclear steps), and
  produces a detailed report. Use when the user says
  "web testing", "test in the browser", "go through the QA items",
  "manual testing", or after the code review is finished.
---

# Web Testing

> Recommended settings: **Sonnet · Effort: High · Extended thinking: Off**

Executes the QA and FAIL test cases in a real, visible browser using `playwright-cli`.
QA — items that cannot be verified from the code.
FAIL — items that the code review identified as problematic
and that need confirmation in the UI that the bug really exists.
Input — the code review and test cases files. Output —
a detailed report with the results of each test case
executed in the UI.

The browser is **headed** (the user sees it) and runs in a **named session**,
so the user can step in at any moment — log in, solve a captcha, prepare data,
show the right page — and the agent continues from the same browser.

## Input

Required from the user:
1. The code review file `<ISSUEKEY>-code-review.md` created
   by the expl1-6-code-review skill. In the same chat the file is available
   in `.workflow-artifacts/<ISSUEKEY>/` automatically. If the chat is new —
   the user uploads the file to the chat.
2. The test cases file `<ISSUEKEY>-test-cases.md` created
   by the expl1-4-qa-test-cases skill. In the same chat it is available automatically.

Optional input:
- The checklist file `<ISSUEKEY>-checklist.md` — for structural
  checks that did not make it into the test cases.

If the code-review file is not provided — ask before starting. Offer the fallback:
"Run all test cases from the test-cases file as QA items?" If the user agrees,
treat every test case as `QA` (Source = QA) and say so in the report.
If the test-cases file is not provided — ask before starting.
If any file is empty or corrupted — stop
and tell the user.

Data sources for this skill:
- the code-review file — the source of QA and FAIL items
- the test-cases file — the source of steps, test data,
  and expected results
- the checklist file (optional) — structural checks
- the product UI through `playwright-cli` — the source of actual
  results
- the user — for anything the agent cannot do or decide itself
- navigation_paths.json — memory of navigation paths
- references/login-config.md — optional app settings (base URL, login notes)

All input files are read-only.
Do not change, rewrite, or clean up their content.

Do not go to the tracker, do not use external tools,
do not inspect code.

## Rules

- All communication and all output file content — in English.
- Chat messages are short.
- Browser tool: `playwright-cli` only (see the `playwright-cli` skill and
  references/browser-rules.md). Do not use Playwright MCP or the Chrome extension.
- Always use a **named session** (`-s=<SESSION>`) and a **headed** browser
  (`--headed`). Never run headless.
- **Ask the user for help whenever you need it** — see "Asking the user for help".
  Do not guess, do not work around a blocker, do not bypass a login.
- Test cases with the statuses PASS and N/A in the code review
  are not executed in the browser. Only QA and FAIL are executed.
- Do not change data in the system without a direct test case step
  that requires this change. If a step says "enter a value" —
  enter it. If it does not say so — do not enter. Do not create records,
  do not delete data, do not change settings unless this
  is an explicit step of the test case.
- Test data is taken from the "Test data" column of the test case
  table. If it contains a specific value — use
  it literally. If it is marked `[test data]`
  with a realistic example — use that example.
  Do not invent test data on your own.
- Follow the user's global rules for scripts: any script (`run-code` files and so on)
  is a file written with the Write tool into `.workflow-artifacts/<ISSUEKEY>/web-testing/`;
  every command is one simple command (no `cd`, no `&&`/`;` chains, no env-var prefixes).
- After saving the file — stop. Do not continue
  into following skills or planning.

## Session

- `SESSION` (the session tag) = `qa-<ISSUEKEY>`, for example `qa-TASK-114`.
  If the user gives another tag — use theirs.
- Every `playwright-cli` command carries `-s=<SESSION>`:
  `playwright-cli -s=qa-TASK-114 snapshot`.
- Open the browser once, headed, with a persistent profile (the user's login
  survives between runs of this stage):
  `playwright-cli -s=<SESSION> open <URL> --headed --persistent`
- Before opening, run `playwright-cli list`. If the session is already running —
  reuse it (do not open a second browser).
- Close the browser only at the end and only after asking the user (see Step 9).

## Asking the user for help

The browser is visible, so the user can act in it directly. Stop and ask in chat
(short message, say exactly what you need and what you will do next) when:

- **Login or access is needed** — e.g. "Please log in in the open browser window and
  tell me when you are on the inventory page." Never type credentials yourself unless
  the user gives them to you in the chat for this run.
- **Captcha, 2FA, SSO, cookie banner** or any step the agent cannot or should not do.
- **The app base URL or the way to the target page is unknown** (nothing in memory).
- **Data for a precondition is missing** and the test case does not say how to prepare it.
- **An element is not found** after 2 attempts, or the page differs from what the
  test case describes — ask before marking BLOCKED: "Can you open/fix X, or should I
  mark it BLOCKED?"
- **A step is ambiguous** or a test case needs a decision (which product to use,
  which value) that is not in the test case.
- **Anything unexpected** that could change the system (a confirmation dialog that deletes
  data, a payment form, an external redirect).

After the user says "done" — run `playwright-cli -s=<SESSION> snapshot` to see the new
state and continue from the current test case. Do not repeat steps the user already did.
If the user cannot help or says skip — mark the test case BLOCKED with that reason.

## Workflow

### Step 1 — Gather the scope

Read `<ISSUEKEY>-code-review.md`. Find all test cases
with the status `QA` or `FAIL` in the results table.
This is the working list for execution in the browser.

- `QA` — needs manual verification because the code review
  could not verify it from the code.
- `FAIL` — the code review found a problem in the code,
  it must be confirmed or refuted in the UI.

Test cases with the statuses `PASS` and `N/A` in the code review
are not included in the scope — they have already been verified from the code.

(If there is no code-review file and the user chose the fallback — the scope is
every test case in the test-cases file, all treated as `QA`.)

Then read `<ISSUEKEY>-test-cases.md`. For each
QA and FAIL test case extract the full data:
- Precondition
- The steps table (step, test data, expected result)
- Postcondition (if any)

For FAIL items additionally extract the finding from the code-review:
file, line, what was expected, what is actually in the code.
This information will help understand what exactly to verify in the UI.

If there are no QA and FAIL items (all PASS/N/A) — tell
the user that there are no items for web testing and stop.

Briefly tell the user:
```
Scope: [N] test cases to execute in the browser.
- QA (verification in the UI): [N]
- FAIL (bug confirmation): [N]
Session: [SESSION], headed browser. I will ask if I need your help.
```

### Step 2 — Determine the target pages

From the test cases determine which pages or sections of the product
need to be visited. Usually this is visible from the preconditions or
from the test case names.

Group the test cases by pages. If all test cases
relate to one page — one group. If to different
pages — several groups, executed sequentially by group.

For the first (or only) group extract `TARGET_PAGE_NAME`.

### Step 3 — Check the navigation memory

Read `navigation_paths.json` from the skill directory
(`.claude/skills/expl1-8-web-testing/navigation_paths.json`).
If the file does not exist — create an empty structure:
```json
{"navigation_paths": {}}
```

Look for `TARGET_PAGE_NAME` as a key in `navigation_paths`.

**If found:**
- Extract `url` — the direct URL if there is one.
- Extract `login_required` — whether login is needed.
- Extract `navigation_steps` — the array of navigation steps.
- Set `PATH_EXISTS = true`.

**If not found:**
- Set `PATH_EXISTS = false`.

### Step 4 — Open the browser and log in (with the user)

Read `references/login-config.md` (optional app settings: base URL, login URL, notes).

1. Determine the start URL: the `url` from memory, else the base/login URL from
   `login-config.md`, else ask the user for the app URL.
2. Run `playwright-cli list`. If `<SESSION>` is not running, open it:
   `playwright-cli -s=<SESSION> open <START_URL> --headed --persistent`
3. Run `playwright-cli -s=<SESSION> snapshot` and check whether the page is a login page
   or requires access.
4. **If login is needed — ask the user to log in themselves in the open window**
   (see "Asking the user for help"). Wait for "done", then take a snapshot and confirm
   you are logged in. Do not enter credentials on your own.
   If `login-config.md` contains credentials explicitly allowed for the agent, you may use them.
5. Because the profile is persistent, the next run usually starts already logged in —
   check the snapshot first and ask for login only if the login page is shown.

### Step 5 — Navigate to the target page

**If `PATH_EXISTS = true`:**
Execute each step from `navigation_steps` sequentially,
following references/browser-rules.md.

If a step from memory does not work (element not found,
the page changed) — ask the user for the new path
and update the entry in `navigation_paths.json`.

**If `PATH_EXISTS = false`:**
Ask the user (they can also navigate in the open browser themselves):
```
The path to "[TARGET_PAGE_NAME]" was not found in memory.
Describe step by step how to get to this page,
or open it in the browser window and tell me when you are there.
```

Wait for the answer. Execute the user's steps (or, if the user navigated themselves,
take a snapshot, record the current URL as the page URL, and ask for the steps they used).
Save the steps as `USER_NAVIGATION_STEPS`.
Set `IS_NEW_PATH = true`.

### Step 6 — Execute the test cases

For each test case in the scope:

1. **Check the precondition:**
   - If the precondition describes the page state (for example
     "the form is open", "the list is loaded") — verify
     that the current state matches. If not — go to
     the needed page or perform actions to reach
     the state.
   - If the precondition describes the presence of data (for example
     "Product B is in the cart") and this state is absent — set it up only
     with actions that are plain UI steps the test case implies (for example adding a
     product to the cart); if it is unclear how, ask the user. Do not create
     data on your own without the user's instructions.
   - If the next test case needs a different
     page — go to it (check memory
     or ask the user).

2. **Execute the steps** — for each row of the test case
   table, interpreting the step as a `playwright-cli` action
   (all with `-s=<SESSION>`):

   **How to interpret steps:**
   - "Open [page]" → `goto <url>` or `click <ref>` on the element that opens it.
   - "Enter [value] in [field]" → `fill <ref> "<value>"`.
   - "Click [button/link]" → `click <ref>`.
   - "Select [option] in [dropdown]" → `select <ref> "<value>"`.
   - "Verify that [element/text] is displayed" → `snapshot` or `find "<text>"`.
   - "Verify size / styling / font" → `eval "el => ..." <ref>` (for example
     `getBoundingClientRect()` for size, `getComputedStyle(el)` for font and colors).
   - "Click the browser Back button" → `go-back`. Reload → `reload`.
   - "Open in a new tab" → `tab-new <url>`, then `tab-select <index>`.

   **For each step:**
   a. `snapshot` (or `find`) — see the current state and get fresh refs.
   b. Find the target element.
   c. Perform the action.
   d. Verify the expected result from the "Expected result" column
      of the table via the new snapshot, `find`, or `eval`.
   e. Record the result of the step: matches
      or does not match.

3. **Classify the test case** according to the section
   "Classification".

4. **If FAIL or FAIL CONFIRMED** — take a screenshot as evidence:
   `playwright-cli -s=<SESSION> screenshot --filename=.workflow-artifacts/<ISSUEKEY>/web-testing/<TC-ID>.png`.
   Do not take a screenshot for PASS, BLOCKED, FAIL REJECTED.
   Optionally check `console` for errors and note them in the finding.

5. **Continue to the next test case** without stopping,
   unless you need the user's help (see "Asking the user for help").

### Step 7 — Save the navigation path (if new)

If `IS_NEW_PATH = true`:
- Read `navigation_paths.json`.
- Add a new entry:
```json
"[TARGET_PAGE_NAME]": {
  "url": "[URL if there is a direct one]",
  "login_required": true,
  "navigation_steps": ["step 1", "step 2", "..."],
  "last_used": "[ISO timestamp]"
}
```
- Save the file without overwriting the existing entries.

### Step 8 — Build the report

Create the file `<ISSUEKEY>-web-testing.md` with the results.

The template is in references/output-template.md.

The report must be detailed:
- A results table for each test case.
- For each FAIL and FAIL CONFIRMED — specifically:
  which step, what was expected, what the agent actually saw,
  and the screenshot path.
- For each FAIL REJECTED — what the code review finding
  showed and why the UI works correctly.
- For each BLOCKED — the reason and what the agent saw.
- For each OBSERVATION — what exactly was noticed.
- Where the user helped (login, data, navigation) — a one-line note.
- Summary statistics.

### Step 9 — Close the browser

Ask the user: "Close the browser session `<SESSION>`? (The login stays saved in the
persistent profile.)" If yes — `playwright-cli -s=<SESSION> close`.
Delete the saved profile (`delete-data`) only if the user asks.

## Classification

Each test case gets one status:

- `PASS` — the UI behavior matches the expected result
  from the test case. All steps were executed successfully.
- `FAIL` — the UI behavior does not match the expected result.
  There is a concrete discrepancy between expected and actual.
  Used for test cases that came with the status
  QA from the code review.
- `FAIL CONFIRMED` — the test case came with the status FAIL
  from the code review and the UI confirms: the bug really manifests
  in the interface. Include the finding from the code review + what the
  agent saw in the UI.
- `FAIL REJECTED` — the test case came with the status FAIL
  from the code review but the UI shows correct behavior. The bug per the code
  does not manifest in the UI — perhaps it is compensated by another
  mechanism, or the code review was wrong.
- `BLOCKED` — the test case cannot be executed. The element
  was not found, the page did not load, no access,
  the precondition is unreachable, and the user could not help.
- `OBSERVATION` — the test case passed (PASS), but a defect
  or anomaly outside the scope of the requirements was noticed.

Rules:
- Do not mark PASS if there are doubts — better FAIL with a description
  (or ask the user to look at the screen).
- Do not mark FAIL without a concrete description of the discrepancy.
- BLOCKED is not FAIL. The test did not fail, it could not
  be executed.
- OBSERVATION does not replace FAIL. If the expected result
  does not match — it is FAIL, not OBSERVATION.
- For items with FAIL from the code review use only
  FAIL CONFIRMED or FAIL REJECTED — not plain FAIL/PASS.
  This makes it visible in the report which was the check of a bug
  and which was a new UI check.

## Browser error handling

- The page did not load (timeout, 500, blank) —
  try `reload` once. If it did not help — ask the user; if they cannot fix it,
  BLOCKED for all test cases of this page.
- Session expired / login page appears — ask the user to log in again
  in the browser window, then continue from the current test case.
- The element was not found after 2 attempts (fresh `snapshot`, scrolling, `find`) —
  ask the user for help; if none, BLOCKED for this test case with a description
  of what was searched for and where.
- An alert or dialog appears — read the text, record it, then
  `dialog-accept` or `dialog-dismiss` per the test case; if the dialog
  would change data and the test case does not call for it — ask the user first.
- "Browser is not open" / the session is gone — run `playwright-cli list`,
  reopen the same `<SESSION>` with `open ... --headed --persistent`, and continue.
- `playwright-cli` is not installed — follow the install section of the `playwright-cli`
  skill (`npx --no-install playwright --version`, else ask the user before
  `npm install -g @playwright/cli@latest`).
- Stuck or zombie browser — ask the user before `kill-all`.

## Additional checks (exploratory)

After executing all test cases, if the agent noticed
anything suspicious during navigation or step execution
that is not covered by the test cases — record it in the
"Observations" section of the output file.

Do not look for bugs on purpose. Record only what
caught the eye while going through the test cases.

## Verification before saving

Before saving, check:

- The number of test cases in the report equals the number
  of QA + FAIL items from the code-review file (or of all test cases when the
  fallback was used). If it does not match — find the missing ones and add them.
- The order of test cases matches the order in the test-cases file.
- Every FAIL and FAIL CONFIRMED has: which step,
  expected result, actual result, screenshot path.
- Every FAIL REJECTED has: the code review finding and what
  the agent saw in the UI.
- Every BLOCKED has a reason.
- There are no test cases without a status.
- For items with FAIL from the code review — FAIL CONFIRMED
  or FAIL REJECTED is used, not PASS/FAIL.

## Output file

Create the file `.workflow-artifacts/<ISSUEKEY>/<ISSUEKEY>-web-testing.md`
and tell the user the path.

The file stays in `.workflow-artifacts/<ISSUEKEY>/`.
Screenshots and run scripts stay in `.workflow-artifacts/<ISSUEKEY>/web-testing/`.

If the file already exists — delete it completely and create a new one.
The output is always a single file with the result of the latest run.
Do not merge with the previous version, do not append, do not keep
data from the previous record.

Before finishing, check:
- One top-level heading
- One coherent document without duplicate sections

The template is in references/output-template.md.

## Final response

After saving the file, report:
- The path to the saved file
- PASS / FAIL / FAIL CONFIRMED / FAIL REJECTED / BLOCKED / OBSERVATION counters
- The overall verdict: web testing successful
  (all PASS and FAIL REJECTED) or unsuccessful
  (there are FAIL or FAIL CONFIRMED)
- If there are FAIL or FAIL CONFIRMED — briefly list
  the problems found
- If there are OBSERVATION — briefly list the observations
- If there are BLOCKED — list what could not be executed and why
- Whether the browser session was closed
