# Test cases — www.saucedemo.com · Products (inventory) · eb-261101-1111

Plan: plan.md · Style: curious · Generated: 2026-11-01
Focus: none (coverage gaps against run eb-261101-1011 and the deep research)
Source of truth: plan.md. This file is generated from it; do not edit.

## Overview

| ID | Priority | Area | Outcome | Title |
|---|---|---|---|---|
| TC-S1 | critical | add to cart | data | A shopper fills the cart with all six products under changing sort orders and the cart count and buttons stay correct |
| TC-S2 | important | add to cart (detail page) | data | A shopper adds products from their detail pages and the product list shows the same cart state afterwards |
| TC-S3 | important | cart page | data | The cart page lists exactly the products the shopper added and the product list matches it after returning |
| TC-S4 | normal | reset app state | data | Reset App State empties the shopper's own cart and the product list shows no item as added |
| TC-S5 | high | sort | state | The sort the shopper chose stays consistent with the list after visiting product detail pages |
| TC-S6 | normal | burger menu | state | The burger menu takes the shopper from a product page back to the catalog and to the Dynamic Catalog without losing the session |

---

## TC-S1: A shopper fills the cart with all six products under changing sort orders and the cart count and buttons stay correct

**Priority:** critical · **Area:** add to cart · **Outcome:** data · **Covers:** —
**Page:** /inventory.html
**Precondition:** Logged in, on /inventory.html, cart empty, sort = Name (A to Z)

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Check the cart is empty (no badge, cart link reads "Cart, empty") | — | — |
| 2 | Select "Name (Z to A)" in the sort dropdown | "Name (Z to A)" | — |
| 3 | Click 'Add to cart' on each of the six products, starting with Test.allTheThings() T-Shirt (Red) | all six products | The cart badge reads 6 after the sixth add |
| 4 | Check the cart badge and the cart link | — | — |
| 5 | Select "Price (low to high)" in the sort dropdown | "Price (low to high)" | — |
| 6 | Check every product still shows 'Remove' and the badge is unchanged | — | — |
| 7 | Reload the page | — | — |
| 8 | Check the badge and all six buttons again | — | All six products show 'Remove' after the re-sort and after the reload |
| 9 | Click 'Remove' on every product | all six products | — |
| 10 | Select "Name (A to Z)" in the sort dropdown | "Name (A to Z)" | After removing all six products the badge is gone and the cart link reads "Cart, empty" |

**Postcondition:** cart empty, sort = Name (A to Z)

---

## TC-S2: A shopper adds products from their detail pages and the product list shows the same cart state afterwards

**Priority:** important · **Area:** add to cart (detail page) · **Outcome:** data · **Covers:** —
**Page:** /inventory.html
**Precondition:** Logged in, on /inventory.html, cart empty

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Click the title link of Test.allTheThings() T-Shirt (Red) to open its detail page | "Test.allTheThings() T-Shirt (Red)" | — |
| 2 | Click 'Add to cart' on the detail page | — | On the detail page the button changes to 'Remove' after the add and the cart badge reads 1 |
| 3 | Click 'Back to products' | — | — |
| 4 | Check the badge and the buttons of all six products on the list | — | Back on the list only the added product shows 'Remove' and the badge reads 1 |
| 5 | Click the image link of Sauce Labs Onesie to open its detail page | "Sauce Labs Onesie" | — |
| 6 | Click 'Add to cart' on the detail page | — | — |
| 7 | Click 'Back to products' | — | — |
| 8 | Check the badge and the buttons of all six products on the list | — | After the second add from a detail page the badge reads 2 and both products show 'Remove' in the list |
| 9 | Click 'Remove' on both added products | "Test.allTheThings() T-Shirt (Red)", "Sauce Labs Onesie" | After both removals the badge is gone |

**Postcondition:** cart empty

---

## TC-S3: The cart page lists exactly the products the shopper added and the product list matches it after returning

**Priority:** important · **Area:** cart page · **Outcome:** data · **Covers:** —
**Page:** /inventory.html
**Precondition:** Logged in, on /inventory.html, cart empty

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Click 'Add to cart' on Sauce Labs Bike Light and Sauce Labs Fleece Jacket | "Sauce Labs Bike Light", "Sauce Labs Fleece Jacket" | — |
| 2 | Click the cart link in the header | — | — |
| 3 | Compare the products, names and prices on the cart page with the list | — | The cart page lists exactly the two added products with the same names and prices as on the product list |
| 4 | If the cart page offers 'Remove', click it on Sauce Labs Fleece Jacket (otherwise record "capability missing: Remove on the cart page") | "Sauce Labs Fleece Jacket" | If the cart page offers 'Remove', removing the Fleece Jacket there leaves only Sauce Labs Bike Light in the cart and the badge reads 1 |
| 5 | Return to the product list with the cart page's continue-shopping control or the browser Back action | — | — |
| 6 | Check the badge and the buttons of all six products | — | Back on the product list the buttons and the badge match the cart contents |
| 7 | Click 'Remove' on every product that still shows 'Remove' | — | After the final removals the badge is gone |

**Postcondition:** cart empty

---

## TC-S4: Reset App State empties the shopper's own cart and the product list shows no item as added

**Priority:** normal · **Area:** reset app state · **Outcome:** data · **Covers:** —
**Page:** /inventory.html
**Precondition:** Logged in, on /inventory.html, cart empty (otherwise BLOCKED: the cart would not be this run's own data), sort = Name (A to Z)

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Check the cart is empty (no badge); if it is not empty stop and report BLOCKED, because the cart would not be this run's own data | — | — |
| 2 | Select "Name (Z to A)" in the sort dropdown | "Name (Z to A)" | — |
| 3 | Click 'Add to cart' on Sauce Labs Bolt T-Shirt and Sauce Labs Onesie | "Sauce Labs Bolt T-Shirt", "Sauce Labs Onesie" | — |
| 4 | Click 'Open Menu' | — | — |
| 5 | Click 'Reset App State' | — | — |
| 6 | Click 'Close Menu' | — | — |
| 7 | Check the badge, the cart link and the buttons of all six products | — | The cart badge is gone and the cart link reads "Cart, empty" after Reset App State |
| 8 | Reload the page | — | — |
| 9 | Check the badge and the buttons again | — | All six products show 'Add to cart' after the reset, and still after a reload (a stale 'Remove' before the reload is a defect to record) |
| 10 | Select "Name (A to Z)" in the sort dropdown | "Name (A to Z)" | — |

**Postcondition:** cart empty, sort = Name (A to Z)

---

## TC-S5: The sort the shopper chose stays consistent with the list after visiting product detail pages

**Priority:** high · **Area:** sort · **Outcome:** state · **Covers:** —
**Page:** /inventory.html
**Precondition:** Logged in, on /inventory.html, sort = Name (A to Z)

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Select "Price (low to high)" in the sort dropdown | "Price (low to high)" | — |
| 2 | Click the image link of Sauce Labs Bike Light to open its detail page | "Sauce Labs Bike Light" | — |
| 3 | Check the detail page name and price | — | Each detail page shows the name and price of the product that was clicked |
| 4 | Click 'Back to products' | — | — |
| 5 | Check the dropdown label and the order of the cards | — | — |
| 6 | Click the title link of Sauce Labs Backpack to open its detail page | "Sauce Labs Backpack" | — |
| 7 | Check the detail page name and price | — | — |
| 8 | Go back with the browser Back action | — | — |
| 9 | Check the dropdown label and the order of the cards again | — | After each return the sort dropdown label matches the order of the cards on the list |
| 10 | Select "Name (A to Z)" in the sort dropdown | "Name (A to Z)" | — |

**Postcondition:** sort = Name (A to Z)

---

## TC-S6: The burger menu takes the shopper from a product page back to the catalog and to the Dynamic Catalog without losing the session

**Priority:** normal · **Area:** burger menu · **Outcome:** state · **Covers:** —
**Page:** /inventory.html
**Precondition:** Logged in, on /inventory.html

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Click the title link of Sauce Labs Bolt T-Shirt to open its detail page | "Sauce Labs Bolt T-Shirt" | — |
| 2 | Click 'Open Menu' | — | — |
| 3 | Click 'All Items' | — | — |
| 4 | Check the URL and the product list | — | 'All Items' on the detail page returns to the product list at /inventory.html |
| 5 | Click 'Open Menu' | — | — |
| 6 | Click 'Dynamic Catalog' | — | — |
| 7 | Record where it leads (URL and page heading); if it leaves www.saucedemo.com go back at once and do not interact further | — | 'Dynamic Catalog' leads to a page whose URL and heading are recorded |
| 8 | Return to /inventory.html with the browser Back action or the menu's 'All Items' | — | — |
| 9 | Check the product list and that the user is still signed in | — | After returning to /inventory.html the six products are listed and the user is still signed in |

**Postcondition:** on /inventory.html, cart empty

---

## Summary

- Scenarios: 6 (data 4, state 2, ui 0)
- Priorities: critical 1, important 2, high 1, normal 2, low 0
