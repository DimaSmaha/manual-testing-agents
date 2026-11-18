# Grader — expl1-1-task-context (LLM criteria, warning only)

The judge sees the frozen tracker record (JSON) and the context file the skill wrote. It answers each criterion with
PASS or FAIL and one piece of evidence (a quoted fragment). Deterministic checks (`checks.ts`) already cover the header,
sections, requirement count, must-keep literals and project-management data; do not re-judge them.

### s1.llm-no-invention
PASS only if every fact, value, name and condition in the context file is present in the tracker record. FAIL when the
file adds a step to reproduce, an expected result, a fix, a role, a number, an error message, a scope item or a
"requirement" that no tracker field states, or draws a conclusion the tracker does not make. Restating the same words
in a different order or splitting a sentence is not invention. Evidence: the added fragment, quoted.

### s1.llm-no-merge-reword
PASS only if the meaning, wording and conditions of the tracker text are kept: nothing generalised ("various" for a
list), no number, label or state replaced by a generic phrase, no condition branch dropped, and requirements that the
tracker describes separately are not merged into one bullet. FAIL when a requirement was reworded so its meaning
changed, simplified, or merged. A copy with small grammar fixes (subject added to a clause) is PASS. Evidence: the
tracker fragment and the context fragment that differ, both quoted.
