---
url: /checkout-step-one.html
title: Swag Labs
state_key: /checkout-step-one.html|-|
researched_at: 2026-11-01T11:11:00Z
mode: deep
---

# Swag Labs - Checkout: Your Information (checkout-step-one)

Step 1 of the Sauce Labs demo shop checkout (page title text "Checkout: Your Information"). The user enters first name, last name and zip/postal code, then goes on with "Continue" or returns to the cart with "Cancel".

**State observed: opened by plain URL load with an EMPTY cart** (cart link "Cart, empty", no badge). Nothing was typed, no button of the form was clicked, nothing was submitted. How the page, "Continue" or validation behave with a filled cart (or whether an empty cart is redirected/blocked at the next step) is unknown to this run.

## Content

Checkout information form (`<form aria-label="Checkout information">`). Three text inputs, an empty error container and two buttons. All inputs carry the class `input_error` already in the pristine state (it is a base class here, not an error marker) and have no `required` attribute seen in the DOM. The error container `.error-message-container` is present but EMPTY now; no `[data-test="error"]` element exists until a validation message is shown (never triggered here, message texts unknown).

> Container: 'form[aria-label="Checkout information"]'

| Element | Type | ARIA | CSS |
|---|---|---|---|
| 'First Name' | textbox | { role: 'textbox', text: 'First Name' } | 'input[data-test="firstName"]' |
| 'Last Name' | textbox | { role: 'textbox', text: 'Last Name' } | 'input[data-test="lastName"]' |
| 'Zip/Postal Code' | textbox | { role: 'textbox', text: 'Zip/Postal Code' } | 'input[data-test="postalCode"]' |
| 'Error message container (empty)' | - | - | '.error-message-container' |
| 'Cancel' | button | { role: 'button', text: 'Cancel' } | 'button[data-test="cancel"]' |
| 'Continue' | button | { role: 'button', text: 'Continue' } | 'input[data-test="continue"]' |

Inputs: `type="text"`, `name` = `firstName` / `lastName` / `postalCode`, `placeholder` equal to the label, `aria-label` equal to the label (no `<label>` element). "Continue" is `<input type="submit" value="Continue">` (submit of the form, not clicked); "Cancel" is a `<button>` (not clicked: navigates away, expected to be the cart, destination not verified).

XPath backups (verified, 1 match each): `//input[@id="first-name"]`, `//input[@id="last-name"]`, `//input[@id="postal-code"]`, `//button[@id="cancel"]`, `//input[@id="continue"]`.

## Navigation (header)

Header band shows the logo text "Swag Labs" and, in the secondary header, the title "Checkout: Your Information" (`[data-test="title"]`, plain text).

> Container: '.primary_header'

| Element | Type | ARIA | CSS |
|---|---|---|---|
| 'Open Menu' | button | { role: 'button', text: 'Open Menu' } | 'button#react-burger-menu-btn' |
| 'Cart' | button | { role: 'button', text: 'Cart, empty' } | 'a.shopping_cart_link' |

The Cart accessible name is state-dependent ("Cart, empty" now); `a.shopping_cart_link` / `[data-test="shopping-cart-link"]` is state-independent (an `<a>` exposed as role `button`). Not clicked (navigates). XPath backups: `//button[@id="react-burger-menu-btn"]`, `//a[@data-test="shopping-cart-link"]`.

## Navigation (footer)

Social links open external sites (`target="_blank"`); plain-text copyright line.

> Container: '.footer'

| Element | Type | ARIA | CSS |
|---|---|---|---|
| 'X' | link | { role: 'link', text: 'X' } | 'a[data-test="social-x"]' |
| 'Facebook' | link | { role: 'link', text: 'Facebook' } | 'a[data-test="social-facebook"]' |
| 'LinkedIn' | link | { role: 'link', text: 'LinkedIn' } | 'a[data-test="social-linkedin"]' |

## Extended Research

### Burger sidebar (opened by: click 'Open Menu')

Same slide-in panel as on `/cart.html` and `/inventory.html`, container `.bm-menu-wrap` (`aria-hidden="true"` and `hidden` while closed, open after the click). "All Items" gets focus on open. Closed again with 'Close Menu'; the page stayed on /checkout-step-one.html, the form stayed empty. Not clicked: All Items (navigates), About (external, https://saucelabs.com/), Logout (ends the session), Reset App State (clears cart/app state).

> Container: '.bm-menu-wrap'

| Element | Type | ARIA | CSS |
|---|---|---|---|
| 'All Items' | button | { role: 'button', text: 'All Items' } | 'a[data-test="inventory-sidebar-link"]' |
| 'Dynamic Catalog' | button | { role: 'button', text: 'Dynamic Catalog' } | 'a[data-test="dynamic-catalog-sidebar-link"]' |
| 'About' | link | { role: 'link', text: 'About' } | 'a[data-test="about-sidebar-link"]' |
| 'Logout' | button | { role: 'button', text: 'Logout' } | 'a[data-test="logout-sidebar-link"]' |
| 'Reset App State' | button | { role: 'button', text: 'Reset App State' } | 'a[data-test="reset-sidebar-link"]' |
| 'Close Menu' | button | - (icon button; `getByRole('button', { name: 'Close Menu' })` also matched 1) | 'button#react-burger-cross-btn' |

### Dynamic Catalog submenu (opened by: click 'Dynamic Catalog' inside the open burger sidebar)

An accordion (`aria-expanded`), not a link; the URL stayed /checkout-step-one.html. Clicking it again collapsed it. The three entries are buttons whose destinations are unknown (not clicked: would navigate away). They exist in the DOM only while the accordion is expanded.

> Container: '.bm-menu-wrap'

| Element | Type | ARIA | CSS |
|---|---|---|---|
| 'Lazy Load' | button | { role: 'button', text: 'Lazy Load' } | 'a[data-test="dynamic-catalog-lazy-load-link"]' |
| 'Spinner' | button | { role: 'button', text: 'Spinner' } | 'a[data-test="dynamic-catalog-spinner-link"]' |
| 'Slider' | button | { role: 'button', text: 'Slider' } | 'a[data-test="dynamic-catalog-slider-link"]' |

Not explored: "Continue" (form submit; validation messages and the next page unknown), "Cancel", the cart link, social links (all navigate or submit). The page has no tabs, dropdowns, selects or row menus. Deep clicks used: 3 of 10.

## Locator check
Checked 20 locators: 20 ok, 0 fixed, 0 unverified (11 main-state rows with the menu closed, 9 sidebar/submenu rows with the menu open and the accordion expanded; every ARIA, CSS and XPath locator that was tried returned exactly 1 match; the Close Menu row has no ARIA name in the table, role lookup also returned 1). Containers: 4 ok / 0 broken ('form[aria-label="Checkout information"]', '.primary_header', '.footer', '.bm-menu-wrap'). Final state: menu closed, accordion collapsed, form untouched, cart empty, URL /checkout-step-one.html.
