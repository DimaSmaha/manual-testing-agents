# TASK-112 - Web testing

Code review: not used — every test case has Source QA
Test cases: .workflow-artifacts/TASK-112-20261111-111111/TASK-112-4-test-cases.md
Impact analysis: not used
Date: 2026-11-11

## Scope

Items for web testing: 4
- Test cases: 4 (Source QA: 4, FAIL: 0, PASS: 0, N/A: 0)
- IMPACT (retest from the impact analysis): 0

App under test: https://www.saucedemo.com/ (login page). Session `qa-TASK-112`, headed browser.
Only the first 2 of the 4 test cases were executed in this run (TC-REQ-2.1 and TC-REQ-3.1 were not executed).

## Results

| TC | Name | Source | Status | Comment |
|----|------|--------|--------|---------|
| TC-REQ-1.1 | Registered user signs in with valid credentials | QA | BLOCKED | The account user@example.com / Passw0rd! does not exist in the app; the login was rejected |
| TC-REQ-1.2 | Visitor can not sign in with an email in an invalid format | QA | PASS | — |

## Findings

### BLOCKED: TC-REQ-1.1 — Registered user signs in with valid credentials

- **Source:** QA
- **Reason:** The precondition "A registered account exists with email user@example.com and password Passw0rd!" is not met on https://www.saucedemo.com/. The steps were run with the test data from the test case (Username `user@example.com`, Password `Passw0rd!`, both confirmed in the form before submit). The app rejected them.
- **Page state:** The login page stayed open with the inline message "Epic sadface: Username and password do not match any user in this service". The user was not signed in. The page lists other accepted usernames, but they are not test data of this test case, so they were not used.

## Statistics

| Status | Count |
|--------|-------|
| PASS   | 1     |
| FAIL   | 0     |
| FAIL CONFIRMED | 0 |
| FAIL REJECTED  | 0 |
| BLOCKED | 1    |
| OBSERVATION | 0 |
| Total  | 2     |

Verdict: Web testing incomplete — 2 of 4 test cases executed (1 PASS, 1 BLOCKED); TC-REQ-2.1 and TC-REQ-3.1 were not executed.
