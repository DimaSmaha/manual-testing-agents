# <ISSUEKEY> - Web testing

Code review: <path to the code-review file>
Test cases: <path to the test-cases file>
Impact analysis: <path to the impact-analysis file, or "not used">
Date: <YYYY-MM-DD>

## Scope

Items for web testing: <N>
- QA (verification in the UI): <N>
- FAIL (bug confirmation): <N>
- IMPACT (retest from the impact analysis): <N>

## Results

| TC | Name | Source | Status | Comment |
|----|------|--------|--------|---------|
| TC-REQ-1.1 | <scenario name> | QA | PASS | — |
| TC-REQ-1.2 | <scenario name> | QA | FAIL | Step 3: expected "X", actual "Y" |
| TC-REQ-2.1 | <scenario name> | FAIL | FAIL CONFIRMED | The UI confirms the bug |
| TC-REQ-2.2 | <scenario name> | FAIL | FAIL REJECTED | The UI works correctly |
| TC-REQ-3.1 | <scenario name> | QA | BLOCKED | Element not found |
| TC-REQ-4.1 | <scenario name> | QA | PASS | OBSERVATION: <what was noticed> |
| IMP-1 | <retest name from the impact analysis> | IMPACT | PASS | — |

## Findings

### FAIL: TC-REQ-1.2 — <scenario name>

- **Source:** QA
- **Step:** #3 — <description of the step from the test case>
- **Test data:** <what was entered>
- **Expected:** <expected result from the test case>
- **Actual:** <what the agent saw on the page>

### FAIL CONFIRMED: TC-REQ-2.1 — <scenario name>

- **Source:** FAIL (code review)
- **Code review finding:** <file, line, description of the problem from code-review>
- **Step:** #<N> — <description of the step>
- **Expected:** <expected result>
- **Actual:** <what the agent saw — confirms the bug>

### FAIL REJECTED: TC-REQ-2.2 — <scenario name>

- **Source:** FAIL (code review)
- **Code review finding:** <file, line, description of the problem from code-review>
- **Actual in the UI:** <what the agent saw — works correctly>
- **Conclusion:** <why the bug does not manifest in the UI>

### BLOCKED: TC-REQ-3.1 — <scenario name>

- **Source:** QA
- **Reason:** <why it could not be executed>
- **Page state:** <what the agent saw at the moment of blocking>

### FAIL: IMP-1 — <retest name from the impact analysis>

- **Source:** IMPACT (impact analysis, <IMP id and the QA / N/A reason>)
- **Step:** #3 — <description of the step from the retest row>
- **Expected:** <expected result from the retest row>
- **Actual:** <what the agent saw on the page>

---

Section rules:
- Results — a table of all QA and FAIL test cases in the order from the test-cases file,
  then the IMPACT items in the order of the impact-analysis file.
- The Source column: QA or FAIL — where the test case came from in the code review;
  IMPACT — a browser retest row from the impact analysis (ID `IMP-<n>`).
- The Comment column: for PASS — a dash or OBSERVATION. For FAIL — a short description. For BLOCKED — the reason. For FAIL CONFIRMED/REJECTED — a short description.
- Findings — for FAIL, FAIL CONFIRMED, FAIL REJECTED, and BLOCKED.
- PASS needs no explanations.
- FAIL REJECTED also has a finding — so it is clear what exactly was refuted.
- If there are no findings — the section is not created.

## Observations

Additional defects or anomalies noticed while executing
the test cases that are not covered by the requirements:

- <OBS-1>: <what was noticed, where, under what conditions>
- <OBS-2>: <what was noticed, where, under what conditions>

If there are no observations — the section is not created.

## Statistics

| Status | Count |
|--------|-------|
| PASS   | <N>   |
| FAIL   | <N>   |
| FAIL CONFIRMED | <N> |
| FAIL REJECTED  | <N> |
| BLOCKED | <N>  |
| OBSERVATION | <N> |
| Total  | <N>   |

Verdict: <Web testing successful (all PASS and FAIL REJECTED) / Web testing unsuccessful — there are N FAIL, N FAIL CONFIRMED>
