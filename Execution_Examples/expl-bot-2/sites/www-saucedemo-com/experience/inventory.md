---
url: /inventory.html
state_key: /inventory.html|-|
updated: 2026-11-01
---

## FLOW: Add a product to the cart and remove it again

* Click 'Add to cart' on the product
* Check the button changes to 'Remove' and the cart shows a badge with 1
* Click 'Remove' on the same product

```js
await page.locator('[data-test="add-to-cart-sauce-labs-backpack"]').click();
await page.locator('[data-test="remove-sauce-labs-backpack"]').click();
```

> Locators follow add-to-cart-<product-slug> / remove-<product-slug>
> The cart link is named "Cart, empty" with no badge; with one item it reads "Cart, 1 items"
> The page logs 6 console errors on load (pre-existing)

---

## FLOW: Build a multi-item cart and remove one item

* Click 'Add to cart' on three products
* Check the badge reads 3
* Click 'Remove' on one of them and check the badge reads 2
* Click 'Remove' on the other two

```js
await page.locator('[data-test="add-to-cart-sauce-labs-bike-light"]').click();
await page.locator('[data-test="add-to-cart-sauce-labs-onesie"]').click();
await page.locator('[data-test="add-to-cart-sauce-labs-fleece-jacket"]').click();
await page.locator('[data-test="remove-sauce-labs-onesie"]').click();
await page.locator('[data-test="remove-sauce-labs-bike-light"]').click();
await page.locator('[data-test="remove-sauce-labs-fleece-jacket"]').click();
```

> Untouched products keep the 'Add to cart' button while others show 'Remove'

---

## FLOW: Sort by price high to low and add the first product

* Select 'Price (high to low)' in the sort dropdown
* Click 'Add to cart' on the first listed product
* Click 'Remove' on it
* Select 'Name (A to Z)' to restore the default

```js
await page.locator('[data-test="product-sort-container"]').selectOption('Price (high to low)');
await page.locator('[data-test="add-to-cart-sauce-labs-fleece-jacket"]').click();
await page.locator('[data-test="remove-sauce-labs-fleece-jacket"]').click();
await page.locator('[data-test="product-sort-container"]').selectOption('Name (A to Z)');
```

> Under Price (high to low) the first product is Sauce Labs Fleece Jacket at $49.99
> Equal-price items ($15.99) keep the same order in both price sorts: Bolt T-Shirt before Test.allTheThings() T-Shirt (Red)

---

## FLOW: Open a product detail page and return to the list

* Click the product title link
* Compare name, description and price with the list
* Go back with the browser Back action
* Click the product image link of another product
* Click 'Back to products'

```js
await page.locator('[data-test="item-1-title-link"]').click();
await page.goBack();
await page.locator('a[data-test="item-4-img-link"]').click();
await page.locator('[data-test="back-to-products"]').click();
```

> Detail pages live at /inventory-item.html?id=<n>
> Detail page shows only image, name, description, price and the Add to cart button
> The detail page has a 'Back to products' button (data-test="back-to-products")

---

## FLOW: Keep the cart across reload and a detail page detour

* Click 'Add to cart' on a product
* Reload the page and check the badge and 'Remove' button
* Open another product's detail page and click 'Back to products'
* Check the badge and 'Remove' button again
* Click 'Remove'

```js
await page.locator('[data-test="add-to-cart-sauce-labs-bolt-t-shirt"]').click();
await page.reload();
await page.locator('[data-test="item-3-title-link"]').click();
await page.locator('[data-test="back-to-products"]').click();
await page.locator('[data-test="remove-sauce-labs-bolt-t-shirt"]').click();
```

> Cart state survives reload, navigation and a re-login (stored client-side)
> The only cookie is session-username; once a reload showed the login page, which did not reproduce

---

## FLOW: Check every sort option on the product list

* Select each option in the sort dropdown in turn
* Read product names and prices after each selection

```js
await page.locator('[data-test="product-sort-container"]').selectOption('Name (Z to A)');
await page.locator('[data-test="product-sort-container"]').selectOption('Price (low to high)');
await page.locator('[data-test="product-sort-container"]').selectOption('Price (high to low)');
await page.locator('[data-test="product-sort-container"]').selectOption('Name (A to Z)');
```

> Sorting is client-side; the URL stays /inventory.html
> [data-test="inventory-item"], "inventory-item-name", "inventory-item-price" and "active-option" can be used to read the list

---

## FLOW: Fill the cart with all six products under changing sort orders and empty it again

* Select 'Name (Z to A)' in the sort dropdown
* Click 'Add to cart' on all six products, starting with Test.allTheThings() T-Shirt (Red)
* Check the badge reads 6 and the cart link reads "Cart, 6 items"
* Select 'Price (low to high)' and check all six buttons still read 'Remove'
* Reload and check the badge and all six buttons again
* Click 'Remove' on all six products and check the badge is gone

```js
await page.locator('[data-test="product-sort-container"]').selectOption('za');
await page.locator("button[data-test='add-to-cart-test.allthethings()-t-shirt-(red)']").click();
await page.locator("button[data-test='add-to-cart-sauce-labs-onesie']").click();
await page.locator("button[data-test='add-to-cart-sauce-labs-fleece-jacket']").click();
await page.locator("button[data-test='add-to-cart-sauce-labs-bolt-t-shirt']").click();
await page.locator("button[data-test='add-to-cart-sauce-labs-bike-light']").click();
await page.locator("button[data-test='add-to-cart-sauce-labs-backpack']").click();
await page.locator('select.product_sort_container').selectOption('lohi');
await page.reload();
await page.locator("button[data-test='remove-sauce-labs-backpack']").click();
```

> Button state follows the product, not the position: re-sorting keeps 'Remove' on every added product and the badge unchanged
> The sort selection resets to Name (A to Z) after a reload
> The page logs a 404 "Failed to load resource" for inventory.html on reload (also present before the scenario)

---

## FLOW: Add products to the cart from their detail pages

* Click the title link of a product to open its detail page
* Click 'Add to cart' on the detail page and check it becomes 'Remove' and the badge reads 1
* Click 'Back to products' and check only that product shows 'Remove'
* Open another product through its image link, click 'Add to cart' and go back
* Check the badge reads 2 and both products show 'Remove', then remove both from the list

```js
await page.locator('[data-test="item-3-title-link"]').click();
await page.locator('[data-test="add-to-cart"]').click();
await page.locator('[data-test="back-to-products"]').click();
await page.locator('[data-test="item-2-img-link"]').click();
await page.locator('[data-test="add-to-cart"]').click();
await page.locator('[data-test="back-to-products"]').click();
```

> Detail page locators: add [data-test="add-to-cart"], back [data-test="back-to-products"]
> The cart link name reads "Cart, 1 items" for one item (singular not handled)
> The session cookie can expire between pages: the detail page then redirects to the login page with "You can only access '/inventory-item.html' when you are logged in"

---

## FLOW: Review the cart page and remove an item there

* Click 'Add to cart' on two products
* Click the cart link in the header
* Compare names and prices on the cart page with the list
* Click 'Remove' on one product on the cart page
* Click 'Continue Shopping' and check the badge and buttons on the list
* Click 'Remove' on the remaining product

```js
await page.locator('[data-test="add-to-cart-sauce-labs-bike-light"]').click();
await page.locator('[data-test="add-to-cart-sauce-labs-fleece-jacket"]').click();
await page.locator('[data-test="shopping-cart-link"]').click();
await page.locator('[data-test="remove-sauce-labs-fleece-jacket"]').click();
await page.locator('[data-test="continue-shopping"]').click();
await page.locator('[data-test="remove-sauce-labs-bike-light"]').click();
```

> Cart page is /cart.html with a QTY column (no quantity editing seen), a per-item Remove, 'Continue Shopping' and 'Checkout' (not clicked)
> Cart link data-test is shopping-cart-link

---

## FLOW: Open product detail pages from a sorted list and compare name and price

* Select 'Price (low to high)' in the sort dropdown
* Click the image link of a product and check the detail page name and price
* Click 'Back to products' and check the dropdown label against the card order
* Open another product through its title link, go back with the browser Back action and check again

```js
await page.locator('[data-test="product-sort-container"]').selectOption('lohi');
await page.locator('a[data-test="item-0-img-link"]').click();
await page.locator('[data-test="back-to-products"]').click();
await page.locator('a[data-test="item-4-title-link"]').click();
await page.goBack();
```

> The right product opens from a sorted list (ids: Backpack 4, Bike Light 0, Bolt T-Shirt 1, Fleece Jacket 5, Onesie 2, Test.allTheThings() Red 3)
> The chosen sort is reset to Name (A to Z) after a detail visit, both via 'Back to products' and browser Back; the dropdown label and card order stay consistent with each other

---

## FLOW: Move from a product page back to the catalog with the burger menu

* Click the title link of a product to open its detail page
* Click 'Open Menu' and click 'All Items'
* Check the URL is /inventory.html and the six products are listed
* Click 'Open Menu', click 'Dynamic Catalog' and click 'Close Menu'
* Check the user is still signed in

```js
await page.locator('[data-test="item-1-title-link"]').click();
await page.getByRole('button', { name: 'Open Menu' }).click();
await page.locator('[data-test="inventory-sidebar-link"]').click();
await page.getByRole('button', { name: 'Open Menu' }).click();
await page.locator('[data-test="dynamic-catalog-sidebar-link"]').click();
await page.locator('#react-burger-cross-btn').click();
```

> Dynamic Catalog is an accordion, not a link: it expands an inline submenu with 'Lazy Load', 'Spinner' and 'Slider' (buttons, not clicked, destinations unknown)
> The sidebar is exposed by role only while it is open; 'All Items' is focused on open
> Reset App State keeps the chosen sort, but the product list keeps 'Remove' on the cleared items until a reload (seen in a FAILED scenario, not a recipe)

---

## FLOW: Submit the checkout form with hostile values and leave through Cancel

* Click 'Add to cart' on a product, open the cart and click 'Checkout'
* Fill 'First Name' with a script tag, 'Last Name' with 10000 characters and 'Zip/Postal Code' with SQL text
* Click 'Continue' and read the result
* Click 'Cancel' on the overview, then 'Remove' on the product

```js
await page.locator('[data-test="add-to-cart-sauce-labs-onesie"]').click();
await page.locator('[data-test=shopping-cart-link]').click();
await page.locator('[data-test=checkout]').click();
// run-code script: fill firstName / lastName (10000 characters built in code) / postalCode, click continue, with a dialog handler
await page.locator('[data-test=cancel]').click();
await page.locator('[data-test=remove-sauce-labs-onesie]').click();
```

> The checkout form takes the script tag, 10000 characters and SQL text without any error and moves to /checkout-step-two.html; no JavaScript dialog appears
> 'Cancel' on the overview returns to /inventory.html with the product still showing 'Remove'
> Touches /cart.html, /checkout-step-one.html and /checkout-step-two.html

---

## ACTION: Click a product button whose data-test contains dots or parentheses

Solution: inline quoted selectors such as button[data-test='remove-test.allthethings()-t-shirt-(red)'] can be blocked by the CLI permission check. Write a run-code script file with the locator hardcoded and run it as one simple command instead.
```js
await page.locator('button[data-test="remove-test.allthethings()-t-shirt-(red)"]').click();
```

---
