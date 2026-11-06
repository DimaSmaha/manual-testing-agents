---
name: expl1-4-qa-test-cases
description: >
  Fourth stage of task processing. Takes the checklist created by the
  expl1-3-qa-checklist skill and generates test cases with specific
  steps, input data, and expected results —
  input for code review and for manual testing.
  Use when the user says "write test cases",
  "generate test cases", "test cases for the requirements",
  or after the checklist is finished.
---

# QA Test Cases

> ⚙️ Recommended settings: **Sonnet · Effort: High · Extended thinking: Off**

Generates test cases with specific steps, input data,
and expected results based on the checklist.

Test cases are not a checklist. A checklist says "what to verify".
A test case says "how to verify": a specific scenario
with specific actions and specific data.

## Input

Input — the file `<ISSUEKEY>-3-checklist.md` created by the
expl1-3-qa-checklist skill. In the same chat the file is available in
`.workflow-artifacts/<ISSUEKEY>/` automatically. If the chat is new — the user
uploads the file to the chat.

From the checklist the skill takes:
- The requirement text from the heading of each section — for generating
  test cases and for grounding expected results.
- The decomposition into checks — to determine the scope:
  if the checks are only about the presence, type, or label
  of an element — the requirement is structural, no test case is needed.
- The REQ-ID — for traceability.

Additional source:
- the user's answers to questions before generation.

First read the checklist file in full. If anything
in the requirements is unclear or ambiguous for building
test cases — ask the user before generation starts.
Do not start generation while there are unresolved questions.

Do not go to the tracker, do not use external tools,
do not search the internet, do not inspect code.

The checklist file is read-only.
Do not change, rewrite, or clean up its content.

If the checklist file is missing, empty, or corrupted —
stop and tell the user that the expl1-3-qa-checklist skill must be
run first.

## Rules

- All communication and all output file content — in English.
- Chat messages are short.
- Test cases are built only from what is in the checklist file.
  Do not invent, supplement, or interpret requirements on your own.
  Do not invent routes, selectors, roles, states, data, or expected
  behavior that are absent from the requirements.
- Do not change the meaning and wording of requirements. The checklist file is
  final. The skill has no right to change anything in it
  or rephrase it.
- If a requirement describes a specific value (number, text, label,
  field name, state) — the test case uses exactly that value.
  Do not replace it with another one, do not generalize.
- If a requirement does NOT describe a specific value but a test case
  needs test data — use realistic examples
  and mark them as `[test data]`.
- If a requirement was left unchanged after grooming
  (the user skipped the question in expl1-2-requirements-grooming) — build test cases
  on what is there. Do not skip such a requirement and do not mark
  it as incomplete. The checklist file is final.
- Do not add generic QA advice that is not tied
  to a specific requirement of the task.
- After saving the file — stop. Do not continue
  into code review, PR summary, or planning.

## Numbering

Test cases inherit the requirement IDs from the checklist file.

The order of requirements in the test cases file must match the order
of requirements in the checklist file. Do not change, reorder,
or group the requirements differently from how they appear in the file.

One requirement can produce several test cases.
Each test case gets a sub-number: TC-REQ-3.1, TC-REQ-3.2.

The main REQ-* number does not change — it is the same
as in the checklist file and onward in the code review.

If a requirement already has sub-items (REQ-5a, REQ-5b) —
each sub-item is numbered separately: TC-REQ-5a.1, TC-REQ-5a.2.

## Test case scope

Every requirement from the checklist file is covered: behavioral ones —
by test cases, structural ones (only presence, type, label) —
by the checklist. No test case is generated for structural requirements —
the checklist is a sufficient level of verification.

Every behavioral requirement gets at least one test case.

Who then executes these test cases — the code review agent
against the code or a human in the UI — is a matter for the following stages, not for this skill.

## Test case building method

For each behavioral requirement, determine which test design
technique is applicable. The choice of technique, coverage criteria,
and application rules are in references/test-case-design-rules.md.

Not every technique applies to every requirement —
apply only those that follow from the specific requirement.

The technique is stated once in the heading of the group
of test cases for a requirement, not in each test case separately.

By default use the standard coverage level
(defined in references/test-case-design-rules.md).
Use the extended level only if the user explicitly asks.

### Grounding rule

Every test case must be tied to a specific
behavior described in the requirement.

If a test case contains an expected result — that result
must follow from the requirement text. If the expected result for a scenario
cannot be determined from the requirement text —
do not generate the test case, mark that the requirement needs
clarification.

If a test case uses a specific value (number,
text, ID) — and that value is in the requirement, use it
literally. If the value is not in the requirement — mark it
as `[test data]` and use a realistic example.

### Filtering out unnecessary test cases

Do not generate test cases for:
- standard browser or platform behavior
  (scroll, focus, opening a tab) unless the requirement
  describes custom behavior
- implementation details (cache, performance, architecture)
  unless stated in the requirement
- general infrastructure (server errors, timeouts,
  network failures) unless the ticket is specifically about this
- boundary values for fields where the requirement describes no
  constraints or ranges
- UX details (animations, timings, hover effects) unless
  they are stated in the requirement
- scenarios for which the expected result cannot be
  determined from the requirement text

The full list of anti-patterns is
in references/test-case-design-rules.md, the "Anti-patterns" section.

## Verification before saving

After generating the test cases and before saving the file:

1. Run the test cases through the filter for unnecessary ones.
2. Go through the test cases and verify:

- Every requirement from the checklist file has at least one test case.
- There are no test cases without a REQ-ID.
- The order of requirements matches the order in the checklist file.
- There is no duplication: the same scenario does not appear twice.
  Two test cases from the same equivalence class are a duplicate.
  A test case whose steps are a strict subset of another test case's steps
  is also a duplicate: merge it into the longer one.
- Scenario names follow the "Writing rules" in references/test-case-design-rules.md
  (no "Verify that", no "and/then", no ids). Steps are mechanical and carry
  no assertions; every condition sits in the expected result, one per line.
- Every test case has a precondition, steps, test data,
  and an expected result. If any part is empty —
  remove the test case or complete it.
- The expected result of every test case follows
  from the requirement text, not invented.
- Expected results do not contain ambiguous words:
  "correctly", "properly", "appropriate", "if needed",
  "adequately". Instead — a specific value,
  state, or behavior.
- Test data is realistic and marked where it is not from the requirement.

If a problem is found — fix it before saving.

## Output file

Create the file `.workflow-artifacts/<ISSUEKEY>/<ISSUEKEY>-4-test-cases.md`
and tell the user the path.

The file stays in `.workflow-artifacts/<ISSUEKEY>/` — the next skill
in the same chat picks it up automatically.

If the file already exists — delete it completely and create a new one.
The output is always a single file with the result of the latest run.
Do not merge with the previous version, do not append, do not keep
data from the previous record.

Before finishing, check:
- One top-level heading
- One coherent document without duplicate sections

The file structure template is in references/output-template.md.
An example of the level of detail is in references/test-cases-example.md.
The technique and coverage rules are in references/test-case-design-rules.md.

## Final response

After saving the file, report:
- The path to the saved file
- The number of test cases
- The number of covered requirements
- Recommendation: "For the following skills (pr-summary,
  code review) it is recommended to continue in a new chat
  with the test-cases and checklist files."