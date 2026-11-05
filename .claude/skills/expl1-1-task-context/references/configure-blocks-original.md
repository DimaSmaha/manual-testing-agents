# Original `⚠️ CONFIGURE` blocks (archive)

> **Archive only.** These are the template instructions that were in
> `SKILL.md` and `references/field-maps.md` before they were replaced with the
> issue-tracker configuration. They are kept verbatim so they can be reused when
> switching to another tracker (Jira, Linear, GitHub Issues, ...). Not a rule for the
> pipeline; do not load this file during a run. Also in git history (commit `ee1f296`).

---

## SKILL.md — trigger phrases (after the `# Task Context` heading)

> ⚠️ **CONFIGURE:** edit the trigger phrases in `description` (frontmatter above) —
> replace "pull the context from the tracker" and the other phrases with
> the ones your team uses.

## SKILL.md — Input

> ⚠️ **CONFIGURE:** specify the task key format in your tracker.
> For example: `PROJ-1234` for Jira, `#1234` for GitHub Issues,
> `ENG-123` for Linear, etc.

## SKILL.md — Tracker access

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

## SKILL.md — Tracker access / Efficient usage

> ⚠️ **CONFIGURE:** describe the optimal way to query your tracker.
> Goal: do not load full payloads, query
> only the required fields. Specify concrete commands or
> MCP tools for your tracker.

## SKILL.md — Tracker access / Recommended flow

> ⚠️ **CONFIGURE:** describe the step-by-step flow for getting data
> from your tracker. For example:
> 1. Parse the URL → extract the task key
> 2. Get the task data with the required fields
> 3. If the first method failed — fallback
> 4. Linked tasks — read for context, but process
>    only the current task's data

## SKILL.md — Task types and fields

> ⚠️ **CONFIGURE:** specify which task types are used
> in your project (for example: Story, Task, Bug, Epic, Subtask)
> and how to determine the type from the tracker response.

## SKILL.md — Empty fields

> ⚠️ **CONFIGURE:** specify which field is required for each
> task type. For example:
> - Story/Task: description
> - Bug: steps to reproduce or bug description

## SKILL.md — Attachments

> ⚠️ **CONFIGURE:** describe how your tracker/MCP provides attachments.
> Some MCPs return only metadata (name, type, size)
> without the file itself — in that case you need to ask the user to
> upload the files to the chat. Some give direct access to files.

---

## references/field-maps.md — header and template

> ⚠️ **CONFIGURE:** this is the field map of your project in the tracker.
> For each task type, specify which fields to read.
>
> How to fill it in:
> 1. Determine which task types exist in your project
> 2. For each type, build a table of fields
> 3. "Meaning" — what the field means in plain language
> 4. "Field key" — the technical key in your tracker
>    (for Jira it is customfield_XXXXX, for Linear — the field name in the API,
>    for GitHub — a field from the JSON response)
> 5. "Required" — if the field is empty, the skill stops
>    and asks for it to be filled in. At minimum, the field with the task
>    description must be required.
>
> Below is a template. Replace it with your own types and fields.

Template tables:

```
## <Task type 1, e.g. Story>

| Meaning | Field key | Required |
|---|---|---|
| Title | <key, e.g. summary> | — |
| Description | <key, e.g. description> | yes |
| <Your field, e.g. User Story> | <key> | no |
| <Your field, e.g. Acceptance Criteria> | <key> | no |
| <Your field, e.g. Notes for QA> | <key> | no |
| Comments | <key, e.g. comment> | no |
| Attachments | <key, e.g. attachment> | no |

## <Task type 2, e.g. Task>

| Meaning | Field key | Required |
|---|---|---|
| Title | <key> | — |
| Description | <key> | yes |
| <Your field> | <key> | no |
| Comments | <key> | no |
| Attachments | <key> | no |

## <Task type 3, e.g. Bug>

| Meaning | Field key | Required |
|---|---|---|
| Title | <key> | — |
| <Bug description, e.g. Bug Description> | <key> | yes |
| <Your field> | <key> | no |
| Comments | <key> | no |
| Attachments | <key> | no |
```
