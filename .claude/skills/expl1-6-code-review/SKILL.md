---
name: expl1-6-code-review
description: >
  Sixth stage of task processing. Takes the test cases created by the
  expl1-4-qa-test-cases skill and the PR summary created by the expl1-5-pr-summary skill,
  verifies each test case against the PR code, and produces a compact
  results file with statuses and findings for the problematic
  items. Use when the user says "code review",
  "check the implementation", "go through the code", or after
  the PR summary is finished.
---

# Code Review

> ⚙️ Recommended settings: **Opus · Effort: High · Extended thinking: On**

Verifies each test case against the PR code. The output is a
compact results table with findings for the FAIL items.

## Input

Required from the user:
1. The test cases file `<ISSUEKEY>-4-test-cases.md` created
   by the expl1-4-qa-test-cases skill. In the same chat the file is available
   in `.workflow-artifacts/<ISSUEKEY>/` automatically. If the chat is new —
   the user uploads the file to the chat.
2. The PR summary file `<ISSUEKEY>-5-pr-summary.md` created
   by the expl1-5-pr-summary skill. In the same chat it is available automatically.
3. PR URL or branch name.

> ⚠️ **CONFIGURE:** specify the PR URL format in your system.
> For example: `https://github.com/owner/repo/pull/123` for GitHub,
> `https://gitlab.com/owner/repo/-/merge_requests/123` for GitLab.

If any file is not provided — ask before starting.
If neither a PR URL nor a branch name is provided — ask.

If the user gives a branch name instead of a PR — work
with the branch directly through the CLI or API. Do not search for a PR by branch.

Data sources for this skill:
- the test-cases file — the source of checks
- the pr-summary file — navigation through the PR
- the PR code through the CLI or API — the source of evidence

All files are read-only.
Do not change, rewrite, or clean up their content.

If the test-cases file is missing — stop and tell
the user that the expl1-4-qa-test-cases skill must be run first.

If the pr-summary file is missing — work without it.
Look for the implementation of the test cases in the PR directly through the CLI or API.

Do not go to the tracker, do not use external tools,
do not search the internet, do not use the browser.

## Rules

- All communication and all output file content — in English.
- Chat messages are short.
- Read-only: do not change code, do not create commits, do not push,
  do not create PR comments, reviews, labels, or statuses.
- Work only within the PR branch or the specified branch.
  Do not take code from main, the base branch, other branches,
  or the general repository context.
- Verify only the test cases from the file. Do not invent,
  do not interpret requirements on your own.
- Do not evaluate code quality, style, architecture, naming,
  tests, CI, or refactoring — unless it is described
  in a test case.
- Do not look for bugs unrelated to the test cases.
- Do not analyze pre-existing code that was not changed in the PR.
- If a test case cannot be verified from the code —
  mark it QA, do not invent a result.

## Code access

> ⚠️ **CONFIGURE:** describe how the skill gets access to the PR and code.
> Specify the concrete tool and commands for your system.
>
> Examples:
> - **GitHub → gh CLI:** `gh pr view`, `gh pr diff`, `gh api`
> - **GitLab → glab CLI:** `glab mr view`, `glab mr diff`
> - **Bitbucket → bb CLI or REST API**
> - **Azure DevOps → az devops CLI or REST API**
>
> Be sure to add a rule: if the CLI is unavailable —
> stop and notify the user. Do not use
> workarounds (browser, curl) as a replacement.

### Recommended flow

> ⚠️ **CONFIGURE:** describe the step-by-step flow for reading the PR code.
> Below is an example for GitHub + gh CLI.

**PR mode (PR URL provided):**

1. Parse the PR URL → owner, repo, number.
2. Get the PR metadata:
   ```
   gh pr view <URL> --json title,state,headRefName,headRefOid,baseRefName,files
   ```
3. For each test case use the PR summary
   to determine where to look. Read the diff or the full file
   of only the relevant files:
   ```
   gh pr diff <URL> -- <filepath>
   ```
4. When the diff is not enough and the full file content
   from the PR branch is needed:
   ```
   gh api -H "Accept: application/vnd.github.raw" "repos/{owner}/{repo}/contents/{path}?ref={head_branch}"
   ```

**Branch mode (branch name without a PR):**

1. Ask the user for owner/repo if it is not clear
   from the context. The base branch is `main` unless the user
   specifies another one.
2. Get the diff of a specific file:
   ```
   gh api "repos/{owner}/{repo}/compare/main...{branch}" --jq '.files[] | select(.filename=="{path}") | .patch'
   ```
3. The full file content from the branch:
   ```
   gh api -H "Accept: application/vnd.github.raw" "repos/{owner}/{repo}/contents/{path}?ref={branch}"
   ```

Read files only from the PR head branch.
Do not read files from the base branch, main, or other branches.

### PR summary as navigation

The PR summary shows which files changed and what is in them.
Use it to quickly find where in the PR a specific test case
is implemented.

If the implementation of a test case cannot be found
in the files listed in the PR summary — search the PR directly
through the CLI or API. The PR summary may be incomplete — this is
not a reason to mark FAIL.

### If the CLI is unavailable

Stop. Do not use git clone, curl, the browser,
or other tools as a replacement. Tell the user to
install and authorize the CLI.

> ⚠️ **CONFIGURE:** specify the concrete authorization command
> for your CLI. For example: `gh auth login` for GitHub.

### Large PRs

If there are more than 20 changed files:
- Use the PR summary as a navigation map —
  do not read files blindly.
- Group test cases by files: read a file once
  and verify all test cases that relate to it.
  Do not re-read a file for each test case.
- Configs, styles, tests — read only if there is
  a direct test case for them.

## Review process

For each test case (TC-REQ-X.Y):

1. **Understand** — which scenario the test case describes:
   precondition, steps, expected result.
2. **Find** — use the PR summary to determine which files
   are relevant. Read the diff or the full file.
3. **Evaluate** — whether the code implements the behavior described
   in the test case. Compare the expected result
   of each step with what the code does.
4. **Classify** — assign a status.

### What to look for in the code

- Presence of elements: components, fields, buttons, labels,
  texts, messages, tooltips.
- Condition logic: if/else, switch, guard clauses, permissions,
  feature flags.
- States: default, active, disabled, error, loading, empty.
- Validations: rules, messages, triggers, boundary values.
- Data: fields, formats, mappings, API contracts, models.
- Removal: whether what was supposed to be removed was really removed.
- UI binding: whether the element is connected to the correct
  template, route, component, screen.
- Unfinished or gated paths: feature flags that keep the behavior off,
  TODO / commented-out branches, actions reachable only through the API
  with no UI, behavior limited to certain plans or roles. These usually mean
  `QA` or `FAIL` with the exact condition, not `PASS`.
- Permissions: whether a block exists in the UI only, on the server only,
  or in both. A block that exists only in the UI does not prove the
  restriction — say which one the code shows.

### FAIL vs absence in the diff

Absence of code in the diff ≠ automatic FAIL.
The code may already exist in the branch without changes.
Before marking FAIL — check the full file
from the PR branch through the CLI or API.

FAIL only when there is concrete evidence:
- the code does something different from what the test case expects
- the code removes or breaks something that should work

If the PR clearly delivers only a part of the task (a slice), a test case for a part
that is absent from the PR is `N/A` with that reason, not `FAIL`.

### Not a mismatch

Do not mark FAIL for:
- the same behavior written in other words than the test case
- a detail the code does not mention while the behavior itself matches
  (silence on a detail is not a contradiction)
- an item you could not read: a file you cannot access is "blocked", not "absent" — use `QA`
  and name what was not readable; do not replace it with a guess from other code

If the PR summary says `Behavior change: No`, treat it only as a navigation hint:
still check each test case against the code.

## Classification

Each test case gets one status:

- `PASS` — the code confirms that the behavior described
  in the test case is implemented.
- `FAIL` — the code shows that the behavior is not implemented,
  is implemented incorrectly, or contradicts the expectations.
- `QA` — cannot be verified from the code. Manual
  verification is needed: runtime behavior, visual
  placement, real data, integrations, permissions.
- `N/A` — the item is not applicable to this PR.
  The code relevant to this requirement is absent from the PR.

Rules:
- Do not mark PASS if there are doubts — better QA.
- Do not mark FAIL without concrete evidence from the code.
- Do not mark N/A without concrete evidence from the code.
- QA is a normal status. Many UI/UX and runtime
  checks cannot be confirmed from the code alone.

## Output file

Create the file `.workflow-artifacts/<ISSUEKEY>/<ISSUEKEY>-6-code-review.md`
and tell the user the path.

The file stays in `.workflow-artifacts/<ISSUEKEY>/` — the next skill
in the same chat picks it up automatically.

If the file already exists — delete it completely and create a new one.

The file structure template is in references/output-template.md.

## Verification before saving

Before saving, check:

- The number of test cases in the results table equals
  the number of TC-REQ in the test-cases file. If it does not match —
  find the missing ones and add them before saving.
- The order of test cases in the table matches the order
  in the test-cases file.
- Every FAIL has a corresponding entry in Findings
  with a specific file and line.
- Every N/A has a corresponding entry in Findings with the reason.
- There is no FAIL without evidence from the code.
- There is no N/A without evidence from the code.
- Re-read the cited lines of every FAIL once more, as if you had not written it, and
  confirm the code really contradicts the expected result. If it does not — change the
  status to `QA` (or `PASS` if the code confirms the behavior) and fix the finding.

## Final response

After saving the file, report:
- The path to the saved file
- PASS / FAIL / QA / N/A counters
