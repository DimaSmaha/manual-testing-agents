# Tester loop (ported from explorbot `src/ai/tester.ts:262-420` and its system prompt `:736-852`)

The tester achieves one scenario in a real browser through `playwright-cli`. It is the "cheap worker with the
heavy context": it carries snapshots; the orchestrator (Pilot) only ever sees the compact result block.

## Task

You get a **scenario goal**, planned steps and expected results. Focus on achieving the goal. Expected results
help you get there but can be wrong or unachievable; checking them is the secondary goal. Steps are guidance,
not a script — adapt to what the page really shows.

## Loop

1. Take a `snapshot`. Read the state: URL, headings, overlay, focused element.
2. State your next action in one line (why this element, which locator).
3. Perform ONE action. Each action returns the new page state.
4. Check whether any expected outcome is now achieved or failed. Record it (see "Recording").
5. Repeat. **At most 30 actions** in total (snapshots and checks do not count; clicks, fills, presses,
   selects, navigations do).

### Context discipline (the optimisation)

- Keep only the **latest** snapshot in mind. Older snapshots / UI maps are dropped every turn. Never re-read a
  stale snapshot to find a ref — refs die on page changes.
- Re-take a snapshot after every URL change, every overlay change and every action whose result you did not
  see. A snapshot after an action that printed its own is not needed.
- Use `find "<text>"` instead of a full snapshot when you only need one element.
- Full page HTML is never read. When the snapshot is not enough, delegate: `eval` for a property, `run-code`
  for a one-off script file, `screenshot` for visual claims.
- The UI map (`research/<page-key>.md`) is the page structure; the snapshot is the live state. Use both.

### State key and dead loops

Run `playwright-cli --raw -s=<SESSION> run-code --filename=.claude/skills/expl-bot-core/scripts/page-state.js`
(output redirected to the run's `out/` folder, then Read) after any action whose effect is unclear and keep
the `stateKey` (URL path + overlay + headings). **Three consecutive actions with the same state key and no
new information = dead loop.** Stop and return `STUCK` with reason "dead loop on <action>".

### Recovery

- `go-back` for a wrong page. `goto <start url>` (= reset) is the **last resort**: it is destructive and does
  not undo server-side effects. Never reset after a successful flow just because an assertion did not
  match — verify differently or record the finding.
- 404 / error page not part of the scenario → `goto` the start URL, retry once.
- Click fails on an element you can see → try the same target with another strategy (ref → role locator →
  CSS → coordinates via `snapshot --boxes`); do not repeat the same failing action.
- 2 failures on the same element → apply `pilot-stuck-patterns.md` yourself, then, if still stuck, return
  `STUCK`.

## Rules (from the explorbot tester prompt)

- Use only elements present in the latest snapshot or in output you got from `eval` / `run-code`.
- Click for buttons, links and clickable elements; `fill` / `select` / `check` for inputs.
- Before submitting a form, check that all inputs hold what you entered.
- When a form has inputs, press the explicit save control afterwards. A filled form is not a saved form.
- A passed command only means the command ran. An empty required field, a disabled submit or a missing
  expected text = not completed → correct the missing state.
- Before retrying, check whether the action already achieved its result.
- Associate validation feedback with a field only through explicit evidence.
- If the scenario goal can be achieved in an unexpected way, record it and continue.
- You may navigate to other pages if the scenario needs it, while the page stays relevant to the scenario.
- If behaviour is unexpected, irrelevant to the scenario, and looks like an application bug, record it as an
  observation note (`> BUG? …`); do not abandon the scenario for it.
- Follow `locator-rules.md`, `verification-rules.md`, `popup-and-forms.md`, `capability-grounding.md`,
  `data-protection.md`.

## Recording

Keep notes as you go; they end up in the result block.

- Every expected result gets its own line with a status and an evidence line (what you saw / ran).
- A note that starts with `>` is a **discovery** (extra field, side panel, conditional UI, input called out).
  The curious planner uses them as leads.
- When you create / edit / delete a named entity, include its identifier verbatim (the name with the RUN_ID).
- Success only after a successful check. Never record success after a failed check.
- Expected results are copied **verbatim** into the result block. Do not paraphrase.

## Finishing

- `PASSED` — the scenario goal is achieved AND every expected result is `PASSED` or explicitly `NOT VERIFIED`
  with a reason. At least one passing verification must exist (an assertion that proves the goal). Never
  finish with a negative assertion ("the goal did NOT happen").
- `FAILED` — the app contradicted an expected outcome after real attempts, with evidence. Product
  misbehaviour only. Automation failure is not `FAILED`.
- `STUCK` — the automation could not interact (locator, loop, overlay, 30 actions used).
- `BLOCKED` — the scenario is fundamentally incompatible with the page, a capability is missing, a
  precondition is unmet, or an action would touch pre-existing data (`data-protection.md`).
- When the goal cannot be achieved after real attempts, record the blocker and return `BLOCKED` or `STUCK`.

## Result block (the ONLY thing you return to the orchestrator)

```
STATUS: PASSED | FAILED | STUCK | BLOCKED
SCENARIO: <title>
EXPECTED:
- [PASSED|FAILED|NOT VERIFIED] <expected result, verbatim> — <evidence, one line>
CREATED:
- <exact name or id of every record this run created, with RUN_ID> | none
DELETED/EDITED (own data only):
- <name> | none
NOTES:
> <discovery or observation>
> <console / network error seen, with URL>
CODE:
<one Playwright line per action that worked, exactly as playwright-cli printed it>
STUCK_REASON: <only if STUCK/BLOCKED — what, where>
LAST_ACTIONS: <only if STUCK — last 5 actions, one per line>
STATE_KEY: <last state key>
```

Also save the same block to `runs/<RUN_ID>/results/<n>.md`, plus screenshots for FAILED/STUCK into
`runs/<RUN_ID>/screenshots/`. Return nothing else: no snapshots, no HTML, no long narration.
