---
name: expl1-7-impact-analysis
description: >
  Seventh stage of task processing. Takes the test cases (expl1-4), the PR summary
  (expl1-5) and the code review (expl1-6), compares the PR with the commit before it,
  builds an impact map (Risk Areas, Direct Impact, Dependent Modules, low risk),
  and checks that the files NOT changed in the PR still work with the changes.
  Produces a results file with statuses and findings, plus browser retest notes for
  stage 8 (only the QA and N/A results that can be checked in the live app UI). Use when the user says
  "impact analysis", "what is affected by the change", "check the dependent files",
  or after the code review is finished.
---

# Impact Analysis

> ⚙️ Recommended settings: **Opus · Effort: High · Extended thinking: On**

Looks beyond the files changed in the PR. It finds the contracts that changed
(exports, props, constants, routes, storage keys, selectors), finds the files
that depend on them but were **not** changed in the PR, and checks that those
files still work with the new behavior.

The comparison baseline is **the commit before the PR** (the merge base of the PR
head and the base branch). The PR head is the "after" state.

## Input

Required:
1. The test cases file `<ISSUEKEY>-4-test-cases.md` (expl1-4-qa-test-cases).
2. The PR summary file `<ISSUEKEY>-5-pr-summary.md` (expl1-5-pr-summary).
3. The code review file `<ISSUEKEY>-6-code-review.md` (expl1-6-code-review).
4. PR URL or branch name.

In the same chat the files are in `.workflow-artifacts/<ISSUEKEY>/` automatically.
If the chat is new — the user uploads them.

PR URL format: `https://github.com/owner/repo/pull/123`.

If a file is missing — stop and tell the user which stage produces it.
If neither a PR URL nor a branch name is provided — ask.
If the user gives a branch name instead of a PR — work with the branch directly.
Do not search for a PR by branch. The base branch is `main` unless the user says otherwise.

Data sources for this skill:
- the three artifact files (read-only)
- the PR code and the repository through the gh CLI — the only source of code

Do not go to the tracker, do not use the browser, do not search the internet.
Do not read the requirements or checklist files.

## Rules

- All communication and all output file content — in English.
- Chat messages are short.
- All input files are read-only. Do not change, rewrite, or clean up their content.
- Read-only on code: do not change code, do not create commits, do not push,
  do not create PR comments, reviews, labels, or statuses.
- **Read not only the files changed in the PR.** Also read the dependent files that
  were NOT changed, to check that they work correctly with the changes.
- **Uncovered files never get FAIL.** If a file has no test case and no declared
  contract, the skill has no context for such a conclusion without a developer
  declaration. Mark it QA or N/A.
- Every FAIL has evidence: file, line, expected vs actual.
- Every N/A has evidence: file, line, expected vs actual (or what exactly is absent).
- No checks invented by the skill. Every check traces to an item of the impact map
  or to a test case / code-review row (validation).
- A QA or N/A result gets a retest note for stage 8 only if it can be checked in the
  live app UI (see Method, step 7). Results about code, CI, deploy files, npm scripts,
  build output, Storybook, CODEOWNERS and similar get no note. The notes are not new
  checks: they only restate what the result could not confirm, using the dependent's own
  flow, a finding, or a test case. Do not invent steps or data.
- Do not re-review the PR's own code against the test cases — that is stage 6.
  Check only contracts and dependencies.
- Do not evaluate code quality, style, architecture, or naming.
- Large impact: prioritize by risk. First Risk Areas, then Direct Impact, then
  Dependent Modules, then low-risk dependencies.
- After saving the file — stop. Do not continue into the next stage.

## Code access

The skill uses the **gh CLI**. Authorization: `gh auth login`.

Commands (replace `{owner}`, `{repo}`, `{sha}`, `{path}`):

1. PR metadata:
   ```
   gh pr view <URL> --json title,state,headRefName,headRefOid,baseRefName
   ```
2. The commit before the PR (BASE = merge base of the base branch and the PR head):
   ```
   gh api "repos/{owner}/{repo}/compare/{baseRefName}...{headRefOid}" --jq .merge_base_commit.sha
   ```
3. Changed files and the diff of one file:
   ```
   gh pr diff <URL> --name-only
   gh pr diff <URL> -- <filepath>
   ```
4. A file at a given commit (BASE or HEAD):
   ```
   gh api -H "Accept: application/vnd.github.raw" "repos/{owner}/{repo}/contents/{path}?ref={sha}"
   ```
5. The list of repository files at HEAD (to find candidate dependents):
   ```
   gh api "repos/{owner}/{repo}/git/trees/{headRefOid}?recursive=1" --jq '.tree[].path'
   ```

Branch mode: use `gh api "repos/{owner}/{repo}/compare/main...{branch}"` for the merge base
(`.merge_base_commit.sha`), the changed files and the diffs; use `{branch}` as HEAD.

Read changed files at HEAD for the new state and at BASE for the old state.
Read dependent files (unchanged in the PR) at HEAD — they are identical at BASE.
Do not read files from other branches.

Large PRs (more than 20 changed files): use the PR summary as the map. Read the diff
only of the files whose contract matters (components, logic, utils, shared helpers,
routes, config that other files read). Do not read styles, assets, built output,
snapshots, or docs unless an impact-map item points to them.

### If the CLI is unavailable

Stop. Do not use git clone, curl, the browser, or other tools as a replacement.
Tell the user to install and authorize the CLI (`gh auth login`).
Exception: if the user explicitly allows a one-off local git clone in the same run,
use read-only git on it (see `setup-guide.md`) and say so in the output file.

## Method

### 1. Read the inputs

- The PR summary: the changed files, grouped by entity, with categories.
- The code review: statuses. Files behind FAIL and QA rows are risk candidates.
- The test cases: the behaviors that are already specified. They are the "validation"
  that checks may refer to.

### 2. Get the two states

Resolve BASE (the commit before the PR) and HEAD (the PR head) with the commands above.
Write both SHAs to the output file.

### 3. Extract the changed contracts

For each changed file (key files first), compare BASE and HEAD and list what other code can
depend on:

- exports: added, removed, renamed, moved files; changed signatures and props
- constants and enums: values added, removed, changed (routes, ids, keys, class names)
- behavior of functions: changed conditions, return values, side effects
- storage and session: keys, storage type, cookie names, formats
- selectors and test ids: element ids, classes, `data-test` attributes, link text, button labels
- API shape: request/response fields, data models
- deleted files and removed code that others may reference

If nothing in the PR changes a contract of a file — it has no contract change; do not invent one.

### 4. Build the impact map

Find the dependents of every changed contract: files that import, call, read, or select it.
Use the repository file list and read candidate files. Every dependent that was not changed
in the PR goes to the map. Dependents that the PR also changed are covered by stage 6;
list them only if the contract change affects them in a way the test cases do not cover.

Give every entry an id `IMP-<n>` and a tier:

- **Risk Areas** — files behind code-review FAIL/QA rows; removed, renamed, or moved
  exports and files; shared mechanisms (storage, session, routes, selector conventions);
  anything where a broken dependent would break a main flow.
- **Direct Impact** — the changed files whose contract changed, and what they now expose.
- **Dependent Modules** — unchanged files that import or consume a changed contract.
- **Low risk** — assets, styles, docs, generated output, other loosely coupled files.

Each entry lists: the module, the contract change (BASE → HEAD), and its dependents (paths).
Order the table by tier, then by risk.

### 5. Verify each dependency

Go through the map in priority order. For every dependent, run the applicable checks:

- Do the imports of the dependent module match what the changed file now exports?
- Does the dependent code handle the new behavior of the changed functions?
- Are the constants and enums that were extended used correctly in the dependent modules?
- Does the conditional logic in the dependent modules (switch / if / filters) account for the new cases?
- Are the API contracts not broken for the dependent consumers?

Read the dependent file at HEAD and compare with the contract at HEAD. Use BASE only to see
what the contract looked like before.

### 6. Classify

- `PASS` — the code confirms the dependent works with the new contract.
- `FAIL` — the code shows a concrete mismatch (file, line, expected vs actual) in a file
  that has a test case or a clear contract in the PR summary / code review.
- `QA` — cannot be verified from the code (runtime, visual, real data, external
  services), or the file is not covered (no test case, no declared contract).
- `N/A` — not applicable: the dependency does not exist at HEAD or the contract
  change does not reach it. Needs evidence (file, line, what exactly is absent).

Rules:
- Do not mark PASS if there are doubts — better QA.
- Do not mark FAIL without concrete evidence. Never FAIL an uncovered file.
- Do not mark N/A without concrete evidence.
- Link each result to its `IMP-<n>` and, when one exists, to a TC or code-review row.

### 7. Write the retest notes for stage 8

Stage 8 tests the live app in a browser only. It does not look at code, CI files or npm
scripts. So the section holds only the checks a person can do in the product UI.

For every result with status `QA` or `N/A`, decide: can it be verified in the live app UI
(a page, a click path, a visible state, a URL that is opened)? If yes — add one row to
"Retest in stage 8" with Page, Precondition, Steps (numbered, short, one action each)
and Expected. If no (CI or deploy files, npm scripts, build output, Storybook, CODEOWNERS,
library internals) — add no row; the QA / N/A result stays in the Results table.
PASS and FAIL results get no row (FAIL already has a finding).

Rules for the notes:
- Take the steps and the expected result only from the dependent's own flow (for example
  the e2e spec steps), from the finding, or from a linked test case. If a linked test case
  already describes the retest, put its id in "Linked TC" and keep Steps short.
- Test data: only values that exist in the inputs or in the dependent (for example a
  product id from the spec). Do not invent data.
- Do not put checks in the notes that are not behind a QA or N/A result.
- If two results need the same browser steps, write the steps in both rows.

## Verification before saving

Before saving, check:

- Every dependency listed in the impact map has a result row.
- Every FAIL has a finding with file, line, expected vs actual.
- Every N/A has a finding with file, line and the reason.
- No FAIL on an uncovered file.
- Every check traces to an `IMP-<n>` item or to a TC / code-review row. Remove anything else.
- The order of the tables follows the risk priority.
- "Retest in stage 8" has no rows for PASS or FAIL results and no rows about code, CI,
  npm scripts or build output. Every row has a page, steps and an expected result.
  If no QA / N/A result can be checked in the UI — the section is not created.

## Output file

Create the file `.workflow-artifacts/<ISSUEKEY>/<ISSUEKEY>-7-impact-analysis.md`
and tell the user the path.

The file stays in `.workflow-artifacts/<ISSUEKEY>/`.

If the file already exists — delete it completely and create a new one.
The output is always a single file with the result of the latest run.

The file structure template is in references/output-template.md.

## Final response

After saving the file, report:
- The path to the saved file
- PASS / FAIL / QA / N/A counters
- The number of impact-map items per tier
- The number of browser retest notes for stage 8
