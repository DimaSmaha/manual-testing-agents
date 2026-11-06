---
url: /inventory.html
state_key: /inventory.html|-|
updated: 2026-11-06
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
