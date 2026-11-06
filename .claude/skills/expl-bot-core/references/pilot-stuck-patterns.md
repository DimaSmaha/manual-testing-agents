# Pilot: stuck patterns and interventions (ported from explorbot `src/ai/pilot.ts:1214-1317`)

In Claude Code the **Pilot is the main session** (the orchestrator). The tester subagent returns a compact
`STUCK` block; the orchestrator reads it against this catalogue and answers with exactly two lines, then
resumes the same tester (SendMessage; fallback: a new tester with a summary):

```
PROGRESS: <1 sentence assessment>
NEXT: <specific actionable instruction for the tester>
```

Concise: one short sentence per line, evidence only, no repeated verdict wording.

The tester also self-applies the catalogue to decide when to stop and return `STUCK` instead of looping.

## Principles

- Plan the test, review each new page, detect stuck patterns, suggest concrete next steps. When things go
  well, encourage briefly and let the tester continue.
- The current page is usually richer than the page summary lists — explore it before navigating away.
- **Already-achieved detection**: if the scenario goal is met in the current state, instruct the tester to
  verify and finish. If the goal was already true at the start, propose different input data so the test is
  meaningful. If the tester repeats the same successful action, STOP.
- If needed, pick the exact item the scenario should act on (from the page, or a record the run created) and
  pass it in NEXT.

## Action classification

- **GOAL-ADVANCING** — mutates the scenario's subject data (create / edit / delete / submit / verify).
- **VIEW-ONLY** — toggles filters / tabs / sort / collapse without changing data.

One VIEW-ONLY action to reveal a target is fine. **≥ 2 consecutive VIEW-ONLY actions with no GOAL-ADVANCING
action in between is thrashing** — redirect to the actual mutation or verification. Repeated large snapshot
diffs are also a thrashing signal.

## Navigation

Compare the current URL to the START URL. A subpage is OK. Parent / sibling is suspicious → `go-back` or
return to the start URL. A different domain is wrong → return to the start URL immediately. Do not try
breadcrumbs (SPA back-nav is unreliable).

## Diagnostic patterns

| Observation | Diagnosis → NEXT |
|---|---|
| Target control is **disabled** | A precondition is unmet. Identify which: other disabled controls and `required` fields name the unsatisfied constraint. Aim the tester at the constraint the page names, not the one the scenario assumed; note the difference in PROGRESS. |
| Overlay is gone but the tester targets it | Overlay closed → re-trigger it. |
| A large area appeared in place without navigation (subview, wizard step, panel) | Act inside it; the rest of the page is still usable. |
| Action succeeded but the snapshot diff is empty | May have worked without a visible DOM change; read the result message / re-check state. |
| Locator matched several elements | Nothing was clicked. Reuse the same locator with `.nth(k)` chosen from the numbered list. |
| Wrong page (settings instead of feature) | Go back (`go-back`) or return to the start URL. |
| Click succeeded but the element clicked ≠ the intent, or the click hit a different element | Wrong element clicked — re-snapshot, use a container. |
| `fill` / `type` succeeded but the focused element is a button / link | Keys went to the wrong element; click the input first. |
| Snapshot diff shows 5+ elements added/removed | Page entered a new mode (editor / modal). Re-snapshot and re-read the controls before guessing locators. |
| Empty dropdown / list when items are expected | Wait for a concrete condition, then check whether the state changed. If still empty, confirm the empty state with a check, or look at `requests` / `console` for the failed fetch. |
| Search-and-select | Needs a SEQUENCE: focus the trigger → type to filter → click the option, in separate calls. |
| Multi-action step in one call | Split it into separate calls. |
| The same state key three times in a row | Dead loop. Stop and return `STUCK`. |

## Locator search when stuck

Never guess one exact text. Combine synonyms, `aria-label`, `title`, role and icon classes with "or" in one
XPath (`//*[@aria-label="Remove" or @title="Remove" or contains(@class,"icon-trash")]`). If empty, broaden
(drop the role filter). Pass the discovered locator in NEXT.

## Resume budget

At most **2** resumes per scenario. After that mark the scenario `STUCK` (or `BLOCKED` when a precondition /
capability is missing) in the results and move on. Never loop on the same scenario.

## What the Pilot does NOT do

- It does not click in the browser (the tester does).
- It does not answer the user's questions on the user's behalf; it asks them (login, ambiguous data).
- It does not create data outside `data-protection.md`. A missing precondition is created by the tester inside
  the scenario, named with the RUN_ID, or reported as missing.
