# eb-261101-1211 - agent run metrics

Generated: 2026-11-01T11:11:00.000Z
Source: `node .claude/hooks/metrics-report.mjs eb-261101-1211 --save`, also written by the Stop hook after every turn (script-owned: it is overwritten each time; the full per-model bill is in `metrics.json`)

### Skill run cost — eb-261101-1211

| # | Skill | Run | Model | Calls | Tools | Active | Wall | Tokens | In | Out | Cache read | Cache write | Cost |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `expl-bot-discover` | 1/1 | claude-sonnet-5-5 | 34 | 35 | 31.0s | 169.8s | 1,482,917 | 69 | 7,627 | 1,462,606 | 51,446 | $0.50 |
| ↳ | `expl-bot-researcher` _(in row above)_ | background | claude-sonnet-5-5 | 30 | 38 | — | 0.0s | 972,215 | 59 | 5,412 | 955,062 | 45,744 | $0.40 |
| 2 | `expl-bot-research` | 1/1 | claude-sonnet-5-5 | 74 | 101 | 58.3s | 395.1s | 3,878,146 | 155 | 39,749 | 3,692,020 | 157,156 | $1.53 |
| ↳ | `expl-bot-researcher` _(in row above)_ | background | claude-sonnet-5-5 | 24 | 34 | — | 0.0s | 1,171,368 | 52 | 12,247 | 1,092,592 | 48,771 | $0.44 |
| ↳ | `expl-bot-researcher` _(in row above)_ | background | claude-sonnet-5-5 | 20 | 28 | — | 1.4s | 830,835 | 36 | 10,967 | 746,977 | 44,576 | $0.40 |
| ↳ | `expl-bot-researcher` _(in row above)_ | background | claude-sonnet-5-5 | 18 | 32 | — | 0.0s | 864,367 | 37 | 12,171 | 800,706 | 51,005 | $0.37 |
| 3 | `expl-bot-plan` | 1/1 | claude-sonnet-5-5 | 7 | 15 | 145.4s | 138.1s | 737,189 | 13 | 19,243 | 690,475 | 45,669 | $0.47 |
| 4 | `expl-bot-test` | 1/1 | claude-sonnet-5-5 | 148 | 172 | 107.5s | 696.3s | 7,768,284 | 300 | 52,521 | 7,482,243 | 257,364 | $2.67 |
| ↳ | `expl-bot-tester` _(in row above)_ | background | claude-sonnet-5-5 | 29 | 35 | — | 0.0s | 1,025,089 | 55 | 7,502 | 1,001,491 | 44,774 | $0.43 |
| ↳ | `expl-bot-tester` _(in row above)_ | background | claude-sonnet-5-5 | 18 | 28 | — | 0.0s | 713,481 | 39 | 6,109 | 655,015 | 33,095 | $0.31 |
| ↳ | `expl-bot-tester` _(in row above)_ | background | claude-sonnet-5-5 | 25 | 34 | — | 0.0s | 1,127,113 | 57 | 11,572 | 1,089,362 | 42,918 | $0.40 |
| ↳ | `expl-bot-tester` _(in row above)_ | background | claude-sonnet-5-5 | 9 | 11 | — | 0.0s | 352,759 | 20 | 3,415 | 305,284 | 27,904 | $0.15 |
| ↳ | `expl-bot-tester` _(in row above)_ | background | claude-sonnet-5-5 | 13 | 19 | — | 0.0s | 438,265 | 28 | 3,160 | 408,682 | 27,510 | $0.14 |
| ↳ | `expl-bot-tester` _(in row above)_ | background | claude-sonnet-5-5 | 13 | 14 | — | 0.0s | 396,952 | 26 | 4,512 | 368,285 | 27,196 | $0.16 |
| ↳ | `expl-bot-tester` _(in row above)_ | background | claude-sonnet-5-5 | 14 | 17 | — | 0.0s | 387,903 | 27 | 3,542 | 352,325 | 28,190 | $0.19 |
| 5 | `expl-bot-report` | 1/1 | — | — | — | 0.0s | 0.0s | — | — | — | — | — | — |
| 6 | `expl-bot-learn` | 1/1 | claude-sonnet-5-5 | 21 | 30 | 156.4s | 476.8s | 5,516,528 | 60 | 19,068 | 5,667,622 | 27,233 | $1.41 |
| **Σ** | **total** | **6 skill runs** |  | **277** | **350** | **491.3s** | **2217.7s** | **19,387,681** | **613** | **137,339** | **19,142,828** | **552,019** | **$6.71** |

**Tokens and Cost.** Every API call inside the row's window — input, output, cache read and cache write — summed from the session transcript (once per message) plus the subagents launched in it. Cost is an estimate at API list rates as of 2026-10-06: it is not your plan or session-limit usage. `Active` is the time the agent was working (user prompt → stop); `Wall` is launch → last stop of that stage, including questions the stage asked the user. The Σ wall clock is first launch → last stop of the latest session.

Per-skill figures are attributed by time window in one shared conversation: a skill's row covers everything from its launch until the next skill starts.
1 row(s) have no token figures: the session transcript is not on this machine (`~/.claude/projects`) and no saved snapshot covers it, or the window held no model call. Their Active/Wall are still measured.
