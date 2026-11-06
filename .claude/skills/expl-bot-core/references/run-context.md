# Run context (shared by every expl-bot-* skill, so each can run on its own)

## Names

| Name | Value |
|---|---|
| `BASE` | `.workflow-artifacts/expl-bot` |
| `HOST` | hostname of the app URL, with the port when it is not 80/443, dots and colons kept as `-`: `localhost:3000` → `localhost-3000`, `app.example.com` → `app-example-com` |
| `SESSION` | `expl-<HOST>` (the user's own tag wins). Always headed + `--persistent` |
| `RUN_ID` | `eb-YYMMDD-HHMM` (local time of the run start) |
| `RUN` | `BASE/runs/<RUN_ID>` |
| `SITE` | `BASE/sites/<HOST>` |

## Which run?

1. A stage skill called by the orchestrator gets `RUN_ID` in its prompt. Use it.
2. Called on its own: use the `RUN_ID` the user names; else the newest `BASE/runs/*` folder **if the user is
   continuing the same job**; else create a new run. State which one you use in the first chat line.
3. Creating a run = writing `RUN/meta.md` with the Write tool (it creates the folders):
   `RUN_ID`, start time, app URL, `HOST`, `SESSION`, style, focus, `--from` key, `--max-tests`, scope
   (`page|pick|site`), `--max-pages`, `--pages`. Never delete or overwrite an existing run folder except for the
   single artifact the stage owns (re-running a stage deletes and recreates ITS file; it never merges).

`RUN/pages.md` (written by `expl-bot-discover`) lists the pages of a multi-page run; scope, discovery, the
per-page loop and the page/test/time budgets are in `site-scope.md`.

## Browser

1. `playwright-cli list`. If `SESSION` is running — reuse it. Do not open a second browser.
2. Otherwise `playwright-cli -s=<SESSION> open <url> --headed --persistent`.
3. `snapshot` and decide whether it is a login/consent page. Login → ask the user (below). Never type
   credentials unless the user gave them in this chat; never invent them.
4. Close only at the very end and only after asking the user (`expl-bot-orchestrator`, last step).
   `delete-data` only on request.

## Asking the user for help (interactive flows)

Short chat message, say exactly what you need and what you will do next. Ask when: login / 2FA / captcha / SSO,
the page URL is unknown, a precondition needs data the scenario cannot create itself, a step is ambiguous, the
page differs from what the plan describes, or anything could change pre-existing data. After "done":
`snapshot` and continue; do not repeat what the user already did. If the user cannot help: mark the item
`BLOCKED` with the reason.

Subagents never ask. They return `NEEDS_USER: <what>`; the calling skill relays it to the user.

## Loading memory before work

1. Knowledge: every `SITE/knowledge/*.md` whose frontmatter `url:` pattern matches the page URL (and `*`). Pass
   the **paths** to subagents, not the contents.
2. Experience: `SITE/experience/<page-key>.md` if it exists — pass the path; consumers read the TOC.
3. Research: `SITE/research/<page-key>.md` if it exists and is fresh (see `ui-map-format.md`, "Cache").
4. `SITE/state.json`: style rotation + tested scenarios (create it when missing: `{"styleIndex":0,"testedScenarios":{},"researchedAt":{}}`).

## Scratch

`RUN/scripts/` and `RUN/out/` are scratch. Write every script with the Write tool, run each with one simple
command (no `cd`, no `&&` / `;`, no env prefixes, no paths outside the repo), redirect output into `RUN/out/`
and read it with Read. When the whole job is done, delete only the scratch files you created, keep `plan.md`,
`results/`, `report.md`, `screenshots/` and everything under `SITE/`. Never delete `BASE` or a run folder. Check
`git status --porcelain` shows nothing new (everything is under the git-ignored `.workflow-artifacts/`, plus
`tests/expl-bot/` when the historian output was requested).

## Independent mode (`--independent`, Flow 2)

`expl-bot-independent-orchestrator` passes `--independent` to every stage skill (and states it in subagent
prompts). It means the run is headless-capable and **nobody answers questions**. Every "ask the user" rule
above is replaced by:

1. **Never ask the user.** A missing required input (URL, auth, base URL, plan) → stop the stage and report
   `STOP: <exactly what is missing>`; the orchestrator ends the run. Do not guess it.
2. **Browser**: headless unless `--headed`. `playwright-cli -s=<SESSION> open <url> [--headed] --persistent`.
   If `SITE/auth.json` exists run `playwright-cli -s=<SESSION> state-load SITE/auth.json` right after opening and
   reload the page.
3. **Login**: if the page is still a login/consent page, read `EXPL_BOT_AUTH` once with `printenv EXPL_BOT_AUTH`
   (free-form text; keep it in memory only, never write it to any file, plan, result, report or knowledge). If it
   contains credentials for this app, log in once; otherwise `STOP: login required`. Never guess credentials.
4. **Plan approval is skipped**: the plan is accepted as written. A bare-keyword `--focus` is restated by the
   planner itself and recorded in the plan header.
5. **Blockers (Captain rule)**: a `NEEDS_USER:` from a subagent, or any blocker, gets **one** attempt to unblock
   (dismiss popup, `reload`, another route to the page, a knowledge hint) by resuming the subagent with a
   `NEXT:`. If it is still blocked, mark the scenario `BLOCKED` with the reason, record it and move on. Never
   wait for the user.
6. **Budgets**: `--max-tests N` (default 5 for one page, 3 per in-scope page up to 24 for a site run),
   `--max-duration M` minutes (default 30 for one page, 60 for a site run) and `--max-pages N` (default 8).
   Before each scenario check the elapsed time (`date +%s` against the start stored in `RUN/meta.md`); over
   budget → stop starting new scenarios and go on to the report.
   **Scope**: the default is `--scope site` (`site-scope.md`); the run never asks which pages. `pick` is treated
   as `site`. A page that cannot be researched is `SKIPPED`, only the start page can stop the run.
7. **Scratch stays**: do not delete `RUN/scripts/` and `RUN/out/` (they live in the git-ignored run folder).
8. **Output protocol**: at the end of each phase the orchestrator emits one `<!-- PHASE COMPACT: <label> -->`
   JSON block; stage skills only return their normal summaries.
9. **Data policy is unchanged**: own data only. Without a human to decide, any doubt means read-only/BLOCKED.

## Chat style

English, short. No invented data. Do not answer questions that stage skills ask the user on the user's behalf.
