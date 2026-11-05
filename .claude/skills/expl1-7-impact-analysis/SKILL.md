---
name: expl1-7-impact-analysis
description: >
  Seventh stage of task processing. PLACEHOLDER (mock) — the detailed
  instructions will be provided later. Intended to analyze which areas of
  the product are impacted by the task's changes, based on the artifacts of the previous
  stages. Use when the user says "impact analysis",
  "what is affected by the change", or after the code review is finished.
---

# Impact Analysis

> ⚠️ **CONFIGURE:** this skill is a placeholder (mock). The detailed
> instructions will be provided by the user later. Until then, do not
> perform any analysis.

> ⚠️ **CONFIGURE:** recommended settings: **<model · effort · extended thinking — to be defined>**

**MANDATORY at the start** — tell the user:

"The `expl1-7-impact-analysis` skill is a placeholder and has not been configured yet.
No analysis was performed. Fill in the sections marked ⚠️ CONFIGURE in
`.claude/skills/expl1-7-impact-analysis/SKILL.md` or skip this stage."

Then stop. Do not create the output file, do not invent the analysis.

> Remove the block above after the skill is configured.

## Input

> ⚠️ **CONFIGURE:** specify the input artifacts. Likely candidates
> (to be confirmed): `<ISSUEKEY>-requirements.md`,
> `<ISSUEKEY>-pr-summary.md`, `<ISSUEKEY>-code-review.md`.

## Rules

Conventions shared by all skills in the chain (keep when configuring):

- All communication and all output file content — in English.
- Chat messages are short.
- All input files are read-only. Do not change, rewrite, or clean up their content.
- Do not invent data that is absent from the input artifacts.
- After saving the file — stop. Do not continue into the next stage.

> ⚠️ **CONFIGURE:** add the rules specific to impact analysis.

## Method

> ⚠️ **CONFIGURE:** describe the impact analysis method: what is
> analyzed, which sources are used, how impacted areas are determined
> and classified.

## Output file

Create the file `<ISSUEKEY>-impact-analysis.md` in the working
directory and hand it to the user for download.

The file stays in the working directory.

If the file already exists — delete it completely and create a new one.
The output is always a single file with the result of the latest run.

The file structure template is in references/output-template.md.

## Final response

> ⚠️ **CONFIGURE:** specify what to report after saving the file.
> At minimum: the path to the saved file.
