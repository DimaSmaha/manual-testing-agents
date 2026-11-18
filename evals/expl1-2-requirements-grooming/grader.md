# Grader — expl1-2-requirements-grooming (LLM criteria, warning only)

The judge sees the context file (input) and the requirements file the skill wrote, plus the chat reply. The structure check and
`checks.ts` already cover Goal, REQ numbering, unsplit wording and the AUTO-DECISION line; do not re-judge them.

### s2.llm-split-faithful
Applies to every requirement that was split into sub-items (REQ-3a, REQ-3b …). PASS only if the sub-items together say
exactly what the context requirement says: nothing dropped, nothing added, every number, label and condition kept, each
sub-item holding one thing. FAIL when a part of the original is missing from all sub-items, a sub-item adds a fact or an
agreement ("agreed with the user"), or a sub-item changes a value. If nothing was split, answer PASS with the evidence
"no split requirements".

### s2.llm-no-invention
PASS only if the problem list in the chat reply (questions, contradictions, potential bugs, uncovered requirements,
risks) is grounded in the context file: each entry points to a real gap, ambiguity or conflict in the named requirement,
and states no product behavior that the context does not give. FAIL when an entry asserts an invented fact as if the
context said it, targets a requirement that is clear and covered, or restates the same finding in several groups. If the
reply lists no problems, answer PASS with the evidence "no problems listed".
