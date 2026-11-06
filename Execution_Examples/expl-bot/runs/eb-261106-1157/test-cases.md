# Test cases — www-saucedemo-com · inventory · eb-261106-1157

Plan: plan.md · Style: normal · Generated: 2026-11-06
Focus: Inventory page (/inventory.html) only. A shopper browses the 6-product list, sorts it, adds and removes products, and the cart state stays correct. Left out: burger menu, footer links, cart page, checkout, login.
Source of truth: plan.md. This file is generated from it; do not edit.

## Overview

| ID | Priority | Area | Outcome | Title |
|---|---|---|---|---|
| TC-S1 | critical | add to cart | data | A shopper adds a product to the cart and sees the cart reflect it |
| TC-S2 | important | remove from cart | data | A shopper builds a multi-item cart and removes one item from the list |
| TC-S3 | high | sort | data | After sorting by price high to low the shopper adds the first listed product and the right item is added |
| TC-S4 | important | product details | state | A shopper opens a product's detail page and it matches the list entry |
| TC-S5 | high | cart persistence | state | The cart contents survive a page reload and a detour to a product detail page |
| TC-S6 | normal | sort | state | Every sort option orders the product list correctly |

---

## TC-S1: A shopper adds a product to the cart and sees the cart reflect it

**Priority:** critical · **Area:** add to cart · **Outcome:** data · **Covers:** —
**Page:** /inventory.html
**Precondition:** The user is logged in and on the inventory page; the cart is empty.

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Note that the cart link reads "Cart, empty" and no badge is shown | — | — |
| 2 | Click 'Add to cart' on the product "Sauce Labs Backpack" | "Sauce Labs Backpack" | — |
| 3 | Check the button on that product and the cart link/badge | — | The button on "Sauce Labs Backpack" changes from "Add to cart" to "Remove"; The cart shows a badge with 1 and the cart link is no longer named "Cart, empty"; The other 5 products still show "Add to cart" |
| 4 | Click 'Remove' on "Sauce Labs Backpack" to restore the empty cart | "Sauce Labs Backpack" | After Remove the button is "Add to cart" again and the cart is empty (no badge) |

**Postcondition:** The cart is empty.

---

## TC-S2: A shopper builds a multi-item cart and removes one item from the list

**Priority:** important · **Area:** remove from cart · **Outcome:** data · **Covers:** —
**Page:** /inventory.html
**Precondition:** The user is logged in and on the inventory page; the cart is empty.

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Click 'Add to cart' on "Sauce Labs Bike Light", "Sauce Labs Onesie" and "Sauce Labs Fleece Jacket" | "Sauce Labs Bike Light", "Sauce Labs Onesie", "Sauce Labs Fleece Jacket" | — |
| 2 | Check the cart badge | — | — |
| 3 | Click 'Remove' on "Sauce Labs Onesie" | "Sauce Labs Onesie" | — |
| 4 | Check the cart badge and the buttons of all 6 products | — | The badge reads 3 after the three adds, then 2 after removing the Onesie; "Sauce Labs Onesie" shows "Add to cart" again; "Bike Light" and "Fleece Jacket" still show "Remove"; The three products that were never touched still show "Add to cart" |
| 5 | Click 'Remove' on the two remaining added products to restore the empty cart | "Sauce Labs Bike Light", "Sauce Labs Fleece Jacket" | At the end the cart is empty (no badge) |

**Postcondition:** The cart is empty.

---

## TC-S3: After sorting by price high to low the shopper adds the first listed product and the right item is added

**Priority:** high · **Area:** sort · **Outcome:** data · **Covers:** —
**Page:** /inventory.html
**Precondition:** The user is logged in and on the inventory page; the cart is empty; sort = "Name (A to Z)".

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Select "Price (high to low)" in the 'Sort products' dropdown | "Price (high to low)" | — |
| 2 | Note the name and price of the first product in the list | — | The first product in the list is "Sauce Labs Fleece Jacket" at $49.99 |
| 3 | Click 'Add to cart' on that first product | The first listed product | — |
| 4 | Check which product shows "Remove" and the cart badge | — | After adding, exactly that product shows "Remove" and the badge reads 1 |
| 5 | Click 'Remove' on it to restore the empty cart | The first listed product | After Remove the cart is empty |

**Postcondition:** The cart is empty; sort = "Price (high to low)" (the tester sets it back to "Name (A to Z)").

---

## TC-S4: A shopper opens a product's detail page and it matches the list entry

**Priority:** important · **Area:** product details · **Outcome:** state · **Covers:** —
**Page:** /inventory.html
**Precondition:** The user is logged in and on the inventory page; the cart is empty.

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Note the name, description and price of "Sauce Labs Bolt T-Shirt" in the list | "Sauce Labs Bolt T-Shirt" | — |
| 2 | Click the product title "Sauce Labs Bolt T-Shirt" | "Sauce Labs Bolt T-Shirt" | The URL changes to a product detail URL for each opened product |
| 3 | Compare the detail page name, description, price and image | — | Name, description and price on each detail page equal the list values ($15.99 for the Bolt T-Shirt, $29.99 for the Backpack) |
| 4 | Return to the inventory page with the browser Back action | — | — |
| 5 | Click the product image of "Sauce Labs Backpack" and compare name and price on its detail page | "Sauce Labs Backpack" | — |
| 6 | Return to the inventory page | — | After going back the inventory page shows all 6 products and the cart is still empty |

---

## TC-S5: The cart contents survive a page reload and a detour to a product detail page

**Priority:** high · **Area:** cart persistence · **Outcome:** state · **Covers:** —
**Page:** /inventory.html
**Precondition:** The user is logged in and on the inventory page; the cart is empty.

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Click 'Add to cart' on "Sauce Labs Bolt T-Shirt" | "Sauce Labs Bolt T-Shirt" | — |
| 2 | Reload the page | — | — |
| 3 | Check the badge and the button of that product | — | After the reload the badge still reads 1 and "Sauce Labs Bolt T-Shirt" still shows "Remove" |
| 4 | Open the detail page of "Test.allTheThings() T-Shirt (Red)" and return to the inventory page | "Test.allTheThings() T-Shirt (Red)" | — |
| 5 | Check the badge and the Bolt T-Shirt button again | — | After the detour the badge still reads 1 and the Bolt T-Shirt still shows "Remove" |
| 6 | Click 'Remove' on "Sauce Labs Bolt T-Shirt" to restore the empty cart | "Sauce Labs Bolt T-Shirt" | After Remove the cart is empty |

**Postcondition:** The cart is empty.

---

## TC-S6: Every sort option orders the product list correctly

**Priority:** normal · **Area:** sort · **Outcome:** state · **Covers:** —
**Page:** /inventory.html
**Precondition:** The user is logged in and on the inventory page; sort = "Name (A to Z)" (default).

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Select each option in turn in the 'Sort products' dropdown: "Name (Z to A)", "Price (low to high)", "Price (high to low)", "Name (A to Z)" | "Name (Z to A)", "Price (low to high)", "Price (high to low)", "Name (A to Z)" | The dropdown shows the selected option each time and always 6 products are listed |
| 2 | After each selection read the list of product names and prices | — | Name (A to Z): Backpack, Bike Light, Bolt T-Shirt, Fleece Jacket, Onesie, Test.allTheThings() T-Shirt (Red); Name (Z to A): the exact reverse of the above; Price (low to high): $7.99, $9.99, $15.99, $15.99, $29.99, $49.99 (the two $15.99 items in either order); Price (high to low): the reverse price order |
| 3 | Finish on "Name (A to Z)" (the default) | "Name (A to Z)" | — |

**Postcondition:** Sort = "Name (A to Z)".

---

## Summary

- Scenarios: 6 (data 3, state 3, ui 0)
- Priorities: critical 1, important 2, high 2, normal 1, low 0
