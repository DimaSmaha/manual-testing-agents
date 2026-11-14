# TASK-114 - Web testing

Code review: not available (stages 5–6 were skipped; all test cases were treated as QA at the user's request)
Test cases: .workflow-artifacts/TASK-114/TASK-114-4-test-cases.md
Date: 2026-11-05

> ⚠️ **Partial run.** The run was stopped by the user after 12 of 23 test cases.
> 11 passed, 1 was not completed, 11 were not run. The verdict below is not final.

## Scope

Test cases for web testing: 23
- QA (verification in the UI): 23 (fallback: no code-review file)
- FAIL (bug confirmation): 0

Environment: https://www.saucedemo.com/ (headed browser, `playwright-cli` session `qa-TASK-114`).
The user logged in manually. Test products: Product A/B were the Sauce Labs Backpack and Sauce Labs Bike Light (swapped between test cases where the cart state required it); Product C = Sauce Labs Bolt T-Shirt.

## Results

| TC | Name | Source | Status | Comment |
|----|------|--------|--------|---------|
| TC-REQ-1.1 | Clicking a product name opens the product details page | QA | PASS | — |
| TC-REQ-2.1 | The details page shows the information of the clicked product only | QA | PASS | — |
| TC-REQ-3.1 | The product name matches the inventory page | QA | PASS | — |
| TC-REQ-5.1 | The price matches the inventory page | QA | PASS | — |
| TC-REQ-6.1 | The details page image is larger than the inventory image | QA | PASS | Backpack image: 158.7×238 (inventory) vs 336.8×510.2 (details), same image file |
| TC-REQ-7.1 | 'Add to cart' adds the product to the cart | QA | PASS | — |
| TC-REQ-8.1 | 'Add to cart' → 'Remove' with cart count update | QA | PASS | Count 1 → 2 (Backpack already in cart, Bike Light added) |
| TC-REQ-8.2 | 'Remove' → 'Add to cart' with cart count update | QA | PASS | Count 2 → 1; cart page lists only the Backpack |
| TC-REQ-9.1 | Adding two products from their details pages | QA | PASS | Count 2; both products on the cart page |
| TC-REQ-10.1 | 'Back to products' keeps the cart contents | QA | PASS | Count 1 and the Backpack 'Remove' kept on the inventory page |
| TC-REQ-10.2 | Browser Back button keeps the cart contents | QA | NOT COMPLETED | Steps 1–2 done: the browser Back button opened `inventory.html`. Steps 3–4 (cart count 1, Backpack 'Remove') not checked |
| TC-REQ-11.1 | Navigating to the cart page from the details page | QA | PASS | — |
| TC-REQ-11.2 | Cart icon/button and count after adding a product on the details page | QA | NOT RUN | Step 1 seen incidentally: details page count (1) equals inventory count (1) |
| TC-REQ-12.1 | Different products open different details pages | QA | NOT RUN | Incidental: Backpack opened `?id=4`, Bike Light opened `?id=0` |
| TC-REQ-12.2 | Reloading the details page | QA | NOT RUN | — |
| TC-REQ-12.3 | Opening the details page by its address | QA | NOT RUN | — |
| TC-REQ-12a.1 | Non-existent product id | QA | NOT RUN | — |
| TC-REQ-13.1 | Header and typography match the inventory page | QA | NOT RUN | — |
| TC-REQ-13.2 | Button styling matches the inventory page | QA | NOT RUN | — |
| TC-REQ-14a.1 | Added on the inventory page → 'Remove' on the details page | QA | NOT RUN | — |
| TC-REQ-14a.2 | Removed on the inventory page → 'Add to cart' on the details page | QA | NOT RUN | — |
| TC-REQ-14b.1 | Added on the details page → 'Remove' on the inventory page | QA | NOT RUN | Incidental: after adding the Backpack on its details page and clicking 'Back to products', the inventory page showed 'Remove' and badge 1. Not counted as a pass |
| TC-REQ-14b.2 | Removed on the details page → 'Add to cart' on the inventory page | QA | NOT RUN | — |

## Observations

- OBS-1: The browser console showed "6 errors" on every page visited after login (inventory, product details, cart). The cause was not investigated, and the errors did not affect any executed test case. Console log: `.playwright-cli/console-2026-11-05T12-59-02-012Z.log`.

## Run notes

- Setup actions (not part of the test cases): the Backpack and the Bike Light were removed from the cart on the cart page twice, to reach the empty-cart and one-item preconditions. The cart now holds the Backpack (count 1).
- The navigation path was not saved to `navigation_paths.json` (run stopped early).
- No FAIL, FAIL CONFIRMED, FAIL REJECTED or BLOCKED results; no screenshots were taken.

## Statistics

| Status | Count |
|--------|-------|
| PASS   | 11    |
| FAIL   | 0     |
| FAIL CONFIRMED | 0 |
| FAIL REJECTED  | 0 |
| BLOCKED | 0    |
| OBSERVATION | 0 |
| NOT COMPLETED | 1 |
| NOT RUN | 11   |
| Total  | 23    |

Verdict: Incomplete — no failures among the 11 executed test cases, but 12 of 23 test cases were not completed. Web testing is not finished.
