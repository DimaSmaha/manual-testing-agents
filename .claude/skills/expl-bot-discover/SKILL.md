---
name: expl-bot-discover
description: >
  Page-discovery stage of the expl-bot exploratory-testing crew. Finds the pages of the same app (links, menu
  entries, the cart/detail pages reached by buttons) in the open playwright-cli session, read-only, and writes
  RUN/pages.md with a status per page (in-scope / skipped-cap / needs-data / external / ignored). Lets the
  orchestrators cover a whole site instead of one page. Use when the user says "find the pages of this app",
  "discover the site", "/expl-bot-discover <url>", or as step 2 of expl-bot-orchestrator when the scope is not
  a single page. Never submits or changes data.
---

# expl-bot-discover

> Recommended settings: **Sonnet · Effort: Medium · Extended thinking: Off** (the clicking happens in a Sonnet
> subagent; this skill only coordinates).

Usage: `/expl-bot-discover <url> [--max-pages N] [--scope site|pick] [--pages "<path>,…"] [--run <RUN_ID>]`

Input — the start page URL (its research file should exist; research it first, deep when possible). Output —
`RUN/pages.md` (format and rules: `.claude/skills/expl-bot-core/references/site-scope.md`) and a summary of
≤ 10 lines in chat.

## Rules

- Read `run-context.md`, `data-protection.md` and `site-scope.md` first.
- Read-only on the app. Navigation clicks only, never a submit; the list of never-clicked controls is in
  `site-scope.md`. Never leave the origin, never log out.
- One browser, one subagent at a time. English, short chat.
- With `--independent`: never ask; return `STOP: …` only for a missing session / login. Discovery failure is not
  fatal: report `SKIPPED` and let the orchestrator fall back to the start page alone.
- Do not research, plan or test here. Stop after the summary.

## Workflow

1. **Resolve** `HOST`, `SESSION`, `RUN_ID`, the start URL and `page-key` (`run-context.md`). With `--pages` and no
   crawl wanted (`--scope pick` with a ready list), write `pages.md` straight from the list (start page = row 1,
   each other path normalised to a `page-key`, status `in-scope`, `Via: user`) and stop.
2. **Browser**: reuse the open session; a login page → Flow 1 asks the user to log in, Flow 2 `STOP: login required`.
3. **Subagent**: launch `expl-bot-researcher` (Agent tool, `subagent_type: expl-bot-researcher`) with
   `MODE: discover`, `SESSION`, `RUN_ID`, `HOST`, `START_URL`, `MAX_PAGES`, the start page's `RESEARCH` path and
   `KNOWLEDGE` paths. Foreground.
4. **Relay**: `NEEDS_USER:` → ask the user (Flow 1) and relaunch. Otherwise check `RUN/pages.md` exists, has the
   start page as row 1 and a `Status` for every row. If not, resume the subagent once with what is missing.
5. **State**: record the pages in `SITE/state.json` → `pages[<page-key>] = { "url": "...", "title": "...",
   "discoveredAt": "<ISO>" }` (add or update; keep the rest of the file).
6. **Report in chat** (≤ 10 lines): counts per status, the in-scope rows (`#`, page-key, URL, via), the rows not
   covered and why, controls that were deliberately not clicked.

## Do not

- Do not click anything that changes data or ends the session; do not submit forms.
- Do not research several pages here; do not open external origins beyond the one click that revealed them.
- Do not edit `pages.md` by hand (only the discoverer writes it; the orchestrator may only flip `in-scope` rows to
  `unselected` after the user's choice, with the Edit tool, and says so).
