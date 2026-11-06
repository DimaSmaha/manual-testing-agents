# Data protection — OWN DATA ONLY

Decision for the `expl-bot-*` and `expl-bot-independent-*` flows: **a run may create, edit or delete only
records it created itself.** Pre-existing data is never touched. This is stricter than explorbot's default
(`dataProtectionRules` in `src/ai/rules.ts`), which also reserves "irreversible actions" for rage mode; here
there is no rage mode.

## RUN_ID and naming

- `RUN_ID` = `eb-YYMMDD-HHMM` (for example `eb-261106-1432`), created once by the orchestrator and stored in
  `runs/<RUN_ID>/`.
- Every record the run creates carries the RUN_ID in its **name / title / label** (first field that is free
  text): `eb-261106-1432 Product A`. If the form has no free-text field, record the generated identifier
  (id, slug, number) in the result block immediately.
- The tester returns every created record under `CREATED:` with its exact name or id. That list is the only
  set of records the run may edit or delete later.

## Rules

1. Do not sign out the current user. Do not change the current user's account settings (profile, password,
   email, 2FA, notification settings).
2. Pre-existing data belongs to the application, not the test. Anything not created inside this run must not
   be deleted, removed, emptied, reset, archived, renamed, re-ordered or otherwise changed.
3. A scenario that needs to edit or delete something must **first create its own target** in the same
   scenario (or in a preceding scenario of the same run), then act on that specific target. Locate it by the
   RUN_ID name, never "the first row".
   **Seeded data:** records created by the `qa-data-seeder` skill in this same run, listed in
   `runs/<RUN_ID>/seed.md`, count as the run's own data. A scenario may edit or delete them, still located by
   the RUN_ID name and never "the first row". The seeder runs only after the user said yes and approved the
   exact count; it is never used by Flow 2 (`--independent`) or under a read-only focus (rule 5).
4. The resource that the current page URL represents is "under test". Never destroy it. Do not propose or
   perform delete/remove/archive on the entity that owns the current URL. Destroy only children created in
   the scenario itself.
5. If the planner/scenario/user focus says read-only, no mutation, search, filter, tab or list inspection:
   do not create, edit, update, delete or otherwise mutate anything — not through the UI, not through
   preconditions, cleanup or fallback steps. Use visible existing data. If no suitable data exists, report the
   **missing precondition** instead of creating data.
6. Reading is not mutation. Inspecting what exists (opening rows, reading detail pages, reading API responses
   through the browser's own network panel) stays allowed under a read-only constraint.
7. Settings pages, user-management pages, billing/payment, integrations, "danger zone" areas: the planner does
   not plan scenarios that change them unless the scenario creates and then fully reverts its own artefact
   (for example a record it created). When in doubt: read-only.
8. Destructive actions on own data are allowed. Destructive actions on anything else: stop and report
   `BLOCKED — would touch pre-existing data (<what>)`.
9. At the end, the report lists every record created by the run and whether it was removed. Leftover own data
   is listed, not hidden. (Cleaning it up is allowed for the run's own records only.)
10. Credentials: sign in only with credentials the user gave in chat or that sit in knowledge / `EXPL_BOT_AUTH`.
    Never invent, guess or try default credentials. If missing, stop and name what is missing; do not submit
    the form.

## Sentences to copy into agent prompts

> Pre-existing data belongs to the application. Create, edit or delete only records whose name carries the
> run id `<RUN_ID>` and that this run created. If a scenario needs to modify something, create it first.
> If an action would touch anything else, stop and report BLOCKED.
