---
name: expl1-8-web-testing
description: >
  Eighth stage of task processing. Takes every test case from the test cases file
  (with its code-review status — QA, FAIL, PASS or N/A — as the source), executes them in a headed browser
  through playwright-cli (with a named session), verifies the expected results,
  asks the user for help when needed (login, missing data, unclear steps), and
  produces a detailed report. Also executes the browser retest notes from the
  impact analysis (stage 7) when that file exists. Use when the user says
  "web testing", "test in the browser", "go through the QA items",
  "manual testing", or after the code review is finished.
---

# Web Testing

> Recommended settings: **Sonnet · Effort: High · Extended thinking: Off**

> 🤖 **Autonomous mode.** If the arguments contain `--autonomous` (set by `expl1-independent-orchestrator`), first
> read the "Stage 8" section of `.claude/skills/expl1-independent-orchestrator/references/autonomous-mode.md`. Its
> rules override every instruction in this skill that asks, confirms or waits for the user, and `--run-dir <dir>`
> replaces `.workflow-artifacts/<ISSUEKEY>/` everywhere in this skill. The browser stays headed either way.

Executes **every test case** of the test-cases file in a real, visible browser using `playwright-cli`,
whatever its code-review status. The code-review status becomes the item's Source:
QA — items that cannot be verified from the code.
FAIL — items that the code review identified as problematic
and that need confirmation in the UI that the bug really exists.
PASS / N/A — items the code review verified (or found not applicable) from the code;
they are still run in the browser, because only the live app shows the real behavior.
IMPACT — browser retest notes from the impact analysis (stage 7): QA and N/A results
for files the PR did not change, which only the UI can confirm.
Input — the test cases and code review files (and optionally the impact analysis). Output —
a detailed report with the results of each test case and retest note
executed in the UI.

The browser is **headed** (the user sees it) and runs in a **named session**,
so the user can step in at any moment — log in, solve a captcha, prepare data,
show the right page — and the agent continues from the same browser.

## Input

Required from the user:
1. The test cases file `<ISSUEKEY>-4-test-cases.md` created
   by the expl1-4-qa-test-cases skill. In the same chat the file is available
   in `.workflow-artifacts/<ISSUEKEY>/` automatically. If the chat is new —
   the user uploads the file to the chat.

Recommended input:
- The code review file `<ISSUEKEY>-6-code-review.md` created
  by the expl1-6-code-review skill (in the same chat it is available automatically).
  It sets the Source of each test case and gives the findings of the FAIL items.

Optional input:
- The checklist file `<ISSUEKEY>-3-checklist.md` — for structural
  checks that did not make it into the test cases.
- The impact analysis file `<ISSUEKEY>-7-impact-analysis.md` created by the
  expl1-7-impact-analysis skill — its section "Retest in stage 8" adds browser items
  (source IMPACT) to the scope. If the file does not exist or has no such section —
  continue without it and say so in one line.

If the code-review file is not provided — say so in one line and continue:
every test case gets Source = `QA` (there are no FAIL items to confirm). Say so in the report.
If the test-cases file is not provided — ask before starting.
If any file is empty or corrupted — stop
and tell the user.

Data sources for this skill:
- the test-cases file — the list of test cases to execute (all of them), and the source of steps,
  test data, and expected results
- the code-review file — the Source of each test case (QA, FAIL, PASS, N/A) and the findings
  of FAIL items
- the checklist file (optional) — structural checks
- the impact analysis file (optional) — the section "Retest in stage 8": steps and
  expected results for IMPACT items
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
- Every test case of the test-cases file is executed in the browser, whatever its
  code-review status (QA, FAIL, PASS or N/A). The status only sets the Source column,
  and items that came as FAIL end as FAIL CONFIRMED or FAIL REJECTED.
- From the impact analysis execute the rows of the section "Retest in stage 8" (all of them
  are browser checks against the live app). Use the steps and the expected result of the
  row literally; do not add checks. Do not look at code, CI files or build output.
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

Read `<ISSUEKEY>-4-test-cases.md`. **Every test case in it** is in the working list
for execution in the browser, in the order of the file. For each test case extract
the full data:
- Precondition
- The steps table (step, test data, expected result)
- Postcondition (if any)

Then read `<ISSUEKEY>-6-code-review.md` (if provided) and take each test case's status
from its results table as the test case's Source:

- `QA` — needs manual verification because the code review
  could not verify it from the code.
- `FAIL` — the code review found a problem in the code,
  it must be confirmed or refuted in the UI.
- `PASS` / `N/A` — the code review verified it (or found it not applicable) from the code.
  It is still executed in the browser: the live app is the final check.
- A test case missing from the code review, or no code-review file — Source `QA`.

For FAIL items additionally extract the finding from the code-review:
file, line, what was expected, what is actually in the code.
This information will help understand what exactly to verify in the UI.

Then, if `<ISSUEKEY>-7-impact-analysis.md` exists, read its section "Retest in stage 8".
- Each row is added to the scope as an item with Source `IMPACT`
  (id `IMP-<n>`; page, precondition, steps and expected result come from the row).
  They are executed after the test cases, in the order of the file.
- If an IMPACT row has a "Linked TC" (every test case is in the scope) — do not
  run it twice. Execute the test case once and add `also IMP-<n>` to its comment.
  If two IMPACT rows have the same steps — execute once and report both ids.

If the test-cases file has no test cases and there are no IMPACT items — tell the user
that there are no items for web testing and stop.

Briefly tell the user:
```
Scope: [N] items to execute in the browser.
- Test cases: [N] (Source QA: [N], FAIL: [N], PASS: [N], N/A: [N])
- IMPACT (retest from the impact analysis): [N]
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

For an IMPACT item the "precondition", "steps" and "expected result" are the columns
Precondition, Steps and Expected of the impact-analysis row; handle them in the same way.

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
     data on your own without the user's instructions. If `<ISSUEKEY>-x-seed-data.md` exists
     (written by the optional `qa-data-seeder` with the user's approval), the records it lists
     may be used for this; nothing else is touched.
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

Create the file `<ISSUEKEY>-8-web-testing.md` with the results.

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
  QA, PASS or N/A from the code review, and for IMPACT items.
  For a test case that came as PASS, say in the finding that the code review marked it PASS.
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

- The number of items in the report equals the number
  of test cases in the test-cases file (all of them, whatever their code-review status)
  plus the IMPACT items from the impact-analysis file (without the ones
  merged into a test case or into another row). If it does not match — find the missing
  ones, execute them, and add them.
- Every test case row has a status from "Classification": no test case is left
  not run or half-run.
- The order of test cases matches the order in the test-cases file; IMPACT items follow
  them in the order of the impact-analysis file.
- Every FAIL and FAIL CONFIRMED has: which step,
  expected result, actual result, screenshot path.
- Every FAIL REJECTED has: the code review finding and what
  the agent saw in the UI.
- Every BLOCKED has a reason.
- There are no test cases without a status.
- For items with FAIL from the code review — FAIL CONFIRMED
  or FAIL REJECTED is used, not PASS/FAIL.

## Output file

Create the file `.workflow-artifacts/<ISSUEKEY>/<ISSUEKEY>-8-web-testing.md`
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
