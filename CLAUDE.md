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
- **Artifacts** go in a **timestamped run folder** `.workflow-artifacts/<ISSUEKEY>-<YYYYMMDD-HHMMSS>/` (git-ignored, kept after the run), for example `TASK-114-20261114-170834`. Stage 1 (or `expl1-orchestrator`) creates it with `date +%Y%m%d-%H%M%S`; stages 2–8 take `--run-dir <dir>` or else the newest such folder; never the bare `.workflow-artifacts/<ISSUEKEY>/`. Artifact file names stay `<ISSUEKEY>-<n>-<name>.md`. The metrics key is then the stamped run key (see the metrics section). Re-running a stage deletes and recreates its file; it never merges. Later stages may need a re-run if an earlier one changed.
- **The orchestrator never does stage work or edits artifacts.** It launches stage skills via the Skill tool, checks handoff files exist and are non-empty, reports counters, and asks before advancing. Stage skills ask the user questions; never answer them on the user's behalf.
- **Stage 8 scope** = **every** test case of stage 4, whatever its stage 6 status (`QA` / `FAIL` / `PASS` / `N/A` only sets the Source column; no code review → all `QA`), plus the rows of stage 7's "Retest in stage 8" section (source `IMPACT`; live-app browser checks only, code/CI/npm results get no row). FAIL items from the code review may only end as `FAIL CONFIRMED` or `FAIL REJECTED`. Feedback loop 4 enforces that every test case has an executed row.
- Each stage skill declares a recommended model/effort/thinking setting (Opus + thinking for stages 2, 6, 7; Sonnet otherwise). Stage 1 blocks until the user confirms those settings.
- Stages 1–4 are tracker/requirements work; stages 5–7 need a PR URL or branch and use the `gh` CLI (`gh pr view`, `gh api repos/.../compare/...`) as the only code source; stage 8 uses the browser only.
- **Optional helpers** (adapted from `testomatio/skills`, MIT; not stages, never required): `qa-thinking` (offered after
  stage 2 → `<ISSUEKEY>-x-risk-questions.md`), `qa-detect-useless-tests` (after stage 4 → `-x-test-pruning.md`, read-only),
  `qa-review-pr` (after stage 8 → `-x-pr-verdict.md`, needs the PR), `qa-data-seeder` (before stage 8 →
  `-x-seed-data.md`; expl-bot: `runs/<RUN_ID>/seed.md`). **`qa-data-seeder` is the only one that writes to the app**: it
  carries an "aware" block, asks the user first (Step 0) and again at its count-approval gate, seeds only non-production,
  marks every record with the ISSUEKEY/RUN_ID, and its listed records are the only seeded data later steps may touch
  (`data-protection.md`, rule 3). Never used by Flow 2 or under read-only focus. The orchestrators offer the helpers
  (tables "Optional helpers" / "Optional features") and never edit their files; the others edit no stage artifact. `qa-explain-behavior` is on-demand only (chat answer,
  code through `gh` or the scratch clone). The `-x-` files are outside the handoff checks and the Stage 8 scope. They are
  not orchestrators, so `GROUP_SKILLS` is unchanged and their cost lands in the stage window they run in.

### Autonomous run: `expl1-independent-orchestrator` (explicit invocation only)

The unattended twin of `expl1-orchestrator`: stages 1–8 back to back, no question and no pause
(`/expl1-independent-orchestrator <TASK-id|BUG-id|URL> [--pr …] [--repo …] [--app-url …] [--from-stage N] [--to-stage N] [--run-dir …] [--skip-impact]`).
- **Run folder** is `.workflow-artifacts/<ISSUEKEY>-<YYYYMMDD-HHMMSS>/` (the run key). Only the folder carries the stamp;
  artifact file names stay `<ISSUEKEY>-<n>-<name>.md`, so the validators and the artifact gate are unchanged. The run key
  is also the metrics key (`keys.mjs`, `saveTargets`; a group row adopts its stages' stamped key in `report-model.mjs`),
  so `<RUN_KEY>-metrics.{md,json}` land in the run folder. Every stage is launched with `--run-dir <RUN_DIR>` as the
  **first** argument — that order is what makes `keyFromArgs` pick the stamped key. Don't reorder it.
- **How stages stop asking**: each stage skill has a short "Autonomous mode" note (`--autonomous`, `--run-dir`) that points
  to `.claude/skills/expl1-independent-orchestrator/references/autonomous-mode.md`, one section per stage. Changing a stage's
  questions or its blockers means updating that file too. Unanswered grooming questions leave the requirement unchanged;
  stage 4 uses its `>` needs-clarification note; unknown login/app URL/path → `BLOCKED` rows, never a question.
- Browser: `playwright-cli`, always **headed**, `--persistent`, session `qa-<ISSUEKEY>`; it is left open at the end.
- Failure policy: stages 1–4 abort the run, 5–7 failures fall through to stage 8 (Source `QA`), validation not `PASSED`
  is logged and flagged, never retried by the orchestrator. Helpers (`qa-*`) are never run, `qa-data-seeder` least of all.
- Pre-flight stops the run before stage 1 when stage 8 is in range and no app URL is known (`--app-url`, `login-config.md`
  Base URL, or a saved path). `<RUN_DIR>/<ISSUEKEY>-x-auto-run.md` is the orchestrator's own decision log.

## The `expl-bot-*` flow (exploratory testing, separate from `expl1-*`)

A port of the explorbot crew (`C:\qa\work\explorbot`) to Claude Code: Claude Code is the brain, `playwright-cli`
the hands. Independent of the `expl1-*` pipeline, which it never edits (`--from <ISSUEKEY>` only **reads**
`<ISSUEKEY>-2-requirements.md` / `-4-test-cases.md`).

| Skill / agent | Role (explorbot) |
|---|---|
| `expl-bot-orchestrator` | Captain; launches the stage skills, asks before advancing; never edits their files |
| `expl-bot-research` + subagent `expl-bot-researcher` (`.claude/agents/`) | Researcher: UI map with tested locators |
| `expl-bot-discover` (same subagent, `MODE: discover`) | Finds the app's pages (read-only navigation) and writes `RUN/pages.md`; gives a run its scope |
| `expl-bot-plan` | Planner: styles normal/curious/psycho, user approves the plan |
| `expl-bot-test` + subagent `expl-bot-tester` | Tester; the main session is the Pilot (`STUCK` → `PROGRESS:`/`NEXT:`, resume ≤ 2) |
| `expl-bot-report` | Analyst (+ Historian: `tests/expl-bot/*.spec.ts` drafts) |
| `expl-bot-learn` | knowledge / experience / compaction |
| `expl-bot-core` | Shared references and `run-code` scripts; not a stage, writes no artifacts |

- Data lives in `.workflow-artifacts/expl-bot/` (`sites/<host>/{knowledge,experience,research}`, `state.json`,
  `runs/<RUN_ID>/{plan.md,test-cases.md,pages.md,results/,report.md,screenshots/,scripts/,out/}`). `RUN_ID` = `eb-YYMMDD-HHMM`. Knowledge
  and plan formats are explorbot-compatible (Flow 3 reads them).
- **Scope** (`expl-bot-core/references/site-scope.md`): the stage skills are page-scoped, the orchestrators pick the
  pages. `--scope page|site|pick`, `--pages`, `--max-pages` (default 8). Flow 1 asks (recommended `pick`); Flow 2
  defaults to `site` and never asks. Discovery is read-only and writes `runs/<RUN_ID>/pages.md`; `needs-data`
  pages are listed as not covered, never researched. One `plan.md` covers all researched pages (each test's
  `## Requirements` = its page). Changing the `pages.md` format or the status names means changing
  `site-scope.md`, the researcher agent (`discover` mode), `expl-bot-discover`, `expl-bot-plan`, `expl-bot-report`
  and both orchestrators together.
- **Flow 1 offers every optional feature** (scope, deep research, style, runnable `tests/expl-bot/` drafts, knowledge,
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
  with `explorbot test`; keep the plan format explorbot-compatible when editing `expl-bot-plan`. Verified against the
  installed parser (`node_modules/explorbot/src/utils/test-plan-markdown.ts`): every non-empty line under a test's
  `## Requirements` is read as its start URL and the last one wins, so that section holds the URL only; `REQ-`/`TC-`
  references go in the `<!-- area … covers: … -->` comment between the `<!-- test -->` block and the `#` heading.
  `explorbot-run` also checks for `TESTOMATIO` in `.env` before a run (the reporter would upload it).
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
- **Key** = `TASK-/BUG-<id>`, the stamped run key `TASK-/BUG-<id>-YYYYMMDD-HHMMSS` of `expl1-independent-orchestrator`, or the RUN_ID (`lib/keys.mjs`). expl-bot skills ignore `--from <ISSUEKEY>` for keying.
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
- `agent-metrics.mjs` exits at once in a nested feedback-loop reviewer session (`EXPL1_REVIEW_CHILD=1`, see "Feedback
  loops"): that session is not a skill run, and its Read calls name the reviewed task's artifacts.
- Synthetic checks used to verify the model live in the (git-ignored) scratch folder only; re-create them from the
  report-model rules if you change the window logic.

## Feedback loops (hooks, stages 2, 3, 4 and 8)

`.claude/hooks/artifact-gate.mjs` is a `PostToolUse` hook on `Write|Edit` in `.claude/settings.json`, with **two**
`if:` file matchers per artifact, `Write(**/*-<stage>.md)` and `Edit(**/*-<stage>.md)` (`-2-requirements`, `-3-checklist`,
`-4-test-cases`, `-8-web-testing`; timeout 60 s, or 300 s for the two reviewer loops). The `if:` names the tool
literally and wants the `**/` path form: the earlier `Edit(/.workflow-artifacts/**/*-<stage>.md)` never fired for a
Write call (no status file, no log entry; found on the first stamped run, TASK-114). Verified live for stage 2 with
both Write and Edit; stages 3, 4 and 8 use the same patterns. The script still ignores any file that is not a
configured `TASK-/BUG-<id>-<stage>.md` artifact in `.workflow-artifacts/<folder>/`. Because it is a project hook and
not a skill-frontmatter hook, it fires the same way inside `expl1-orchestrator` (stages run inline via the Skill tool)
and for a single `/expl1-…` call, and again on every fix. Stage 4's skill is not changed by its loop; stage 8's scope
was widened for loop 4 (below). Ported from the `artifact-gate` / `us-json-gate` / `tc-gate` of
`user-story-to-test-case-agent-generator`, with the write trigger only.

- Config: `.claude/hooks/artifact-gate.json` (file-name suffix after `<ISSUEKEY>-` → `validator`, optional
  `reviewer: { agent, timeout_ms }`, `max_retries`). Validators export
  `validateArtifact(absPath) → { errors, warnings, unverified?, pending?, source, inputs?, fixHint? }` and also work as a
  CLI: `node .claude/hooks/lib/validate-requirements.mjs <file>`.
- **Layers, cheapest first** — this is what keeps the reviewer from running on every edit (user requirement):
  1. `pending` (stages 4 and 8): the file has no `## Statistics` section yet, so the stage is still writing it →
     status `PENDING`, silent, nothing else runs.
  2. script validator → `errors` block without any model call.
  3. reviewer subagent, only for a finished file that passed the script layer: `.claude/agents/<agent>.md` run as-is
     through `claude -p --agent <agent> --setting-sources project --no-session-persistence --output-format json
     --json-schema <{verdict, notes}>` (`lib/review-subagent.mjs`). The agent reads the files itself (tools `Read`,
     `StructuredOutput`). **Verdict cache**: same agent rules + artifact + ground truth (sha256) in the same session →
     the last verdict is reused, no model call. Reviewer cannot run → `UNVERIFIED` + `systemMessage`, not a retry.
     Time and cost of each review are recorded (`review_ms`, `review_cost_usd`; measured: 10–20 s, $0.07–0.13).
- **Progress is free**: a script-layer failure with fewer problems than the previous script-layer check still gets
  feedback but uses no retry, so stage 8 adding executed test cases one by one never runs out of retries.
- **Loop 1**, `lib/validate-requirements.mjs`: `<KEY>-2-requirements.md` is checked against the sibling
  `<KEY>-1-context.md`. `## Goal` must be copied unchanged. The count is checked: N context requirements (the
  `## Requirements` bullets, then the `## Additional requirements (from comments)` bullets) need REQ-1 … REQ-N, where
  REQ-k may be replaced or extended by sub-items REQ-ka, REQ-kb. There must be nothing above N, no duplicate ids,
  ids in ascending order, and every bullet must carry an id. **Wording is not compared**, because grooming may
  rewrite after the user agrees. That was the user's decision.
- **Loop 2**, `lib/validate-checklist.mjs`: `<KEY>-3-checklist.md` is checked against the sibling `<KEY>-2-requirements.md`.
  Every REQ needs exactly one `### REQ-<id>: <text>` heading with the exact text (whitespace and quote style may
  differ), in order, with no unknown headings. Every heading needs at least one check, numbered `REQ-<id>.1…n` with no
  gaps and under the matching heading.
- **Loop 3**, `lib/validate-test-cases.mjs` + reviewer `.claude/agents/expl1-test-cases-reviewer.md`:
  `<KEY>-4-test-cases.md` against the sibling `<KEY>-3-checklist.md`. Script: one `## REQ-<id>: <text>` section per
  checklist REQ (exact text, order), each with test cases or a `>` note (structural / needs clarification),
  `TC-REQ-<id>.1…n` numbering, a steps table per test case. Reviewer: every behavioral checklist check is covered with
  its data, conditions and exact values; no contradiction, no invented behavior, executable preconditions, verifiable
  expected results, no duplicates. Style, naming and technique are out of scope. Stage 4's skill is unchanged.
- **Loop 4**, `lib/validate-web-testing.mjs` + reviewer `.claude/agents/expl1-web-testing-reviewer.md`:
  `<KEY>-8-web-testing.md` against the sibling `<KEY>-4-test-cases.md`. **Every** test case must have exactly one
  `## Results` row with an executed status (PASS / FAIL / FAIL CONFIRMED / FAIL REJECTED / BLOCKED / OBSERVATION — the
  result does not matter; NOT RUN / NOT COMPLETED / empty fail). Reviewer: really run on the live app (not "covered by
  the code review", not partial, not incidental), FAIL/BLOCKED rows say what happened, the report names the app. This
  is why stage 8 now runs every test case whatever its code-review status (user decision).
- Shared parsing lives in `lib/expl1-markdown.mjs`. **Changing the output template of stage 1, 2, 3, 4 or 8 means
  changing this parser, the validators, the reviewer agent, the fixtures **and the evals (`evals/lib/md.ts`,
  `evals/lib/validators.ts`, `evals/<skill>/checks.ts`, `grader.md`, frozen `inputs/`, see "Evals")** together.**
- Feedback is `{"decision":"block","reason":…}`, shown next to the Write/Edit result. It is one note per problem with
  one fix each. The loop is bounded per (session, run folder, artifact): 3 blocks, then a final block asking for a
  `<REQUIREMENTS|CHECKLIST|TEST-CASES|WEB-TESTING> VALIDATION FAILED after 3 retries — <path>` reply, then silence.
  A PASS resets the count. A missing ground-truth sibling gives `UNVERIFIED`: a `systemMessage`, no block and no retry.
  The ground truth is never fabricated. A gate crash also gives a `systemMessage`, and every path exits 0.
- Status: `.workflow-artifacts/<KEY>/<KEY>-<stage>.validation.json` (`PASSED | RETRYING | FAILED | UNVERIFIED | PENDING`,
  plus `layer`, `checked_by`, `notes`, `review_ms`, `review_cost_usd`, `cached`). These are **hook-owned**: the
  orchestrator reads them in its handoff checks and never edits them. That file is the **latest** check only, and it is
  overwritten each time. **Every** check (PENDING, RETRYING, PASSED, FAILED, UNVERIFIED) also writes its own numbered,
  never-overwritten file `.workflow-artifacts/<KEY>/validations/<KEY>-<stage>.validation-<NNN>.json` (same fields plus
  `sequence`, `tool`, `session_id`); the latest file carries `sequence` and `history` pointing at it. Checks made before
  this change have no history file. Retry state and the log are in
  `.workflow-artifacts/.hook-state/` (`artifact-gate-<run>-<stem>.json`, `artifact-gate.log`).
- **Nested reviewer sessions** run with `EXPL1_REVIEW_CHILD=1`: `artifact-gate.mjs` and `agent-metrics.mjs` are no-ops
  inside them (no recursion, and the reviewer's Read calls must not be billed to — or overwrite the saved metrics of —
  the task it reviews). Its cost is in the `.validation.json` instead.
- Only files in `.workflow-artifacts/<folder>/` named `TASK-<id>-…` / `BUG-<id>-…` are checked. Dot-folders such as
  `.hook-state` and `.hook-test` are ignored.
- Offline tests: `npm run test:artifact-gate` (all four loops, **fake** reviewer `test/fake-claude.mjs`, which judges a
  file only by `<!-- fake-review: FAIL … -->` markers: free, deterministic, seconds) and `npm run test:artifact-gate:real`
  (loops 3–4 with the real reviewer subagents against labelled examples: real model calls, minutes, ~$2–3). Options:
  `--artifact <kind>[,<kind>]`, `--reviewer fake|real`, `--case <substr>`, `--verbose`, `--keep`. The runner plays the
  agent and pipes `PostToolUse` inputs into the real gate. Fixtures are in `.claude/hooks/test/fixtures/<artifact>/`:
  `_base/` is built from the real TASK-114 run (for loop 3 the real test cases with the fixes the real reviewer asked
  for; the original is the `tc6-real-114-stale` defect case), and each case folder holds a `case.json` with find/replace
  `edits` (or named `versions`), the expected outcome sequence (per reviewer mode when they differ) and asserts. Run
  folders are created under `.workflow-artifacts/gate-test-*` and deleted afterwards.

## Evals (stages 1–4, offline)

`evals/` (TypeScript on the Agent SDK; `npm run eval`, `eval:selftest`, `eval:typecheck`) checks that an edit to a stage
skill did not make the skill worse. The feedback loops above fix one live output; evals measure the skill, so the gate is
**off** during an eval (`EXPL1_REVIEW_CHILD=1` → `artifact-gate.mjs` / `agent-metrics.mjs` are no-ops). Full workflow,
rules and options: `evals/README.md`. Rules to keep when editing:

- One shared runner `evals/run-eval.ts`; per-skill folders hold only `cases.jsonl`, `inputs/`, `checks.ts` (deterministic,
  the hard gate), `grader.md` (LLM, warning only) and `baseline.json`. Criteria are ids, so failures are reported per
  criterion. Stage 4 reuses `expl1-test-cases-reviewer` through `reviewWithSubagent` as its judge.
- **The structure checks are independent of the feedback loops**: `evals/lib/md.ts` (parser) and `evals/lib/validators.ts`
  (`s2/s3/s4.validator`) import nothing from `.claude/hooks`, so a hook change cannot move a baseline. Only
  `evals/self-test/gate-parity.ts` imports the hook validators, to assert both agree on every fixture. A changed stage
  output template means changing both parsers; `npm run eval:selftest` fails when they disagree.
- Trials run in `.eval-runs/<skill>-<case>-<trial>/` (git-ignored) with Read of `evals/**`, `.workflow-artifacts/**`,
  `Execution_Examples/**` and the gate fixtures **denied** (`npm run eval -- --probe-leak` proves it) and Write/Edit allowed
  in `.eval-runs/` only. Stage 1 reads a stub tracker (`evals/lib/stub-tracker.ts`) serving the frozen `tracker.json`.
- Baselines (`<skill>/baseline.json`) are committed and move only with `--update-baseline --reason "…"`; down only with
  `--allow-decrease`. A regression is a case that passed and now fails (exit 1). Changing `cases.jsonl` or `inputs/`
  changes `cases_hash` and requires a re-baseline.
- `evals/self-test/` holds the known-bad fixtures: every deterministic check must have one, and the real gate-validated
  runs must pass. Run `npm run eval:selftest` (free) after any change to a check or to a stage output template.
- The runner drives the installed `claude` binary (`pathToClaudeCodeExecutable`; override `EVAL_CLAUDE_BIN`) because the
  CLI bundled in the SDK package can be too old for the pinned models.
- The evals never edit stage skills, validators or reviewer agents.

## External dependencies

- **Issue tracker**: a REST API read with `curl` (no auth), default `http://localhost:3000`, with an ngrok alternative. Tasks (`/tasks/<id>`) and bugs (`/bugs/<id>`) have **separate id spaces**, so the kind must always be known. Commands, retry flags and response shapes: `.claude/skills/expl1-1-task-context/references/issue-tracker.md`. Pre-flight health check is `curl -s --max-time 5 <BASE>/`; if it fails, stop and ask rather than work around it. Comments, attachments and linked items are not exposed by the tracker.
- **Browser (stage 8)**: `playwright-cli` only (see `.claude/skills/playwright-cli/`), never Playwright MCP or the Chrome extension. Always a **headed** browser in a **named session** `qa-<ISSUEKEY>` with `--persistent`, so the user can log in or intervene. The agent does not type credentials unless the user gives them in chat. Per-page navigation memory is in `.claude/skills/expl1-8-web-testing/navigation_paths.json`; app settings are in `references/login-config.md`.
- Stage 6/7 test the PR under review, which lives in another repo. A local clone sits in `.workflow-artifacts/clone/` (scratch).

## Editing skills

- `.claude/skills/` is the only folder Claude Code loads. `.claude/skills-archive/` holds retired versions (currently the Claude Desktop variant of stage 8) and is inert. To restore one, copy it into `skills/` under a non-clashing name.
- `.claude/skills-archive/testomat-skills/` is the imported `testomatio/skills` set. Five were promoted (moved out: `qa-thinking`, `qa-review-pr`, `qa-explain-behavior`, `qa-detect-useless-tests` (renamed from `detect-useless-tests`), `qa-data-seeder`); useful rules from `qa-write-test-cases`, `epic-requirement-reviewer`, `write-user-story`, `pull-request-diff-analyzer`, `wiki-from-code`, `detect-product-mismatches`, `qa-pr-requirements-analyzer`, `detect-duplicate-test-cases` and the three `explorbot-*` skills were merged into stages 2–7 and the explorbot flow (the archive copies stay). The rest are Testomat/TMS- or automation-tied and are not used. Do not import their `.test.md` format, ids, `.testeiya/` folder or "never generate IDs" rule: they conflict with `REQ-N` / `TC-REQ-N.N` and the artifact layout.
- Each stage's output format is defined by its `references/output-template.md`. Changes to a stage's output shape must be matched in the downstream skills that parse it (for example stage 8 reads the stage 6 results table and stage 7's "Retest in stage 8" section) and in the orchestrator's pipeline table and handoff checks. For stages 1–3, they must also be matched in the feedback-loop validators and fixtures (`.claude/hooks/lib/expl1-markdown.mjs`, `validate-*.mjs`, `.claude/hooks/test/fixtures/`). For stages 1–4, also in the evals (`evals/<skill>/checks.ts`, `grader.md`, `inputs/`, `evals/self-test/`).
- `setup-guide.md` in each stage records how to reconfigure that stage for another tracker or project. Stages 1 and 7 also keep `references/configure-blocks-original.md` with the original `⚠️ CONFIGURE` placeholder blocks.
- Skill text is written in English, with short chat messages and no invented data. Several skills have hard "do not" rules (do not reword requirements, do not invent test data, uncovered files never get FAIL). Preserve them when editing.

## Script and output conventions (from the user's global rules)

- Helper scripts (`playwright-cli run-code` files and so on) are written with the Write tool into a git-ignored folder in the repo, such as `.workflow-artifacts/<ISSUEKEY>/web-testing/`. Do not create them with heredocs or `sed`.
- Run each as one simple command: no `cd`, no `&&`/`;` chains, no env-var prefixes, and no paths outside the repo. Redirect output to a git-excluded scratch folder and read it with the Read tool.
- Delete scratch files you created when finished and confirm `git status --porcelain` shows nothing new. Never delete `.workflow-artifacts/<ISSUEKEY>/` itself.

## Git-ignored locally

`.workflow-artifacts/`, `.playwright-cli/`, `.claude/settings.local.json`, `TODO` (personal notes), and the usual Playwright output folders.
