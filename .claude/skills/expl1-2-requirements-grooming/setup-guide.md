# Setup guide for the Requirements Grooming skill

This skill analyzes the requirements from the context file and produces
a numbered list of requirements for the following skills in the chain.
The grooming logic is universal — setup is minimal.

## What needs to be configured

### 1. Name of the context-collection skill

This skill expects a context file from the previous skill
in the chain. By default it is called "expl1-1-task-context".

If the context-collection skill in your chain has a different name —
replace "expl1-1-task-context" with the correct one in two places:
- `description` in the frontmatter (the line with "Takes the context file
  created by the expl1-1-task-context skill")
- the "Input" section in the body of SKILL.md

### 2. Communication language (optional)

By default the skill communicates in English.
If another language is needed — find the "Rules" section in SKILL.md
and replace the line:
```
- All communication and all output file content — in English.
```
with your language.

## What does NOT need to be configured

The grooming method (4 questions), the REQ-N numbering rules,
the chat output format, the rules on what not to generate —
this is universal logic, do not touch it.

## Setup order

1. In the `SKILL.md` frontmatter: replace "expl1-1-task-context" with the name of
   your context-collection skill.
2. In the `SKILL.md` "Input" section: replace "expl1-1-task-context"
   with the same name.
3. Optionally: change the communication language.

## Check after setup

- [ ] The name of the context-collection skill is correct
      in both places
- [ ] The `⚠️ CONFIGURE` blocks in SKILL.md are resolved

## Skill files

```
expl1-2-requirements-grooming/
  SKILL.md                         — skill instructions
  references/
    output-template.md             — output file template
  setup-guide.md                   — this guide
```
