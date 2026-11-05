# Field Maps

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

Fixed field maps for the project. Do not reopen
these maps every time — use them as is.

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
