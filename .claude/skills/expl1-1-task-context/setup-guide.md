# Setup guide for the Task Context skill

> ✅ **Current state:** configured for the REST issue tracker (tasks and bugs).
> Tracker access, base URL, and error handling: `references/issue-tracker.md`.
> Field map: `references/field-maps.md`. The steps below are for switching
> to a real tracker (Jira, Linear, GitHub, ...) later.

This skill collects task data from the tracker and produces
a structured context file. Before use, it must be
configured for your tracker and project.

## What you need to know before setup

Find the answers to these questions BEFORE asking
the AI to configure the files:

### 1. Which tracker do you use?

Jira Cloud, Jira Server, Linear, GitHub Issues,
Azure DevOps, YouTrack, Notion, ClickUp, or another one.

### 2. How will the AI access the tracker?

Options:
- **MCP server** (recommended) — Atlassian MCP for Jira,
  Linear MCP for Linear, etc. Make sure the MCP is connected
  and authenticated.
- **CLI** — for example `gh` for GitHub Issues.
  Make sure the CLI is installed and authorized.
- **No integration** — you will copy the task description into the chat
  manually. Works with any tracker, but slower.

### 3. Which task types exist in your project?

Open the tracker and see which types are used.
Typical examples:
- Jira: Story, Task, Bug, Epic, Sub-task
- Linear: Issue, Bug, Feature
- GitHub: Issue (one type, differentiated by labels)

### 4. Which fields does each task type have?

This is the most important step. Open several real tasks
of each type and note which fields are filled in:

- Title (always present)
- Description (almost always present)
- Acceptance Criteria
- User Story
- Notes for QA / Notes for DEV
- Custom fields specific to your project
- Comments
- Attachments

**For Jira:** custom fields have technical keys
like `customfield_XXXXX`. To find the key:
1. Open the task in the browser
2. Click `...` → Export XML
3. Find the needed field and its key in the XML

Or ask your Jira admin for a list of custom fields.

### 5. Which field is required?

Which field MUST be filled in so that there is
something to process? Usually it is the task description (description).
For bugs it may be a separate field (Bug Description,
Steps to Reproduce).

## Setup order

Once you have the answers to the questions above, configure the files
in this order:

### Step 1: references/field-maps.md

This is the first and most important step. Fill in the field map:
1. Create a section for each task type
2. For each type, fill in the table:
   - Meaning — the human-readable field name
   - Field key — the technical key in the tracker
   - Required — yes/no (at least one "yes" per type)
3. Delete the task types you do not use
4. Add types that are not in the template

### Step 2: SKILL.md — "Tracker access" section

Replace the `⚠️ CONFIGURE` block with specific instructions
for your tracker and access method. Specify:
- Which MCP tools or CLI commands to use
- How to parse the task URL
- What to do if the integration is unavailable
- The fallback scenario

### Step 3: SKILL.md — "Task types and fields" section

Replace the `⚠️ CONFIGURE` block with the list of your task types.

### Step 4: SKILL.md — "Empty fields" section

Replace the `⚠️ CONFIGURE` block with the specific required fields
for each task type from your field map.

### Step 5: SKILL.md — "Attachments" section

Replace the `⚠️ CONFIGURE` block with a description of how your tracker/MCP
provides attachments. If you do not know — leave it as is,
the default flow (ask the user to upload) works
with any tracker.

### Step 6: SKILL.md — "Input" section

Replace the `⚠️ CONFIGURE` block with the task key format
in your tracker.

## Check after setup

After setup, check:
- [ ] All `⚠️ CONFIGURE` blocks in SKILL.md are replaced
      with specific instructions
- [ ] field-maps.md contains the real fields of your project
      with correct technical keys
- [ ] There is at least one required field for each task type
- [ ] The tracker access method is specified (MCP, CLI,
      or manual copying)

## Test run

After setup, do a test run on one
real task:
1. Give the AI the task key or URL
2. Check that all fields from the map are collected
3. Check that the context file contains all the information
   from the ticket without loss
4. If something is missing — check the field map

## Skill files

```
expl1-1-task-context/
  SKILL.md                         — skill instructions
  references/
    field-maps.md                  — project field map
    output-template.md             — output file template
  setup-guide.md                   — this guide
```
