---
name: qa-data-seeder
description: >
  Optional, user-confirmed helper that CREATES test data in a non-production environment for
  one task (expl1) or one exploratory run (expl-bot): analyzes what the feature needs, proposes
  data categories (regular and edge cases), and after the user approves the categories and the
  exact count, seeds them through the UI (playwright-cli) or a REST API, marking every record with
  the run marker so only that data is ever touched or removed. Use when the user says "seed test
  data", "prepare data for testing", "populate the test environment", "create fixtures", or when an
  orchestrator offers it. It always asks the user before doing anything. Adapted from
  testomatio/skills (MIT).
author: Testomat.io (adapted)
---

# QA Data Seeder

> ⚙️ Recommended settings: **Sonnet · Effort: Medium · Extended thinking: Off**

> ## ⚠️ Be aware before you use this skill
>
> This is the only skill in the repo whose job is to **create data in a live application**. Everything
> else is read-only or works on the run's own scenarios.
>
> - It writes records into a real environment. They are visible to other people using it.
> - It is **never started on its own**, **never run unattended** (Flow 2 / `expl-bot-independent-*`
>   do not use it), and never skipped past its approval gate.
> - It seeds only into **non-production** environments (local, dev, staging), and only after you confirm.
> - Every record it creates carries one marker (the RUN_ID or the ISSUEKEY). Only records with that
>   marker count as "own data": nothing else is ever edited or deleted.
> - It does not apply to read-only exploratory focus (`expl-bot-core/references/data-protection.md`, rule 5).
>
> The first thing it does is ask you whether you want to use it at all (Step 0).

Analyze how the feature works, design a balanced dataset, and populate it into the target environment
so the feature can be tested manually or by an exploratory run.

## Step 0: Ask first (always)

Before reading anything or proposing anything, ask the user once, in a short message:

> "`qa-data-seeder` creates records in a live environment (marked `<marker>`). Do you want to use it
> for `<ISSUEKEY or RUN_ID>`? (yes / no)"

- **No** (or no answer) → stop. Say "No data seeded." and note the decline if an orchestrator started
  this. Do not offer again in the same run unless the user asks.
- **Yes** → go to Step 1. A yes covers only analysis and the proposal: nothing is written before the
  Step 3 gate.
- If the user's focus is read-only, or the run is unattended (`--independent`) → do not ask, refuse and
  say why in one line.

## Critical constraints

- **Never seed production.** Confirm the environment is local, dev or staging before writing anything.
  If in doubt, stop and ask.
- **Never produce broken data.** Every record must pass the application's own validation. Edge cases are
  extreme-but-valid values, not corrupt ones. Malformed input belongs in negative tests executed live, never
  in persisted data.
- **Balance: at least 70% regular data, at most 30% edge cases.**
- **Do not seed until the user approves the categories and the exact item count** (Step 3 gate).
- **Own data only.** Never edit, delete or reuse a record that this skill did not create in this run.
- Credentials, tokens and connection strings come from the user in chat or from env vars (for expl-bot:
  `EXPL_BOT_AUTH`, `sites/<host>/auth.json`). Never hardcode them, never print them, never invent or guess
  default credentials.
- No invented facts about the app: the fields, rules and limits come from the requirements, the UI, the
  API schema or the user.
- English only. Chat messages are short.

## The run marker

One marker for the whole run, put in the first free-text field the schema allows (name, title, note, tag):

- expl-bot run: the RUN_ID (`eb-YYMMDD-HHMM`), for example `eb-261106-1432 Product A`.
- expl1 task: the ISSUEKEY (`TASK-112`), for example `TASK-112 Product A`.

If a record has no free-text field, do not seed that record type. If the user insists, record the generated
identifier (id, slug, number) in the seed file immediately.

## Files

- expl1: `.workflow-artifacts/<ISSUEKEY>/<ISSUEKEY>-x-seed-data.md` (the report) and scratch scripts or plans in
  `.workflow-artifacts/<ISSUEKEY>/seed-data/`.
- expl-bot: `.workflow-artifacts/expl-bot/runs/<RUN_ID>/seed.md` (the report) and scratch files in
  `.workflow-artifacts/expl-bot/runs/<RUN_ID>/scripts/`.
- No task key and no run id: show everything in chat only and write no file.
- If the report file exists, delete it and write a new one. Delete scratch scripts when finished (never the
  `.workflow-artifacts/<ISSUEKEY>/` folder itself).
- Scripts are written with the Write tool and run as one simple command, output redirected into the scratch
  folder (see the repo's script conventions). No heredocs, no `cd`, no `&&`.

## Workflow

### Step 1: Understand what the feature needs

Collect, from the sources the user has (use what exists, do not invent):

- expl1: `<ISSUEKEY>-2-requirements.md`, `-3-checklist.md`, `-4-test-cases.md` (test data columns, boundary
  values), `-6-code-review.md` and `-7-impact-analysis.md` (QA rows that need data).
- expl-bot: `plan.md` / `test-cases.md` of the run and the research files of the pages in scope.
- Entities and fields: type, format, length limits, numeric ranges, enums, required vs optional, uniqueness.
- Relationships: which records must exist before others (parents before children).
- Variations that change behavior: roles, statuses, types, plans, locales.
- How records can be created: UI flows or API endpoints, and what they require.

Code access is not needed. If the PR is available, `gh` can show validation rules (read-only). If a fact is
missing, ask the user. Do not read or change the database.

### Step 2: Collect environment details

Ask for what the sources cannot tell you (one short list, only what is missing):

- Base URL, and the environment kind (local, dev, staging). Confirm it is not production.
- Channel: **UI with `playwright-cli`** (the open `qa-<ISSUEKEY>` or `expl-<host>` headed session) or a
  **REST API** (API base URL, token in an env var named by the user).
- Which account, tenant or workspace to seed into, and that the user is signed in there.

Channel order: the app's own seed mechanism if the user names one → REST API → UI. Never write straight to
the database and never bypass validation.

### Step 3: Propose categories and ask for the count (approval gate)

- Derive categories from Step 1: one per business variation, plus edge-case groups (min/max lengths and
  amounts, unicode, date boundaries, every enum value and reachable state, empty vs full optional fields,
  collection and relationship extremes). Only values that are valid for the app.
- Present a table: category, what it lets the tester check, regular/edge, planned share, and the marker form
  of the name.
- Keep regular categories at 70% or more and edge categories at 30% or less.
- Ask the user for the exact total number of items, recompute per-category counts, and confirm.
- Adjust per feedback. **Nothing is created until the user answers yes to the final table.**

### Step 4: Generate the dataset

- Realistic values (names, emails, amounts) that fit the app; unique where the schema requires it. No real
  people's data.
- Order records so prerequisites come first.
- Apply the run marker to every record.
- Save the dataset (records or generation rules) to the scratch folder before seeding, so the run is
  reviewable.

### Step 5: Seed

- Seed through the chosen channel in dependency order, batch where the channel allows.
- Verify each batch: the response or the page shows the record, count matches, note the id or exact name.
- If the app rejects a record, fix the data to comply. Never bypass validation.
- After 3 failed attempts on a category, stop and report the failure with the error text. Ask how to proceed.
- Stop at the first sign you are in the wrong place (production URL, wrong tenant, other people's data in
  the target list): report `BLOCKED` and do not continue.

### Step 6: Verify and hand off

- Re-check per category in the app and compare with the approved counts.
- Write the report file: a table with category, requested, created, and how to find the records (the marker or
  the ids), the environment URL, and a page where the data is visible. This list is the **set of own records**
  later stages may use, edit or delete.
- Give cleanup instructions: find the records by the marker and delete them through the same channel. Offer
  to do it for the user; only records from this list, and only after a yes.
- Final response in chat: the report path, requested vs created per category (short), and "Seeded data is
  marked `<marker>`; later steps may use only these records".

## How the other skills use the result

- `expl1-8-web-testing`: may use the records listed in `<ISSUEKEY>-x-seed-data.md` for a precondition that
  needs data. Anything not in that list stays untouchable.
- `expl-bot-test` and the report: the records in `RUN/seed.md` count as the run's own data
  (`data-protection.md`). The report's "Data created" section lists them and whether they were removed.
