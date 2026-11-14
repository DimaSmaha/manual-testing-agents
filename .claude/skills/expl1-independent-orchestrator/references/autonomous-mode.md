# Autonomous mode — binding overrides for the expl1 stage skills

Used by `expl1-independent-orchestrator`, which launches every stage skill with `--autonomous --run-dir <RUN_DIR>`.
A stage skill that finds `--autonomous` in its arguments reads the section of its own stage in this file **before
doing anything**. These rules override every instruction in that skill that asks, confirms, offers or waits for the
user. Nothing else in the stage changes: the output template, the "do not" rules and the feedback-loop hooks stay.

## General rules (every stage)

1. **Never ask, never wait.** No question to the user, no `AskUserQuestion`, no "confirm when ready", no "tell me
   when you are done". Decide from the arguments, the artifact files and the rules below.
2. **Unresolved input → the stage's rule below.** If a stage has no rule for a case, take the safest reading that
   invents nothing (leave a requirement unchanged, mark a test case `QA` / `BLOCKED`, skip a step) and record it.
3. **Record every decision you took instead of asking**, one line each, in the final reply of the stage:
   `AUTO-DECISION: <what was unclear> → <what was done>`. The orchestrator copies these lines into the run log.
   A stage that cannot continue replies with `STOP: <reason>` as the **first line** (nothing after it is a question).
4. **Run folder.** `--run-dir <RUN_DIR>` (for example `.workflow-artifacts/TASK-112-20261114-153042`) replaces
   `.workflow-artifacts/<ISSUEKEY>/` everywhere in the stage skill: artifacts, `tracker/`, `web-testing/`. File names
   stay `<ISSUEKEY>-<n>-<name>.md` (the feedback-loop hooks and validators depend on that). The folder name is not the
   `<ISSUEKEY>`. Without `--run-dir`, the stage skill works as always.
5. **Model and effort cannot be switched during a run.** Skip every "switch the settings / confirm when ready" step;
   the recommended setting line is informational.
6. Everything else a stage never did stays forbidden: no editing of input artifacts, no data changes in the app that a
   test case does not call for, no credentials typed unless the files explicitly allow it, no workarounds for a missing
   integration (browser instead of the tracker, `git clone` instead of `gh`).

## Stage 1 — `expl1-1-task-context`

- Skip the MANDATORY settings message and do not wait for a confirmation.
- The kind (task / bug) and the base URL come from the arguments; the orchestrator has already resolved them. Never ask.
- Attachments: the tracker has none, so there is nothing to ask for. If the user attached files to the chat, they are
  not available here: record the attachments as "present but not processed" (the skill's rule for a skipped upload).
- Tracker unreachable, item not found, persistent 5xx, or an empty description → reply `STOP: <reason>`; write no file.
- The raw tracker response goes to `<RUN_DIR>/tracker/<ISSUEKEY>.json`.

## Stage 2 — `expl1-2-requirements-grooming`

- Workflow step 2 (questions about the product before grooming): do not ask. The context file is the only source.
- Workflow step 6: still print the problem list in chat (it is the log of what was found).
- Workflow step 7 (wait for answers): do not wait. **Every question counts as "the user cannot answer / says skip"**:
  the requirement stays exactly as it is in the context file. Do not rewrite any requirement (a rewrite needs an
  agreement that does not exist), do not add new requirement sub-items "agreed with the user". Splitting a requirement
  that holds several different things into sub-items (REQ-5a, REQ-5b) stays allowed: it needs no agreement.
- Add one line: `AUTO-DECISION: <N> grooming questions left unanswered → requirements kept as in the context`.
- Context file missing, corrupted or contradictory → `STOP: <reason>`.

## Stage 3 — `expl1-3-qa-checklist`

- Do not ask about anything unclear. Build the checks on what the requirement says (the skill's rule for a requirement
  left unchanged after grooming). Do not skip such a requirement and do not invent behavior to fill the gap.
- One `AUTO-DECISION` line per requirement whose checks had to be built from an ambiguous text.
- Requirements file missing, empty or corrupted → `STOP: <reason>`.

## Stage 4 — `expl1-4-qa-test-cases`

- Do not ask. For a requirement whose test data, condition or expected result cannot be taken from the checklist, do not
  invent it: use the `>` note under that requirement's `## REQ-<id>` heading that the output template already provides
  for "needs clarification", and add an `AUTO-DECISION` line for it.
- Checklist file missing, empty or corrupted → `STOP: <reason>`.

## Stage 5 — `expl1-5-pr-summary` · Stage 6 — `expl1-6-code-review` · Stage 7 — `expl1-7-impact-analysis`

- The PR is given as a URL, or as a branch together with `--repo <owner>/<name>` (the orchestrator passes both).
  Branch mode without a repository → `STOP: branch given without --repo`. Never ask for owner/repo.
- `gh` missing or not authorised, or the PR / branch not readable → `STOP: <reason>`. No `git clone`, `curl` or browser
  fallback. Stage 7's "one-off local clone if the user allows" exception does **not** apply: nobody can allow it.
- Stage 6 without the stage 5 summary works as it always does (reads the PR directly).
- Stage 7: the base branch is `main` unless the PR says otherwise (its `baseRefName`).
- Input artifacts missing → `STOP: <reason>`; the orchestrator decides what runs next.

## Stage 8 — `expl1-8-web-testing`

The browser stays **headed**, in the named session `qa-<ISSUEKEY>`, `--persistent` (a login saved earlier survives).

- **App URL:** `--app-url`, else the `url` in `navigation_paths.json`, else "Base URL" in `references/login-config.md`.
  None of them → do not open a browser; every test case gets `BLOCKED` with the reason "app URL unknown", and the
  report is still written. (The orchestrator normally stops before stage 8 in that case.)
- **Login (Step 4):** snapshot first; a persistent profile is often logged in already. On a login page: use the
  credentials in `login-config.md` only if it says **"Agent may type credentials: yes"**. Otherwise (or on SSO, 2FA,
  captcha, cookie wall you cannot click away) do not wait for a human: every test case that needs the session gets
  `BLOCKED` — "login required, no credentials allowed for the agent" — and the report is written. Tell the user, in the
  final reply, to log in once in the session `qa-<ISSUEKEY>` and re-run from stage 8.
- **Navigation (Step 5):** do not ask for the path. Use the memory entry; if absent or broken, try the app URL, the
  visible navigation and the test case's own steps (at most two attempts per page). Still not there → `BLOCKED`
  for that page's test cases. **Do not write to `navigation_paths.json`** (only a path the user confirmed belongs there).
- **Preconditions without data:** set data up only with plain UI steps the test case implies. Otherwise `BLOCKED`
  ("precondition not reachable"). Never create, edit or delete data on your own. `<ISSUEKEY>-x-seed-data.md` is never
  produced in an autonomous run (the seeder asks the user), so there is no seeded data to use.
- **Dialogs** that would change data and that the test case does not call for → `dialog-dismiss` and note it.
- **"Ask the user" in Browser error handling:** reload once, reopen the session once, then `BLOCKED` with what was
  searched for. No `kill-all`. No global `npm install` if `playwright-cli` is missing: then the report has every test
  case `BLOCKED` ("playwright-cli not installed") and the final reply says so.
- **Doubt** ("do not mark PASS if there are doubts, or ask the user to look"): mark `FAIL` with a concrete
  description of the discrepancy, or `OBSERVATION` when the expected result matched. Never leave a test case unrun
  while the app is reachable: the feedback loop requires an executed status for every test case.
- **Step 9 (close the browser):** do not ask and do not close. Leave the session open, never `delete-data`; mention the
  session name in the final reply.
- "Where the user helped" in the report: none in an autonomous run; do not invent a line for it.
