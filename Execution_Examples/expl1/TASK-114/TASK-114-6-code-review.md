# TASK-114 - Code review

Test cases: .workflow-artifacts/TASK-114/TASK-114-4-test-cases.md
PR: https://github.com/saucelabs/sample-app-web/pull/52

Code source: PR head fetched as local branch `pr-52` (no `gh` CLI). Files were read only from `pr-52`.

## Results

| TC | Name | Status |
|----|------|--------|
| TC-REQ-1.1 | Clicking a product name opens the product details page | PASS |
| TC-REQ-2.1 | The details page shows the information of the clicked product only | PASS |
| TC-REQ-3.1 | The product name matches the inventory page | PASS |
| TC-REQ-5.1 | The price matches the inventory page | PASS |
| TC-REQ-6.1 | The details page image is larger than the inventory image | QA |
| TC-REQ-7.1 | 'Add to cart' adds the product to the cart | PASS |
| TC-REQ-8.1 | 'Add to cart' → 'Remove' with cart count update | PASS |
| TC-REQ-8.2 | 'Remove' → 'Add to cart' with cart count update | PASS |
| TC-REQ-9.1 | Adding two products from their details pages | PASS |
| TC-REQ-10.1 | 'Back to products' keeps the cart contents | PASS |
| TC-REQ-10.2 | Browser Back button keeps the cart contents | PASS |
| TC-REQ-11.1 | Navigating to the cart page from the details page | PASS |
| TC-REQ-11.2 | Cart icon/button and count after adding a product on the details page | PASS |
| TC-REQ-12.1 | Different products open different details pages | PASS |
| TC-REQ-12.2 | Reloading the details page | QA |
| TC-REQ-12.3 | Opening the details page by its address | QA |
| TC-REQ-12a.1 | Non-existent product id | PASS |
| TC-REQ-13.1 | Header and typography match the inventory page | QA |
| TC-REQ-13.2 | Button styling matches the inventory page | QA |
| TC-REQ-14a.1 | Added on the inventory page → 'Remove' on the details page | PASS |
| TC-REQ-14a.2 | Removed on the inventory page → 'Add to cart' on the details page | PASS |
| TC-REQ-14b.1 | Added on the details page → 'Remove' on the inventory page | PASS |
| TC-REQ-14b.2 | Removed on the details page → 'Add to cart' on the inventory page | PASS |

## Statistics

| Status | Count |
|--------|-------|
| PASS   | 18    |
| FAIL   | 0     |
| QA     | 5     |
| N/A    | 0     |
| Total  | 23    |
