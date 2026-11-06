---
name: expl-bot-core
description: >
  Shared rules, formats and scripts of the expl-bot exploratory-testing crew (a port of the explorbot agent
  crew into Claude Code). Not a pipeline stage and not run on its own: the expl-bot-* skills and the
  expl-bot-researcher / expl-bot-tester subagents read its references. Load it directly only when the user asks
  how expl-bot works, wants to see or change its rules (locators, verification, data protection, planner
  styles, stuck patterns, report format, memory layout), or runs one of its scripts by hand.
---

# expl-bot-core

Shared building blocks for the `expl-bot-*` flows. Explorbot (`C:\qa\work\explorbot`) is an autonomous
exploratory-testing agent crew that needs its own API key. Here Claude Code is the brain and
`playwright-cli` is the hands; this skill holds the rules and know-how the crew shares.

> Not a stage. Does not write artifacts. Rules and scripts only.

## Crew → where it lives

| Explorbot role | Here |
|---|---|
| Captain, Pilot, Planner judgement, Analyst | the main chat session, driven by `expl-bot-orchestrator` |
| Researcher | subagent `expl-bot-researcher` (skill `expl-bot-research`) |
| Planner | skill `expl-bot-plan` (rules: `planner-rules.md`, `planner-styles/*`) |
| Tester | subagent `expl-bot-tester` (skill `expl-bot-test`) |
| Pilot interventions | orchestrator + `pilot-stuck-patterns.md` |
| Analyst, Historian | skill `expl-bot-report` |
| Experience, Knowledge, ExperienceCompactor | skill `expl-bot-learn` |
| Navigator | rules inside the tester (`locator-rules.md`, `verification-rules.md`) |

## References (`references/`)

| File | Read it when |
|---|---|
| `locator-rules.md` | choosing any locator (researcher, tester) |
| `action-mapping.md` | translating a step into `playwright-cli` commands |
| `verification-rules.md` | checking an expected result |
| `popup-and-forms.md` | a popup/overlay appears, filling a form, credentials |
| `capability-grounding.md` | planning or executing a scenario that needs a named action/feature |
| `data-protection.md` | **always** (tester, planner, orchestrator) — own data only |
| `ui-map-format.md` | researching a page / reading a research file |
| `planner-rules.md` + `planner-styles/<style>.md` | planning |
| `tester-loop.md` | executing a scenario (tester) |
| `pilot-stuck-patterns.md` | a tester returned `STUCK` or is looping |
| `report-format.md` | writing the report / historian tests |
| `test-cases-format.md` | writing `test-cases.md` (readable view of `plan.md`) |
| `memory-formats.md` | reading/writing knowledge, experience, state.json, plan.md |
| `run-context.md` | **first**, in every `expl-bot-*` skill: names (HOST, SESSION, RUN_ID), browser, asking the user, scratch |

## Scripts (`scripts/`, `playwright-cli run-code`)

Each is a single function expression for `playwright-cli -s=<SESSION> run-code --filename=<path>`. They read
the page, they never change it. Redirect output into the run's `out/` folder and Read it:

```
playwright-cli --raw -s=<SESSION> run-code --filename=.claude/skills/expl-bot-core/scripts/page-state.js > .workflow-artifacts/expl-bot/runs/<RUN_ID>/out/state-01.out 2>&1
```

`--raw` is important: without it the output also echoes the whole script source. With it the file holds only
the returned JSON. (Tested against a local page: all three scripts return valid JSON.)

| Script | Returns |
|---|---|
| `page-state.js` | `url`, `path`, `title`, `headings`, `overlays`, `focused`, `stateKey`, `stateHash`, `pageKey` — the deterministic state key used for loop detection and for experience/research file names |
| `interactive-map.js` | every visible interactive element: role, accessible name, id/name/data-testid/aria-label/href, state (disabled/checked/expanded/required), nearest section `kind` + `container`; plus iframes, duplicate role+name pairs and pagination hints |
| `locator-check.template.js` | a **template**. The researcher writes a copy into `runs/<RUN_ID>/scripts/` with its UI-map locators inlined in `CHECKS` and runs the copy; returns match counts per ARIA/CSS/XPath locator and per container, and `summary.redoResearch` |

Follow the user's global rules when running anything: scripts are files (Write tool), one simple command
each (no `cd`, no `&&`/`;`, no env-var prefixes), output to a git-ignored folder, scratch files created for
a run are removed at the end (never `.workflow-artifacts/expl-bot/sites/` or a run's report).

## Principles (why the crew is built this way)

1. **Cheap workers, smart manager, isolated context.** Heavy snapshots live in the subagents; the main
   session only sees compact result blocks.
2. **Tested locators.** A UI map is only trusted after its locators were counted against the live page.
3. **Outcome strength.** Data change > state change > UI-only, in every plan.
4. **Evidence or `NOT VERIFIED`.** Never a weaker claim than the one planned.
5. **Own data only.** The run creates what it edits or deletes; everything else is read-only.
6. **Product defects ≠ automation problems.** The report keeps them apart.
7. **Memory compounds.** Knowledge (human facts) and experience (what worked) are loaded before research,
   planning and testing, and updated after.

## Do not

- Do not use Playwright MCP or the Chrome extension. `playwright-cli` only, headed (unless a
  `expl-bot-independent-*` run says otherwise), named session, `--persistent`.
- Do not type credentials unless the user gave them in the chat for this run.
- Do not invent test data beyond what the scenario needs; names carry the RUN_ID.
- Do not edit `expl1-*` skills or their artifacts. `--from <ISSUEKEY>` only reads them.
- Do not paste whole snapshots, research files or experience files into chat or into another agent's prompt:
  pass file paths and a short summary.
