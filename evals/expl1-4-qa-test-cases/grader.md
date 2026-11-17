# Grader — expl1-4-qa-test-cases (LLM criteria, warning only)

Coverage, contradictions, invented behavior, exact values and the structural/clarification notes are judged by the
existing `expl1-test-cases-reviewer` subagent (criterion `s4.llm-reviewer`, run through `reviewWithSubagent`, so the
judge is separate from the skill under test and is the same one the feedback loop uses). That reviewer states that
style, naming and technique are out of scope; this file adds the one criterion it does not cover.

### s4.llm-step-assertion-separation
The judge sees the checklist and the test cases file. PASS only if, in every test case, steps are mechanical single
actions (open, click, enter, select, read) and every assertion lives in the Expected result column, one verifiable
condition per line (`<br>` between conditions). FAIL when a step contains a judgement ("check that the price matches"),
when an Expected result merely restates the step ("The user clicks the button"), or when one expected-result cell holds
several unrelated conditions run together in a single sentence. Preconditions must hold the state and role needed before
step 1, not be repeated as step 1. Evidence: the test case id and the offending cell, quoted.
