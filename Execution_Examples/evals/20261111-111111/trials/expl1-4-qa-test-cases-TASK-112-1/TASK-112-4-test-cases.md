# TASK-112 - Test cases

Checklist: .eval-runs/expl1-4-qa-test-cases-TASK-112-1/TASK-112-3-checklist.md
Generated: 2026-11-11

---

## REQ-1: Users can sign in with validated credentials.

Applied techniques: EP (valid and invalid credentials)

### TC-REQ-1.1: User signs in with credentials that pass validation

**Precondition:** The user is not signed in. An account exists with email `qa.user@example.com` and password `ValidPass#2026` [test data].

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Open the login page | — | The login form is displayed |
| 2 | Enter the email and the password | Email: `qa.user@example.com` [test data]; password: `ValidPass#2026` [test data] | The entered values are in the form fields |
| 3 | Submit the login form | — | The user is signed in |

**Postcondition:** The user is signed in.

### TC-REQ-1.2: User is not signed in with credentials that fail validation

**Precondition:** The user is not signed in. An account exists with email `qa.user@example.com` [test data].

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Open the login page | — | The login form is displayed |
| 2 | Enter the email and a wrong password | Email: `qa.user@example.com` [test data]; password: `WrongPass#0000` [test data] | The entered values are in the form fields |
| 3 | Submit the login form | — | The user is not signed in |

---

## REQ-2: Users see clear inline error states.

Applied techniques: Use Case (exceptional scenario: failed sign-in)

### TC-REQ-2.1: User sees an inline error with a text message after a failed sign-in

**Precondition:** The user is not signed in. An account exists with email `qa.user@example.com` [test data].

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Open the login page | — | The login form is displayed |
| 2 | Enter the email and a wrong password | Email: `qa.user@example.com` [test data]; password: `WrongPass#0000` [test data] | The entered values are in the form fields |
| 3 | Submit the login form | — | An error state is displayed inline in the login form<br>The error state contains a visible text message |

---

## REQ-3: Users remain on the page when authentication fails.

Applied techniques: Use Case (exceptional scenario: failed authentication)

### TC-REQ-3.1: User stays on the login page after a failed authentication

**Precondition:** The user is not signed in. An account exists with email `qa.user@example.com` [test data].

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Open the login page | — | The login form is displayed |
| 2 | Read the address of the current page | — | The address of the login page is shown in the address bar |
| 3 | Enter the email and a wrong password | Email: `qa.user@example.com` [test data]; password: `WrongPass#0000` [test data] | The entered values are in the form fields |
| 4 | Submit the login form | — | The address in the address bar is the same as in step 2<br>The login form is displayed |

---

## Statistics

- Requirements covered: 3
- Requirements needing clarification: 0
- Total number of test cases: 4
