# Evals for the expl1 stage skills 1-4

The runtime feedback loops (`.claude/hooks/artifact-gate.mjs` + validators + reviewer agents) fix ONE live task's output.
They cannot tell you that an edit to a stage skill made the skill worse: a skill that is wrong 60% of the time still
ships valid files because the gate bounces it. Evals fill that gap. Fixed cases built from real stories run on every
skill change, are scored per criterion, and are diffed per case against a committed baseline.

They measure the **skill**, so the gate is off during an eval (`EXPL1_REVIEW_CHILD=1`, the documented switch that makes
`artifact-gate.mjs` and `agent-metrics.mjs` no-ops). The eval sees the skill's first output, writes no `.validation.json`
and records no metrics events.

## Run

```
npm run eval:typecheck                      # types
npm run eval:selftest                       # free, seconds: the checks catch every known-bad fixture
npm run eval -- --skill expl1-2-requirements-grooming --only TASK-112 --runs 1    # one case, one trial
npm run eval -- --skill all --runs 3 --max-cost-usd 40                            # everything
npm run eval -- --probe-leak                # proves the agent cannot read evals/, .workflow-artifacts/ …
```

Options: `--skill <name|all>`, `--only c1,c2` (one skill), `--runs N` (default 3), `--max-cost-usd N` (stop launching
trials above it; the run is then incomplete, exit 2), `--timeout-min N` (default 20), `--update-baseline --reason "…"
[--allow-decrease]`. Uses the local Claude Code login or `ANTHROPIC_API_KEY`. Real model calls: stage 2 runs on Opus.

Exit code: `0` no regression · `1` a case that passed in the baseline fails now, the cases changed since the baseline,
or a baseline rule was broken · `2` bad input or incomplete run. A deterministic failure of a case that already failed in
the baseline is not a regression. LLM criteria only print a WARN.

## Layout

```
evals/
  run-eval.ts                  the CLI (one shared runner; the per-skill folders hold data and checks only)
  lib/                         run-skill (Agent SDK trial), stub-tracker, md (parser), validators (structure), llm-judge, baseline, report
  <skill>/cases.jsonl          {id, key, kind, input, expected, criteria, model?, tags}; `expected` is the case's ground
                               truth (stage 1: title, literals, counts; stage 2: goal, context_requirements, min_problems;
                               stage 3: reqs; stage 4: reqs, min_test_cases). The structure check also derives the same
                               facts from the input and fails with "case expects …" when the two disagree.
  <skill>/inputs/<case>/       frozen input: tracker.json (stage 1) or the previous stage's file (stages 2-4)
  <skill>/checks.ts            deterministic criteria (the hard gate)
  <skill>/grader.md            LLM criteria, one `### <id>` section each (warning only)
  <skill>/baseline.json        last accepted result, committed
  self-test/                   known-bad fixtures: every check must fail them; real runs must pass;
                               gate-parity.ts compares our structure validators with the feedback-loop ones
  results/                     git-ignored: <timestamp>/{results.json, report.md, trials/…}
.eval-runs/                    git-ignored sandbox run folders <skill>-<case>-<trial>/
```

Skills: stage 1 (5 cases: TASK-111 is the empty record that must `STOP:`, TASK-112/113/114, BUG-114), stages 2-4 (TASK-112/113/114
and, once the chain is frozen, BUG-114). Grow the set from real failures (see step 8 below).

## How a trial runs

- Agent SDK `query()` from the repo root with `settingSources: ["project"]`, `permissionMode: "dontAsk"` and a small
  `allowedTools` list; the model and effort are each skill's recommended setting (stage 2 Opus + thinking, others Sonnet).
- The prompt is the real stage call: `/expl1-<n>-… --run-dir .eval-runs/<skill>-<case>-<trial> --autonomous <KEY>`
  (+ `--base http://127.0.0.1:<port>` for stage 1).
- Stage 1 reads a **stub tracker** (`lib/stub-tracker.ts`) that serves the committed `tracker.json` like the live one
  (the live tracker has random 5xx). Stages 2-4 get the frozen previous artifact copied into the run folder.
- Write/Edit are allowed in `.eval-runs/` only. `Read` of `evals/**`, `.workflow-artifacts/**`, `Execution_Examples/**`,
  `.claude/hooks/test/fixtures/**`, `docs/**` and `.git/**` is denied, so expected answers and past runs cannot leak
  (`--probe-leak` proves it). Trials run one after another and a finished folder is moved to `results/…/trials/`,
  so a trial never sees another trial's output.
- An error or timeout makes the trial `ERROR`: counted as a fail, flagged, never retried.

## Pass rules

A trial passes when every deterministic criterion passes. A case passes at ≥ ⅔ of its trials (1 of 1, 2 of 2, 2 of 3).
Deterministic criteria (the evals' own structure validators in `lib/validators.ts` + regex/count checks) are the hard
gate. They share no code with the feedback loops, so a hook change cannot move a baseline; only the stage 4 judge
reuses the existing reviewer agent, and the self-test (`gate-parity.ts`) is the one place that imports the hook
validators, to prove both implementations agree on every fixture. LLM criteria (`grader.md`,
judged by Haiku with thinking on, binary PASS/FAIL + evidence; for stage 4 also the existing `expl1-test-cases-reviewer`
through `reviewWithSubagent`) only warn. The stage 4 reviewer already judges coverage, contradictions and invention, so
`grader.md` of stage 4 only adds the step/assertion separation it does not cover.

## Baseline rules

- `baseline.json` keeps `cases_hash` (cases.jsonl + all inputs), per-case results, history, `reason`.
- A different hash means the numbers are not comparable: re-run all cases with `--update-baseline --reason`.
- Regression = a case that passed in the baseline and fails now, even if the average rose.
- The baseline moves up freely with `--update-baseline --reason "…"`; down only with `--allow-decrease` and a reason.
  A partial `--only` run merges only its cases and cannot replace a baseline whose cases changed.
- Changing a check in `checks.ts` can change outcomes without changing the hash: run `eval:selftest`, then re-baseline
  with a reason that names the check.

## Workflow when a case fails

1. **Read the evidence.** The report lists failures by criterion (which rule breaks, in how many trials) and the quoted
   evidence of the first failing trial. The trial folder is in `results/<ts>/trials/` (output, `_reply.txt`, `_trace.jsonl`).
2. **Group by criterion**, not by case: a criterion failing in every case is a skill rule problem; in one case, a data
   or wording problem.
3. **Diagnose why** the skill did it: open the SKILL.md / reference passage the criterion maps to. Missing rule, rule
   buried, rule contradicted by another passage, or example that teaches the opposite.
4. **Smallest edit** that fixes the cause, with a Bad / Good example in the skill text when the rule is about wording.
5. **Re-run only the failed cases** (`--only`), then the **full run** to catch regressions elsewhere.
6. **Update the baseline** with `--update-baseline --reason "what changed and why"`.
7. **Check flakiness**: re-run twice; if a case flips between runs, tighten the criterion or raise `--runs` before committing.
8. **Promote the failure to a case**: add the input that exposed it to `cases.jsonl` (+ `inputs/`), and a known-bad
   fixture to `self-test/cases.ts` so the check stays calibrated.

Do not edit the stage skills, hook validators or reviewer agents from here: their contract is unchanged (a validator
change already needs fixture updates, see CLAUDE.md "Feedback loops"). When a stage output template changes, update
`lib/md.ts` / `lib/validators.ts` here as well as the hook parser; `eval:selftest` fails if the two disagree.
