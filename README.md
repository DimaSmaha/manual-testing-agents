# Manual Testing Agents

A collection of **AI agents (Claude Code skills) that automate manual QA flows**: from reading a ticket, through grooming requirements and writing test cases, to reviewing a PR and executing checks in a real browser.

The repo is meant to grow. Each flow is a self-contained family of skills with its own prefix. Right now there is one flow:

| Flow           | Prefix    | What it does                                                                                                                               | Status  |
| -------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| **Explorer 1** | `expl1-*` | End-to-end QA pipeline for one task or bug: ticket → requirements → checklist → test cases → PR review → impact analysis → browser testing | Working |

More flows will be added next to it under `.claude/skills/`.

> **Note on naming:** the skills use the prefix `expl1` (explorer, flow 1). Use that spelling in commands and file names.

---

## Table of contents

- [Why this exists](#why-this-exists)
- [Explorer 1 (`expl1`) at a glance](#explorer-1-expl1-at-a-glance)
- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
- [The eight stages](#the-eight-stages)
- [How the stages hand work to each other](#how-the-stages-hand-work-to-each-other)
- [Stage 8: web testing in detail](#stage-8-web-testing-in-detail)
- [Issue tracker integration](#issue-tracker-integration)
- [Repository layout](#repository-layout)
- [Configuring and adapting the skills](#configuring-and-adapting-the-skills)
- [Design principles](#design-principles)
- [Conventions for scripts and scratch files](#conventions-for-scripts-and-scratch-files)
- [Adding a new agent flow](#adding-a-new-agent-flow)
- [Sources and credits](#sources-and-credits)

---

## Why this exists

Manual testing of one ticket is a chain of repeatable steps: read the ticket, find gaps in the requirements, decide what to check, write the cases, see what the developer changed, check what else the change might break, then walk through the UI. Each step produces something the next step needs.

These agents split that chain into small, single-purpose skills. Each skill:

- does one job and saves **one Markdown artifact**,
- reads only the artifacts of earlier stages (not the whole conversation),
- stops after saving, so a human stays in control between stages.

The result is a traceable trail from a requirement (`REQ-3`) to a check, to a test case, to a code-review verdict, to a browser result.

---

## Explorer 1 (`expl1`) at a glance

```
 tracker                                                       browser
   │                                                              ▲
   ▼                                                              │
┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐             ┌────────┐
│1 Task  │→ │2 Reqs  │→ │3 Check-│→ │4 Test  │             │8 Web   │
│context │  │grooming│  │list    │  │cases   │──────┐      │testing │
└────────┘  └────────┘  └────────┘  └────────┘      │      └────────┘
                                                    ▼           ▲
                         PR / branch  ──→  ┌────────┐  ┌────────┐ │
                                           │5 PR    │→ │6 Code  │─┤
                                           │summary │  │review  │ │
                                           └────────┘  └───┬────┘ │
                                                           ▼      │
                                                      ┌────────┐  │
                                                      │7 Impact│──┘
                                                      │analysis│ (optional)
                                                      └────────┘
```

The `expl1-orchestrator` skill runs the stages in order, verifies the handoff files between them, reports counters after each stage, and asks you before moving on.

---

## Prerequisites

| Tool                                  | Needed for                              | Notes                                                                                         |
| ------------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------- |
| [Claude Code](https://claude.ai/code) | Running all skills                      | Skills are loaded from `.claude/skills/`                                                      |
| `curl`                                | Stage 1 and the orchestrator pre-flight | Reads the issue tracker REST API                                                              |
| [`gh` CLI](https://cli.github.com/)   | Stages 5, 6, 7                          | Authenticate with `gh auth login`; used as the only source of PR code                         |
| `playwright-cli`                      | Stage 8                                 | `npm install -g @playwright/cli@latest` (the stage asks before installing)                    |
| Node.js                               | Playwright tooling                      | Optional `npm install` for the stock Playwright scaffold in the root                          |
| A running issue tracker               | Stage 1                                 | Default `http://localhost:3000` (see [Issue tracker integration](#issue-tracker-integration)) |

---

## Quick start

1. Open this repo in Claude Code.
2. Make sure the tracker is reachable and `gh` is authenticated.
3. Ask for the whole pipeline:

   ```
   Run the QA pipeline for TASK-112
   ```

   Or give a URL: `http://localhost:3000/tasks/112`. For bugs (retesting) use `BUG-114` or `<BASE>/bugs/114`.

4. When the orchestrator reaches stage 5, give it the PR URL or branch name.
5. After every stage, choose: **continue**, **rerun**, **skip**, or **stop**.

Other ways to start:

- Resume mid-pipeline: `Continue the QA pipeline from stage 4`
- Run one stage only: `Run expl1-3-qa-checklist for TASK-112`
- Stages can also be invoked directly as slash commands, for example `/expl1-6-code-review`.

All output lands in `.workflow-artifacts/<ISSUEKEY>/`.

### Recommended model settings

Each skill declares its own recommended settings and shows them before it starts. Stage 1 will not begin until you confirm them.

| Stage                   | Model  | Effort | Extended thinking |
| ----------------------- | ------ | ------ | ----------------- |
| 1 Task context          | Sonnet | Medium | Off               |
| 2 Requirements grooming | Opus   | High   | On                |
| 3 QA checklist          | Sonnet | Medium | Off               |
| 4 Test cases            | Sonnet | High   | Off               |
| 5 PR summary            | Sonnet | Medium | Off               |
| 6 Code review           | Opus   | High   | On                |
| 7 Impact analysis       | Opus   | High   | On                |
| 8 Web testing           | Sonnet | High   | Off               |

After stage 4, the pipeline recommends continuing stages 5 and onward in a **new chat** with the test-cases and checklist files, to keep context small. Upload the needed artifacts there and tell the orchestrator which stage to resume from.

---

## The eight stages

### 1. `expl1-1-task-context`: collect the ticket

Reads the task (story) or bug from the tracker, cross-references all fields (description, comments, attachments, acceptance criteria where available), and produces one enriched context file. It does **not** clarify or groom anything.

- **Input:** task/bug URL or key
- **Output:** `<ISSUEKEY>-1-context.md`
- **Hard rules:** never change the meaning, numbers, limits, labels, validation messages, or conditional branches of a requirement; do not invent information; stop if the description is empty.
- Bugs are processed the same way, with a `Severity` line; the bug description is kept as the problem to be verified as fixed.

### 2. `expl1-2-requirements-grooming`: analyze requirements like in grooming

Reads the context through a QA lens: coverage, clarity, contradictions, risks, missing details. Numbers every requirement (`REQ-N`). The IDs assigned here stay the same through every later stage.

- **Input:** `<ISSUEKEY>-1-context.md`
- **Output:** `<ISSUEKEY>-2-requirements.md`
- Asks the user grooming questions when requirements are unclear.

### 3. `expl1-3-qa-checklist`: atomic checks

Decomposes each requirement into atomic checks and produces a reference checklist.

- **Input:** `<ISSUEKEY>-2-requirements.md`
- **Output:** `<ISSUEKEY>-3-checklist.md`
- Design rules and an example live in `references/`.

### 4. `expl1-4-qa-test-cases`: steps, data, expected results

Turns the checklist into test cases with preconditions, step tables (step, test data, expected result), and postconditions.

- **Input:** `<ISSUEKEY>-3-checklist.md`
- **Output:** `<ISSUEKEY>-4-test-cases.md`

### 5. `expl1-5-pr-summary`: map of the PR

Reads the PR through the `gh` CLI/API and writes a structured summary of what changed. This is the map the code review uses.

- **Input:** PR URL or branch name
- **Output:** `<ISSUEKEY>-5-pr-summary.md`

### 6. `expl1-6-code-review`: verify each test case against the code

Checks every test case against the PR code and gives it a status:

| Status | Meaning                                                                        |
| ------ | ------------------------------------------------------------------------------ |
| `PASS` | The code satisfies the test case                                               |
| `FAIL` | The code contradicts the expected result (with file, line, expected vs actual) |
| `QA`   | Cannot be verified from code; needs the UI                                     |
| `N/A`  | Not applicable to this PR                                                      |

- **Input:** `<ISSUEKEY>-4-test-cases.md`, `<ISSUEKEY>-5-pr-summary.md`, PR URL or branch
- **Output:** `<ISSUEKEY>-6-code-review.md`

### 7. `expl1-7-impact-analysis` (optional): what else did the change touch?

Compares the PR head with the commit before the PR (the merge base) and finds contracts that changed: exports, props, constants, routes, storage keys, selectors. Then it reads the files that depend on those contracts but were **not** changed in the PR and checks they still work. Results are an impact map (Risk Areas, Direct Impact, Dependent Modules, low risk) with statuses and findings.

- **Input:** test cases, PR summary, code review, PR URL or branch
- **Output:** `<ISSUEKEY>-7-impact-analysis.md`, including a **"Retest in stage 8"** section with `Browser`, `Manual`, and `None` rows for every QA and N/A result
- Files with no test case and no declared contract never get `FAIL`, only `QA` or `N/A`.

### 8. `expl1-8-web-testing`: run it in a real browser

Executes the `QA` and `FAIL` items from the code review, plus `Browser` retest rows from the impact analysis, in a headed browser through `playwright-cli`, and writes a detailed report. See [Stage 8: web testing in detail](#stage-8-web-testing-in-detail).

- **Input:** `<ISSUEKEY>-6-code-review.md`, `<ISSUEKEY>-4-test-cases.md` (optional: checklist, impact analysis)
- **Output:** `<ISSUEKEY>-8-web-testing.md` plus screenshots

---

## How the stages hand work to each other

- **Naming.** Every artifact is `<ISSUEKEY>-<stage number>-<name>.md`. `<ISSUEKEY>` is `TASK-<id>` or `BUG-<id>`, so files sort in pipeline order.
- **Location.** `.workflow-artifacts/<ISSUEKEY>/` (git-ignored, kept after the run). The raw tracker response is stored in its `tracker/` subfolder.
- **Handoff checks.** Before each stage the orchestrator verifies the required inputs exist and are not empty. If one is missing it tells you which stage produces it.
- **Reruns overwrite.** Rerunning a stage deletes and recreates its file; nothing is merged or appended. Later stages may need a rerun if an earlier one changed.
- **Stable IDs.** `REQ-N` from stage 2 and test-case IDs are carried through to the final report.
- **Orchestrator discipline.** It launches stage skills with the Skill tool, never does stage work itself, never edits artifacts, and never answers a stage's questions for you.

### Conditional stages

- No PR or branch yet → stop after stage 4.
- Stage 7 is optional; skip it if you want.
- Stage 8 has nothing to do (and is skipped) if the code review has no `QA`/`FAIL` rows and the impact analysis has no `Browser` rows.

---

## Stage 8: web testing in detail

- **Headed browser, named session.** `playwright-cli -s=qa-<ISSUEKEY> open <URL> --headed --persistent`. You can step in at any moment (log in, solve a captcha, prepare data) and the agent continues in the same browser. The persistent profile keeps your login between runs.
- **Human in the loop.** The agent asks for help on login, 2FA/SSO/captcha, unknown URLs, missing preconditions, elements it cannot find after two attempts, ambiguous steps, and anything that could change data unexpectedly. It never types credentials unless you give them in chat.
- **No invented actions.** It changes data only when a test-case step requires it, and uses the test data from the test case literally.
- **Navigation memory.** Paths to pages are stored in `.claude/skills/expl1-8-web-testing/navigation_paths.json` so the next run does not ask again.
- **Statuses** in the final report:

  | Status           | Meaning                                                            |
  | ---------------- | ------------------------------------------------------------------ |
  | `PASS`           | UI matches the expected result                                     |
  | `FAIL`           | UI differs from expected (for items that came as `QA` or `IMPACT`) |
  | `FAIL CONFIRMED` | A code-review `FAIL` that the UI confirms                          |
  | `FAIL REJECTED`  | A code-review `FAIL` that the UI does not show                     |
  | `BLOCKED`        | Could not be executed (with the reason)                            |
  | `OBSERVATION`    | Passed, but something outside the requirements looked wrong        |

- **Evidence.** Screenshots for `FAIL` and `FAIL CONFIRMED` are saved under `.workflow-artifacts/<ISSUEKEY>/web-testing/`.
- **Manual follow-up.** `Manual` rows from the impact analysis are not executed; they are listed in the report for a person to check.
- The browser is closed only at the end and only after asking you.

---

## Issue tracker integration

The pipeline reads from a simple REST API (HTTP, no auth) using `curl`.

| Kind         | Endpoint                | Key         |
| ------------ | ----------------------- | ----------- |
| Task (story) | `GET <BASE>/tasks/<id>` | `TASK-<id>` |
| Bug          | `GET <BASE>/bugs/<id>`  | `BUG-<id>`  |

- Tasks and bugs have **separate id spaces**: the same number can exist in both, so the kind must always be known.
- Default `<BASE>` is `http://localhost:3000`; an ngrok URL can be used instead.
- Health check: `curl -s --max-time 5 <BASE>/`. If it fails, the pipeline stops and asks you; it does not fall back to a browser or guessing.
- Only the title, description, and type/severity are available. Comments, attachments, acceptance criteria, linked items, and PR info are not exposed by this tracker.

Full details: `.claude/skills/expl1-1-task-context/references/issue-tracker.md`. To use Jira, Linear, GitHub Issues, or another tracker, follow `.claude/skills/expl1-1-task-context/setup-guide.md`.

---

## Repository layout

```
.
├── CLAUDE.md                      Guidance for Claude Code working in this repo
├── README.md                      This file
├── package.json                   Playwright dev dependencies (no scripts)
├── playwright.config.ts           Stock Playwright scaffold (not used by the pipeline)
├── tests/example.spec.ts          Stock Playwright example
├── .claude/
│   ├── skills/                    The only folder Claude Code loads
│   │   ├── expl1-orchestrator/
│   │   ├── expl1-1-task-context/
│   │   ├── expl1-2-requirements-grooming/
│   │   ├── expl1-3-qa-checklist/
│   │   ├── expl1-4-qa-test-cases/
│   │   ├── expl1-5-pr-summary/
│   │   ├── expl1-6-code-review/
│   │   ├── expl1-7-impact-analysis/
│   │   ├── expl1-8-web-testing/
│   │   └── playwright-cli/        Browser automation skill used by stage 8
│   └── skills-archive/            Retired skill versions (inert)
└── .workflow-artifacts/           Git-ignored: per-task artifacts and scratch files
    └── <ISSUEKEY>/
        ├── <ISSUEKEY>-1-context.md ... <ISSUEKEY>-8-web-testing.md
        ├── tracker/               Raw tracker response
        └── web-testing/           Screenshots and run scripts
```

Each stage skill folder has the same shape:

```
expl1-N-name/
├── SKILL.md           Instructions the agent follows
├── references/        Output template, design rules, examples, field maps
└── setup-guide.md     How to reconfigure the stage for another tracker or project
```

---

## Configuring and adapting the skills

- **Tracker:** `expl1-1-task-context/references/field-maps.md` and `issue-tracker.md` define fields and access. `setup-guide.md` explains how to switch trackers.
- **App under test:** `expl1-8-web-testing/references/login-config.md` holds optional app settings (base URL, login notes). Empty is fine; the agent asks.
- **Output shape:** each stage's `references/output-template.md` defines its file. If you change one, update the downstream skills that parse it and the orchestrator's pipeline table and handoff checks. For example, stage 8 parses the stage 6 results table and stage 7's "Retest in stage 8" section.
- **Archived variant:** `.claude/skills-archive/expl1-8-web-testing-claude-desktop/` is a Claude Desktop version of stage 8 that drives the Claude in Chrome extension. To restore it, copy it into `.claude/skills/` under a non-clashing name.

---

## Design principles

- **One stage, one artifact.** Small skills with a clear input and output are easier to rerun, review, and replace.
- **Human in the loop.** Stages stop after saving; the orchestrator asks before advancing; the browser stage asks instead of guessing.
- **Do not invent.** No new requirements, test data, steps, or conclusions beyond what the sources say. Uncovered code never gets `FAIL` without evidence.
- **Evidence for every verdict.** `FAIL` and `N/A` carry file, line, expected vs actual. UI failures carry a screenshot.
- **Read-only where it matters.** Input artifacts are never edited; code review and impact analysis never commit, push, or comment on the PR.
- **Short chat, detailed files.** Chat messages are brief; the detail is in the artifacts.

---

## Conventions for scripts and scratch files

- Helper scripts (for example `playwright-cli run-code` files) are written as files with the editor/Write tool into a git-ignored folder in the repo, such as `.workflow-artifacts/<ISSUEKEY>/web-testing/`. No heredocs, no `sed` edits.
- Each script runs as one simple command: no `cd`, no `&&` or `;` chains, no env-var prefixes, no paths outside the repo. This keeps every command matching an allow rule.
- Command output goes to a git-excluded scratch folder and is read with the Read tool.
- Scratch files are deleted when the task is done. The `.workflow-artifacts/<ISSUEKEY>/` folder itself is never deleted.

Local-only, git-ignored files: `.workflow-artifacts/`, `.playwright-cli/`, `.claude/settings.local.json`, `TODO`, and the Playwright output folders.

---

## Adding a new agent flow

1. Pick a prefix for the flow (for example `expl2`).
2. Create `.claude/skills/<prefix>-<n>-<name>/SKILL.md` for each stage, with `references/` and a `setup-guide.md`.
3. Define each stage's input, output file name, and output template. Keep one artifact per stage.
4. Add an orchestrator skill (`<prefix>-orchestrator`) with a pipeline table, handoff checks, and a final report.
5. Add the flow to the table at the top of this README.

---

## Sources and credits

Explorer 1 is based on the ideas and workflow shown in. Thanks a lot Anna ;) :

- DOU forum post: <https://dou.ua/forums/topic/59970/>
- Live stream: <https://www.youtube.com/live/YwTP0yveYzU>

Public apps and repositories used as practice targets:

- Swag Labs demo shop: <https://www.saucedemo.com/>
- Sauce Labs sample web app, an example PR to run the pipeline against: <https://github.com/saucelabs/sample-app-web/pull/52>
