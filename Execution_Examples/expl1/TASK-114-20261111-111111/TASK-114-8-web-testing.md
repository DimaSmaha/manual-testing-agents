# TASK-114 - Web testing

Code review: not used — every test case has Source QA
Test cases: .workflow-artifacts/TASK-114-20261111-111111/TASK-114-4-test-cases.md
Impact analysis: not used
Date: 2026-11-11

App under test: https://www.saucedemo.com/ (logged in by the user in the headed browser, session `qa-TASK-114`).
Product mapping used for the positions in the test cases: first = Sauce Labs Backpack, second = Sauce Labs Bike Light, last = Test.allTheThings() T-Shirt (Red).

> The run was stopped by the user after 6 of 13 test cases. The remaining 7 test cases were NOT executed and are reported as NOT RUN. This report is incomplete.

## Scope

Items for web testing: 13
- Test cases: 13 (Source QA: 13, FAIL: 0, PASS: 0, N/A: 0)
- IMPACT (retest from the impact analysis): 0

## Results

| TC | Name | Source | Status | Comment |
|----|------|--------|--------|---------|
| TC-REQ-1.1 | User opens the product details page of the first listed product | QA | PASS | — |
| TC-REQ-1.2 | User opens the product details page of the last listed product | QA | PASS | — |
| TC-REQ-2.1 | User opens the product details page of the clicked product | QA | PASS | — |
| TC-REQ-5.1 | User sees on the details page the same price as on the inventory page | QA | PASS | — |
| TC-REQ-6.1 | User sees on the details page a larger image than on the inventory page | QA | PASS | — |
| TC-REQ-7.1 | User adds a product to the cart from the product details page | QA | PASS | — |
| TC-REQ-7.2 | User removes a product from the cart on the details page with the same result as on the inventory page | QA | NOT RUN | Run stopped by the user before this test case |
| TC-REQ-8.1 | User returns to the inventory page with the cart contents kept | QA | NOT RUN | Run stopped by the user before this test case |
| TC-REQ-9.1 | User opens the cart page from the details page with an empty cart | QA | NOT RUN | Run stopped by the user before this test case |
| TC-REQ-9.2 | User opens the cart page from the details page after adding a product | QA | NOT RUN | Run stopped by the user before this test case |
| TC-REQ-10.1 | User sees the page URL change between the inventory page and the details page | QA | NOT RUN | Run stopped by the user before this test case |
| TC-REQ-10.2 | User sees on the details page the cart state set on the inventory page | QA | NOT RUN | Run stopped by the user before this test case |
| TC-REQ-10.3 | User sees on the inventory page the cart state set on the details page | QA | NOT RUN | Run stopped by the user before this test case |

## Evidence for the executed test cases

- TC-REQ-1.1: clicking "Sauce Labs Backpack" opened `/inventory-item.html?id=4`; the product list was not on the page.
- TC-REQ-1.2: clicking "Test.allTheThings() T-Shirt (Red)" opened `/inventory-item.html?id=3`; the product list was not on the page.
- TC-REQ-2.1: clicking "Sauce Labs Bike Light" opened `/inventory-item.html?id=0` with the name "Sauce Labs Bike Light"; "Sauce Labs Backpack" was not on the page.
- TC-REQ-5.1: price of the Backpack was $29.99 on the inventory page and $29.99 on the details page.
- TC-REQ-6.1: image of the Backpack rendered 158.66 × 238 px on the inventory page and 336.80 × 510.19 px on the details page.
- TC-REQ-7.1: with an empty cart ("Cart, empty") the button read "Add to cart"; after the click it read "Remove" and the cart showed 1.

## Statistics

| Status | Count |
|--------|-------|
| PASS   | 6     |
| FAIL   | 0     |
| FAIL CONFIRMED | 0 |
| FAIL REJECTED  | 0 |
| BLOCKED | 0    |
| OBSERVATION | 0 |
| NOT RUN | 7    |
| Total  | 13    |

Verdict: Web testing incomplete — 6 of 13 test cases executed (all PASS), 7 NOT RUN (stopped by the user).
