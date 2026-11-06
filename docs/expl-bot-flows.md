# expl-bot: what it is and example flows

How the three exploratory flows work in practice, with example sessions for each orchestrator and for the
single skills. For the rules and formats see `.claude/skills/expl-bot-core/`; for the one-page overview see the
README section "Exploratory flow: `expl-bot-*`".

> **The sessions below are illustrative.** They use an invented app (`http://localhost:3000/products`) to show
> the shape of each step and file. None of it is output of a real run: the flows have not been run end to end on
> a real app yet (only the `run-code` scripts, the runner's input checks and `explorbot config --json` were
> exercised).

---

## 1. What expl-bot is (and is not)

**Is:** an exploratory-testing crew for one page or area, ported from [explorbot](https://github.com/testomatio/explorbot).
It looks at the live page, decides *what is worth testing*, runs those scenarios in a real browser, and reports
what it found. Claude Code is the brain, `playwright-cli` the hands.

**Is not** "exploratory testing and test-case creation in parallel". It is a **sequence**, and the two things you
may be thinking of fit into it like this:

| You might expect | What actually happens |
| ---------------- | --------------------- |
| Test-case creation | **Step 3 (plan)** writes a list of *scenarios* (title, steps, expected results, priority). That is the nearest thing to test cases, but it is explorbot's lightweight format (`plan.md`), with no tracker IDs, no `TC-n` numbering, no linking to a tracker. For formal, traceable test cases use the `expl1-*` pipeline. |
| Exploring at the same time | Planning comes **before** execution and scenarios run **one at a time**. There is one browser, and subagents cannot spawn subagents, so nothing runs in parallel. "Exploring" happens inside each scenario (the tester adapts to what the page really shows and records discoveries) and in the research step. |
| Runnable automated tests | **Optional step 5:** `/expl-bot-report --tests` turns the *passed* scenarios into draft `tests/expl-bot/*.spec.ts`. These are a byproduct of execution, not generated up front. |
| Learning | **Step 6** stores what worked (`experience`) and human facts (`knowledge`). The next run reads them, which is why a second run behaves differently from the first. |

Where the work happens:

```
 main chat session (Opus)            subagents (Sonnet, own context, one at a time)
 ─────────────────────────           ───────────────────────────────────────────────
 Captain / Planner / Pilot /         expl-bot-researcher  → UI map of the page
 Analyst                             expl-bot-tester      → executes ONE scenario
        │                                     ▲
        └─ launches stage skills ─────────────┘          browser: playwright-cli, headed, session expl-<host>
```

### expl-bot versus expl1

| | `expl1-*` | `expl-bot-*` |
| - | --------- | ------------ |
| Starts from | a ticket (task or bug) and a PR | a URL of a page or area |
| Question it answers | "Does this change satisfy its requirements?" | "What works and what is broken on this page?" |
| Test cases | formal, numbered, traced to `REQ-n` | scenarios in a plan, generated from the live page (optionally grounded in expl1 with `--from`) |
| Needs | tracker, `gh`, PR | a running app (and a login, if it has one) |
| Result | per-test-case verdicts, impact analysis | defects / UX issues / execution issues, experience for the next run |

They complement each other: run `expl1` for the ticket, then `expl-bot --from TASK-112` to go beyond the
documented behaviour.

### The three flows

| Flow | Entry point | Who answers questions | Models / cost |
| ---- | ----------- | --------------------- | ------------- |
| 1 · semi-auto | `/expl-bot-orchestrator <url>` in this chat | you (login, plan approval, ambiguities) | Claude Code session; no extra key |
| 2 · unattended | `npm run expl-bot:run -- <url>` or `/expl-bot-independent-orchestrator` | nobody: missing input = stop and report | Claude Agent SDK (API key or local login) |
| 3 · explorbot as-is | `/explorbot-run <command>` | explorbot's own agents | explorbot's models via OpenRouter (your key) |

---

## 2. Skills at a glance

| Skill | Role in explorbot | Input | Output | Run it alone when… |
| ----- | ----------------- | ----- | ------ | ------------------ |
| `expl-bot-research` | Researcher | URL | `sites/<host>/research/<page-key>.md` | you want a UI map with tested locators, or to check what a page offers |
| `expl-bot-plan` | Planner | research file | `runs/<RUN_ID>/plan.md` | you want scenarios to read/edit/hand to someone, without running them |
| `expl-bot-test` | Tester + Pilot | `plan.md` or one pasted scenario | `runs/<RUN_ID>/results/<n>.md` | you have a plan (yours or generated) and want it executed |
| `expl-bot-report` | Analyst + Historian | results | `report.md` (+ `tests/expl-bot/*.spec.ts`) | a run finished and you want the write-up |
| `expl-bot-learn` | `learn`, Historian experience, compactor | a run, or a fact | `knowledge/`, `experience/` | you want the next run to know something |
| `expl-bot-orchestrator` | Captain | URL | all of the above | you want the whole thing with checkpoints |
| `expl-bot-independent-orchestrator` | Captain, headless | URL (+ saved login) | all of the above + PHASE COMPACT log | you want it unattended |
| `explorbot-run` | wrapper | a command | explorbot's reports | you want the real explorbot, or a baseline to compare with |
| `expl-bot-core` | — | — | — | not a stage; shared rules and scripts |

---

## 3. Example flows

Conventions: `host` = `localhost-3000`, `RUN_ID` = `eb-261106-1432`, `page-key` = `products`. All paths are under
`.workflow-artifacts/expl-bot/`.

### A. Full semi-auto run on a CRUD page (Flow 1)

```
/expl-bot-orchestrator http://localhost:3000/products --focus "Product catalog: create, edit, search and delete products; leave user and billing settings alone" --max-tests 4
```

**Step 1 · Preflight.** The orchestrator opens a headed, persistent browser:
`playwright-cli -s=expl-localhost-3000 open http://localhost:3000/products --headed --persistent`, and writes
`runs/eb-261106-1432/meta.md`. The page is a login screen, so:

> Please log in in the open browser window and tell me when you are on the products page.

You log in, type `done`. It says:
`Knowledge: 0 files · Experience: no · Research cache: none · Style: normal · Session: expl-localhost-3000 · Run: eb-261106-1432`

**Step 2 · Research** (subagent `expl-bot-researcher`, you see only the summary):

```
RESEARCH: sites/localhost-3000/research/products.md
PAGE: /products | Products | CACHE: miss | mode: standard
PURPOSE: Product catalogue where staff create, edit, search and delete products.
SECTIONS: overlay (none), list (12 controls, .product-list), content (6 controls, .filter-form), navigation (5)
LOCATORS: 27/29 verified, 2 fixed, 0 unverified; containers 3/3
FEATURE AREAS: create product, edit product, delete product, search/filter, sort
RISKS: 'Delete all' button in toolbar; Settings and Billing links
```

**Step 3 · Plan.** Style `normal`. The orchestrator shows a compact table and **waits**:

| # | priority | outcome | scenario |
| - | -------- | ------- | -------- |
| 1 | critical | data | Create a product named `eb-261106-1432 Product A` and find it in the list |
| 2 | important | data | Create `eb-261106-1432 Product B`, rename it to `… Product B2`, and see the new name in the list |
| 3 | important | data | Create `eb-261106-1432 Product C`, delete it, and see it gone from the list |
| 4 | high | state | Search the list for `eb-261106-1432` and see only the products this run created |

You answer: `drop 4, make 3 high`. The plan file is updated. Nothing runs until you approve.
`plan.md` (explorbot format):

```markdown
<!-- suite -->
# Exploration plan — localhost-3000 / products — normal — eb-261106-1432

### Prerequisite

* URL: /products

<!-- test
priority: critical
-->
# Create a product named with the run id and find it in the list
<!-- area: products · outcome: data -->

## Requirements
/products

## Steps
* Click 'New product'
* Fill 'Name' with "eb-261106-1432 Product A"
* Click 'Save'
* Search the list for "eb-261106-1432 Product A"

## Expected
* The product "eb-261106-1432 Product A" appears in the list
* A success message is shown
```

Note how every scenario that edits or deletes **creates its own target first**, named with the run id. The run
never touches products that were already there.

**Step 4 · Test.** One tester at a time; after each scenario you get one line:

```
S1 PASSED — Create a product named with the run id and find it in the list
S2 PASSED — Create, rename and re-check a product
S3 FAILED — Create and delete a product
```

The tester's returned block for S3 (also saved to `runs/eb-261106-1432/results/3.md`):

```
STATUS: FAILED
SCENARIO: Create and delete a product
EXPECTED:
- [PASSED] The product "eb-261106-1432 Product C" appears in the list — found in .product-list after Save
- [FAILED] The product is no longer in the list after deletion — still listed after confirming 'Delete'; reload shows it too
CREATED:
- eb-261106-1432 Product C
DELETED/EDITED (own data only):
- none
NOTES:
> Confirm dialog says "Delete 1 item?" but the item name is not shown
> console: 500 on DELETE /api/products/57
CODE:
await page.getByRole('button', { name: 'New product' }).click();
…
STATE_KEY: /products|-|Products>Filters
```

**Step 5 · Report** (`runs/eb-261106-1432/report.md`):

```markdown
# Exploration report — localhost-3000 · eb-261106-1432

Products can be created and renamed, but deleting a product fails on the server and leaves it in the list.

## Coverage
- Pages: /products
- Features: create, rename, delete, list

## What works
- **Create product** — `S1 Create a product named with the run id and find it in the list`
- **Rename product** — `S2 Create, rename and re-check a product`

## Defects

### [High] Deleting a product returns a server error and the product stays
Affects: `S3 Create and delete a product`
Reproduce:
  1. Click 'New product', save a product
  2. Click 'Delete' on it and confirm
Evidence: DELETE /api/products/57 returned 500; the product is still listed after reload

## UX issues
- **Delete dialog** — does not show which item is being deleted (`S3 Create and delete a product`)

## Data created by this run
- eb-261106-1432 Product A — left in place
- eb-261106-1432 Product B2 — left in place
- eb-261106-1432 Product C — left in place (delete failed)
```

**Step 6 · Learn.** Passed flows go to `sites/localhost-3000/experience/products.md` as `## FLOW:` blocks (steps,
working code, `>` discoveries), and `state.json` records the scenarios so the next plan doesn't repeat them.

**Step 7 · Wrap-up.** It offers to save the login state for headless runs
(`sites/localhost-3000/auth.json`, your yes required), then asks whether to close the browser, and removes its
scratch (`scripts/`, `out/`).

### B. The same thing, one skill at a time

Use this when you want control, or to reuse a step.

```
/expl-bot-research http://localhost:3000/products --deep   # UI map incl. hidden menus and modals (opens/closes only)
/expl-bot-plan --focus "Product catalog: create and delete" --max-tests 3
#   → shows the plan, you edit/approve
/expl-bot-test runs/eb-261106-1432/plan.md '*'               # or '1,3' to run only some scenarios
/expl-bot-report --tests                                      # report + draft Playwright tests for passed scenarios
/expl-bot-learn experience                                    # save what worked
```

Run one pasted scenario without a plan:

```
/expl-bot-test "A user can sort products by price and the order changes" --url http://localhost:3000/products
```

### C. Second run: a different style, no repeats

Run the orchestrator again on the same page. `state.json` says the last style was `normal`, so this run uses
`curious`:

- The planner reads the research and the experience FLOW titles, finds controls that were never touched in the
  earlier scenarios (for example the category select, the stock checkbox, the "Tags" side panel recorded as a
  `>` discovery) and builds scenarios around them that still end in a data or state change.
- Scenarios that duplicate earlier ones are dropped.
- The third run uses `psycho`: every reachable control in the form gets a different strange value (empty, very
  long, unicode, HTML) in the same scenario, then the form is committed.

Force a style when you want one: `--style psycho`.

### D. Grounded in an expl1 ticket

```
/expl-bot-orchestrator http://localhost:3000/products --from TASK-112 --max-tests 6
```

If `.workflow-artifacts/TASK-112/TASK-112-2-requirements.md` and `-4-test-cases.md` exist, about 70% of the
scenarios exercise documented behaviour (the plan cites `REQ-3`, `TC-7` under the scenario) and about 30% explore
beyond it. The expl1 files are only read, never changed. If they are missing it says so and plans from the page.

### E. A scenario gets stuck (the Pilot at work)

The tester cannot find the 'Export' control on the detail page and has used its actions:

```
STATUS: STUCK
STUCK_REASON: 'Export' not found in the detail view after 2 attempts (snapshot, find)
LAST_ACTIONS: …
```

The main session acts as Pilot. It matches the situation against `pilot-stuck-patterns.md` (capability missing?
overlay? wrong page?) and replies with two lines, then resumes the same tester:

```
PROGRESS: The detail page has no 'Export'; the list row menu might.
NEXT: Open the row's '…' menu on the list page and look for 'Export'; if it is not there, record "capability missing".
```

At most two resumes per scenario. After that it stays `STUCK` (reported under *Execution Issues*, not as a
defect) and the run moves on. If the capability simply does not exist, the tester returns `BLOCKED: capability
missing`.

### F. Unattended run (Flow 2)

One-time setup: `cp .env.sample .env`, set `EXPL_BOT_URL`; log in once in Flow 1 and answer *yes* to "save login
state" (or set `EXPL_BOT_AUTH`, see README).

```
npm run expl-bot:run -- http://localhost:3000/products --max-tests 2 --max-duration 15
```

Terminal output (shape):

```
══ /expl-bot-independent-orchestrator http://localhost:3000/products --max-tests 2 --max-duration 15
  [TOOL] Bash playwright-cli -s=expl-localhost-3000 open …
┌─ PHASE COMPACT: Phase 0 init            status: SUCCESS   auth: state-file
┌─ PHASE COMPACT: Phase 1 research        status: SUCCESS   locators_ok: 27  locators_total: 29
┌─ PHASE COMPACT: Phase 2 plan            status: SUCCESS   style: normal  scenario_count: 2
┌─ PHASE COMPACT: Phase 3 test [scenario 1]  status: SUCCESS   result: PASSED
┌─ PHASE COMPACT: Phase 3 test [scenario 2]  status: FAILED    result: FAILED
┌─ PHASE COMPACT: Phase 3 summary         status: SUCCESS   passed: 1  failed: 1
┌─ PHASE COMPACT: Phase 4 report          status: SUCCESS   defects_high: 1
EXPL-BOT RUN COMPLETE   Turns / Duration / Cost …
```

Differences from Flow 1: no plan-approval checkpoint; headless unless `--headed`; a blocker gets one attempt to
unblock, then the scenario is `BLOCKED` and the run moves on; a login that needs a human means
`STOP: login required` and exit code 2. Exit codes: `0` ok · `2` bad input, error or stopped early · `3` fatal ·
`130` Ctrl+C. The browser session is closed in every case.

The same orchestrator can be invoked in chat (`/expl-bot-independent-orchestrator <url> …`) when you want an
unattended run without the script.

### G. Real explorbot, and comparing the two (Flow 3)

```
/explorbot-run config                                  # models and dirs, works without a key
/explorbot-run navigate /products                      # reachable? (exit 1 = no)
/explorbot-run explore /products --max-tests 2 --max-duration 10
```

It runs `npx explorbot explore …`, finds the newest `.workflow-artifacts/explorbot/output/reports/explore-*.md`,
and summarises it. **Bridge mode** runs a plan that Flow 1 wrote through the real explorbot, so you can compare:

```
/explorbot-run bridge eb-261106-1432
```

Result: a short table of scenario → expl-bot result vs. explorbot result. Differences are shown to you, not
resolved. Needs `OPENROUTER_API_KEY` in `.env`; costs tokens on your OpenRouter account.

### H. Teach it a fact

```
/expl-bot-learn knowledge "/products*" "Staff accounts can delete only products without orders; the Delete button is disabled otherwise"
```

Writes `sites/localhost-3000/knowledge/products-all.md` with `url:` frontmatter. Researcher, planner and tester
read it on the next run, and so does explorbot in Flow 3 (same folder). Do not put passwords there; log-in
details go in chat for one run, or in `EXPL_BOT_AUTH`.

---

## 4. Choosing

| You want… | Use |
| --------- | --- |
| Verify a ticket's requirements against a PR and the UI | `expl1-orchestrator` |
| Find out what is broken on a page, interactively | `expl-bot-orchestrator` |
| The same on a schedule / without you | `npm run expl-bot:run` |
| A readable list of scenarios only | `/expl-bot-research` + `/expl-bot-plan` |
| Re-run or extend an earlier plan | `/expl-bot-test <plan.md>` / `--style` |
| Automated regression tests from what passed | `/expl-bot-report --tests` |
| A second opinion from the real explorbot | `/explorbot-run explore` or `bridge` |

## 5. Limits worth knowing

- **Not run on a real app yet.** Rules and skills were written against explorbot's sources; the scripts and the
  runner's input handling were tested on a local page. Expect to tune things on the first real run.
- **Own data only.** Edits and deletes happen only on records the run created (named with the run id). Pages
  whose purpose is to change existing data (user management, billing, settings) are planned read-only, or
  reported as `BLOCKED`. Created records are listed in the report so you can remove them.
- **Sequential.** One tester at a time, so a run with many scenarios takes a while; use `--max-tests` and
  `--max-duration`.
- **Resuming a stuck tester** relies on `SendMessage`; if it is unavailable the skill starts a new tester with a
  short summary instead.
- **Playwright draft tests** are drafts. They are not run against your app unless you ask, and they use the run
  id in names, so adapt them before putting them into a regression suite.
- **Flow 3** needs `OPENROUTER_API_KEY` for every command, and explorbot's own data protection is looser than the
  own-data-only rule above.
