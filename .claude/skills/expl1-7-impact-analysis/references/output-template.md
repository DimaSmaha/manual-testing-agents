# <ISSUEKEY> - Impact analysis

Inputs: <paths to the test-cases, PR summary and code review files>
PR: <URL>
Base (commit before the PR): <sha>
Head (PR head): <sha>
Generated: <YYYY-MM-DD>

## Impact map

| ID | Tier | Module | Contract change (BASE → HEAD) | Dependents |
|----|------|--------|-------------------------------|------------|
| IMP-1 | Risk Areas | <path> | <what changed: export / constant / storage key / selector / route> | <paths of the dependent files> |
| IMP-2 | Direct Impact | <path> | <what changed> | <paths> |
| IMP-3 | Dependent Modules | <path> | <what changed> | <paths> |
| IMP-4 | Low risk | <path> | <what changed> | <paths> |

Rows are ordered by tier: Risk Areas, Direct Impact, Dependent Modules, Low risk.

## Results

| ID | Dependent module | Check | Status | Linked TC / review row |
|----|------------------|-------|--------|------------------------|
| IMP-1 | <path> | <imports / new behavior / constants / conditions / API contract> | PASS | TC-REQ-X.Y or — |
| IMP-1 | <path> | <check> | FAIL | — |
| IMP-2 | <path> | <check> | QA | — |
| IMP-3 | <path> | <check> | N/A | — |

## Findings

### FAIL: IMP-1 — <dependent module>

- **File:** <path>, line <N>
- **Expected:** <what the dependent must do with the new contract>
- **Actual:** <what the code does>

### N/A: IMP-3 — <dependent module>

- **File:** <path>, line <N>
- **Reason:** <why it is not applicable — what exactly is absent>

## Retest in stage 8

| ID | Status | Type | Page | Precondition | Steps | Expected | Linked TC / review row |
|----|--------|------|------|--------------|-------|----------|------------------------|
| IMP-1 | QA | Browser | <page or URL> | <state needed> | 1) <action> 2) <action> | <visible result> | TC-REQ-X.Y or — |
| IMP-4 | QA | Manual | — | — | <what a person checks and where> | — | — |
| IMP-11 | N/A | None | — | — | <reason no retest is needed> | — | — |

---

Section rules:
- Impact map — every item has an id, a tier, the contract change, and its dependents.
- Results — one row per dependent and check, in the order of the impact map.
  Every dependency of the impact map has at least one row.
- Findings — only for FAIL and N/A. PASS and QA need no explanations.
- Every FAIL has a file, a line, expected/actual.
- Every N/A has a file, a line, and a reason.
- No FAIL for uncovered files — use QA or N/A.
- If there is no FAIL or N/A — the Findings section is not created.
- Retest in stage 8 — one row for every QA and N/A result in the Results table, in the
  same order, and no rows for PASS or FAIL. Type: `Browser` (stage 8 executes it),
  `Manual` (not a browser check, listed for a person), `None` (N/A, no retest needed).
  Steps and Expected come only from the dependent's own flow, a finding, or a test case.

## Statistics

| Status | Count |
|--------|-------|
| PASS   | <N>   |
| FAIL   | <N>   |
| QA     | <N>   |
| N/A    | <N>   |
| Total  | <N>   |

| Tier | Impact-map items |
|------|------------------|
| Risk Areas | <N> |
| Direct Impact | <N> |
| Dependent Modules | <N> |
| Low risk | <N> |
