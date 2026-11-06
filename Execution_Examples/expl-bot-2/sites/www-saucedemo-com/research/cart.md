---
url: /cart.html
title: Swag Labs
state_key: /cart.html|-|
researched_at: 2026-11-01T11:11:00Z
mode: deep
---

# Swag Labs - Your Cart (cart)

Shopping cart of the Sauce Labs demo shop (page heading "Your Cart"). A user reviews the items added on the product list, then goes back with "Continue Shopping" or moves to the checkout form with "Checkout".

**State observed: EMPTY cart** (no item rows in the DOM, cart link named "Cart, empty", no badge). Nothing was added, removed, reset or checked out during this research. The filled-cart rows below the table are NOT in this map because they were never seen on this page by this run; see "Not observed" for what earlier runs recorded.

## List

Cart item list. Empty in the observed state: only the column labels "QTY" and "Description" are rendered (not controls); no item rows, no Remove buttons.

> Container: '.cart_list'

| Element | Type | ARIA | CSS |
|---|---|---|---|
| (no controls in the empty state) | - | - | - |

## Content

Cart actions under the list. Both buttons are always present, also with an empty cart ("Checkout" is not disabled when empty; not clicked here).

> Container: '#cart_contents_container'

| Element | Type | ARIA | CSS |
|---|---|---|---|
| 'Continue Shopping' | button | { role: 'button', text: 'Continue Shopping' } | 'button[data-test="continue-shopping"]' |
| 'Checkout' | button | { role: 'button', text: 'Checkout' } | 'button[data-test="checkout"]' |

XPath backups (verified, 1 match each): `//button[@id="continue-shopping"]`, `//button[@id="checkout"]`.

## Navigation (header)

Secondary header shows the title "Your Cart" (`[data-test="title"]`, plain text).

> Container: '.primary_header'

| Element | Type | ARIA | CSS |
|---|---|---|---|
| 'Open Menu' | button | { role: 'button', text: 'Open Menu' } | 'button#react-burger-menu-btn' |
| 'Cart' | button | { role: 'button', text: 'Cart, empty' } | 'a.shopping_cart_link' |

The Cart accessible name is state-dependent ("Cart, empty" here); `a.shopping_cart_link` / `[data-test="shopping-cart-link"]` is state-independent. It is an `<a>` without a usable href and exposes role `button`. On this page it points to the page you are already on. XPath backups: `//button[@id="react-burger-menu-btn"]`, `//a[@data-test="shopping-cart-link"]`.

## Navigation (footer)

Social links (external, leave the site) and the plain-text copyright line.

> Container: '.footer'

| Element | Type | ARIA | CSS |
|---|---|---|---|
| 'X' | link | { role: 'link', text: 'X' } | 'a[data-test="social-x"]' |
| 'Facebook' | link | { role: 'link', text: 'Facebook' } | 'a[data-test="social-facebook"]' |
| 'LinkedIn' | link | { role: 'link', text: 'LinkedIn' } | 'a[data-test="social-linkedin"]' |

## Not observed (filled cart)

Not seen by this run (the cart was empty and nothing may be added). Taken from earlier runs, `experience/inventory.md` flow "Review the cart page and remove an item there" (not verified here, no locator was re-tested):

- The cart page lists each added product with a QTY column (no quantity editing seen), name and price, a per-item "Remove" button with `data-test="remove-<product-slug>"`, "Continue Shopping" and "Checkout" below.
- The header cart link then reads "Cart, N items" and shows a badge with the count (`research/inventory.md`, `experience/inventory.md`).
- Cart contents persist client-side across reload and navigation (experience).

Not explored: "Checkout" (leads to a form page, a separate page-key), per-item "Remove", Logout, Reset App State.

## Extended Research

### Burger sidebar (opened by: click 'Open Menu')

Same slide-in panel as on `/inventory.html` (`research/inventory.md`), container `.bm-menu-wrap` (`aria-hidden="true"` while closed, `"false"` when open). "All Items" is focused on open. Rows verified with the menu open (ARIA, CSS and XPath each unique). Closed again with 'Close Menu'; the page stayed on /cart.html. Not clicked: All Items (navigates), About (external, https://saucelabs.com/), Logout (ends the session), Reset App State (clears cart/app state).

> Container: '.bm-menu-wrap'

| Element | Type | ARIA | CSS |
|---|---|---|---|
| 'All Items' | button | { role: 'button', text: 'All Items' } | 'a[data-test="inventory-sidebar-link"]' |
| 'Dynamic Catalog' | button | { role: 'button', text: 'Dynamic Catalog' } | 'a[data-test="dynamic-catalog-sidebar-link"]' |
| 'About' | link | { role: 'link', text: 'About' } | 'a[data-test="about-sidebar-link"]' |
| 'Logout' | button | { role: 'button', text: 'Logout' } | 'a[data-test="logout-sidebar-link"]' |
| 'Reset App State' | button | { role: 'button', text: 'Reset App State' } | 'a[data-test="reset-sidebar-link"]' |
| 'Close Menu' | button | { role: 'button', text: 'Close Menu' } | 'button#react-burger-cross-btn' |

### Dynamic Catalog submenu (opened by: click 'Dynamic Catalog' inside the open burger sidebar)

An accordion, not a link: the button gets `[expanded]` and an inline submenu appears between "Dynamic Catalog" and "About"; the URL stayed /cart.html. Clicking it again collapsed it (restored). The three entries are buttons whose destinations are unknown (not clicked: would navigate away). The submenu items are only in the DOM/role tree while the accordion is expanded (the first DOM dump with the menu closed did not list them).

> Container: '.bm-menu-wrap'

| Element | Type | ARIA | CSS |
|---|---|---|---|
| 'Lazy Load' | button | { role: 'button', text: 'Lazy Load' } | 'a[data-test="dynamic-catalog-lazy-load-link"]' |
| 'Spinner' | button | { role: 'button', text: 'Spinner' } | 'a[data-test="dynamic-catalog-spinner-link"]' |
| 'Slider' | button | { role: 'button', text: 'Slider' } | 'a[data-test="dynamic-catalog-slider-link"]' |

Other deep candidates: the cart link and the footer social links either leave the page or are inert here (not explored: would navigate). The page has no tabs, dropdowns or row menus in the empty state.

## Locator check
Checked 16 locators: 16 ok, 0 fixed, 0 unverified (7 main-state rows with the menu closed, 9 sidebar/submenu rows with the menu open and the accordion expanded; every ARIA, CSS and XPath locator returned exactly 1 match). Containers: 5 ok / 0 broken ('.cart_list', '#cart_contents_container', '.primary_header', '.footer', '.bm-menu-wrap'). The List section has no control rows in the empty state. Final state: menu closed, accordion collapsed, cart empty, URL /cart.html.
