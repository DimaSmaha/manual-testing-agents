---
name: expl1-8-web-testing
description: >
  Eighth stage of task processing. Takes the QA items and FAIL items
  from the code review and the test cases, executes them in the browser through the
  Chrome extension, verifies the expected results, and produces
  a detailed report. Use when the user says
  "web testing", "test in the browser", "go through the QA items",
  "manual testing", or after the code review is finished.
---

# Web Testing

> Recommended settings: **Sonnet · Effort: High · Extended thinking: Off**

Executes the QA and FAIL test cases in a real browser.
QA — items that cannot be verified from the code.
FAIL — items that the code review identified as problematic
and that need confirmation in the UI that the bug really exists.
Input — the code review and test cases files. Output —
a detailed report with the results of each test case
executed in the UI.

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

If the code-review file is not provided — ask before starting.
If the test-cases file is not provided — ask before starting.
If any file is empty or corrupted — stop
and tell the user.

Data sources for this skill:
- the code-review file — the source of QA and FAIL items
- the test-cases file — the source of steps, test data,
  and expected results
- the checklist file (optional) — structural checks
- the product UI through the Chrome extension — the source of actual
  results
- navigation_paths.json — memory of navigation paths
- references/login-config.md — login instructions

All input files are read-only.
Do not change, rewrite, or clean up their content.

Do not go to the tracker, do not use external tools,
do not inspect code.

## Rules

- All communication and all output file content — in English.
- Chat messages are short.
- Browser tool: Claude in Chrome extension.
  Do not use Playwright MCP.
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
- After saving the file — stop. Do not continue
  into following skills or planning.

## Chrome extension tools

Use these tools to work with the browser:

- **navigate** — go to a URL.
- **find** — find an element on the page by a description
  in natural language. The main way to locate elements.
- **read_page** — get the page structure (accessibility
  tree). With `filter: "interactive"` — only interactive
  elements (buttons, fields, links).
- **computer** with `action: "screenshot"` — take a screenshot.
  Use only as evidence for FAIL
  and FAIL CONFIRMED. Do not take screenshots for PASS.
- **computer** with `action: "left_click"` — click on an element.
- **computer** with `action: "type"` — type text.
- **computer** with `action: "key"` — press a key.
- **computer** with `action: "scroll"` — scroll the page.
- **form_input** — set the value of a form field by ref.
- **get_page_text** — get the page text.
- **tabs_context_mcp** — get the list of tabs.

The full interaction rules are in references/browser-rules.md.

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
Starting.
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

Read `navigation_paths.json` from the working directory.
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

### Step 4 — Login (if needed)

Read `references/login-config.md` from the skill directory.

**If the file is filled in** (contains a URL, field descriptions,
the source of credentials):
- Perform the login according to the instructions in the file.
- The login rules are in references/browser-rules.md,
  the "Login" section.

**If the file is not filled in** (contains the placeholders
`<login page URL>`, `<how to find the field>`, etc.)
or the file is missing:
- Ask the user: the login URL, where the username
  and password fields are, which submit button, where the credentials come from.
- Perform the login following the user's instructions.

### Step 5 — Navigate to the target page

**If `PATH_EXISTS = true`:**
Execute each step from `navigation_steps` sequentially,
following the rules from references/browser-rules.md.

If a step from memory does not work (element not found,
the page changed) — ask the user for the new path
and update the entry in `navigation_paths.json`.

**If `PATH_EXISTS = false`:**
Ask the user:
```
The path to "[TARGET_PAGE_NAME]" was not found in memory.
Describe step by step how to get to this page:
1. [First step]
2. [Second step]
3. ...
```

Wait for the answer. Execute the user's steps.
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
     "there is a record with the type Individual") and this data is absent
     in the system — ask the user how to prepare
     the data: where to create it, which values to specify, whether there is
     a ready record that can be used. Do not create
     data on your own without the user's instructions.
   - If the next test case needs a different
     page — go to it (check memory
     or ask the user).

2. **Execute the steps** — for each row of the test case
   table, interpreting the step as a browser action:

   **How to interpret steps:**
   - "Open [page/form/modal]" → `navigate`
     to the URL or `find` + `computer click` on the element
     that opens it.
   - "Enter [value] in [field]" → `find` the field
     by description → `form_input` or `computer type`.
   - "Click [button]" → `find` the button by text
     → `computer left_click`.
   - "Select [option] in [dropdown]" → `find` the dropdown
     → `computer left_click` → `find` the option
     → `computer left_click`. Or `form_input` with a value.
   - "Verify that [element/text] is displayed"
     → `find` the element or `get_page_text` and look for the text.
   - "Scroll to [element]" → `computer scroll`
     or `find` + `computer scroll_to`.

   **For each step:**
   a. `read_page` or `find` — see the current state.
   b. Find the target element.
   c. Perform the action.
   d. Verify the expected result from the "Expected result" column
      of the table: look for the text, element, or state on the page via `find`,
      `read_page`, or `get_page_text`.
   e. Record the result of the step: matches
      or does not match.

3. **Classify the test case** according to the section
   "Classification".

4. **If FAIL or FAIL CONFIRMED** — take a screenshot
   (`computer screenshot`) as evidence. Do not take
   a screenshot for PASS, BLOCKED, FAIL REJECTED.

5. **Continue to the next test case** without stopping.

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
  which step, what was expected, what the agent actually saw.
- For each FAIL REJECTED — what the code review finding
  showed and why the UI works correctly.
- For each BLOCKED — the reason and what the agent saw.
- For each OBSERVATION — what exactly was noticed.
- Summary statistics.

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
  the precondition is unreachable.
- `OBSERVATION` — the test case passed (PASS), but a defect
  or anomaly outside the scope of the requirements was noticed.

Rules:
- Do not mark PASS if there are doubts — better FAIL with a description.
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
  try reloading once via `navigate`.
  If it did not help — BLOCKED for all test cases
  of this page.
- Session expired during execution — repeat the login
  per step 4, continue from the current test case.
- The element was not found after 2 attempts (including scrolling) —
  BLOCKED for this test case with a description of what was searched for and where.
- An alert or dialog appears — read the text,
  record it, close it, and continue. If the dialog
  blocks execution — BLOCKED.
- The Chrome extension does not respond — stop, notify
  the user.

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
  of QA + FAIL items from the code-review file. If it
  does not match — find the missing ones and add them.
- The order of test cases matches the order in the test-cases file.
- Every FAIL and FAIL CONFIRMED has: which step,
  expected result, actual result.
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
