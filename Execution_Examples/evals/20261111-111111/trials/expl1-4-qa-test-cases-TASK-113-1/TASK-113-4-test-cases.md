# TASK-113 - Test cases

Checklist: .eval-runs/expl1-4-qa-test-cases-TASK-113-1/TASK-113-3-checklist.md
Generated: 2026-11-11

---

## REQ-1: Logout handling clears the current session.

Applied techniques: EP (two partitions: manual logout, automatic session expiration)

### TC-REQ-1.1: Manually logged out user stays signed out after reloading the page

**Precondition:** The user is signed in with a valid account (`[test data]` user: qa.user@example.com).

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Click the logout control | — | The user is signed out |
| 2 | Reload the page | — | The user is still signed out<br>The signed-in state of the previous session is not restored |

**Postcondition:** The current session is cleared; the user is signed out.

### TC-REQ-1.2: User with an expired session stays signed out after reloading the page

**Precondition:** The user is signed in with a valid account (`[test data]` user: qa.user@example.com). No logout is performed.

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Wait until the session expires | Session lifetime configured in the test environment `[test data]` | The user is signed out |
| 2 | Reload the page | — | The user is still signed out<br>The signed-in state of the expired session is not restored |

**Postcondition:** The current session is cleared; the user is signed out.

---

## REQ-2: Logout handling redirects the user to the sign-in screen.

Applied techniques: EP (two partitions: manual logout, automatic session expiration)

### TC-REQ-2.1: Manually logged out user lands on the sign-in screen

**Precondition:** The user is signed in with a valid account (`[test data]` user: qa.user@example.com).

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Click the logout control | — | The user is redirected away from the current screen |
| 2 | Read the displayed screen | — | The sign-in screen is displayed |

### TC-REQ-2.2: User with an expired session lands on the sign-in screen

**Precondition:** The user is signed in with a valid account (`[test data]` user: qa.user@example.com). No logout is performed.

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Wait until the session expires | Session lifetime configured in the test environment `[test data]` | The user is redirected away from the current screen |
| 2 | Read the displayed screen | — | The sign-in screen is displayed |

---

## REQ-3: Logout handling behaves consistently for both manual logout and automatic session expiration.

Applied techniques: State Transition (signed in → signed out, reached by two different events)

### TC-REQ-3.1: User reaches the same signed-out state after manual logout and after session expiration

**Precondition:** A valid account exists (`[test data]` user: qa.user@example.com). The user is not signed in.

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Sign in | `[test data]` user: qa.user@example.com | The user is signed in |
| 2 | Click the logout control | — | The user is signed out<br>The sign-in screen is displayed |
| 3 | Sign in again | `[test data]` user: qa.user@example.com | The user is signed in |
| 4 | Wait until the session expires | Session lifetime configured in the test environment `[test data]` | The user is signed out<br>The sign-in screen is displayed<br>The state is the same as after step 2 |

**Postcondition:** The user is signed out; the sign-in screen is displayed.

---

## Statistics

- Requirements covered: 3
- Requirements needing clarification: 0
- Total number of test cases: 5
