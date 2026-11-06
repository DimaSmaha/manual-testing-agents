# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Not an application. It is a **Claude Code skill pipeline for manual QA of one task/bug at a time**. All the real content lives in `.claude/skills/` as Markdown skills (`SKILL.md` + `references/` + `setup-guide.md`). The only code is the stock Playwright scaffold (`playwright.config.ts`, `tests/example.spec.ts`), which is not part of the pipeline, plus the Flow 2 runner (`scripts/expl-bot-run.ts`, scripts `expl-bot:run` / `expl-bot:typecheck`) and the Flow 3 config (`explorbot.config.mjs`). Dependencies: `@playwright/test`, `@types/node`, `@anthropic-ai/claude-agent-sdk`, `dotenv`, `tsx`, `typescript`, and `explorbot` (dev).

## The pipeline

`expl1-orchestrator` runs eight stage skills in order. Each stage reads the previous stages' artifacts and writes one Markdown file, then stops and waits for the user:

| # | Skill | Output |
|---|-------|--------|
| 1 | `expl1-1-task-context` | `<ISSUEKEY>-1-context.md` |
| 2 | `expl1-2-requirements-grooming` | `<ISSUEKEY>-2-requirements.md` |
| 3 | `expl1-3-qa-checklist` | `<ISSUEKEY>-3-checklist.md` |
| 4 | `expl1-4-qa-test-cases` | `<ISSUEKEY>-4-test-cases.md` |
| 5 | `expl1-5-pr-summary` | `<ISSUEKEY>-5-pr-summary.md` |
| 6 | `expl1-6-code-review` | `<ISSUEKEY>-6-code-review.md` (per test case: PASS / FAIL / QA / N/A) |
| 7 | `expl1-7-impact-analysis` (optional) | `<ISSUEKEY>-7-impact-analysis.md` |
| 8 | `expl1-8-web-testing` | `<ISSUEKEY>-8-web-testing.md` |

Cross-stage contracts that span several skills (read the orchestrator `SKILL.md` for the full list):

- **`<ISSUEKEY>`** is `TASK-<id>` or `BUG-<id>` and prefixes every artifact. Requirement IDs (`REQ-N`) are assigned in stage 2 and must stay stable through all later stages.
- **Artifacts** go in `.workflow-artifacts/<ISSUEKEY>/` (git-ignored, kept after the run). Re-running a stage deletes and recreates its file; it never merges. Later stages may need a re-run if an earlier one changed.
- **The orchestrator never does stage work or edits artifacts.** It launches stage skills via the Skill tool, checks handoff files exist and are non-empty, reports counters, and asks before advancing. Stage skills ask the user questions; never answer them on the user's behalf.
- **Stage 8 scope** = `QA` and `FAIL` rows from stage 6, plus the rows of stage 7's "Retest in stage 8" section (source `IMPACT`; live-app browser checks only, code/CI/npm results get no row). `PASS`/`N/A` rows from the code review are not browser-tested. FAIL items from the code review may only end as `FAIL CONFIRMED` or `FAIL REJECTED`.
- Each stage skill declares a recommended model/effort/thinking setting (Opus + thinking for stages 2, 6, 7; Sonnet otherwise). Stage 1 blocks until the user confirms those settings.
- Stages 1–4 are tracker/requirements work; stages 5–7 need a PR URL or branch and use the `gh` CLI (`gh pr view`, `gh api repos/.../compare/...`) as the only code source; stage 8 uses the browser only.

## The `expl-bot-*` flow (exploratory testing, separate from `expl1-*`)

A port of the explorbot crew (`C:\qa\work\explorbot`) to Claude Code: Claude Code is the brain, `playwright-cli`
the hands. Independent of the `expl1-*` pipeline, which it never edits (`--from <ISSUEKEY>` only **reads**
`<ISSUEKEY>-2-requirements.md` / `-4-test-cases.md`).

| Skill / agent | Role (explorbot) |
|---|---|
| `expl-bot-orchestrator` | Captain; launches the stage skills, asks before advancing; never edits their files |
| `expl-bot-research` + subagent `expl-bot-researcher` (`.claude/agents/`) | Researcher: UI map with tested locators |
| `expl-bot-plan` | Planner: styles normal/curious/psycho, user approves the plan |
| `expl-bot-test` + subagent `expl-bot-tester` | Tester; the main session is the Pilot (`STUCK` → `PROGRESS:`/`NEXT:`, resume ≤ 2) |
| `expl-bot-report` | Analyst (+ Historian: `tests/expl-bot/*.spec.ts` drafts) |
| `expl-bot-learn` | knowledge / experience / compaction |
| `expl-bot-core` | Shared references and `run-code` scripts; not a stage, writes no artifacts |

- Data lives in `.workflow-artifacts/expl-bot/` (`sites/<host>/{knowledge,experience,research}`, `state.json`,
  `runs/<RUN_ID>/{plan.md,test-cases.md,results/,report.md,screenshots/,scripts/,out/}`). `RUN_ID` = `eb-YYMMDD-HHMM`. Knowledge
  and plan formats are explorbot-compatible (Flow 3 reads them).
- **Flow 1 offers every optional feature** (deep research, style, runnable `tests/expl-bot/` drafts, knowledge,
  another round, saving the login, closing the browser): the orchestrator's "Optional features" table lists
  what to ask and when; declines are recorded in `RUN/meta.md`. Flow 2 never asks and keeps `--deep`,
  `--style`, `--tests` as explicit flags. Keep the table, the stage skills and `README.md` in step.
- **Own data only**: a run creates/edits/deletes only records it created itself, named with the RUN_ID.
  Pre-existing data is never touched (`expl-bot-core/references/data-protection.md`). Preserve this rule when
  editing the skills and agents.
- Browser: `playwright-cli`, headed, `-s=expl-<host>`, `--persistent`. Subagents cannot spawn subagents and share
  one browser, so testers run one at a time. Subagents never ask the user; they return `NEEDS_USER: …` and the
  calling skill asks.
- Heavy snapshots stay in subagents; the main context gets the compact result block
  (`expl-bot-core/references/tester-loop.md`, "Result block"). Changes to a block's shape must be matched in
  `expl-bot-test`, `expl-bot-report`, `expl-bot-learn` and the two agents.
- Scripts in `expl-bot-core/scripts/` are `run-code` files; run them with `--raw` and absolute-or-repo-relative
  paths, one simple command, output into `runs/<RUN_ID>/out/`.
- **Flow 2, `expl-bot-independent-orchestrator`** (explicit invocation only) is the unattended twin. It never asks
  the user, uses the same stage skills with `--independent` (overrides: `run-context.md`, "Independent mode"),
  and emits `<!-- PHASE COMPACT: … -->` JSON blocks that `scripts/expl-bot-run.ts` (Agent SDK, `permissionMode:
  "dontAsk"` + `allowedTools` whitelist, never `bypassPermissions`) parses. Run: `npm run expl-bot:run -- <url>`.
  Credentials only via `EXPL_BOT_AUTH` (env, in memory) or `sites/<host>/auth.json` (written only with the user's
  yes in Flow 1); never print them. The Express server (SSE, batch jobs) and Docker are written up as "Future
  updates — run pipeline" in `README.md` and are **not built**; do not add them unprompted. Changing a compact's
  fields means changing `colors.ts` (`printFinalSummary`) and the orchestrator skill together.
- **Flow 3, `explorbot-run`** wraps the real explorbot CLI (`explorbot@0.6.2`, dev dependency; its own models and
  `OPENROUTER_API_KEY` in `.env`, billed by the provider — not Claude Code). Config is `explorbot.config.mjs`
  (`.mjs`: the package is CommonJS and an ES-module `.js` config does not load). Its `dirs.knowledge` points at
  `.workflow-artifacts/expl-bot/sites/<host>/knowledge` so Flow 1 and Flow 3 share human facts; `experience` and
  `output` live in `.workflow-artifacts/explorbot/`. Use only non-TUI commands on Windows; never trust the exit
  code for pass/fail (read `reports/<mode>-<session>.md`); never read or print `.env`; credentials only via
  `--auth` for one run. Every explorbot command needs the key at startup. Bridge mode runs a Flow 1 `plan.md`
  with `explorbot test`; keep the plan format explorbot-compatible when editing `expl-bot-plan`.
- Status: the skills were written against explorbot's sources and the three scripts were run against a local
  test page; a full end-to-end run on a real app has not been done yet. Flow 3 was verified only up to
  `explorbot config --json` (models and dirs resolve); running its commands needs the user's OpenRouter key.

## Run metrics (hooks, not skills)

`.claude/hooks/agent-metrics.mjs` (registered in `.claude/settings.json`) records, from outside the conversation,
every skill launch (a `Skill` tool call, **and** a skill the user types as `/name args`, which is not a tool call and is
only visible in the `UserPromptSubmit` prompt), every user turn (`UserPromptSubmit` → `Stop`) and every `Task|Agent` subagent run into
`.workflow-artifacts/metrics/_events/<session>.jsonl`; `metrics-report.mjs <KEY>` derives the cost table from those
events plus the transcripts in `~/.claude/projects` (ported from the `suvore-qa-confa` mock, adapted: a stage is a
window of the main session, not a subagent). Rules to keep when editing:

- **No stage skill or agent file mentions the metrics.** Only the three orchestrators run
  `node .claude/hooks/metrics-report.mjs <KEY>` (read-only) at the end; `expl-bot-run.ts` whitelists that one command.
- **Orchestrator names live in one place**: `GROUP_SKILLS` in `lib/tracked-tools.mjs`. A new orchestrator skill must be
  added there, or its turns are billed to the stage before it. The matcher `Task|Agent` and `Skill` in
  `settings.json` must keep matching `SUBAGENT_TOOLS` / `SKILL_TOOLS`.
- **Key** = `TASK-/BUG-<id>` or the RUN_ID (`lib/keys.mjs`). expl-bot skills ignore `--from <ISSUEKEY>` for keying.
  Only assistant tool-call inputs are scanned for artifact paths, never tool results (SKILL.md quotes example keys).
- **The Stop hook saves after every turn** (`saveReport` in `lib/report-render.mjs`, shared with the CLI), so typed
  `/skill` runs are saved without an orchestrator; a failed write is a `save_failed` diagnostic, never a failed turn.
- **The orchestrators also run `metrics-report.mjs <KEY> --save`**, which writes `<KEY>-metrics.{md,json}` into
  `.workflow-artifacts/<KEY>/` (expl-bot: `runs/<RUN_ID>/metrics.{md,json}`). These two files are **script-owned**: the
  "orchestrator never edits artifacts" rule stands, they are the one thing a script writes. The JSON snapshot restores
  rows whose `~/.claude/projects` transcript was cleaned up (`buildKeyReport`'s `snapshot`); it only ever fills a missing
  bill. Changing the JSON row shape means changing `loadSnapshot`/`saveTargets` in `lib/report-model.mjs` together.
- **Cost is an API-list-price estimate, derived each run** (not plan usage); rates are in `lib/pricing.mjs` (`RATES_AS_OF`). Unknown model, non-standard
  speed or Haiku 5.5 above 100K prompt = unpriced, never guessed. Update rates there when prices change.
- Every hook path exits 0 and writes `_diagnostics.jsonl` instead of failing silently. Empty table → read it first.
- Synthetic checks used to verify the model live in the (git-ignored) scratch folder only; re-create them from the
  report-model rules if you change the window logic.

## External dependencies

- **Issue tracker**: a REST API read with `curl` (no auth), default `http://localhost:3000`, with an ngrok alternative. Tasks (`/tasks/<id>`) and bugs (`/bugs/<id>`) have **separate id spaces**, so the kind must always be known. Commands, retry flags and response shapes: `.claude/skills/expl1-1-task-context/references/issue-tracker.md`. Pre-flight health check is `curl -s --max-time 5 <BASE>/`; if it fails, stop and ask rather than work around it. Comments, attachments and linked items are not exposed by the tracker.
- **Browser (stage 8)**: `playwright-cli` only (see `.claude/skills/playwright-cli/`), never Playwright MCP or the Chrome extension. Always a **headed** browser in a **named session** `qa-<ISSUEKEY>` with `--persistent`, so the user can log in or intervene. The agent does not type credentials unless the user gives them in chat. Per-page navigation memory is in `.claude/skills/expl1-8-web-testing/navigation_paths.json`; app settings are in `references/login-config.md`.
- Stage 6/7 test the PR under review, which lives in another repo. A local clone sits in `.workflow-artifacts/clone/` (scratch).

## Editing skills

- `.claude/skills/` is the only folder Claude Code loads. `.claude/skills-archive/` holds retired versions (currently the Claude Desktop variant of stage 8) and is inert. To restore one, copy it into `skills/` under a non-clashing name.
- Each stage's output format is defined by its `references/output-template.md`. Changes to a stage's output shape must be matched in the downstream skills that parse it (for example stage 8 reads the stage 6 results table and stage 7's "Retest in stage 8" section) and in the orchestrator's pipeline table and handoff checks.
- `setup-guide.md` in each stage records how to reconfigure that stage for another tracker or project. Stages 1 and 7 also keep `references/configure-blocks-original.md` with the original `⚠️ CONFIGURE` placeholder blocks.
- Skill text is written in English, with short chat messages and no invented data. Several skills have hard "do not" rules (do not reword requirements, do not invent test data, uncovered files never get FAIL). Preserve them when editing.

## Script and output conventions (from the user's global rules)

- Helper scripts (`playwright-cli run-code` files and so on) are written with the Write tool into a git-ignored folder in the repo, such as `.workflow-artifacts/<ISSUEKEY>/web-testing/`. Do not create them with heredocs or `sed`.
- Run each as one simple command: no `cd`, no `&&`/`;` chains, no env-var prefixes, and no paths outside the repo. Redirect output to a git-excluded scratch folder and read it with the Read tool.
- Delete scratch files you created when finished and confirm `git status --porcelain` shows nothing new. Never delete `.workflow-artifacts/<ISSUEKEY>/` itself.

## Git-ignored locally

`.workflow-artifacts/`, `.playwright-cli/`, `.claude/settings.local.json`, `TODO` (personal notes), and the usual Playwright output folders.
