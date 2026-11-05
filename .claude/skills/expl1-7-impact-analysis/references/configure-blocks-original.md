# Original `⚠️ CONFIGURE` blocks (archive)

> **Archive only.** These are the placeholder (mock) instructions that were in
> `SKILL.md` and `references/output-template.md` before the stage was implemented.
> They are kept verbatim so the original template can be consulted or reused.
> Not a rule for the pipeline; do not load this file during a run.
> Also in git history (last placeholder version: commit `9f698d9`; created in `ee1f296`).

---

## SKILL.md — frontmatter description (placeholder)

```
description: >
  Seventh stage of task processing. PLACEHOLDER (mock) — the detailed
  instructions will be provided later. Intended to analyze which areas of
  the product are impacted by the task's changes, based on the artifacts of the previous
  stages. Use when the user says "impact analysis",
  "what is affected by the change", or after the code review is finished.
```

## SKILL.md — placeholder notice and mandatory stop message

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

## SKILL.md — Input

> ⚠️ **CONFIGURE:** specify the input artifacts. Likely candidates
> (to be confirmed): `<ISSUEKEY>-2-requirements.md`,
> `<ISSUEKEY>-5-pr-summary.md`, `<ISSUEKEY>-6-code-review.md`.

## SKILL.md — Rules

Conventions shared by all skills in the chain (kept in the implemented skill):

- All communication and all output file content — in English.
- Chat messages are short.
- All input files are read-only. Do not change, rewrite, or clean up their content.
- Do not invent data that is absent from the input artifacts.
- After saving the file — stop. Do not continue into the next stage.

> ⚠️ **CONFIGURE:** add the rules specific to impact analysis.

## SKILL.md — Method

> ⚠️ **CONFIGURE:** describe the impact analysis method: what is
> analyzed, which sources are used, how impacted areas are determined
> and classified.

## SKILL.md — Final response

> ⚠️ **CONFIGURE:** specify what to report after saving the file.
> At minimum: the path to the saved file.

---

## references/output-template.md — placeholder template

```
# <ISSUEKEY> - Impact analysis

> ⚠️ **CONFIGURE:** placeholder template. The final structure will be defined later.

Inputs: <paths to the input files>
Generated: <YYYY-MM-DD>

## Impacted areas

- <impacted area>: <what is affected and why>
```
