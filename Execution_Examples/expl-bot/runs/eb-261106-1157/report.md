# Exploration report — www-saucedemo-com · eb-261106-1157

The product list, sorting, add and remove, cart badge and product detail pages behave as expected, and the cart survives a reload. One unexplained logout on the first reload was not reproduced.

## Coverage
- Pages: /inventory.html, /inventory-item.html
- Features: add to cart, remove from cart, cart badge and cart link, sort (4 options), product detail, cart persistence

## What works
- **Add to cart and Remove toggle** — `S1 A shopper adds a product to the cart and sees the cart reflect it`
- **Multi-item cart and badge count** — `S2 A shopper builds a multi-item cart and removes one item from the list`
- **Add after sorting** — `S3 After sorting by price high to low the shopper adds the first listed product and the right item is added`
- **Product detail matches list** — `S4 A shopper opens a product's detail page and it matches the list entry`
- **Cart persistence across reload and navigation** — `S5 The cart contents survive a page reload and a detour to a product detail page`
- **Sort by name and price** — `S6 Every sort option orders the product list correctly`

## UX issues
- **Cart link** — accessible name reads "Cart, 1 items" for a single item (`S1 A shopper adds a product to the cart and sees the cart reflect it`)

## Execution Issues
- `S5 The cart contents survive a page reload and a detour to a product detail page` — first reload showed login page, not reproduced on re-run

## Data created by this run
- Cart item Sauce Labs Backpack — removed
- Cart item Sauce Labs Bike Light — removed
- Cart item Sauce Labs Onesie — removed
- Cart item Sauce Labs Fleece Jacket — removed
- Cart item Sauce Labs Bolt T-Shirt (added in two S5 attempts) — removed
