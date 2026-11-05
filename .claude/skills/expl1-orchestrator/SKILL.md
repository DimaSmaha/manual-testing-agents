---
name: expl1-orchestrator
description: >
  Orchestrator of the QA pipeline for one task. Runs the stage skills
  expl1-1-task-context → expl1-2-requirements-grooming → expl1-3-qa-checklist →
  expl1-4-qa-test-cases → expl1-5-pr-summary → expl1-6-code-review →
  expl1-7-impact-analysis → expl1-8-web-testing in order, checks the handoff files
  between stages, and reports progress. Use when the user says "run the QA
  pipeline", "process the ticket end to end", "start the QA workflow for <KEY>",
  "run all QA stages", or "continue the QA pipeline".
---

# QA Pipeline Orchestrator

> ⚙️ Recommended settings: **Sonnet · Effort: Medium · Extended thinking: Off**
> (each stage skill states its own recommended settings — see the pipeline table).

Drives the QA skills chain for one task, stage by stage. The orchestrator
does not do the stage work itself: it launches each stage skill with the Skill tool
in the same chat, so the artifact files in the working directory are picked up
by the next stage automatically.

## Pipeline

| # | Skill | Input | Output | Recommended settings |
|---|-------|-------|--------|----------------------|
| 1 | `expl1-1-task-context` | task URL or key | `<ISSUEKEY>-context.md` | Sonnet · Medium · Thinking Off |
| 2 | `expl1-2-requirements-grooming` | `<ISSUEKEY>-context.md` | `<ISSUEKEY>-requirements.md` | Opus · High · Thinking On |
| 3 | `expl1-3-qa-checklist` | `<ISSUEKEY>-requirements.md` | `<ISSUEKEY>-checklist.md` | Sonnet · Medium · Thinking Off |
| 4 | `expl1-4-qa-test-cases` | `<ISSUEKEY>-checklist.md` | `<ISSUEKEY>-test-cases.md` | Sonnet · High · Thinking Off |
| 5 | `expl1-5-pr-summary` | PR URL or branch | `<ISSUEKEY>-pr-summary.md` | Sonnet · Medium · Thinking Off |
| 6 | `expl1-6-code-review` | `<ISSUEKEY>-test-cases.md`, `<ISSUEKEY>-pr-summary.md`, PR URL or branch | `<ISSUEKEY>-code-review.md` | Opus · High · Thinking On |
| 7 | `expl1-7-impact-analysis` | to be defined (placeholder skill) | `<ISSUEKEY>-impact-analysis.md` | to be defined |
| 8 | `expl1-8-web-testing` | `<ISSUEKEY>-code-review.md`, `<ISSUEKEY>-test-cases.md` (optional: `<ISSUEKEY>-checklist.md`) | `<ISSUEKEY>-web-testing.md` | Sonnet · High · Thinking Off |

Stage artifacts use the same `<ISSUEKEY>` throughout. Requirement IDs (`REQ-N`) are
assigned at stage 2 and stay the same through all following stages.

## Input

Collect from the user before starting (ask only for what is missing):
1. The task URL or key (needed for stage 1; also gives `<ISSUEKEY>` for all file names).
2. The PR URL or branch name (needed for stages 5 and 6).
3. Which stages to run. Default: all, in order. The user may also ask to start from
   a given stage (for example "continue from stage 4") or to run a single stage.

## Rules

- All communication — in English. Chat messages are short.
- Run **one stage at a time**. Stage skills ask the user questions (settings confirmation
  in stage 1, grooming questions in stage 2, clarifications in stages 3–4) and each one
  stops after saving its file. Never answer a stage skill's questions on the user's behalf.
- After each stage report: the stage name, the output file path, and the stage's
  final summary (counters). Then ask the user whether to continue to the next stage,
  rerun this one, skip it, or stop. Do not start the next stage without the user's go-ahead.
- Do not do the work of a stage yourself and do not edit any artifact file.
  Artifacts are produced only by the stage skills.
- Do not change the order of stages. Rerunning a stage overwrites its artifact
  (each stage skill does this itself); tell the user that stages after it may need a rerun
  if its output changed.
- If a stage skill stops with a blocker (missing integration, missing input, unconfigured
  `⚠️ CONFIGURE` block) — show the blocker to the user and wait. Do not work around it.

## Handoff checks before each stage

Before launching a stage, check that its required input files exist in the working
directory and are not empty:

- Stage 2 needs `<ISSUEKEY>-context.md`.
- Stage 3 needs `<ISSUEKEY>-requirements.md`.
- Stage 4 needs `<ISSUEKEY>-checklist.md`.
- Stage 5 needs the PR URL or branch name.
- Stage 6 needs `<ISSUEKEY>-test-cases.md` and the PR URL or branch name
  (`<ISSUEKEY>-pr-summary.md` is recommended but the skill can work without it).
- Stage 8 needs `<ISSUEKEY>-code-review.md` and `<ISSUEKEY>-test-cases.md`.

If a required file is missing, tell the user which stage produces it and offer to run
that stage first. If the chat is new, the user can upload the files instead.

## Conditional stages

- **Stages 5–6 (PR):** if the task has no PR or branch yet, offer to stop after stage 4.
  Stage 8 cannot run without `<ISSUEKEY>-code-review.md`.
- **Stage 7 (impact analysis):** currently a placeholder. Offer to skip it; run it only
  if the user confirms the skill has been configured.
- **Stage 8 (web testing):** if `<ISSUEKEY>-code-review.md` has no test cases with
  status `QA` or `FAIL`, the stage has nothing to do — say so and skip it.

## Settings and context hygiene

- Before each stage, mention the recommended model/effort/thinking from the pipeline
  table if they differ from the previous stage, so the user can switch them.
  Stage 1 additionally requires the user's explicit confirmation of its settings.
- After stage 4, recommend continuing with stages 5 and onward in a new chat with the
  `test-cases` and `checklist` files (as the `expl1-4-qa-test-cases` skill recommends).
  If the user continues in a new chat, they upload the needed artifact files there,
  and the orchestrator resumes from the stage they name.

## Final report

When the user stops or the pipeline completes, give a short table: each stage as
run / skipped / not run, its output file path, and its key counters:

| Stage | Status | Output | Key result |
|-------|--------|--------|------------|
| 1 expl1-1-task-context | run | `<ISSUEKEY>-context.md` | — |
| 2 expl1-2-requirements-grooming | run | `<ISSUEKEY>-requirements.md` | N requirements |
| 3 expl1-3-qa-checklist | run | `<ISSUEKEY>-checklist.md` | N checks |
| 4 expl1-4-qa-test-cases | run | `<ISSUEKEY>-test-cases.md` | N test cases, N requirements covered |
| 5 expl1-5-pr-summary | run | `<ISSUEKEY>-pr-summary.md` | N changed files |
| 6 expl1-6-code-review | run | `<ISSUEKEY>-code-review.md` | PASS / FAIL / QA / N/A counters |
| 7 expl1-7-impact-analysis | skipped | — | placeholder |
| 8 expl1-8-web-testing | run | `<ISSUEKEY>-web-testing.md` | counters + verdict |

(The table above is an example — report the real values.)
