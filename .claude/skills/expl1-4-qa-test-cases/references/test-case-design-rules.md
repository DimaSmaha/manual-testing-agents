# Test case building rules — reference

## Choosing a technique for the requirement type

| Nature of the requirement | Technique | Coverage criterion |
|---------------------------|-----------|--------------------|
| Ranges, limits, numeric constraints | EP + BVA | Every partition + every boundary value covered |
| Categories of input data without numeric boundaries | EP | Every partition (valid and invalid) covered |
| Several conditions → different actions | Decision Table | Every rule (combination of conditions) covered |
| An object with statuses/modes | State Transition | Every valid transition covered |
| A full user scenario | Use Case | Main + alternative + exceptional scenarios |
| Many parameters with different values | Pairwise | Every pair of values of any two parameters covered |

Techniques are combined: one requirement may need
both Use Case (for the flow), and EP+BVA (for input fields),
and State Transition (for statuses).

## Coverage levels

**Standard (default for every task):**
- Main scenario (happy path)
- Invalid partitions (where present in the requirements)
- Boundary values, 2-value BVA (where there are constraints in the requirements)
- Alternative and exceptional scenarios (where described)
- Valid state transitions (where there are states)

**Extended (only if the user explicitly asks):**
- 3-value BVA
- Decision Table for complex business logic
- Invalid state transitions
- Pairwise for forms with 3+ parameters

## Mandatory attributes of every test case

- Identifier (TC-REQ-N.N)
- Scenario name
- Precondition
- Steps with input data
- Expected result for every significant step
- Postcondition — only if the system state changes

The test design technique is stated once in the heading
of the group of test cases for a requirement, not in each test case
separately.

## Quality rules

**Precision.** One interpretation. Forbidden words
in expected results: "correctly", "properly",
"appropriate", "if needed", "adequately", "several".
Instead of them — a specific value, state, or behavior.

**Completeness.** A test case without an expected result —
is not a test case. Do not generate it.

**Traceability.** Every test case is tied to a REQ-ID.
Every behavioral requirement has at least one test case.

**Conciseness.** One test case = one scenario with one
focus of verification. Do not combine several independent
checks in one test case.

## EP rules

- One representative from each class is sufficient.
  Do not generate several test cases from one class.
- Every invalid partition is a separate test case.
  Do not combine several invalid values in one case.

## BVA rules

- Apply only when the requirement has explicit numeric
  or text constraints (min/max, length, count).
- By default 2-value: the boundary + the nearest neighbor
  from the adjacent partition.
- Do not generate BVA if the requirement has no constraints.

## State Transition rules

- A transition test case = a sequence of events that leads
  through several states. One test case may cover
  several transitions.
- Test invalid transitions only if the requirement
  explicitly describes forbidden transitions.

## Decision Table rules

- Use a simplified (collapsed) table:
  if the value of a condition does not affect the action — merge
  the rules.
- Do not generate the full enumeration if some combinations
  give the same behavior.

## Anti-patterns (prohibitions)

- A test case without an expected result → do not generate
- Ambiguous wording in the requirement → do not generate a test case, mark that the requirement needs clarification
- Two test cases from the same EP class → remove the duplicate
- A test case for behavior absent from the requirement → do not generate
- A test case without a REQ-ID → do not generate
