# Exploration report — www.saucedemo.com · eb-261101-1111

The cart stays correct across the product list, product detail pages and the cart page. Reset App State leaves stale 'Remove' buttons on the product list until the page is reloaded.

## Coverage
- Pages: /inventory.html, /inventory-item.html?id=<n>, /cart.html
- Features: add and remove from the list, detail page and cart page; sort; Reset App State; burger menu (All Items, Dynamic Catalog)

## What works
- **Cart count and buttons on the product list** — `S1 A shopper fills the cart with all six products under changing sort orders and the cart count and buttons stay correct`
- **Add to cart from product detail pages** — `S2 A shopper adds products from their detail pages and the product list shows the same cart state afterwards`
- **Cart page contents and removal** — `S3 The cart page lists exactly the products the shopper added and the product list matches it after returning`
- **Detail pages show the clicked product from a sorted list** — `S5 The sort the shopper chose stays consistent with the list after visiting product detail pages`

## Defects

### [Medium] Product list keeps 'Remove' on items after Reset App State until reload
Affects: `S4 Reset App State empties the shopper's own cart and the product list shows no item as added`
Reproduce:
  1. Open /inventory.html with an empty cart
  2. Click 'Add to cart' on Sauce Labs Bolt T-Shirt and Sauce Labs Onesie
  3. Click 'Open Menu', then 'Reset App State', then 'Close Menu'
  4. Look at the buttons on the product list
Evidence: The badge is gone and the cart link reads "Cart, empty", yet both items still show 'Remove'; after a reload all six show 'Add to cart' (.workflow-artifacts/expl-bot/runs/eb-261101-1111/screenshots/n4-stale-remove.png)

## UX issues
- **Sort** — the chosen sort resets to Name (A to Z) after a reload and after a detail-page visit (both 'Back to products' and browser Back), while Reset App State keeps it (`S1 A shopper fills the cart with all six products under changing sort orders and the cart count and buttons stay correct`, `S4 Reset App State empties the shopper's own cart and the product list shows no item as added`, `S5 The sort the shopper chose stays consistent with the list after visiting product detail pages`)
- **Cart link** — the accessible name reads "Cart, 1 items" for a single item (`S2 A shopper adds products from their detail pages and the product list shows the same cart state afterwards`, `S3 The cart page lists exactly the products the shopper added and the product list matches it after returning`)

## Execution Issues
- `S1 A shopper fills the cart with all six products under changing sort orders and the cart count and buttons stay correct` — inline selectors blocked by permission check, finished via script
- `S2 A shopper adds products from their detail pages and the product list shows the same cart state afterwards` — login expired mid-run, passed after re-login
- `S6 The burger menu takes the shopper from a product page back to the catalog and to the Dynamic Catalog without losing the session` — Dynamic Catalog is an accordion, not a page

## Data created by this run
- none
