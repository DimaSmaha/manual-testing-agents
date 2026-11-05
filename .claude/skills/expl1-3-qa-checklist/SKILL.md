---
name: expl1-3-qa-checklist
description: >
  Third stage of task processing. Takes the requirements file created by the
  expl1-2-requirements-grooming skill, decomposes each requirement into atomic
  checks, and produces a reference QA checklist — input for
  test cases and for manual testing.
  Use when the user says "build a checklist",
  "make a checklist", "checklist of checks", or after the
  requirements grooming is finished.
---

# QA Checklist

> ⚙️ Recommended settings: **Sonnet · Effort: Medium · Extended thinking: Off**

Decomposes the numbered requirements into atomic checks
and produces a reference QA checklist — input for test cases
and for manual testing.

## Input

Input — the file `<ISSUEKEY>-requirements.md` created by the
expl1-2-requirements-grooming skill. In the same chat the file is available in the working
directory automatically. If the chat is new — the user
uploads the file to the chat.

Data sources for this skill:
- the requirements file — the only source of requirements.
- the user's answers to questions before generating the checklist.

First read the requirements file in full. If anything
in the requirements is unclear or ambiguous for building
checks — ask the user before generation starts.
Do not start generation while there are unresolved questions.

Do not go to the tracker, do not use external tools,
do not search the internet, do not inspect code.

The requirements file is read-only.
Do not change, rewrite, or clean up its content.

If the requirements file is missing, empty, or corrupted —
stop and tell the user that the expl1-2-requirements-grooming skill must
be run first.

## Rules

- All communication and all output file content — in English.
- Chat messages are short.
- The checklist is built only from what is in the requirements file.
  Do not invent, supplement, or interpret requirements on your own.
  Do not invent routes, selectors, roles, states, data, or expected
  behavior that are absent from the requirements.
- Do not change the meaning and wording of requirements. The skill decomposes
  requirements into checks, but does not rewrite or improve
  the requirements themselves.
- If a requirement was left unchanged after grooming
  (the user skipped the question in expl1-2-requirements-grooming) — build the checklist
  on what is there. Do not skip such a requirement and do not mark
  it as incomplete. The requirements file is final.
- Do not add generic QA advice that is not tied
  to a specific requirement of the task.
- After saving the file — stop. Do not continue
  into code review, test cases, or planning.

## Numbering

Checklist items inherit the requirement IDs from the requirements file.

The order of requirements in the checklist must match the order of requirements
in the requirements file. Do not change, reorder,
or group the requirements differently from how they appear in the file.

One requirement can produce several checks. Each check
gets a sub-number after a dot: REQ-3.1, REQ-3.2, REQ-3.3.

The main REQ-* number does not change — it is the same
as in the requirements file and onward in the code review.

Sub-item numbering is sequential, with no gaps,
in the order the checks appear in the checklist.

If a requirement already has sub-items (REQ-5a, REQ-5b) —
each sub-item is numbered separately: REQ-5a.1, REQ-5a.2,
REQ-5b.1, REQ-5b.2.

## Checklist building method

The rules for quality, decomposition, wording, check types,
filtering out unnecessary checks, base sets for typical elements,
and anti-patterns are in references/checklist-design-rules.md.

Read this file before starting to generate the checklist.

## Verification before saving

After generating the checklist and before saving the file:

1. Run the checklist through the filter for unnecessary checks.
2. Go through the checklist and verify:

- Every requirement from the requirements file has at least one
  check in the checklist. If a requirement has no checks —
  add some or explain why it is not possible.
- There are no checklist items without a REQ-ID.
- The order of requirements in the checklist matches the order
  in the requirements file.
- There is no duplication: the same check
  does not appear twice.
- Elements of the same type have the same base set
  of checks.
- Each item is atomic: one check, one pass/fail.
- Each item is self-contained: understandable without opening
  the requirements file.
- There are no checks for behavior that is absent from the requirements.

If a problem is found — fix it before saving.

## Output file

Create the file <ISSUEKEY>-checklist.md in the working directory
and hand it to the user for download.

The file stays in the working directory — the next skill
in the same chat picks it up automatically.

If the file already exists — delete it completely and create a new one.
The output is always a single file with the result of the latest run.
Do not merge with the previous version, do not append, do not keep
data from the previous record.

Before finishing, check:
- One top-level heading
- One coherent checklist without duplicate sections

The file structure template is in references/output-template.md.
An example of the level of detail is in references/checklist-example.md.

## Final response

After saving the file, report:
- The path to the saved file
- The number of checklist items
