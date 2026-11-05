# TASK-114 - Web testing

Code review: .workflow-artifacts/TASK-114/TASK-114-6-code-review.md
Test cases: .workflow-artifacts/TASK-114/TASK-114-4-test-cases.md
Impact analysis: .workflow-artifacts/TASK-114/TASK-114-7-impact-analysis.md
Date: 2026-11-05
App under test: https://www.saucedemo.com/ (live site, standard user; session `qa-TASK-114`). This is the live deployment, not a local build of PR 52.
Test data: "Product A" = Sauce Labs Bike Light (`/inventory-item.html?id=0`); the impact-analysis rows use the Backpack (`?id=4`), as the rows say.
User help: logged in at the start; logged in again after the session ended during IMP-8 (see the Results note).

## Scope

Items for web testing: 8
- QA (verification in the UI): 5
- FAIL (bug confirmation): 0
- IMPACT (retest from the impact analysis): 3

## Results

| TC | Name | Source | Status | Comment |
|----|------|--------|--------|---------|
| TC-REQ-6.1 | The details page image is larger than the inventory image | QA | PASS | Inventory image 158.66×238, details image 336.80×510.19 (both wider and taller); same product (Bike Light) |
| TC-REQ-12.2 | Reloading the details page | QA | PASS | Page reloaded and shows "Sauce Labs Bike Light". OBSERVATION: OBS-1 |
| TC-REQ-12.3 | Opening the details page by its address | QA | PASS | New tab with `/inventory-item.html?id=0` shows "Sauce Labs Bike Light", cart count 1. OBSERVATION: OBS-1 |
| TC-REQ-13.1 | Header and typography match the inventory page | QA | PASS | Header text "Open Menu / Swag Labs / 1" and font family `"DM Sans", Arial, Helvetica, sans-serif` (body), `"DM Sans", sans-serif` (text) are identical on both pages |
| TC-REQ-13.2 | Button styling matches the inventory page | QA | PASS | Add to cart: white background, text and 1px border rgb(19, 35, 34), 16px/500, 160×34, radius 4px. Remove: text and border rgb(226, 35, 26), same size and font. Identical on both pages |
| IMP-1 | Burger menu opens (`MenuPage.js` / `.bm-burger-button`) | IMPACT | PASS | `.bm-burger-button` exists on `/cart.html`; the menu opened with `#inventory_sidebar_link`, `#about_sidebar_link`, `#logout_sidebar_link`, `#reset_sidebar_link`. OBSERVATION: OBS-2 |
| IMP-8 (menu.spec.js) | Menu: Reset App State, All Items, Logout | IMPACT | PASS | Reset: badge went from 1 to empty. All Items: inventory page shown. Logout (from `/cart.html`): login page shown. OBSERVATION: OBS-3 |
| IMP-8 (swag.item.details.spec.js) | Details page opened by direct address (`?id=4`) | IMPACT | PASS | Backpack page loaded, badge empty → Add to cart → 1 → Remove → empty → Back to products → inventory page. Overlaps TC-REQ-12.3, which was run once; the extra steps of the row were run as well. See the note below. OBSERVATION: OBS-1 |

Note on IMP-8 (details): the first Back to products click landed on the login page with "You can only access '/inventory.html' when you are logged in". The gap between my previous step and this one was about 28 minutes, so the session had most likely expired. After the user logged in again, the details page was reloaded by address and Back to products opened `/inventory.html`. The result is PASS; the first attempt is not counted as a defect.

## Observations

Additional defects or anomalies noticed while executing the test cases that are not covered by the requirements:

- OBS-1: Loading a details page by address (reload, new tab, direct URL) returns HTTP 404 for `/inventory-item.html?id=N` (console: "Failed to load resource: the server responded with a status of 404"), but the page still renders correctly. Seen on `?id=0` (reload, new tab) and `?id=4`. It looks like a single-page-app fallback served with a 404 status.
- OBS-2: The menu has a fifth link, "Dynamic Catalog" (`#dynamic_catalog_sidebar_link`), in addition to the four links the retest row lists.
- OBS-3: On `/cart.html`, after Reset App State the header shows "Cart, empty", but the cart page still lists the Backpack (QTY 1) and the menu stays open. The list is not refreshed until the page changes.

Also in the console on every page: HTTP 401 on `events.backtrace.io` (third-party error reporting). Not related to the product pages.

## Statistics

| Status | Count |
|--------|-------|
| PASS   | 8     |
| FAIL   | 0     |
| FAIL CONFIRMED | 0 |
| FAIL REJECTED  | 0 |
| BLOCKED | 0    |
| OBSERVATION | 3 |
| Total  | 8     |

Verdict: Web testing successful (all PASS and FAIL REJECTED)
