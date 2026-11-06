---
url: /inventory.html
title: Swag Labs
state_key: /inventory.html|-|
researched_at: 2026-11-01T11:11:00Z
mode: deep
---

# Swag Labs - Products (inventory)

Post-login landing page of the Sauce Labs demo shop. A user browses the 6 products, sorts them, adds items to the cart, opens a product's detail page, or opens the burger menu for navigation / logout / app-state reset.

## List

Product catalog, 6 cards (image, name, description, price, "Add to cart"). All items are shown, no paging. Default sort: Name (A to Z). Prices: Backpack $29.99, Bike Light $9.99, Bolt T-Shirt $15.99, Fleece Jacket $49.99, Onesie $7.99, Test.allTheThings() T-Shirt (Red) $15.99. Accessible names repeat ("Add to cart" x6; each "View details for <product>" x2: image link and title link), so ARIA is `-` and rows are disambiguated by `data-test`. The image and title links have role `button` (explicit `role="button"`, `href="#"`). After an add the button becomes "Remove" and the cart link gets a badge (not clicked: would change data).

> Container: '.inventory_list'

| Element | Type | ARIA | CSS |
|---|---|---|---|
| 'View details (image) Sauce Labs Backpack' | button | - | 'a[data-test="item-4-img-link"]' |
| 'View details (title) Sauce Labs Backpack' | button | - | 'a[data-test="item-4-title-link"]' |
| 'Add to cart Sauce Labs Backpack' | button | - | 'button[data-test="add-to-cart-sauce-labs-backpack"]' |
| 'View details (image) Sauce Labs Bike Light' | button | - | 'a[data-test="item-0-img-link"]' |
| 'View details (title) Sauce Labs Bike Light' | button | - | 'a[data-test="item-0-title-link"]' |
| 'Add to cart Sauce Labs Bike Light' | button | - | 'button[data-test="add-to-cart-sauce-labs-bike-light"]' |
| 'View details (image) Sauce Labs Bolt T-Shirt' | button | - | 'a[data-test="item-1-img-link"]' |
| 'View details (title) Sauce Labs Bolt T-Shirt' | button | - | 'a[data-test="item-1-title-link"]' |
| 'Add to cart Sauce Labs Bolt T-Shirt' | button | - | 'button[data-test="add-to-cart-sauce-labs-bolt-t-shirt"]' |
| 'View details (image) Sauce Labs Fleece Jacket' | button | - | 'a[data-test="item-5-img-link"]' |
| 'View details (title) Sauce Labs Fleece Jacket' | button | - | 'a[data-test="item-5-title-link"]' |
| 'Add to cart Sauce Labs Fleece Jacket' | button | - | 'button[data-test="add-to-cart-sauce-labs-fleece-jacket"]' |
| 'View details (image) Sauce Labs Onesie' | button | - | 'a[data-test="item-2-img-link"]' |
| 'View details (title) Sauce Labs Onesie' | button | - | 'a[data-test="item-2-title-link"]' |
| 'Add to cart Sauce Labs Onesie' | button | - | 'button[data-test="add-to-cart-sauce-labs-onesie"]' |
| 'View details (image) Test.allTheThings() T-Shirt (Red)' | button | - | 'a[data-test="item-3-img-link"]' |
| 'View details (title) Test.allTheThings() T-Shirt (Red)' | button | - | 'a[data-test="item-3-title-link"]' |
| 'Add to cart Test.allTheThings() T-Shirt (Red)' | button | - | 'button[data-test="add-to-cart-test.allthethings()-t-shirt-(red)"]' |

XPath backups (verified, 1 match each): `//a[@id="item_<n>_img_link"]` and `//a[@id="item_<n>_title_link"]` with n = 4, 0, 1, 5, 2, 3 in the row order above.

## Menu

Sort toolbar under the header (title "Products"). Native `<select>`; option values: `az` Name (A to Z) [default], `za` Name (Z to A), `lohi` Price (low to high), `hilo` Price (high to low).

> Container: '.header_secondary_container'

| Element | Type | ARIA | CSS |
|---|---|---|---|
| 'Sort products' | combobox | { role: 'combobox', text: 'Sort products' } | 'select.product_sort_container' |

## Navigation (header)

> Container: '.primary_header'

| Element | Type | ARIA | CSS |
|---|---|---|---|
| 'Open Menu' | button | { role: 'button', text: 'Open Menu' } | 'button#react-burger-menu-btn' |
| 'Cart' | button | { role: 'button', text: 'Cart, empty' } | 'a.shopping_cart_link' |

The Cart accessible name is state-dependent ("Cart, empty" with no items, a count when items are in it); `a.shopping_cart_link` is state-independent. It is an `<a>` without a usable href and exposes role `button`.

## Navigation (footer)

Social links (external, leave the site) and the line "(c) 2026 Sauce Labs. All Rights Reserved. Terms of Service | Privacy Policy" (plain text, not links).

> Container: '.footer'

| Element | Type | ARIA | CSS |
|---|---|---|---|
| 'X' | link | { role: 'link', text: 'X' } | 'a[data-test="social-x"]' |
| 'Facebook' | link | { role: 'link', text: 'Facebook' } | 'a[data-test="social-facebook"]' |
| 'LinkedIn' | link | { role: 'link', text: 'LinkedIn' } | 'a[data-test="social-linkedin"]' |

## Extended Research

### Burger sidebar (opened by: click 'Open Menu')

Slide-in panel, 300px, container `.bm-menu-wrap` (`aria-hidden="true"` while closed, items are in the DOM but not exposed by role; `aria-hidden="false"` when open). "All Items" is focused on open. Items verified with the menu open (ARIA + CSS both unique). Closed by: click 'Close Menu' (Escape was not needed). Items not clicked: Logout ends the session, Reset App State clears cart/app state, Dynamic Catalog and All Items navigate (not explored: would leave the inventory state or change data); About is an external link to https://saucelabs.com/.

> Container: '.bm-menu-wrap'

| Element | Type | ARIA | CSS |
|---|---|---|---|
| 'All Items' | button | { role: 'button', text: 'All Items' } | 'a[data-test="inventory-sidebar-link"]' |
| 'Dynamic Catalog' | button | { role: 'button', text: 'Dynamic Catalog' } | 'a[data-test="dynamic-catalog-sidebar-link"]' |
| 'About' | link | { role: 'link', text: 'About' } | 'a[data-test="about-sidebar-link"]' |
| 'Logout' | button | { role: 'button', text: 'Logout' } | 'a[data-test="logout-sidebar-link"]' |
| 'Reset App State' | button | { role: 'button', text: 'Reset App State' } | 'a[data-test="reset-sidebar-link"]' |
| 'Close Menu' | button | { role: 'button', text: 'Close Menu' } | 'button#react-burger-cross-btn' |

### Sort options (opened by: click 'Sort products'; then selected each value, finally restored to az)

The native dropdown exposes no extra DOM, closed with Escape. Selecting an option re-orders the cards in place (URL unchanged, view state only, no data change):

- `lohi` Price (low to high): Onesie, Bike Light, Bolt T-Shirt, Test.allTheThings() T-Shirt (Red), Backpack, Fleece Jacket (equal prices keep catalog order).
- `hilo` Price (high to low): Fleece Jacket, Backpack, Bolt T-Shirt, Test.allTheThings() T-Shirt (Red), Bike Light, Onesie.
- `za` Name (Z to A): Test.allTheThings() T-Shirt (Red), Onesie, Fleece Jacket, Bolt T-Shirt, Bike Light, Backpack.
- `az` Name (A to Z) restores the default: Backpack, Bike Light, Bolt T-Shirt, Fleece Jacket, Onesie, Test.allTheThings() T-Shirt (Red).

Not explored (would navigate or change data): cart page, product detail pages, Add to cart / Remove, footer social links (external).

## Locator check
Checked 30 locators: 30 ok, 0 fixed, 0 unverified (24 main-state rows verified with the menu closed, 6 sidebar rows with the menu open; every individual ARIA/CSS/XPath locator returned exactly 1 match). Containers: 5 ok / 0 broken ('.inventory_list', '.header_secondary_container', '.primary_header', '.footer', '.bm-menu-wrap'). List rows have no ARIA locator by design (names repeat).
