# Exploration report — www.saucedemo.com · eb-261101-1211

The cart and product pages stay consistent under rapid clicks and browser history moves, but the product page accepts unknown ids and the checkout lets an empty cart and invalid details through to the Overview.

## Coverage
- Pages: /inventory.html (start of two scenarios), /inventory-item.html?id=<n>, /cart.html, /checkout-step-one.html
- Features: remove from the cart page, add on the product page, product ids in the address, checkout entry, checkout form validation
- Not covered: inventory — left out by the user, covered in eb-261101-1111; dynamic-catalog-lazy-load, dynamic-catalog-spinner, dynamic-catalog-slider — not selected; checkout-step-two — needs a form submit, only seen in passing and never finished; checkout-complete — needs an order submit

## What works
- **Cart state across Back, Forward and reload** — `S1 A shopper removes cart items with repeated clicks and browser history jumps and the cart page, badge and product list stay in agreement`
- **Add and remove on the product page under rapid clicks** — `S2 A shopper hammers 'Add to cart' on a product page and the cart still holds the product exactly once across reload and history moves`
- **Hostile checkout input never raises a script dialog** — `S5 A shopper submits the checkout form with a script tag, a ten-thousand-character name and SQL in the zip field and the app answers in a defined way`
- **Cancel on the checkout overview returns to the product list** — `S4 Find out whether a shopper with an empty cart can pass the checkout information step`, `S6 A shopper submits the checkout form empty, then with spaces, an emoji and a negative zip, and each attempt gets a clear answer`

## Defects

### [Medium] A product page with an unknown id offers a working 'Add to cart' that creates phantom cart entries
Affects: `S3 Find out what a shopper sees and can add to the cart when the product id in the address is broken`
Reproduce:
  1. Open /inventory-item.html?id=abc (also id=6, id=-1, an empty id)
  2. Click 'Add to cart' on the "ITEM NOT FOUND" card
  3. Open /cart.html
  4. Compare the cart badge with the rows on the cart page
Evidence: Badge counted 6 after six adds while the cart page listed one row; entries from non-numeric ids have no 'Remove' button anywhere (screenshots/3-inventory-after-removals.png, screenshots/3-cart.png)

### [Medium] An empty cart can go through checkout to an Overview with zero totals and an enabled Finish button
Affects: `S4 Find out whether a shopper with an empty cart can pass the checkout information step`, `S6 A shopper submits the checkout form empty, then with spaces, an emoji and a negative zip, and each attempt gets a clear answer`
Reproduce:
  1. Open /cart.html with an empty cart and click 'Checkout'
  2. Fill the three checkout fields and click 'Continue'
Evidence: /checkout-step-two.html shows no items, Item total $0, Total $0.00 and 'Finish' enabled, never clicked (screenshots/4-step-two-empty.png)

### [Medium] The checkout form accepts invalid values without any validation
Affects: `S5 A shopper submits the checkout form with a script tag, a ten-thousand-character name and SQL in the zip field and the app answers in a defined way`, `S6 A shopper submits the checkout form empty, then with spaces, an emoji and a negative zip, and each attempt gets a clear answer`
Reproduce:
  1. Open /checkout-step-one.html
  2. Fill 'First Name' with three spaces, 'Last Name' with an emoji and 'Zip/Postal Code' with -1
  3. Click 'Continue'
Evidence: The page moves to /checkout-step-two.html; a script tag, 10000 characters and SQL text in the fields were accepted the same way

### [Low] A product id with a decimal part silently opens another product
Affects: `S3 Find out what a shopper sees and can add to the cart when the product id in the address is broken`
Reproduce:
  1. Open /inventory-item.html?id=4.5
Evidence: The page shows Sauce Labs Backpack (id 4) and adding it puts the real Backpack in the cart

## UX issues
- **Cart page** — a double-click on 'Remove' removes two items because the list shifts under the second click (`S1 A shopper removes cart items with repeated clicks and browser history jumps and the cart page, badge and product list stay in agreement`)
- **Cart link** — the accessible name reads "Cart, 1 items" for a single item (`S1 A shopper removes cart items with repeated clicks and browser history jumps and the cart page, badge and product list stay in agreement`, `S2 A shopper hammers 'Add to cart' on a product page and the cart still holds the product exactly once across reload and history moves`)
- **Checkout form** — an empty submit names only the first missing field, "Error: First Name is required" (`S6 A shopper submits the checkout form empty, then with spaces, an emoji and a negative zip, and each attempt gets a clear answer`)
- **Not-found product card** — shows a phone-recording text and the price "$√-1" (`S3 Find out what a shopper sees and can add to the cart when the product id in the address is broken`)

## Execution Issues
- `S1 A shopper removes cart items with repeated clicks and browser history jumps and the cart page, badge and product list stay in agreement` — expected one removal; double-click hit the shifted row
- `S3 Find out what a shopper sees and can add to the cart when the product id in the address is broken` — three entries cleared through localStorage, not the UI
- `S4 Find out whether a shopper with an empty cart can pass the checkout information step` — first attempt blocked by expired session, passed on re-run
- `S6 A shopper submits the checkout form empty, then with spaces, an emoji and a negative zip, and each attempt gets a clear answer` — last step skipped, page had left step one

## Data created by this run
- Cart items Sauce Labs Bike Light, Sauce Labs Onesie, Sauce Labs Backpack (`S1`, `S2`, `S5`, `S3`) — removed
- Six cart entries from broken ids in `S3` (ids 6, -1, abc, 4.5, empty, script payload) — removed; three of them by editing the cart's localStorage entry, not through the UI
- No order was placed; 'Finish' was never clicked
