# Manual Testing Agents

A collection of **AI agents (Claude Code skills) that automate manual QA flows**: from reading a ticket, through grooming requirements and writing test cases, to reviewing a PR and executing checks in a real browser.

The repo is meant to grow. Each flow is a self-contained family of skills with its own prefix. Right now there is one flow:

| Flow                             | Prefix                   | What it does                                                                                                                                                         | Status                                            |
| -------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| **Explorer 1**                   | `expl1-*`                | End-to-end QA pipeline for one task or bug: ticket → requirements → checklist → test cases → PR review → impact analysis → browser testing                           | Working                                           |
| **Exploratory bot (semi-auto)**  | `expl-bot-*`             | [explorbot](https://github.com/testomatio/explorbot)'s agent crew on Claude Code (no API key): research a page → plan scenarios → test → report → learn              | New, untested on a real app                       |
| **Exploratory bot (unattended)** | `expl-bot-independent-*` | Same crew, headless, driven by `npm run expl-bot:run` (Claude Agent SDK); never asks the user                                                                        | New, untested on a real app                       |
| **explorbot as-is**              | `explorbot-run`          | The real [explorbot](https://github.com/testomatio/explorbot) npm package with its own models and API key, behind a thin wrapper skill; can run an `expl-bot-*` plan | Config verified; needs your OpenRouter key to run |

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
- [Exploratory flow: `expl-bot-*`](#exploratory-flow-expl-bot-)
- [Run metrics: tokens, cost and time per skill](#run-metrics-tokens-cost-and-time-per-skill)
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

### Optional helpers

Small skills adapted from [testomatio/skills](https://github.com/testomatio/skills) (MIT). They are not stages: the orchestrator offers them, you can say no, and they never edit a stage artifact. Their files are named `<ISSUEKEY>-x-*.md` and sit outside the handoff checks.

| Helper | Offered after | Output | What it does |
|--------|---------------|--------|--------------|
| `qa-thinking` | stage 2 | `<ISSUEKEY>-x-risk-questions.md` | up to 5 "What if" questions and 5 risk scenarios on the groomed requirements |
| `qa-detect-useless-tests` | stage 4 | `<ISSUEKEY>-x-test-pruning.md` | read-only list of test cases to merge, simplify or drop |
| `qa-data-seeder` | before stage 8 (and in the `expl-bot` flow after plan approval), only if data is missing | `<ISSUEKEY>-x-seed-data.md` (expl-bot: `seed.md`) | **writes to the app:** creates marked test records in a non-production environment. Asks you first, and again before creating anything; only the records it lists are treated as the run's own data. Never used in the unattended flow |
| `qa-review-pr` | stage 8 | `<ISSUEKEY>-x-pr-verdict.md` | short PR verdict: is it done, merge risks, what must be verified |
| `qa-explain-behavior` | on demand only | chat answer | explains what the product does, from the PR or the scratch clone |

The rest of the imported set stays in `.claude/skills-archive/testomat-skills/`. Rules from several of those skills were merged into stages 2–7 and the explorbot skills instead (for example the test-case writing rules in stage 4 and the plan checks in `expl-bot-plan`).

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

## Exploratory flow: `expl-bot-*`

A port of the agent crew of [explorbot](https://github.com/testomatio/explorbot) (autonomous exploratory testing)
into Claude Code. **Claude Code is the brain, `playwright-cli` is the hands, no API key.** Independent of the
`expl1-*` pipeline (which stays unchanged); it can optionally read its artifacts with `--from <ISSUEKEY>`.

```
/expl-bot-orchestrator <url|path> [--scope page|site|pick] [--pages "<path>,…"] [--max-pages N] [--focus "…"] [--style normal|curious|psycho] [--max-tests N] [--deep] [--from <ISSUEKEY>]
```

| Step | Skill                    | Who does the work                                                                                                      | Output                                                                                                                                         |
| ---- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | (orchestrator preflight) | main session; opens a headed `--persistent` session `expl-<host>`, you log in; asks the scope, depth, style, drafts    | `runs/<RUN_ID>/meta.md`                                                                                                                        |
| 2a   | `expl-bot-research`      | subagent `expl-bot-researcher` (Sonnet), start page                                                                    | `sites/<host>/research/<page-key>.md`: UI map, locators tested against the live page                                                           |
| 2b   | `expl-bot-discover`      | subagent `expl-bot-researcher` in `discover` mode (scope `pick`/`site`); with `pick` you choose the pages              | `runs/<RUN_ID>/pages.md`: pages of the app with a status each (in-scope, skipped-cap, needs-data, external, ignored)                           |
| 2c   | `expl-bot-research`      | one page per call, one at a time, for every other in-scope page                                                        | one research file per page                                                                                                                     |
| 3    | `expl-bot-plan`          | main session; style rotates normal → curious → psycho; **you approve the plan**                                        | `runs/<RUN_ID>/plan.md` (explorbot plan format)                                                                                                |
| 4    | `expl-bot-test`          | subagent `expl-bot-tester` (Sonnet), one at a time; main session is the Pilot and resumes a `STUCK` tester up to twice | `runs/<RUN_ID>/results/<n>.md`                                                                                                                 |
| 5    | `expl-bot-report`        | main session                                                                                                           | `runs/<RUN_ID>/report.md` (Coverage / What works / Defects / UX / Execution Issues / Data created); optional `tests/expl-bot/*.spec.ts` drafts |
| 6    | `expl-bot-learn`         | main session                                                                                                           | `sites/<host>/experience/<page-key>.md`, `knowledge/*.md`, `state.json`                                                                        |

Every skill is also runnable alone (for example `/expl-bot-research https://app/products --deep`). Shared rules,
formats and scripts live in `expl-bot-core` (not a stage).

**Scope: one page or the whole app.** The stage skills work on one page each; the orchestrator decides which
pages (`expl-bot-core/references/site-scope.md`). Flow 1 asks in Step 1: `pick` (recommended: it discovers the
pages, shows the list and you choose), `site` (discover and cover everything up to `--max-pages`, default 8) or
`page` (only the URL you gave). `--pages "/cart.html,/inventory-item.html?id=4"` names pages directly. Discovery is
read-only: it follows links and navigation controls (never log out, submit, add to cart or pay), stays on the
origin, and records pages that need data or a form submit as `needs-data` (listed as not covered in the report, not
researched in this version). One plan covers all researched pages (about 3 scenarios per page, at most 24).

**New to it?** Read [`docs/expl-bot-flows.md`](docs/expl-bot-flows.md): what the bot is (and is not), how it
differs from `expl1-*`, and example sessions for each orchestrator and each skill.

What is ported from explorbot: cheap workers with heavy context + a smart manager (subagents vs. main session);
the Researcher's UI map with tested locators and a 6 h cache; planning styles ranked **data change > state
change > UI-only**; the Tester loop (≤ 30 actions, only the latest snapshot kept, dead-loop detection by state
key); the Pilot's stuck-pattern catalogue; the closed verification vocabulary (`NOT VERIFIED` ≠ failed); the
Analyst report that separates product defects from automation problems; knowledge and experience memory.

**Data policy: own data only.** A run creates, edits or deletes only records it created itself, named with the
run id (`eb-YYMMDD-HHMM`). Pre-existing data is never touched; anything that would is reported as `BLOCKED`.
See `.claude/skills/expl-bot-core/references/data-protection.md`.

**Memory** is in `.workflow-artifacts/expl-bot/` (git-ignored):
`sites/<host>/{knowledge,experience,research}`, `sites/<host>/state.json`, `runs/<RUN_ID>/…`. Knowledge and plan
files use explorbot's own formats.

### Flow 2: unattended run (`expl-bot-independent-*`)

The same crew, rules, stage skills and subagents, driven headlessly by a Claude Agent SDK script. It **never asks
the user**: missing input means stop-and-report. No plan-approval checkpoint; browser is headless unless
`--headed`; the scope defaults to `site` (start URL plus discovered pages, `--max-pages` default 8; `--scope page`
restores the single-page run); budgets `--max-tests` (default 5 for one page, 3 per page up to 24 for a site) and
`--max-duration` minutes (default 30 for one page, 60 for a site); a blocker gets one
attempt to unblock, then the scenario is `BLOCKED` and the run moves on. After each phase the orchestrator emits a
`<!-- PHASE COMPACT -->` JSON block (same protocol as `flow-1a-gt-us-to-tc` in
`user-story-to-test-case-agent-generator`), which the runner parses for the live log and the final summary.

```
cp .env.sample .env            # set EXPL_BOT_URL / auth, see below
npm run expl-bot:run -- http://localhost:3000/products --scope page --max-tests 2 [--focus "…"] [--style curious] [--deep] [--headed] [--from TASK-112]
npm run expl-bot:run -- http://localhost:3000/ --max-pages 6        # whole site: discovers pages, 3 scenarios per page
```

Or inside Claude Code chat: `/expl-bot-independent-orchestrator <url> …` (explicit invocation only).

| Piece                                                     | File                                                          |
| --------------------------------------------------------- | ------------------------------------------------------------- |
| Orchestrator skill                                        | `.claude/skills/expl-bot-independent-orchestrator/SKILL.md`   |
| Overrides every stage skill follows with `--independent`  | `expl-bot-core/references/run-context.md`, "Independent mode" |
| Runner (Agent SDK `query()`, SIGINT, summary, exit codes) | `scripts/expl-bot-run.ts`, `scripts/utils/colors.ts`          |
| Env template                                              | `.env.sample`                                                 |

- **Exit codes:** `0` ok · `2` bad input, pipeline error or stopped early (`STOPPED:`/`STOP:`) · `3` fatal ·
  `130` Ctrl+C (the browser session `expl-<host>` is closed in every case).
- **Permissions:** `permissionMode: "dontAsk"` with a whitelist (`Read/Write/Edit/Glob/Grep/Agent/SendMessage`,
  `Bash(playwright-cli:*)`, `date`, `git status`, `printenv EXPL_BOT_AUTH`). Anything else is denied, not prompted.
  `bypassPermissions` is not used.
- **Login:** headless runs need a login that needs no human. Either log in once in Flow 1 and answer "yes" to
  saving the login state (`sites/<host>/auth.json`, loaded with `playwright-cli state-load`), or set
  `EXPL_BOT_AUTH` (free-form text, kept in memory only; the agent reads it with `printenv`, so it appears in the
  session transcript, not in any artifact).
- **SDK authentication:** `ANTHROPIC_API_KEY` or `CLAUDE_CODE_OAUTH_TOKEN` (from `claude setup-token`), else the
  local Claude Code login. Check Anthropic's current terms before using a subscription token in automation.
- **Data policy** is unchanged: own data only, and any doubt means read-only/`BLOCKED`.

#### Future updates — run pipeline

Not implemented. Planned, modeled on `user-story-to-test-case-agent-generator`:

- **Server.** An Express app (`server/`) that starts `expl-bot:run` jobs, streams live logs to the browser over
  SSE, runs batch jobs (several URLs / pages one after another) with per-job timeouts, and has optional
  `X-API-Key` auth. Services: `server/services/processManager.ts`, `batchRunner.ts`, `sseManager.ts`.
- **Docker.** `Dockerfile` (Node 24 + `playwright-cli` + Chromium, `.workflow-artifacts` as a volume) and
  `docker-compose.yml` / `docker-compose.prod.yml`.

### Flow 3: explorbot as-is (`explorbot-run`)

The real explorbot, installed as a dev dependency (`explorbot@0.6.2`, Node ≥ 24). It uses **its own models and a
pay-per-token API key**, not Claude Code. Useful as a baseline to compare the `expl-bot-*` results against.

1. `npm install`, then `npx playwright install chromium` if the browser is missing.
2. Put `OPENROUTER_API_KEY` in `.env` (copy `.env.sample`; `.env` is git-ignored). Leave `TESTOMATIO` and the
   `LANGFUSE_*` variables empty unless you want run data sent to those services.
3. `explorbot.config.mjs` (`.mjs` because this package is CommonJS) sets the URL from `EXPLORBOT_URL` /
   `EXPL_BOT_URL`, the bundled OpenRouter model recommendations, a visible browser, and:

   | explorbot dir          | Location                                                                                                                                           |
   | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
   | `knowledge`            | `.workflow-artifacts/expl-bot/sites/<host>/knowledge`, **shared with the `expl-bot-*` flows** (one source of human facts, same frontmatter format) |
   | `experience`, `output` | `.workflow-artifacts/explorbot/{experience,output}` (apart from Flow 1: explorbot writes runnable tests and its own reports there)                 |

4. Use the **non-TUI** commands on Windows (the TUI needs Windows Terminal + WSL), through the skill or directly:

   ```
   /explorbot-run config                        # npx explorbot config --json
   /explorbot-run navigate /products            # pre-flight, exit 1 if unreachable
   /explorbot-run research /products [--deep]
   /explorbot-run plan /products --focus "…"
   /explorbot-run explore /products --max-tests 2 --max-duration 10
   /explorbot-run test <plan.md> '*'
   /explorbot-run bridge <RUN_ID>               # run a Flow 1 plan.md through explorbot
   ```

The skill reads the report explorbot wrote (`.workflow-artifacts/explorbot/output/reports/<mode>-<session>.md`) and
never trusts the exit code for pass/fail. **Bridge mode** works because Flow 1 writes `runs/<RUN_ID>/plan.md` in
explorbot's own plan format.

Notes:

- Every command, including `context`, needs the key at startup (the bundled decision model requires
  `OPENROUTER_API_KEY`), even when it makes no AI calls. `config --json` works without it.
- Explorbot's data protection is not the own-data-only policy of Flow 1/2. On an app with real data prefer
  `bridge`/`test` with a Flow 1 plan over a free `explore`.
- `npm install` reports vulnerabilities in explorbot's dependency tree (`npm audit`); they are in a dev-only tool.
- Optional: `npx explorbot prima verify|ask` against an open Flow 1 browser session. Explorbot's own review
  recommends `playwright-cli` for driving and `prima` only for `verify`/`ask`; it needs the key as well.

---

## Run metrics: tokens, cost and time per skill

Hooks in `.claude/hooks/` (registered in `.claude/settings.json`) measure every skill run **from outside**:
no stage skill or agent mentions them. They are ported from the agent-metrics hooks of the
`suvore-qa-confa` mock (`agent-metrics.mjs` + `metrics-report.mjs` and their libs) and adapted, because
here the stages are skills in the main chat, not subagents.

| What                                                                                                               | How it is measured                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| One stage skill (`expl1-3-qa-checklist`, `expl-bot-plan`, …), launched by an orchestrator or typed as `/name args` | the window of the chat from its launch to the next skill; tokens are the assistant messages in it, summed once per message id from the session transcript |
| `expl-bot-researcher` / `expl-bot-tester` subagents                                                                | their own transcripts, added to the stage that launched them (shown as `↳` rows, not added twice)                                                         |
| An orchestrator                                                                                                    | `<name> (own turns)` row plus all its stages; the **Σ row is the orchestrator's overall result**                                                          |
| Time                                                                                                               | **Active** = prompt → stop (the agent working); **Wall** = launch → last stop, including questions to you                                                 |
| Key                                                                                                                | `TASK-<id>` / `BUG-<id>` for `expl1-*`, the `eb-YYMMDD-HHMM` RUN_ID for `expl-bot-*` (resolved from skill args or the artifact paths the skill wrote)     |

After every turn of a skill session the **Stop** hook prints one line, e.g.
`SKILL_RUN_METRICS: skill=expl1-3-qa-checklist key=TASK-112 run=1/1 model=… active=95.2s tokens=212,345 cost=$0.41 …`.
The orchestrators print the full table at the end:

```
node .claude/hooks/metrics-report.mjs TASK-112            # table, one row per stage + Σ
node .claude/hooks/metrics-report.mjs TASK-112 --detail   # + input / output / cache split
node .claude/hooks/metrics-report.mjs TASK-112 --json     # machine-readable
node .claude/hooks/metrics-report.mjs TASK-112 --save     # table + save the snapshot files on demand
node .claude/hooks/metrics-report.mjs --list              # every key that has metrics
```

**Where it is saved.** The **Stop hook saves automatically after every turn** (so a stage you type yourself, with no
orchestrator, is saved too; its line ends with `saved=<path>`), the orchestrators also run `--save` at the end, and
you can run it by hand. It writes a markdown table and a JSON snapshot next to the key's own artifacts:
`.workflow-artifacts/TASK-112/TASK-112-metrics.{md,json}` (or `.workflow-artifacts/expl-bot/runs/<RUN_ID>/metrics.{md,json}`).
They are script-owned: re-running overwrites them. The numbers come from the session transcripts in
`~/.claude/projects`, which Claude Code can clean up, so every later report fills any row whose transcript is
gone from the saved JSON — a saved number is never replaced by a worse one. The raw events behind it are in
`.workflow-artifacts/metrics/_events/<session>.jsonl` (git-ignored). A hook that bails writes the reason to `.workflow-artifacts/metrics/_diagnostics.jsonl` — if the
table is empty, look there first. All hooks exit 0: metrics never fail a tool call.

**Limits (also printed under the table):** per-skill numbers are attributed by time window in one shared chat, so
an off-topic message between stages lands in the surrounding stage; cost is list price (no plan discount) and
rates live in `lib/pricing.mjs` (`RATES_AS_OF` says when they were checked — an unknown model or a fast-mode run
is left unpriced, never guessed); a row whose session transcript is no longer in `~/.claude/projects` keeps its
time but has no tokens; an interrupted subagent has no bill. The unattended runner (`npm run expl-bot:run`)
loads project hooks via `settingSources: ["project"]`, so Flow 2 is measured the same way.

---

## Repository layout

```
.
├── CLAUDE.md                      Guidance for Claude Code working in this repo
├── README.md                      This file
├── package.json                   Playwright + Agent SDK deps; scripts expl-bot:run, expl-bot:typecheck
├── scripts/                       expl-bot-run.ts (Flow 2 runner) and utils/colors.ts
├── .env.sample                    Env template for the runner and explorbot (copy to .env, git-ignored)
├── explorbot.config.mjs           Config for Flow 3 (explorbot as-is)
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
│   │   ├── qa-thinking/           Optional helpers (see "Optional helpers"):
│   │   ├── qa-detect-useless-tests/ adapted from testomatio/skills
│   │   ├── qa-review-pr/
│   │   ├── qa-data-seeder/
│   │   ├── qa-explain-behavior/
│   │   ├── expl-bot-orchestrator/ Exploratory flow (semi-auto), see above
│   │   ├── expl-bot-{research,discover,plan,test,report,learn}/
│   │   ├── expl-bot-independent-orchestrator/  Unattended twin (Flow 2)
│   │   ├── explorbot-run/         Wrapper for the real explorbot CLI (Flow 3)
│   │   ├── expl-bot-core/         Shared rules, formats and run-code scripts (not a stage)
│   │   └── playwright-cli/        Browser automation skill used by stage 8 and expl-bot-*
│   ├── agents/                    Subagents: expl-bot-researcher, expl-bot-tester
│   ├── hooks/                     Run-metrics hooks: agent-metrics.mjs, metrics-report.mjs, lib/
│   ├── settings.json              Registers the hooks (settings.local.json stays personal)
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

Explorbot skills are based on the ideas and workflow shown in. Thanks a lot Misha ;) :

- Github: <https://github.com/testomatio/explorbot/>

Metrics hooks are based on the ideas and workflow shown in. Thanks a lot Kostia ;) :

- Github: <https://github.com/dneprokos/suvore-qa-confa-test-automation>

Public apps and repositories used as practice targets:

- Swag Labs demo shop: <https://www.saucedemo.com/>
- Sauce Labs sample web app, an example PR to run the pipeline against: <https://github.com/saucelabs/sample-app-web/pull/52>
