# Setup guide for the QA Checklist skill

This skill is almost entirely universal — it works with any
tracker and product without changes. The checklist building method,
numbering rules, check types, and anti-patterns are based
on ISTQB and do not depend on the environment.

## What needs to be configured

### 1. Communication language (optional)

By default the skill communicates in English.
If another language is needed — in the "Rules" section of SKILL.md
replace the line:
```
- All communication and all output file content — in English.
```
with your language.

### 2. Reference to the previous skill (optional)

If the requirements-grooming skill in your chain has a different
name than "expl1-2-requirements-grooming" — replace this reference
in the "Input" section of SKILL.md.

## What does NOT need to be configured

- `references/checklist-design-rules.md` — ISTQB rules,
  fully universal, do not touch
- `references/checklist-example.md` — example of the level of detail,
  do not touch
- `references/output-template.md` — file structure template,
  do not touch
- The REQ-N.M numbering method, verification, filtering rules —
  do not touch

## Check after setup

- [ ] If the language was changed — check that it is changed everywhere
- [ ] If the name of the previous skill was changed —
      check that it is changed in the "Input" section

## Skill files

```
expl1-3-qa-checklist/
  SKILL.md                              — skill instructions
  references/
    checklist-design-rules.md          — building rules (ISTQB)
    checklist-example.md               — example of the level of detail
    output-template.md                 — output file template
  setup-guide.md                       — this guide
```
