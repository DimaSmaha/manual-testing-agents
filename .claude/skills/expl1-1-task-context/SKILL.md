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

> ⚠️ **CONFIGURE:** edit the trigger phrases in `description` (frontmatter above) —
> replace "pull the context from the tracker" and the other phrases with
> the ones your team uses.

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
1. Task URL or key in the tracker

> ⚠️ **CONFIGURE:** specify the task key format in your tracker.
> For example: `PROJ-1234` for Jira, `#1234` for GitHub Issues,
> `ENG-123` for Linear, etc.

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

> ⚠️ **CONFIGURE:** describe how the skill gets access to your tracker.
>
> Examples:
> - **Jira Cloud** → Atlassian MCP: use getJiraIssue
>   with a specific list of fields and responseContentFormat: "markdown"
> - **Linear** → Linear MCP: use the corresponding tools
> - **GitHub Issues** → gh CLI: `gh issue view <number> --json title,body,comments,labels`
> - **Azure DevOps** → the corresponding MCP or REST API
> - **No integration** → the user copies the task description into the chat manually
>
> Be sure to add a rule: if the integration is unavailable —
> stop and notify the user. Do not use workarounds
> (browser, web search) as a replacement.

### Efficient usage

> ⚠️ **CONFIGURE:** describe the optimal way to query your tracker.
> Goal: do not load full payloads, query
> only the required fields. Specify concrete commands or
> MCP tools for your tracker.

### Recommended flow

> ⚠️ **CONFIGURE:** describe the step-by-step flow for getting data
> from your tracker. For example:
> 1. Parse the URL → extract the task key
> 2. Get the task data with the required fields
> 3. If the first method failed — fallback
> 4. Linked tasks — read for context, but process
>    only the current task's data

## Task types and fields

> ⚠️ **CONFIGURE:** specify which task types are used
> in your project (for example: Story, Task, Bug, Epic, Subtask)
> and how to determine the type from the tracker response.

1. Determine the task type from the tracker response.
2. Load the field map for that type from references/field-maps.md.
3. Read only the fields listed in the map. Ignore other fields.
4. Do not reopen the field maps every time —
   they are fixed for your project.

## Empty fields

The required field for processing is the task description
(per references/field-maps.md).

> ⚠️ **CONFIGURE:** specify which field is required for each
> task type. For example:
> - Story/Task: description
> - Bug: steps to reproduce or bug description

If the required field is empty or missing — stop
and tell the user there is nothing to process and that a description
must be added to the ticket.

All other fields are optional. Collect everything that is filled in,
skip empty ones. The full list of fields for each task type
is in references/field-maps.md.

## Attachments

> ⚠️ **CONFIGURE:** describe how your tracker/MCP provides attachments.
> Some MCPs return only metadata (name, type, size)
> without the file itself — in that case you need to ask the user to
> upload the files to the chat. Some give direct access to files.

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

Create the file <ISSUEKEY>-context.md in the working directory
and hand it to the user for download.

The file stays in the working directory — the next skill
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
