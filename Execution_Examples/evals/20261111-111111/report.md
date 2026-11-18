# expl1 skill evals

Started 2026-11-11T11:11:11.000Z · total 4,173,019 tok (in 36,604 · out 60,357 · cache r 3,340,052 · cache w 736,006) · est. API cost $3.45 · test time 6m 32s (sum of all trials) · wall clock 7m 17s

No regressions against the baselines.

## expl1-1-task-context

pass rate 100% (5/5 cases, 1 trial(s) each, a case passes at 1) · 1,751,608 tok (in 8,479 · out 13,534 · cache r 1,489,254 · cache w 240,341) · est. API cost $1.10 · time 1m 45s (21s per trial) · cases_hash 50c35e1d64564800

No baseline yet (`--update-baseline --reason "…"` creates it).

| Case | Result | Trials | Baseline | Time (all trials) | Per trial | Est. cost | Tokens | In | Out | Cache read | Cache write |
|---|---|---|---|---|---|---|---|---|---|---|---|
| TASK-111 | pass | 1/1 | - | 13s | 13s | $0.25 | 284,220 | 11 | 1,098 | 237,636 | 45,475 |
| TASK-112 | pass | 1/1 | - | 26s | 26s | $0.22 | 372,017 | 1,999 | 2,602 | 317,713 | 49,703 |
| TASK-113 | pass | 1/1 | - | 20s | 20s | $0.21 | 372,575 | 2,030 | 2,964 | 317,814 | 49,767 |
| TASK-114 | pass | 1/1 | - | 25s | 25s | $0.22 | 362,900 | 2,451 | 3,914 | 308,298 | 48,237 |
| BUG-114 | pass | 1/1 | - | 22s | 22s | $0.20 | 359,896 | 1,988 | 2,956 | 307,793 | 47,159 |

_Time: each trial end to end (skill run + checks + judges), summed over the case's trials; "Per trial" lists them in order. Tokens: every API call of the skill run and its judges, summed over the case's trials; same fields as the run metrics report (`<KEY>-metrics.md`). Est. cost is an API list-price estimate, not plan usage._

### LLM criteria failed (warning only)

- **s1.llm-no-invention** failed 4/4 trials (TASK-112, TASK-113, TASK-114, BUG-114) — [TASK-112#1] The context file adds values that the tracker record does not contain. The header line 'Source: http://127.0.0.1:3000/tasks/112' gives a URL and port that appear nowhere in the tracker JSON, which has only id, title, description and type. The header line 'Generated: 2026-11-11' gives a date that is also absent from the tracker record. The remaining content (title, type 'story', goal and requireme

## expl1-2-requirements-grooming

pass rate 100% (3/3 cases, 1 trial(s) each, a case passes at 1) · 678,302 tok (in 7,760 · out 8,153 · cache r 537,050 · cache w 125,339) · est. API cost $0.58 · time 1m 05s (22s per trial) · cases_hash 6dd76bbe19e83b08

Baseline 100% → now 100%.

| Case | Result | Trials | Baseline | Time (all trials) | Per trial | Est. cost | Tokens | In | Out | Cache read | Cache write |
|---|---|---|---|---|---|---|---|---|---|---|---|
| TASK-112 | pass | 1/1 | same | 24s | 24s | $0.12 | 222,803 | 2,306 | 2,248 | 189,575 | 28,674 |
| TASK-113 | pass | 1/1 | same | 19s | 19s | $0.23 | 228,685 | 2,249 | 2,167 | 175,798 | 48,471 |
| TASK-114 | pass | 1/1 | same | 22s | 22s | $0.23 | 226,814 | 3,205 | 3,738 | 171,677 | 48,194 |

_Time: each trial end to end (skill run + checks + judges), summed over the case's trials; "Per trial" lists them in order. Tokens: every API call of the skill run and its judges, summed over the case's trials; same fields as the run metrics report (`<KEY>-metrics.md`). Est. cost is an API list-price estimate, not plan usage._

### LLM criteria failed (warning only)

- **s2.llm-no-invention** failed 2/3 trials (TASK-112, TASK-114) — [TASK-112#1] The chat reply states: "The validation hook gave no feedback after the write." The context file mentions no validation hook, no write operation and no feedback behavior. It describes product behavior the context does not give, and it is not tied to any real gap, ambiguity or conflict in REQ-1, REQ-2 or REQ-3. The same reply also reports "AUTO-DECISION: 6 grooming questions left unanswered", but it

## expl1-3-qa-checklist

pass rate 100% (3/3 cases, 1 trial(s) each, a case passes at 1) · 707,125 tok (in 8,424 · out 11,450 · cache r 535,303 · cache w 151,948) · est. API cost $0.70 · time 58s (19s per trial) · cases_hash 105a657715fe3f17

No baseline yet (`--update-baseline --reason "…"` creates it).

| Case | Result | Trials | Baseline | Time (all trials) | Per trial | Est. cost | Tokens | In | Out | Cache read | Cache write |
|---|---|---|---|---|---|---|---|---|---|---|---|
| TASK-112 | pass | 1/1 | - | 18s | 18s | $0.19 | 233,139 | 2,283 | 2,825 | 178,408 | 49,623 |
| TASK-113 | pass | 1/1 | - | 14s | 14s | $0.25 | 233,511 | 2,484 | 2,940 | 178,251 | 49,836 |
| TASK-114 | pass | 1/1 | - | 25s | 25s | $0.25 | 240,475 | 3,657 | 5,685 | 178,644 | 52,489 |

_Time: each trial end to end (skill run + checks + judges), summed over the case's trials; "Per trial" lists them in order. Tokens: every API call of the skill run and its judges, summed over the case's trials; same fields as the run metrics report (`<KEY>-metrics.md`). Est. cost is an API list-price estimate, not plan usage._

### LLM criteria failed (warning only)

- **s3.llm-atomic** failed 1/3 trials (TASK-114) — [TASK-114#1] Worst offender REQ-2.3: "The cart is available on the product details page (cart icon/button and 'Add to cart' button)." This joins two separately verifiable elements, the cart icon/button and the 'Add to cart' button, under one pass/fail, so it could be partially pass. REQ-2.1 also joins navigation with separateness ("navigates the user to a product details page, separate from the inventory page"
- **s3.llm-no-invention** failed 1/3 trials (TASK-112) — [TASK-112#1] REQ-2.2: "The inline error message text states the reason for the failure." The requirement only says "Users see clear inline error states"; it does not state that the message must give a reason for the failure. This adds a content requirement (message must explain the cause) that the requirement does not state. REQ-3.1's URL check is a reasonable operationalization of "remain on the page", so the
- **s3.llm-coverage** failed 1/3 trials (TASK-114) — [TASK-114#1] REQ-6: "Ensure routing, UI consistency, and state synchronization between inventory and product pages." The part "UI consistency" has no check. REQ-6.1 covers routing, REQ-6.2-6.4 cover state sync, but no check verifies UI consistency between the two pages. Additionally, REQ-3e: "behaves identically to the one on the inventory page" is only checked on the product details page (REQ-3e.1-3e.5); no c

## expl1-4-qa-test-cases

pass rate 67% (2/3 cases, 1 trial(s) each, a case passes at 1) · 1,035,984 tok (in 11,941 · out 27,220 · cache r 778,445 · cache w 218,378) · est. API cost $1.07 · time 2m 43s (54s per trial) · cases_hash 1c58da4f818900b2

No baseline yet (`--update-baseline --reason "…"` creates it).

| Case | Result | Trials | Baseline | Time (all trials) | Per trial | Est. cost | Tokens | In | Out | Cache read | Cache write |
|---|---|---|---|---|---|---|---|---|---|---|---|
| TASK-112 | pass | 1/1 | - | 40s | 40s | $0.28 | 273,297 | 2,979 | 6,715 | 205,598 | 58,005 |
| TASK-113 | pass | 1/1 | - | 40s | 40s | $0.34 | 333,824 | 3,174 | 6,212 | 251,689 | 72,749 |
| TASK-114 | FAIL | 0/1 | - | 1m 23s | 1m 23s | $0.46 | 428,863 | 5,788 | 14,293 | 321,158 | 87,624 |

_Time: each trial end to end (skill run + checks + judges), summed over the case's trials; "Per trial" lists them in order. Tokens: every API call of the skill run and its judges, summed over the case's trials; same fields as the run metrics report (`<KEY>-metrics.md`). Est. cost is an API list-price estimate, not plan usage._

### Failed criteria (hard gate)

- **s4.structural-note** failed 1/3 trials (TASK-114) — [TASK-114#1] ## REQ-1 (line 8) has no test cases and no "> ℹ️ Structural requirement …" / "> ⚠️ The requirement needs clarification …" note

### LLM criteria failed (warning only)

- **s4.llm-reviewer** failed 1/3 trials (TASK-112) — [TASK-112#1] TC-REQ-1.1 step 2 (same in TC-REQ-1.2, TC-REQ-2.1 and TC-REQ-3.1 step 3): the expected result 'The entered values are in the form fields' only restates the data-entry step (rule 7) → Remove the expected result from the entry step, or replace it with a check that comes from the checklist. Keep the verifications in the submit step. | TC-REQ-3.1 step 2: the expected result 'The address of the login page is shown in the address bar' only restates the step 'Read the address of the current page' (rule 7) → Put the address in the step's test data (for example 'Address: current login page URL, recorde

## Update the baseline

```
npm run eval:set-baseline -- evals/results/20261111-111111 --reason "<why the baseline moves>" --skill expl1-1-task-context
npm run eval:set-baseline -- evals/results/20261111-111111 --reason "<why the baseline moves>" --skill expl1-3-qa-checklist
npm run eval:set-baseline -- evals/results/20261111-111111 --reason "<why the baseline moves>" --skill expl1-4-qa-test-cases
```

- expl1-2-requirements-grooming: same as the current baseline, nothing to update
