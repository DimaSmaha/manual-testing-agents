---
name: expl1-1-task-context
description: >
  First stage of task processing. Collects task data from the tracker,
  cross-references information from all fields (description, comments,
  attachments, acceptance criteria, etc.), and produces a single enriched
  Markdown context — the source of truth for the following skills.
  Use when the user provides a task URL or key and wants processed
  context, or says "pull the context from the tracker", "prepare the task
  context", "process the ticket".
---

# Task Context

> ⚙️ Recommended settings: **Sonnet · Effort: Medium · Extended thinking: Off**

**MANDATORY before starting work** — show the user
the message below and stop. Do not perform any actions until
the user confirms:

⚙️ Switch the settings for this skill:
- **Model:** Sonnet
- **Effort:** Medium
- **Extended thinking:** Off

Confirm when ready.

Collects task data from the tracker, cross-references information
from all fields, and produces a single enriched Markdown context — the source of truth
for the following skills in the chain.

## Input

Required from the user:
1. Task or bug URL or key in the tracker

Keys: `TASK-<id>` for tasks, `BUG-<id>` for bugs (bugs are read for retesting).
URL forms: `<BASE>/tasks/<id>`, `<BASE>/bugs/<id>`; extract the kind, the id, and the
base URL from it. Tasks and bugs have separate id spaces — if a bare number has no
kind, ask the user. `<ISSUEKEY>` in all file names = the key (`TASK-112`, `BUG-114`).
Details: `references/issue-tracker.md`.

## Rules

- All communication with the user and all handoff content — in English.
- Chat messages are short. Do not paste raw tracker responses.
- Do not clarify or groom requirements. This skill only collects
  and structures data from the tracker as is. The output file is the source of truth
  for all following skills in the chain.
- Ask the user only about operational blockers: unavailable
  attachments, write errors.
- Concise bullets, no filler.

## Tracker access

The tracker is a REST API (HTTP, no auth), read with `curl`.
All commands, the base URL, response shapes, and error handling are in
`references/issue-tracker.md` — follow it exactly.

If the tracker is unreachable (health check fails) — stop and tell the user.
Do not use workarounds (browser, web search, guessing the content) as a replacement.

### Efficient usage

An item record is small: one request per item is enough. Save the response to
`.workflow-artifacts/<ISSUEKEY>/tracker/<ISSUEKEY>.json` and read it with the Read tool.
Always use the retry flags from the reference file.

### Recommended flow

1. Parse the input → extract the kind (task/bug), the id, and the base URL if a URL was given.
2. Run the health check from the reference file.
3. Read the item (`GET /tasks/<id>` or `GET /bugs/<id>`) with retries.
4. 404 → tell the user the item does not exist and stop. Persistent 5xx or empty
   response → report the blocker and stop.
5. Comments, attachments, and linked items are not available from the tracker — skip those steps.

## Task types and fields

Item types in this project: `story` (from `/tasks`) and `bug` (from `/bugs`).
The kind is determined by the endpoint the item was read from.

1. Determine the item kind (task or bug).
2. Load the field map for that type from references/field-maps.md.
3. Read only the fields listed in the map. Ignore other fields.
4. Do not reopen the field maps every time —
   they are fixed for your project.

## Empty fields

The required field for processing is the task description
(per references/field-maps.md).

- story: description
- bug: description (bug description)

If the required field is empty or missing — stop
and tell the user there is nothing to process and that a description
must be added to the ticket.

## Bugs (retest)

A bug is processed the same way as a story, with these rules:
- Header: `Type: bug`, plus a `Severity: <value>` line (from the `severity` field).
- The bug description goes into the Requirements section as-is, as the problem
  to be verified as fixed. Do not invent steps to reproduce, expected results,
  or a fix — only what is in the bug record.
- Goal: retest of the bug (verify the described problem no longer occurs).

All other fields are optional. Collect everything that is filled in,
skip empty ones. The full list of fields for each task type
is in references/field-maps.md.

## Attachments

The tracker provides no attachments, so for now this section does not apply:
do not ask the user for uploads and do not create an Attachments section. If the
user attaches files to the chat on their own (screenshots, md, PDF), use the flow below.

Flow:
1. Collect the list of attachments from the task metadata.
2. Determine which ones are supported for processing:
   - images: png, jpg, jpeg, gif, webp
   - markdown: md, markdown
   - PDF: pdf
3. If there are supported attachments — ask the user to
   upload them to the chat for processing.
4. After receiving the files — extract the information from them
   and add it to the corresponding sections of the context.
5. Video (mp4, mov, webm, avi, mkv) — Claude cannot
   view it. Record it in the context as present
   but not processed.
6. If the user skips the upload — record the
   attachments in the context as present but not processed.

## Collecting and cross-referencing data

This step is performed after all data has been received:
task fields, comments, and attachments from the user.

Cross-reference the data and build a single enriched context.

Principle:
- Go through all filled-in task fields.
- Compare data between fields: comments may supplement
  the description, attachments may detail the steps, acceptance
  criteria may clarify requirements from the description.
- If one field has a detail that another doesn't —
  add it to the corresponding context section.
- If attachments (screenshots, mockups, md files) give
  specifics that extend the description — integrate that information.
- Result: one file where everything is collected, deduplicated,
  and arranged into sections. Not scattered data from fields,
  but a complete picture of the task.

Handling comments:
- Comments are the same kind of data source as the description
  or acceptance criteria.
- If a comment supplements or clarifies an existing requirement —
  integrate it into the Requirements section.
- If a comment describes a problem that is absent from the requirements —
  add it as an additional requirement in the section
  "Additional requirements (from comments)" under the main requirements.
- Ignore everything else (bugs against existing requirements, testing
  statuses, process discussions).

Prohibitions — violating any of them makes the handoff unusable:
- Do not change the essence, wording, or meaning of requirements.
- Do not change validation rules, validation messages,
  or validation trigger conditions.
- Do not simplify or generalize specific values: numbers,
  limits, ranges, sizes, thresholds, units of measurement.
- Do not replace exact names, labels, copy, statuses, states,
  roles, or permissions with generic wording.
- Do not omit before/after values in changes — keep
  both sides.
- Do not invent, draw logical conclusions, or add
  information that is absent from every task field.
- Do not merge different requirements into one if they are
  described separately in the tracker.
- Do not change conditional logic: keep all condition
  branches (if/then/else) as they are in the tracker.
- Do not break links between requirements: if one
  requirement depends on another (field on state, action on condition,
  rule on role) — keep that link in one place.

## Verification before saving

Before saving the file, go through every filled-in field
from the list in references/field-maps.md and check:

- Did every fact, requirement, and detail from this field
  make it into the corresponding context section?
- Was anything skipped because it seemed familiar, repetitive,
  or unimportant?

If missed information is found — add it
to the corresponding section before saving.

## Output file

Create the file `.workflow-artifacts/<ISSUEKEY>/<ISSUEKEY>-context.md`
(the per-task artifacts folder; create the folder if it does not exist)
and tell the user the path.

The file stays in `.workflow-artifacts/<ISSUEKEY>/` — the next skill
in the same chat picks it up automatically.

If the file already exists — delete it completely and create a new one.
The output is always a single file with the result of the latest run.
Do not merge with the previous version, do not append, do not keep
data from the previous record.

Before finishing, check:
- One top-level heading
- One coherent handoff without duplicate sections
- All prohibitions from "Collecting and cross-referencing data" are observed
- Do not create sections that are not in references/output-template.md
- Do not include estimation, story points, sprint, assignee,
  work dates, or other project-management data

The file structure template is in references/output-template.md.

## Final response

After saving the file, report:
- The path to the saved file
- If anything was skipped (the user skipped attachments,
  a field was unavailable) — briefly remind what exactly
  did not make it into the context.
