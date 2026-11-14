# TASK-114 - Web testing

Code review: .workflow-artifacts/TASK-114/TASK-114-6-code-review.md
Test cases: .workflow-artifacts/TASK-114/TASK-114-4-test-cases.md
Impact analysis: .workflow-artifacts/TASK-114/TASK-114-7-impact-analysis.md
Date: 2026-11-05
App under test: https://www.saucedemo.com/ (live site, standard user; headed browser, `playwright-cli` session `qa-TASK-114`).
Test data: Product A = Sauce Labs Bike Light (`/inventory-item.html?id=0`), Product B = Sauce Labs Backpack (`?id=4`), Product C = Sauce Labs Bolt T-Shirt.
User help: the user logged in at the start.

## Scope

Items for web testing: 25
- Test cases: 23 (Source QA: 5, FAIL: 0, PASS: 18, N/A: 0)
- IMPACT (retest from the impact analysis): 2

## Results

| TC | Name | Source | Status | Comment |
|----|------|--------|--------|---------|
| TC-REQ-1.1 | Clicking a product name opens the product details page | PASS | PASS | — |
| TC-REQ-2.1 | The details page shows the information of the clicked product only | PASS | PASS | — |
| TC-REQ-3.1 | The product name matches the inventory page | PASS | PASS | — |
| TC-REQ-5.1 | The price matches the inventory page | PASS | PASS | — |
| TC-REQ-6.1 | The details page image is larger than the inventory image | QA | PASS | Inventory image 158.66×238, details image 336.80×510.19 (both wider and taller); same product |
| TC-REQ-7.1 | 'Add to cart' adds the product to the cart | PASS | PASS | — |
| TC-REQ-8.1 | 'Add to cart' → 'Remove' with cart count update | PASS | PASS | Count 1 → 2 |
| TC-REQ-8.2 | 'Remove' → 'Add to cart' with cart count update | PASS | PASS | Count 2 → 1; the cart page lists only Product B |
| TC-REQ-9.1 | Adding two products from their details pages | PASS | PASS | Count 2; both products on the cart page |
| TC-REQ-10.1 | 'Back to products' keeps the cart contents | PASS | PASS | Count 1 and Product B 'Remove' kept on the inventory page |
| TC-REQ-10.2 | Browser Back button keeps the cart contents | PASS | PASS | `go-back` opened `inventory.html`; count 1, Product B shows 'Remove' |
| TC-REQ-11.1 | Navigating to the cart page from the details page | PASS | PASS | — |
| TC-REQ-11.2 | Cart icon/button and count after adding a product on the details page | PASS | PASS | Count 1 on both pages before, 2 on both pages after |
| TC-REQ-12.1 | Different products open different details pages | PASS | PASS | Product A opened `?id=0`, Product B opened `?id=4` |
| TC-REQ-12.2 | Reloading the details page | QA | PASS | Page reloaded and shows "Sauce Labs Bike Light". OBSERVATION: OBS-1 |
| TC-REQ-12.3 | Opening the details page by its address | QA | PASS | New tab with `/inventory-item.html?id=0` shows "Sauce Labs Bike Light", cart count 1. Also IMP-8 (details page by address). OBSERVATION: OBS-1 |
| TC-REQ-12a.1 | Non-existent product id | PASS | PASS | `?id=99999` opened a page without the data of an existing product; 'Back to products' opened the inventory page |
| TC-REQ-13.1 | Header and typography match the inventory page | QA | PASS | Header "Open Menu / Swag Labs / 1" and font family `"DM Sans", Arial, Helvetica, sans-serif` identical on both pages |
| TC-REQ-13.2 | Button styling matches the inventory page | QA | PASS | Add to cart and Remove: same color, 16px/500, 160×34, radius 4px on both pages |
| TC-REQ-14a.1 | Added on the inventory page → 'Remove' on the details page | PASS | PASS | — |
| TC-REQ-14a.2 | Removed on the inventory page → 'Add to cart' on the details page | PASS | PASS | — |
| TC-REQ-14b.1 | Added on the details page → 'Remove' on the inventory page | PASS | PASS | — |
| TC-REQ-14b.2 | Removed on the details page → 'Add to cart' on the inventory page | PASS | PASS | — |
| IMP-1 | Burger menu opens (`MenuPage.js` / `.bm-burger-button`) | IMPACT | PASS | The menu opened with All Items, About, Logout and Reset App State. OBSERVATION: OBS-2 |
| IMP-8 | Menu: Reset App State, All Items, Logout | IMPACT | PASS | Reset: badge went from 1 to empty. All Items: inventory page shown. Logout: login page shown. OBSERVATION: OBS-3 |

## Observations

Additional defects or anomalies noticed while executing the test cases that are not covered by the requirements:

- OBS-1: Loading a details page by address (reload, new tab, direct URL) returns HTTP 404 for `/inventory-item.html?id=N`, but the page still renders correctly.
- OBS-2: The menu has a fifth link, "Dynamic Catalog", in addition to the four links the retest row lists.
- OBS-3: On `/cart.html`, after Reset App State the header shows an empty cart, but the cart page still lists the Backpack until the page changes.

## Statistics

| Status | Count |
|--------|-------|
| PASS   | 25    |
| FAIL   | 0     |
| FAIL CONFIRMED | 0 |
| FAIL REJECTED  | 0 |
| BLOCKED | 0    |
| OBSERVATION | 3 |
| Total  | 25    |

Verdict: Web testing successful (all PASS and FAIL REJECTED)
