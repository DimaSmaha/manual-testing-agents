# <ISSUEKEY> - Code review

Test cases: <path to the test-cases file>
PR: <URL>

## Results

| TC | Name | Status |
|----|------|--------|
| TC-REQ-1.1 | <scenario name> | PASS |
| TC-REQ-1.2 | <scenario name> | FAIL |
| TC-REQ-1.3 | <scenario name> | QA |
| TC-REQ-2.1 | <scenario name> | N/A |

## Findings

### FAIL: TC-REQ-1.2 — <scenario name>

- **File:** <path>, line <N>
- **Expected:** <expected result from the test case>
- **Actual:** <what the code does>

### N/A: TC-REQ-2.1 — <scenario name>

- **Reason:** <why it is not applicable — what exactly is absent from the PR>

---

Section rules:
- Results — a table of all test cases in the order from the test-cases file.
- Findings — only for FAIL and N/A. PASS and QA need no explanations.
- Every FAIL has a file, a line, expected/actual.
- Every N/A has a reason why the item is not applicable to the PR.
- If there is no FAIL or N/A — the Findings section is not created.

## Statistics

| Status | Count |
|--------|-------|
| PASS   | <N>   |
| FAIL   | <N>   |
| QA     | <N>   |
| N/A    | <N>   |
| Total  | <N>   |
