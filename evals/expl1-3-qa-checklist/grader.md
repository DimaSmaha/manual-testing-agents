# Grader — expl1-3-qa-checklist (LLM criteria, warning only)

The judge sees the requirements file (input) and the checklist the skill wrote. The structure check and `checks.ts` already
cover headings, numbering, forbidden words, one statement per line and cross-references; do not re-judge them.

### s3.llm-atomic
PASS only if every check has exactly one pass/fail: one element or behavior, one expected result. FAIL when a check joins
two verifiable things with "and" ("the button is visible and enabled", "the name and the price are shown" when they could
be told apart), or could be "partially pass". A single check about a group that the requirement itself treats as one unit
("name, description, price and image displayed together") is PASS. Evidence: the check id and text of the worst offender.

### s3.llm-no-invention
PASS only if every check is grounded in the requirement under its heading. FAIL when a check adds behavior, a route, a
selector, a role, a message text, a limit, a state or data that the requirement does not state, or tests general QA
advice not tied to the requirement. Evidence: the check id and the invented detail, quoted.

### s3.llm-coverage
PASS only if every statement, value, condition and branch of each requirement is verified by at least one check, and
labels, numbers and state names of the requirement are used as written. FAIL when a stated part of a requirement has no
check (for example only the happy path of a requirement that describes a state change in both directions) or when a check
generalises a stated value. Evidence: the requirement id and the uncovered part, quoted.
