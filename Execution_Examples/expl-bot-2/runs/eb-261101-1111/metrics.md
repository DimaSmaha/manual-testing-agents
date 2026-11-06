# eb-261101-1111 - agent run metrics

Generated: 2026-11-01T11:11:00.000Z
Source: `node .claude/hooks/metrics-report.mjs eb-261101-1111 --save`, also written by the Stop hook after every turn (script-owned: it is overwritten each time; the full per-model bill is in `metrics.json`)

### Orchestrator run cost — eb-261101-1111

| # | Skill | Run | Model | Calls | Tools | Active | Wall | Tokens | In | Out | Cache read | Cache write | Cost |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `expl-bot-orchestrator` (own turns) | 1/2 | claude-sonnet-5-5 | 26 | 45 | 80.4s | — | 2,784,997 | 54 | 21,840 | 2,603,051 | 83,707 | $1.10 |
| 2 | `expl-bot-research` | 1/1 | claude-sonnet-5-5 | 30 | 47 | 13.2s | 16.8s | 1,597,350 | 69 | 17,389 | 1,493,195 | 66,131 | $0.68 |
| ↳ | `expl-bot-researcher` _(in row above)_ | background | claude-sonnet-5-5 | 33 | 47 | — | 0.0s | 1,288,459 | 63 | 16,126 | 1,222,416 | 58,702 | $0.60 |
| 3 | `expl-bot-plan` | 1/1 | claude-sonnet-5-5 | 4 | 8 | 92.1s | 86.9s | 559,106 | 15 | 12,585 | 517,371 | 29,158 | $0.30 |
| 4 | `expl-bot-test` | 1/1 | claude-sonnet-5-5 | 146 | 197 | 169.7s | 915.0s | 7,811,787 | 317 | 56,193 | 7,274,371 | 269,699 | $2.82 |
| ↳ | `expl-bot-tester` _(in row above)_ | background | claude-sonnet-5-5 | 26 | 40 | — | 0.0s | 843,139 | 53 | 10,955 | 811,700 | 38,249 | $0.38 |
| ↳ | `expl-bot-tester` _(in row above)_ | background | claude-sonnet-5-5 | 24 | 33 | — | 0.0s | 1,090,625 | 55 | 8,246 | 1,018,599 | 43,725 | $0.41 |
| ↳ | `expl-bot-tester` _(in row above)_ | background | claude-sonnet-5-5 | 9 | 14 | — | 0.0s | 378,464 | 24 | 3,518 | 324,667 | 35,680 | $0.15 |
| ↳ | `expl-bot-tester` _(in row above)_ | background | claude-sonnet-5-5 | 17 | 23 | — | 0.0s | 671,379 | 43 | 5,383 | 625,541 | 30,918 | $0.23 |
| ↳ | `expl-bot-tester` _(in row above)_ | background | claude-sonnet-5-5 | 15 | 31 | — | 0.0s | 630,770 | 33 | 7,372 | 573,797 | 33,365 | $0.23 |
| ↳ | `expl-bot-tester` _(in row above)_ | background | claude-sonnet-5-5 | 16 | 30 | — | 0.0s | 596,065 | 40 | 5,742 | 577,539 | 33,655 | $0.23 |
| 5 | `expl-bot-report` | 1/1 | — | — | — | 0.0s | 0.0s | — | — | — | — | — | — |
| 6 | `expl-bot-learn` | 1/1 | claude-sonnet-5-5 | 38 | 109 | 528.5s | 841.3s | 10,233,113 | 87 | 60,173 | 9,737,618 | 119,470 | $3.06 |
| 7 | `expl-bot-orchestrator` (own turns) | 2/2 | claude-sonnet-5-5 | 7 | 14 | 85.0s | — | 515,779 | 11 | 2,617 | 442,720 | 56,837 | $0.39 |
| **Σ** | **orchestrator total** | **5 skill runs** |  | **254** | **413** | **967.6s** | **83.9s** | **23,099,182** | **554** | **166,813** | **22,838,673** | **625,232** | **$8.25** |

**Tokens and Cost.** Every API call inside the row's window — input, output, cache read and cache write — summed from the session transcript (once per message) plus the subagents launched in it. Cost is an estimate at API list rates as of 2026-10-06: it is not your plan or session-limit usage. `Active` is the time the agent was working (user prompt → stop); `Wall` is launch → last stop of that stage, including questions the stage asked the user. The Σ wall clock is first launch → last stop of the latest session.

Per-skill figures are attributed by time window in one shared conversation: a skill's row covers everything from its launch until the next skill starts, except the turn in which an orchestrator launches the next stage, which is the orchestrator's own.
1 row(s) have no token figures: the session transcript is not on this machine (`~/.claude/projects`) and no saved snapshot covers it, or the window held no model call. Their Active/Wall are still measured.
This key spans 2 sessions; the wall clock shown is the latest session's (1 rows).
