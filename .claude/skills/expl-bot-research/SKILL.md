---
name: expl-bot-research
description: >
  Research stage of the expl-bot exploratory-testing crew (explorbot's Researcher on Claude Code). Opens or
  reuses a headed playwright-cli session, has the expl-bot-researcher subagent build a UI map of one page
  (sections, containers, controls with locators verified against the live DOM) and saves it for the planner
  and tester. Use when the user says "research this page", "build a UI map", "/expl-bot-research <url>", or
  as step 2 of expl-bot-orchestrator. Read-only on the app.
---

# expl-bot-research

> Recommended settings: **Sonnet · Effort: Medium · Extended thinking: Off** (the heavy reading happens in a
> Sonnet subagent; this skill only coordinates).

Usage: `/expl-bot-research <url|path> [--deep] [--fresh] [--focus "…"]`

Input — a page URL (absolute, or a path relative to a known base URL in `SITE/knowledge`/`state.json`).
Output — `SITE/research/<page-key>.md` (UI map) and a summary of ≤ 30 lines in chat. The main context never
receives the page's snapshots or the full map.

## Rules

- Read `.claude/skills/expl-bot-core/references/run-context.md` first (names, run, browser, asking the user,
  scratch). Then `ui-map-format.md`.
- Chat messages are short. English.
- With `--independent`: follow "Independent mode" in `run-context.md`; never ask the user, return `STOP: …`.
- Read-only on the app: no submits, no data changes (`data-protection.md`). `--deep` only opens and closes.
- `playwright-cli` only; headed; named session; persistent.
- Do not plan or test here. Stop after the summary.

## Workflow

1. **Resolve** `HOST`, `SESSION`, `RUN_ID` (`run-context.md`). If the URL is unknown — ask the user.
2. **Browser**: reuse or open the session. If the page is a login page — ask the user to log in in the open
   window, wait for "done" (never type credentials unless given in chat).
3. **Memory**: find matching knowledge files; check `SITE/research/<page-key>.md` freshness (< 6 h and same
   `state_key`). Explicit `/expl-bot-research` is always fresh unless the user passed nothing and the cache is
   valid — then say "cache hit" and offer `--fresh`. (Explorbot: explicit research always bypasses the cache; do
   that, unless the caller is the orchestrator, which passes `MODE` itself.)
4. **Subagent**: launch `expl-bot-researcher` (Agent tool, `subagent_type: expl-bot-researcher`) with:
   `SESSION`, `RUN_ID`, `HOST`, `PAGE_URL`, `MODE` (`standard`/`deep`/`fresh`), `FOCUS`, `KNOWLEDGE` paths.
   Foreground (the browser is shared; do not run another browser action meanwhile).
5. **Relay**: if the block contains `NEEDS_USER:` → ask the user, then launch the researcher again (or resume it
   with SendMessage). Otherwise sanity-check the returned block: the file exists, is non-empty, has at least
   one `> Container:` line and a table, and `LOCATORS` has a count. If not, resume the researcher once with
   what is missing; if still wrong, tell the user.
6. **State**: update `SITE/state.json` → `researchedAt[<page-key>]` (ISO time).
7. **Report in chat** (≤ 12 lines): path, purpose, sections with control counts, locator verification
   (`ok/total`), feature areas, risks. Offer the next step: `/expl-bot-plan` (or `--deep` if the page has
   hidden UI that was not explored).

## Do not

- Do not read the research file back into chat; give the summary and the path.
- Do not research several pages in one subagent call; one page, one call.
- Do not mark locators as verified unless the check script said so.
