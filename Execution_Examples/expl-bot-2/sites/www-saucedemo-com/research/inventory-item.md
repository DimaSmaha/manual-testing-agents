---
url: /inventory-item.html?id=4
title: Swag Labs
state_key: /inventory-item.html|-|
researched_at: 2026-11-01T11:11:00Z
mode: deep
---

# Swag Labs - Product detail (inventory-item)

Detail page of one product of the Sauce Labs demo shop (sample: id=4, Sauce Labs Backpack, $29.99). A user reads the name, description and price, adds the product to the cart, goes back to the catalog, or opens the cart / burger menu. There are no headings (the product name is a plain `div`). The id in the query string picks the product (ids 0-5 exist; the page-key collapses the id). Every detail control keeps the same id/data-test for all products here (`add-to-cart`, `back-to-products`); only the image `data-test` carries the product slug.

## Detail

Single product card: image, name, description, price, one action button. The "Add to cart" button is not clicked in research (would change cart state); after an add it is expected to turn into "Remove" and the cart link to get a badge (not verified here). The name/description/price rows are text for assertions, not controls. Image `src` is a hashed asset path (`/assets/sauce-backpack-1200x1500-<hash>.jpg`), do not use it as a locator; the image `data-test` is `item-<product-slug>-img` (here `item-sauce-labs-backpack-img`), the alt is the product name.

> Container: '.inventory_details_container'

| Element | Type | ARIA | CSS |
|---|---|---|---|
| 'Product image' | img | { role: 'img', text: 'Sauce Labs Backpack' } | 'img.inventory_details_img' |
| 'Product name' | text | - | '[data-test="inventory-item-name"]' |
| 'Product description' | text | - | '[data-test="inventory-item-desc"]' |
| 'Product price' | text | - | '[data-test="inventory-item-price"]' |
| 'Add to cart' | button | { role: 'button', text: 'Add to cart' } | 'button#add-to-cart' |

XPath backups (verified, 1 match each): image `//img[contains(@class,"inventory_details_img")]`, name `//div[contains(@class,"inventory_details_name")]`, description `//div[contains(@class,"inventory_details_desc ")]`, price `//div[contains(@class,"inventory_details_price")]`, add `//button[@id="add-to-cart"]`.

Values for id=4: name "Sauce Labs Backpack", description "carry.allTheThings() with the sleek, streamlined Sly Pack that melds uncompromising style with unequaled laptop and tablet protection.", price "$29.99". The ARIA name of the image changes with the id (alt = product name); the other rows' names and locators are the same for every product.

## Navigation (header)

"Back to products" sits in the header band under the top bar (same `header#header_container`, outside `.primary_header`). It is a `<button>`, not a link (no href): it navigates to /inventory.html. Cart accessible name is state-dependent ("Cart, empty" with no items, a count when items are in it); `a.shopping_cart_link` is state-independent (an `<a>` without href exposing role `button`; click goes to the cart page).

> Container: '#header_container'

| Element | Type | ARIA | CSS |
|---|---|---|---|
| 'Open Menu' | button | { role: 'button', text: 'Open Menu' } | 'button#react-burger-menu-btn' |
| 'Cart' | button | { role: 'button', text: 'Cart, empty' } | 'a.shopping_cart_link' |
| 'Back to products' | button | { role: 'button', text: 'Back to products' } | 'button#back-to-products' |

XPath backups (verified): Open Menu `//button[@id="react-burger-menu-btn"]`, Cart `//a[@data-test="shopping-cart-link"]`, Back `//button[@data-test="back-to-products"]`.

## Navigation (footer)

Social links (external, leave the site) and the plain-text line "(c) 2026 Sauce Labs. All Rights Reserved. Terms of Service | Privacy Policy" (not links). Same as the inventory page. Open in the same tab (not clicked).

> Container: '.footer'

| Element | Type | ARIA | CSS |
|---|---|---|---|
| 'X' | link | { role: 'link', text: 'X' } | 'a[data-test="social-x"]' |
| 'Facebook' | link | { role: 'link', text: 'Facebook' } | 'a[data-test="social-facebook"]' |
| 'LinkedIn' | link | { role: 'link', text: 'LinkedIn' } | 'a[data-test="social-linkedin"]' |

## Extended Research

### Burger sidebar (opened by: click 'Open Menu')

Same slide-in panel as on the inventory page, container `.bm-menu-wrap`. While closed its items are in the DOM but not exposed by role (ARIA locators return 0, CSS returns 1); while open the ARIA locators below match once each. "All Items" is focused on open. Closed by: click 'Close Menu'. Items not clicked: Logout ends the session, Reset App State clears cart/app state, Dynamic Catalog and All Items navigate (not explored: would leave the page or change data); About is an external link to https://saucelabs.com/. The page itself (cart empty, product, URL id=4) was unchanged after opening and closing.

> Container: '.bm-menu-wrap'

| Element | Type | ARIA | CSS |
|---|---|---|---|
| 'All Items' | button | { role: 'button', text: 'All Items' } | 'a[data-test="inventory-sidebar-link"]' |
| 'Dynamic Catalog' | button | { role: 'button', text: 'Dynamic Catalog' } | 'a[data-test="dynamic-catalog-sidebar-link"]' |
| 'About' | link | { role: 'link', text: 'About' } | 'a[data-test="about-sidebar-link"]' |
| 'Logout' | button | { role: 'button', text: 'Logout' } | 'a[data-test="logout-sidebar-link"]' |
| 'Reset App State' | button | { role: 'button', text: 'Reset App State' } | 'a[data-test="reset-sidebar-link"]' |
| 'Close Menu' | button | { role: 'button', text: 'Close Menu' } | 'button#react-burger-cross-btn' |

### Other ids and session behaviour (observations)

- Not explored: the detail page of another id (id=0). The attempt, a plain `goto` of `/inventory-item.html?id=0` right after reading id=4, landed on the login page `/` with the message "Epic sadface: You can only access '/inventory-item.html' when you are logged in." and `cookie-list` was empty, so the session had been lost between the id=4 load and this one (cause not determined; not caused by a click on Logout, which was never clicked). Opening a detail URL while logged out redirects to the login page with that message. The research of this page was finished before the redirect.
- Not explored (would change data or leave the page): Add to cart / Remove, Back to products, cart link, footer social links (external), Logout, Reset App State, Dynamic Catalog, All Items.

## Locator check
Checked 17 locators: 17 ok, 0 fixed, 0 unverified (every individual ARIA/CSS/XPath locator returned exactly 1 match; run twice: sidebar open and sidebar closed, in the closed state the 6 sidebar ARIA locators return 0 by design because the panel is `aria-hidden`, their CSS locators still return 1). Containers: 4 ok / 0 broken ('.inventory_details_container', '#header_container', '.footer', '.bm-menu-wrap'). Text rows (name, description, price) have no ARIA locator by design.
