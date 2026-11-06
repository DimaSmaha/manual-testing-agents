# Test cases — www.saucedemo.com · cart, checkout-step-one, inventory-item · eb-261101-1211

Plan: plan.md · Style: psycho · Generated: 2026-11-01
Focus: none (pages chosen by the user: cart, checkout-step-one, inventory-item)
Source of truth: plan.md. This file is generated from it; do not edit.

## Overview

| ID | Page | Priority | Area | Outcome | Title |
|---|---|---|---|---|---|
| TC-S1 | /inventory.html | important | cart page (inventory → cart) | data | A shopper removes cart items with repeated clicks and browser history jumps and the cart page, badge and product list stay in agreement |
| TC-S2 | /inventory-item.html?id=4 | high | add to cart (detail page, rapid input) | data | A shopper hammers 'Add to cart' on a product page and the cart still holds the product exactly once across reload and history moves |
| TC-S3 | /inventory-item.html?id=4 | high | product id in the address (discovery) | data | Find out what a shopper sees and can add to the cart when the product id in the address is broken |
| TC-S4 | /cart.html | high | checkout entry (cart → checkout-step-one) | state | Find out whether a shopper with an empty cart can pass the checkout information step |
| TC-S5 | /inventory.html | important | checkout form, hostile input (inventory → cart → checkout-step-one) | state | A shopper submits the checkout form with a script tag, a ten-thousand-character name and SQL in the zip field and the app answers in a defined way |
| TC-S6 | /checkout-step-one.html | high | checkout form, empty and boundary values (checkout-step-one) | state | A shopper submits the checkout form empty, then with spaces, an emoji and a negative zip, and each attempt gets a clear answer |

---

## TC-S1: A shopper removes cart items with repeated clicks and browser history jumps and the cart page, badge and product list stay in agreement

**Priority:** important · **Area:** cart page (inventory → cart) · **Outcome:** data · **Covers:** —
**Page:** /inventory.html
**Precondition:** Logged in; the cart is empty.

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Check the cart link reads "Cart, empty" | — | — |
| 2 | On the product list click 'Add to cart' on Sauce Labs Bike Light, Sauce Labs Onesie and Sauce Labs Backpack | Sauce Labs Bike Light, Sauce Labs Onesie, Sauce Labs Backpack | — |
| 3 | Click the cart link in the header | — | — |
| 4 | Double-click 'Remove' on Sauce Labs Bike Light on the cart page | Sauce Labs Bike Light | After the double-click the cart page lists Sauce Labs Onesie and Sauce Labs Backpack, each exactly once |
| 5 | Click 'Remove' on Sauce Labs Onesie on the cart page | Sauce Labs Onesie | — |
| 6 | Use the browser Back action and check the badge and the buttons of all six products on the product list | — | After the browser Back action the product list badge reads 1 and only Sauce Labs Backpack shows 'Remove' |
| 7 | Use the browser Forward action and check the items on the cart page | — | After the browser Forward action the cart page lists only Sauce Labs Backpack |
| 8 | Click 'Remove' on Sauce Labs Backpack on the cart page | Sauce Labs Backpack | — |
| 9 | Click 'Continue Shopping', reload the product list and check the badge, the cart link and the buttons of all six products | — | After the last removal and the reload the badge is gone, the cart link reads "Cart, empty" and all six products show 'Add to cart' |

**Postcondition:** cart empty.

---

## TC-S2: A shopper hammers 'Add to cart' on a product page and the cart still holds the product exactly once across reload and history moves

**Priority:** high · **Area:** add to cart (detail page, rapid input) · **Outcome:** data · **Covers:** —
**Page:** /inventory-item.html?id=4
**Precondition:** Logged in; the cart is empty; the page shows Sauce Labs Backpack.

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Check the cart link reads "Cart, empty" and the button reads 'Add to cart' | — | — |
| 2 | Click the add/remove button five times in quick succession (it toggles between 'Add to cart' and 'Remove') | 5 clicks | — |
| 3 | Check the badge, the cart link and the button | — | After five quick clicks the badge reads 1 and the button reads 'Remove' |
| 4 | Reload the page and check the badge and the button again | — | After the reload the badge still reads 1 and the button still reads 'Remove' |
| 5 | Click 'Back to products' and check the badge and the buttons of all six products | — | On the product list only Sauce Labs Backpack shows 'Remove' |
| 6 | Use the browser Back action to return to the detail page and check the button | — | After the browser Back action the detail page button reads 'Remove' |
| 7 | Click 'Remove' on the detail page and check the badge | — | After the final 'Remove' the badge is gone and the cart link reads "Cart, empty" |

**Postcondition:** cart empty.

---

## TC-S3: Find out what a shopper sees and can add to the cart when the product id in the address is broken

**Priority:** high · **Area:** product id in the address (discovery) · **Outcome:** data · **Covers:** —
**Page:** /inventory-item.html?id=4
**Precondition:** Logged in; the cart is empty.

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Check the cart link reads "Cart, empty" | — | — |
| 2 | Open /inventory-item.html?id=6 and read what the page shows | id=6 | — |
| 3 | If an 'Add to cart' button is shown, click it and check the badge and the cart link | — | — |
| 4 | Open /inventory-item.html?id=-1 and repeat the two steps above | id=-1 | — |
| 5 | Open /inventory-item.html?id=abc and repeat the two steps above | id=abc | — |
| 6 | Open /inventory-item.html?id=4.5 and repeat the two steps above | id=4.5 | — |
| 7 | Open /inventory-item.html?id= (empty value) and repeat the two steps above | id= | — |
| 8 | Open /inventory-item.html?id=%3Cscript%3Ealert(1)%3C%2Fscript%3E and repeat the two steps above | id=%3Cscript%3Ealert(1)%3C%2Fscript%3E | Each broken id gives a defined result: a not-found style message, an empty product card or a redirect to the product list, with no browser error page and no JavaScript dialog |
| 9 | Open the cart page and read every item listed | — | Every item listed on the cart page has a product name and a price |
| 10 | Click 'Remove' on every item this scenario added, then open the product list and check the badge and buttons | — | After the removals the cart link reads "Cart, empty" and all six products show 'Add to cart' |

**Postcondition:** cart empty.

---

## TC-S4: Find out whether a shopper with an empty cart can pass the checkout information step

**Priority:** high · **Area:** checkout entry (cart → checkout-step-one) · **Outcome:** state · **Covers:** —
**Page:** /cart.html
**Precondition:** Logged in; the cart is empty.

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Check the cart link reads "Cart, empty" and the cart page lists no products | — | — |
| 2 | Click 'Checkout' and read where the page goes and whether a message is shown | — | Clicking 'Checkout' with an empty cart gives a definite result: the page stays on /cart.html with a message, or it moves to /checkout-step-one.html |
| 3 | If the page is /checkout-step-one.html, fill 'First Name' with "eb-261101-1211", 'Last Name' with "Empty Cart" and 'Zip/Postal Code' with "00000" | "eb-261101-1211", "Empty Cart", "00000" | — |
| 4 | Click 'Continue' and read the result | — | — |
| 5 | If the page is /checkout-step-two.html, read the item list and the totals, do not click 'Finish', and click 'Cancel' | — | If /checkout-step-two.html is reached it lists no products |
| 6 | Check the cart link | — | After the scenario the cart link reads "Cart, empty" |

**Postcondition:** cart empty; no order placed.

---

## TC-S5: A shopper submits the checkout form with a script tag, a ten-thousand-character name and SQL in the zip field and the app answers in a defined way

**Priority:** important · **Area:** checkout form, hostile input (inventory → cart → checkout-step-one) · **Outcome:** state · **Covers:** —
**Page:** /inventory.html
**Precondition:** Logged in; the cart is empty.

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Check the cart link reads "Cart, empty" | — | — |
| 2 | On the product list click 'Add to cart' on Sauce Labs Onesie | Sauce Labs Onesie | — |
| 3 | Click the cart link and then 'Checkout' | — | — |
| 4 | Fill 'First Name' with `<script>alert(1)</script>` | `<script>alert(1)</script>` | — |
| 5 | Fill 'Last Name' with a string of 10000 times "Ö" | "Ö" x 10000 | — |
| 6 | Fill 'Zip/Postal Code' with `' OR '1'='1' --` | `' OR '1'='1' --` | — |
| 7 | Click 'Continue' and read the result | — | Clicking 'Continue' gives a definite result: an error message is shown and the URL stays /checkout-step-one.html, or the page moves to /checkout-step-two.html |
| 8 | If the page is /checkout-step-two.html, do not click 'Finish', and click 'Cancel' | — | No JavaScript dialog appears at any point |
| 9 | Click 'Remove' on Sauce Labs Onesie wherever it is shown and check the cart link | Sauce Labs Onesie | After the cleanup the cart link reads "Cart, empty" and all six products show 'Add to cart' |

**Postcondition:** cart empty; no order placed.

---

## TC-S6: A shopper submits the checkout form empty, then with spaces, an emoji and a negative zip, and each attempt gets a clear answer

**Priority:** high · **Area:** checkout form, empty and boundary values (checkout-step-one) · **Outcome:** state · **Covers:** —
**Page:** /checkout-step-one.html
**Precondition:** Logged in; the cart is empty; the form is untouched.

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Check the three fields are empty and the cart link reads "Cart, empty" | — | — |
| 2 | Click 'Continue' with all three fields empty and read the message | — | Continue with all three fields empty keeps the URL /checkout-step-one.html and shows a non-empty message in the error container |
| 3 | Fill 'First Name' with three spaces, 'Last Name' with "😀" and 'Zip/Postal Code' with "-1" | "   ", "😀", "-1" | — |
| 4 | Click 'Continue' and read the result | — | — |
| 5 | If the page is still /checkout-step-one.html, clear 'First Name', fill 'Last Name' with "O'Brien-Smith" and 'Zip/Postal Code' with forty times "9", and click 'Continue' | "O'Brien-Smith", "9" x 40 | Each later 'Continue' gives a definite result: an error message with the URL unchanged, or a move to /checkout-step-two.html |
| 6 | If the page is /checkout-step-two.html, do not click 'Finish', and click 'Cancel' | — | — |
| 7 | Check the cart link | — | After the scenario the cart link reads "Cart, empty" |

**Postcondition:** cart empty; no order placed.

---

## Summary

- Scenarios: 6 (data 3, state 3, ui 0)
- Priorities: critical 0, important 2, high 4, normal 0, low 0
