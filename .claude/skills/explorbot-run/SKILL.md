---
name: explorbot-run
description: >
  Thin wrapper around the real explorbot CLI (Flow 3: `npm i -D explorbot`, its own models and API key, not the
  Claude Code crew). Runs preflight, then the chosen non-TUI command (config, context, navigate, research, plan,
  explore, test, rerun) and summarises the report it wrote. Can also run a plan.md written by the expl-bot-*
  flow through `explorbot test`. Use when the user says "run explorbot", "use the real explorbot",
  "/explorbot-run explore /products", "run this expl-bot plan with explorbot", or wants a baseline to compare
  the expl-bot-* results against. Needs OPENROUTER_API_KEY (or another provider key) in .env; costs tokens.
---

# explorbot-run

> Recommended settings: **Sonnet · Effort: Low · Extended thinking: Off.** The AI work is done by explorbot's own
> models (OpenRouter by default), not by this session. This skill only runs commands and reads their reports.

Usage: `/explorbot-run <command> [args]`, where `<command>` is one of:

| Command | What it runs | AI calls |
|---|---|---|
| `config` | `npx explorbot config --json` | none (works without a key) |
| `context <path>` | `npx explorbot context <path>` | none, but it refuses to start without the key (the bundled decision model needs `OPENROUTER_API_KEY`) |
| `knows [path]` | `npx explorbot knows [path]` — list the stored knowledge, or the files matching a URL | none |
| `learn <path> "<note>"` | `npx explorbot learn <path> "<note>"` — store a fact in the knowledge folder (user-approved text only) | none |
| `navigate <path>` | `npx explorbot navigate <path>` (exit 1 = unreachable) | little |
| `research <path> [--deep]` | `npx explorbot research <path>` | yes |
| `plan <path> --focus "…" [--style s]` | `npx explorbot plan …` | yes |
| `explore <path> [--focus "…"] [--max-tests N] [--max-duration M]` | `npx explorbot explore …` | yes, the most |
| `test <plan.md> ['*'\|n\|n-m\|n,m,k]` | `npx explorbot test <plan.md> '*'` (selection forms: `1-5`, `1,3,7`) | yes |
| `rerun <file> [n]` | `npx explorbot rerun …` | yes (healing) |
| `bridge <RUN_ID>` | `npx explorbot test .workflow-artifacts/expl-bot/runs/<RUN_ID>/plan.md '*'` | yes |

It is **not** a stage of any pipeline and does not touch `expl1-*` or the `expl-bot-*` artifacts (it only
*reads* a Flow 1 `plan.md` and the Flow 1 knowledge folder).

## Rules

- Only non-TUI commands. The TUI (`start`, slash commands) needs Windows Terminal + WSL; never launch it.
- Run each command as one simple command: `npx explorbot …`, no `cd`, no `&&`/`;`, no env-var prefixes (the URL
  and keys come from `.env` / `explorbot.config.js`, see below). Redirect output into
  `.workflow-artifacts/explorbot/out/<name>.out` and read it with the Read tool.
- **Never trust the exit code for pass/fail.** `explore`/`test` can exit 0 with failed tests. Read the report
  (below) and judge from it. For `navigate`, the exit code is meaningful (0 reachable / 1 not).
- Never print, echo or read back the content of `.env`. To check that a key is set, use Grep with
  `output_mode: count` on `^OPENROUTER_API_KEY=.+` in `.env`.
- Never invent credentials. Login details come from the user in chat: pass them with `--auth '<text>'` for that
  one run (kept in memory by explorbot, never written to disk — `docs/reference/commands.md`, `--auth`) — do not
  put them in `.env` or knowledge files. To make a login repeatable without storing a secret, a knowledge file may
  name the credentials as `${env.NAME}` placeholders (explorbot resolves them from the environment); write such a
  file only with the user's yes, and no selectors in it.
- Flags and commands: answer questions about them from `npx explorbot --help` / `npx explorbot help-json
  <command>` and `node_modules/explorbot/docs/index.json`, not from memory or from this file. If `--help` does not
  show a flag, it does not exist.
- Targets are `/path` (needs the base URL from config or `EXPLORBOT_URL`) or a full `http(s)://` URL. Explorbot
  works on apps with create/edit/delete flows; landing pages, blogs and plain content sites give it little to do —
  say so before a costly run on one.
- Tell the user before an AI-heavy command (`explore`, `test`, `rerun`, `research --deep`): it costs tokens on
  their provider account. Ask once, unless the user already said to run it.
- Data policy: explorbot has its own `dataProtectionRules`, but it is not our own-data-only policy. For a site
  with real data, prefer `bridge`/`test` with a Flow 1 plan (own-data scenarios) over a free `explore`, and say
  so when the user asks for `explore`.
- English, short chat. Stop after the summary.

## Preflight (every run)

1. `npx explorbot --version` → one line. If the command is missing: tell the user to run
   `npm install` in the repo (explorbot is a dev dependency).
2. Key present: Grep count on `.env` as above. Missing → stop and tell the user what to put in `.env`
   (see `.env.sample`: `OPENROUTER_API_KEY`). Do not create the key.
3. `npx explorbot config --json` → read `.workflow-artifacts/explorbot/out/config.out`. Confirm the base URL,
   the models and the three directories (knowledge / experience / output). Report them in two lines.
4. Target URL: from the user, else `EXPLORBOT_URL` / `EXPL_BOT_URL` in `.env` (look with Grep, show only the
   URL). Unknown → ask.
5. Cloud-reporter leak check: explorbot reports through `@testomatio/reporter`, and if `TESTOMATIO` is set it
   uploads the run to that Testomat.io project. Grep count on `.env` for `^TESTOMATIO=.+`, and on
   `explorbot.config.mjs` for `runGroup|cloud`. If anything matches — tell the user the run would be uploaded
   and ask before going on. Never print the key.
6. Reachability, in this order, stopping at the first failure (do not work around it, do not start the app, do
   not guess another URL):
   1. `curl -s -o /dev/null -w "%{http_code}" <base-url>` — `000` means DNS or VPN, `5xx` means the app itself.
   2. `curl -sIL <base-url>` — if a 3xx, 401 or 403 ends on a login URL, the page needs a login: ask the user
      for it (see `--auth`), do not guess.
   3. `npx explorbot navigate <path> --session` — exit 1 → read `<output dir>/explorbot.log` first (the output
      dir is in `config.out`); `--session` saves the cookies to `<output dir>/session.json` for later commands.

## Running

1. Create the output folder by writing `.workflow-artifacts/explorbot/out/README.txt` (Write tool), then run the
   command, e.g.
   `npx explorbot explore /products --max-tests 2 --max-duration 10 > .workflow-artifacts/explorbot/out/explore.out 2>&1`.
2. Read the tail of the `.out` file with Read (use `offset` for the last ~60 lines).
3. Find the report: `<output dir>/reports/<mode>-<session>.md` (Analyst report, for example
   `explore-WiseFox42.md`) and, if enabled, `…-tests.md` / `.html`. Use Glob on
   `.workflow-artifacts/explorbot/output/reports/*` and take the newest file. Read it.
4. Summarise (≤ 15 lines): headline, Coverage, What works, Defects with severity, UX issues, Execution Issues —
   in the report's own words, nothing added. Give the report path. If no report was written, say that, read
   `<output dir>/explorbot.log` (start here on any failure), show the last lines, and stop.

## Bridge mode (`bridge <RUN_ID>`)

Runs a plan written by `expl-bot-plan` through the real explorbot so the two results can be compared.

1. Check `.workflow-artifacts/expl-bot/runs/<RUN_ID>/plan.md` exists and has a `### Prerequisite` URL.
2. Run `npx explorbot test .workflow-artifacts/expl-bot/runs/<RUN_ID>/plan.md '*'` (add `--base-url` only if
   the user gives one).
3. Read the report as above and, if `.workflow-artifacts/expl-bot/runs/<RUN_ID>/report.md` exists, compare in a
   short table: scenario → expl-bot result vs. explorbot result. Differences are findings to show the user, not
   to resolve. Do not edit either report.

## Optional: prima

`npx explorbot prima verify|ask` can drive an already-open playwright-cli browser session (for example the
Flow 1 `expl-<host>` one). It needs the API key too, and explorbot's own field review
(`docs/superpowers/reviews/2026-08-06-prima-vs-playwright-cli.md` in the explorbot repo) concludes
playwright-cli should drive and prima be used only for `verify`/`ask`. Use it only if the user asks, and read
`npx explorbot help-json prima` first.

## Final response

What was run (command, one line), where the output and report are, the summary above, cost note if the log
shows token usage, and what is *not* verified (anything the report marks as Execution Issues).
