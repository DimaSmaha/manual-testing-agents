# TASK-112 - Test cases

Checklist: .workflow-artifacts/TASK-112-20261111-111111/TASK-112-3-checklist.md
Generated: 2026-11-11

---

## REQ-1: Create the end-to-end login experience so users can sign in with validated credentials.

Applied techniques: Use Case, EP

### TC-REQ-1.1: Registered user signs in with valid credentials

**Precondition:** The login page is open. A registered account exists with email user@example.com and password Passw0rd! [test data]. The user is not signed in.

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Enter the email | user@example.com [test data] | The email is entered in the form |
| 2 | Enter the password | Passw0rd! [test data] | The password is entered in the form |
| 3 | Submit the login form | — | The user is signed in |

**Postcondition:** The user is signed in.

### TC-REQ-1.2: Visitor can not sign in with an email in an invalid format

**Precondition:** The login page is open. The user is not signed in.

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Enter the email | user-example.com [test data] | The email is entered in the form |
| 2 | Enter the password | Passw0rd! [test data] | The password is entered in the form |
| 3 | Submit the login form | — | The user is not signed in |

---

## REQ-2: Users see clear inline error states.

Applied techniques: EP

### TC-REQ-2.1: Visitor sees an inline error state for an empty password

**Precondition:** The login page is open. The user is not signed in.

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Enter the email | user@example.com [test data] | The email is entered in the form |
| 2 | Leave the password empty | — | The password field is empty |
| 3 | Submit the login form | — | An inline error state is displayed on the login page |

---

## REQ-3: Users remain on the page when authentication fails.

Applied techniques: Use Case

### TC-REQ-3.1: User remains on the login page after a failed authentication

**Precondition:** The login page is open. A registered account exists with email user@example.com and password Passw0rd! [test data]. The user is not signed in.

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Enter the email | user@example.com [test data] | The email is entered in the form |
| 2 | Enter a wrong password | WrongPass1! [test data] | The password is entered in the form |
| 3 | Submit the login form | — | An inline error state is displayed on the login page<br>The login page remains displayed<br>The user is not navigated to another page |

---

## Statistics

- Requirements covered: 3 (REQ-1, REQ-2, REQ-3)
- Requirements needing clarification: 0
- Total number of test cases: 4
