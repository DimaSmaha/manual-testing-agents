# Issue Tracker

The pipeline reads tasks (stories) and bugs from the issue tracker over a REST API
(HTTP, no auth). Bugs are read for retesting.

## Base URL

- Default: `http://localhost:3000`
- Public alternative (ngrok): `https://congrats-wolverine-goon.ngrok-free.dev`
- If the user gives another base URL or a full item URL (`<base>/tasks/<id>`,
  `<base>/bugs/<id>`), use that base for the whole run.

Below, `<BASE>` means the base URL in use.

## Availability

If the tracker is not reachable — stop and tell the user. Do not use workarounds
(browser, web search, guessing the content).

### Health check

```
curl -s --max-time 5 <BASE>/
```

Any non-empty 200 response means the tracker is up. Empty output or a connection error
means it is not reachable.

## Item kinds

Tasks and bugs are separate collections with **separate id spaces** — the same number can
exist in both. The kind must always be known before reading:

| Kind | Endpoint | Key (`<ISSUEKEY>`) | Source line |
|---|---|---|---|
| Task (story) | `GET <BASE>/tasks/<id>` | `TASK-<id>` | `<BASE>/tasks/<id>` |
| Bug | `GET <BASE>/bugs/<id>` | `BUG-<id>` | `<BASE>/bugs/<id>` |

- Input forms: a full URL (kind from the path), `TASK-<id>` / `BUG-<id>`, or a bare number
  together with the word task/bug. If a bare number has no kind — ask the user which one.
- `<ISSUEKEY>` in all artifact file names = the key from the table (for example
  `TASK-112-1-context.md`, `BUG-114-1-context.md`).

## Reading an item

Write the response into the git-ignored scratch folder and read it with the Read tool
(one simple command, no `cd`, no `&&`):

```
curl -s --retry 3 --retry-all-errors --max-time 10 --create-dirs <BASE>/<tasks|bugs>/<id> -o .workflow-artifacts/<ISSUEKEY>/tracker/<ISSUEKEY>.json
```

- The retry flags are required: transient server errors (HTTP 5xx) must not stop the run.
- If the saved file is empty or contains an error body (`"status":"error"`) after the
  retries — run the command once more; if it still fails, report the blocker to the user.
- Do not paste the raw response into the chat.

### Responses (200)

Task:
```json
{ "id": 112, "title": "...", "description": "...", "type": "story" }
```

Bug:
```json
{ "id": 114, "title": "...", "description": "...", "severity": "low|medium|high" }
```

### Not found (404)

```json
{ "message": "Task not found" }
```
(`"Bug not found"` for bugs.) Tell the user the item does not exist in the tracker and stop.

## Missing data

Only the fields above are returned. Comments, attachments, acceptance criteria,
linked items, and PR/branch information are not available from the tracker.
Empty optional sections are normal — do not report them as skipped or missing data.
Apply the "Not specified in the tracker" rules of `output-template.md`.

## Other endpoints (not used by stage 1)

`GET /testcases/:id`, `GET /tasks/:id/linked-tc`,
`POST /tasks/create`, `POST /bugs/create`, `POST /testcases/create`.
