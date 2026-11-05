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
in the same chat, so the artifact files in `.workflow-artifacts/<ISSUEKEY>/` are picked up
by the next stage automatically.

## Pipeline

| # | Skill | Input | Output | Recommended settings |
|---|-------|-------|--------|----------------------|
| 1 | `expl1-1-task-context` | task URL or key | `<ISSUEKEY>-1-context.md` | Sonnet · Medium · Thinking Off |
| 2 | `expl1-2-requirements-grooming` | `<ISSUEKEY>-1-context.md` | `<ISSUEKEY>-2-requirements.md` | Opus · High · Thinking On |
| 3 | `expl1-3-qa-checklist` | `<ISSUEKEY>-2-requirements.md` | `<ISSUEKEY>-3-checklist.md` | Sonnet · Medium · Thinking Off |
| 4 | `expl1-4-qa-test-cases` | `<ISSUEKEY>-3-checklist.md` | `<ISSUEKEY>-4-test-cases.md` | Sonnet · High · Thinking Off |
| 5 | `expl1-5-pr-summary` | PR URL or branch | `<ISSUEKEY>-5-pr-summary.md` | Sonnet · Medium · Thinking Off |
| 6 | `expl1-6-code-review` | `<ISSUEKEY>-4-test-cases.md`, `<ISSUEKEY>-5-pr-summary.md`, PR URL or branch | `<ISSUEKEY>-6-code-review.md` | Opus · High · Thinking On |
| 7 | `expl1-7-impact-analysis` | to be defined (placeholder skill) | `<ISSUEKEY>-7-impact-analysis.md` | to be defined |
| 8 | `expl1-8-web-testing` | `<ISSUEKEY>-6-code-review.md`, `<ISSUEKEY>-4-test-cases.md` (optional: `<ISSUEKEY>-3-checklist.md`) | `<ISSUEKEY>-8-web-testing.md` | Sonnet · High · Thinking Off |

Stage artifacts are named `<ISSUEKEY>-<stage number>-<name>.md` (the stage number keeps the
files in pipeline order in the folder) and use the same `<ISSUEKEY>` throughout. Requirement IDs (`REQ-N`) are
assigned at stage 2 and stay the same through all following stages.

## Input

Collect from the user before starting (ask only for what is missing):
1. The task or bug URL or key (needed for stage 1; also gives `<ISSUEKEY>` for all file names).
   Keys: `TASK-<id>` (story) or `BUG-<id>` (bug, for retesting); `<ISSUEKEY>` = the key
   (for example `TASK-112-1-context.md`, `BUG-114-1-context.md`). A URL has the form
   `<BASE>/tasks/<id>` or `<BASE>/bugs/<id>`; the default `<BASE>` is `http://localhost:3000`.
   Tasks and bugs have separate id spaces — if the kind is unclear, ask.
   Details: `.claude/skills/expl1-1-task-context/references/issue-tracker.md`.
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

## Pre-flight (once per pipeline run, before stage 1)

Check that the issue tracker is reachable (one simple command, no `cd`/`&&`):

```
curl -s --max-time 5 <BASE>/
```

A non-empty response means it is up. If the output is empty or the command fails —
tell the user the tracker is not reachable (and ask for the correct base URL if needed)
and wait. Do not work around it. Skip the pre-flight when resuming from stage 2 or later.

Locations: stage artifacts (`<ISSUEKEY>-*.md`) go to the per-task folder
`.workflow-artifacts/<ISSUEKEY>/` (git-ignored) and are kept after the run;
the raw tracker response is saved in `.workflow-artifacts/<ISSUEKEY>/tracker/` and is kept
with the task folder. Other scratch files (helper scripts and their output) go to the other
subfolders of `.workflow-artifacts/` and are deleted when the run is finished.
Never delete the `.workflow-artifacts/<ISSUEKEY>/` folder.

## Handoff checks before each stage

Before launching a stage, check that its required input files exist in
`.workflow-artifacts/<ISSUEKEY>/` and are not empty:

- Stage 2 needs `<ISSUEKEY>-1-context.md`.
- Stage 3 needs `<ISSUEKEY>-2-requirements.md`.
- Stage 4 needs `<ISSUEKEY>-3-checklist.md`.
- Stage 5 needs the PR URL or branch name.
- Stage 6 needs `<ISSUEKEY>-4-test-cases.md` and the PR URL or branch name
  (`<ISSUEKEY>-5-pr-summary.md` is recommended but the skill can work without it).
- Stage 8 needs `<ISSUEKEY>-6-code-review.md` and `<ISSUEKEY>-4-test-cases.md`.

If a required file is missing, tell the user which stage produces it and offer to run
that stage first. If the chat is new, the user can upload the files instead.

## Conditional stages

- **Stages 5–6 (PR):** if the task has no PR or branch yet, offer to stop after stage 4.
  Stage 8 cannot run without `<ISSUEKEY>-6-code-review.md`.
- **Stage 7 (impact analysis):** currently a placeholder. Offer to skip it; run it only
  if the user confirms the skill has been configured.
- **Stage 8 (web testing):** if `<ISSUEKEY>-6-code-review.md` has no test cases with
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
| 1 expl1-1-task-context | run | `<ISSUEKEY>-1-context.md` | — |
| 2 expl1-2-requirements-grooming | run | `<ISSUEKEY>-2-requirements.md` | N requirements |
| 3 expl1-3-qa-checklist | run | `<ISSUEKEY>-3-checklist.md` | N checks |
| 4 expl1-4-qa-test-cases | run | `<ISSUEKEY>-4-test-cases.md` | N test cases, N requirements covered |
| 5 expl1-5-pr-summary | run | `<ISSUEKEY>-5-pr-summary.md` | N changed files |
| 6 expl1-6-code-review | run | `<ISSUEKEY>-6-code-review.md` | PASS / FAIL / QA / N/A counters |
| 7 expl1-7-impact-analysis | skipped | — | placeholder |
| 8 expl1-8-web-testing | run | `<ISSUEKEY>-8-web-testing.md` | counters + verdict |

(The table above is an example — report the real values.)
