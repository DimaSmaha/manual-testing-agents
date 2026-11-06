---
url: /inventory-item.html
state_key: /inventory-item.html|-|
updated: 2026-11-01
---

## FLOW: Toggle the add/remove button quickly on a product page and check the cart stays consistent

* Open the product page (id=4) with an empty cart
* Click the add/remove button five times in quick succession, re-locating it each time
* Check the badge reads 1 and the button reads 'Remove'
* Reload and check the badge and button again
* Click 'Back to products' and check only that product shows 'Remove'
* Use the browser Back action and check the button still reads 'Remove'
* Click 'Remove' and check the cart is empty

```js
await page.goto('https://www.saucedemo.com/inventory-item.html?id=4');
await page.locator('.inventory_details_container button.btn_inventory').click({ noWaitAfter: true, timeout: 5000 }); // x5, re-located each time
await page.reload();
await page.getByRole('button', { name: 'Back to products' }).click();
await page.goBack();
await page.getByRole('button', { name: 'Remove' }).click();
```

> The one button toggles between 'Add to cart' and 'Remove' (data-test add-to-cart / remove); an odd number of clicks leaves the product in the cart
> No lost or doubled toggles with noWaitAfter clicks; the badge never exceeded 1
> The cart link reads "Cart, 1 items" with one item
> Touches /inventory.html through 'Back to products'

---
