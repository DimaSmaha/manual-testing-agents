---
name: expl1-5-pr-summary
description: >
  Fifth stage of task processing. Reads the PR through the CLI or API
  and produces a structured summary of the changes — a map of the PR for the
  expl1-6-code-review skill. Use when the user says "read the PR",
  "look at the PR", "PR summary", "what's in the PR", or after
  the test cases are finished and before the code review.
---

# PR Summary

> ⚙️ Recommended settings: **Sonnet · Effort: Medium · Extended thinking: Off**

Reads the PR through the CLI or API and produces a structured summary
of the changes: which files changed, which components are affected,
what was added, removed, and modified.

The summary is a navigation map for the code review skill.
The code review uses it to know where in the PR to look for
the implementation of each test case.

## Input

Required from the user:
- PR URL or branch name.

> ⚠️ **CONFIGURE:** specify the PR URL format in your system.
> For example: `https://github.com/owner/repo/pull/123` for GitHub,
> `https://gitlab.com/owner/repo/-/merge_requests/123` for GitLab.

If neither a PR URL nor a branch name is provided — ask
before starting work.

If the user gives a branch name instead of a PR — work
with the branch directly through the CLI or API. Do not search for a PR by branch.

Data sources for this skill:
- The PR through the CLI or API — the only source.

Do not go to the tracker, do not use external tools,
do not search the internet, do not use the browser.
Do not read the requirements, checklist, or test-cases files —
this skill works only with code.

## Rules

- All communication and all output file content — in English.
- Chat messages are short.
- Read-only: do not change code, do not create commits, do not push,
  do not create PR comments, reviews, labels, or statuses.
- Work only within the PR branch or the specified branch.
  Do not take code from main, the base branch, or other branches.
- Describe what changed, do not evaluate how it changed. Do not comment
  on code quality, style, architecture, or naming.
- Do not compare the changes with the task requirements. The skill does not know
  the requirements — it sees only the code.
- After saving the file — stop. Do not continue
  into code review or analysis.

## Code access

> ⚠️ **CONFIGURE:** describe how the skill gets access to the PR.
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

### Workflow

> ⚠️ **CONFIGURE:** describe the step-by-step flow for getting data
> from the PR. Below is an example for GitHub + gh CLI.

**PR mode (PR URL provided):**

1. Parse the PR URL → owner, repo, number.
2. Get the PR metadata:
   ```
   gh pr view <URL> --json title,state,headRefName,headRefOid,baseRefName,files
   ```
3. Get the list of changed files:
   ```
   gh pr diff <URL> --name-only
   ```
4. For each file get the diff:
   ```
   gh pr diff <URL> -- <filepath>
   ```
   Read file by file, not the whole diff at once.
5. If the diff is not enough to understand the changes — read
   the full file from the PR branch:
   ```
   gh api -H "Accept: application/vnd.github.raw" "repos/{owner}/{repo}/contents/{path}?ref={head_branch}"
   ```

**Branch mode (branch name without a PR):**

1. Ask the user for owner/repo if it is not clear
   from the context. The base branch is `main` unless the user
   specifies another one.
2. Get the list of changed files:
   ```
   gh api "repos/{owner}/{repo}/compare/main...{branch}" --jq '.files[].filename'
   ```
3. Get the diff of a specific file:
   ```
   gh api "repos/{owner}/{repo}/compare/main...{branch}" --jq '.files[] | select(.filename=="{path}") | .patch'
   ```
4. The full file content from the branch:
   ```
   gh api -H "Accept: application/vnd.github.raw" "repos/{owner}/{repo}/contents/{path}?ref={branch}"
   ```

Read files only from the PR head branch.
Do not read files from the base branch, main, or other branches.
Do not take code from the general repository context.

### Large PRs

If there are more than 20 changed files — do not read the diff of each one.
Read the diff only of the key files (components, logic,
API). Configs, styles, tests — describe by file name
without the diff.

### If the CLI is unavailable

Stop. Do not use git clone, curl, the browser,
or other tools as a replacement. Tell the user to
install and authorize the CLI.

> ⚠️ **CONFIGURE:** specify the concrete authorization command
> for your CLI. For example: `gh auth login` for GitHub.

## What to describe for each file

For each changed file determine:

- **Category:** component, API/endpoint, model/type,
  utility, style, config, test, migration, or other.
- **What changed:** briefly — what was added, removed, or
  modified. Do not rewrite the code, describe the essence of the changes.
  Give the concrete names of functions, components, hooks,
  endpoints that were changed or added.

If several files change one entity (component +
its styles + its test) — group them under that entity.

## PR type and behavior-change triage

From the diff alone (not from requirements) determine two header lines:

- **Type:** `feature` (new files, endpoints, components, or new behavior in existing ones),
  `fix` (the diff corrects existing behavior), `refactor` (same behavior, changed structure),
  or `mixed`. If the diff does not show it — `unclear`. Do not guess from the PR title alone.
- **Behavior change:** `Yes` or `No`. `No` only when every changed file is documentation, tests,
  CI or build configuration, lint or format configuration, or a dependency version bump
  (list the files that show it). Anything else is `Yes`.

Still list every file in the table: the triage is a hint for the next stages, not a reason to
shorten the summary. Do not write acceptance criteria or test ideas.

## Verification before saving

Before saving, check:

- Type and Behavior change are filled in, with a one-sentence "Changes" line.
- Every changed file from the PR is present in the summary.
  Compare the number of files in the list of changes with the number
  of files in the summary.
- A category is determined for every file.
- Descriptions of changes are brief and specific — not "file changed",
  but "added the region parameter to the filterLeads function".

## Output file

Create the file `.workflow-artifacts/<ISSUEKEY>/<ISSUEKEY>-5-pr-summary.md`
(create the folder if it does not exist) and tell the user the path.

The file stays in `.workflow-artifacts/<ISSUEKEY>/` — the next skill
in the same chat picks it up automatically.

If the file already exists — delete it completely and create a new one.

The file structure template is in references/output-template.md.

## Final response

After saving the file, report:
- The path to the saved file
- The number of changed files
