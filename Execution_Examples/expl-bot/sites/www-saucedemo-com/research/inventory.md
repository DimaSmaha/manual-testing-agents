---
url: /inventory.html
title: Swag Labs
state_key: /inventory.html|-|
researched_at: 2026-11-06T11:30:00Z
mode: standard
---

# Swag Labs - Products (inventory)

Post-login landing page of the Sauce Labs demo shop. A user browses the 6 products, sorts them, adds items to the cart, opens a product's detail page, or opens the burger menu for navigation / logout / app-state reset.

## List

Product catalog, 6 cards (name, description, price, image, "Add to cart"). All items are shown, no paging. Default sort: Name (A to Z). Prices: Backpack $29.99, Bike Light $9.99, Bolt T-Shirt $15.99, Fleece Jacket $49.99, Onesie $7.99, Test.allTheThings() T-Shirt (Red) $15.99. "Add to cart" / "View details" names repeat across cards, so rows are disambiguated by `data-test` (accessible name is not unique, ARIA = `-`). After an add, the button becomes "Remove" and the cart link name changes (not clicked in this run).

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

## Menu

Sort toolbar under the header. Options: Name (A to Z) [selected], Name (Z to A), Price (low to high), Price (high to low).

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

The Cart accessible name is state-dependent ("Cart, empty" when the cart has no items); `a.shopping_cart_link` is state-independent.

## Menu (sidebar, hidden until "Open Menu")

Burger side menu. The items exist in the DOM but are not visible or exposed by role while the menu is closed, so ARIA is `-` (not opened in standard mode). Verified by CSS only (counts, not clicks). Names come from DOM text.

> Container: '.bm-menu-wrap'

| Element | Type | ARIA | CSS |
|---|---|---|---|
| 'All Items' | link | - | 'a[data-test="inventory-sidebar-link"]' |
| 'Dynamic Catalog' | link | - | 'a[data-test="dynamic-catalog-sidebar-link"]' |
| 'About' | link | - | 'a[data-test="about-sidebar-link"]' |
| 'Logout' | link | - | 'a[data-test="logout-sidebar-link"]' |
| 'Reset App State' | link | - | 'a[data-test="reset-sidebar-link"]' |
| 'Close Menu' | button | - | 'button#react-burger-cross-btn' |

## Navigation (footer)

Social links (external) and copyright line "(c) 2026 Sauce Labs. All Rights Reserved. Terms of Service | Privacy Policy" (the last two are plain text here, not links in the snapshot).

> Container: '.footer'

| Element | Type | ARIA | CSS |
|---|---|---|---|
| 'X' | link | { role: 'link', text: 'X' } | 'a[data-test="social-x"]' |
| 'Facebook' | link | { role: 'link', text: 'Facebook' } | 'a[data-test="social-facebook"]' |
| 'LinkedIn' | link | { role: 'link', text: 'LinkedIn' } | 'a[data-test="social-linkedin"]' |

## Locator check
Checked 30 locators: 30 ok, 0 fixed, 0 unverified. Containers: 5 ok / 0 broken. (Product-card and sidebar rows have no ARIA locator: names repeat or the elements are hidden. Sidebar items verified by DOM count only.) Console showed 6 errors on the page (not investigated).
