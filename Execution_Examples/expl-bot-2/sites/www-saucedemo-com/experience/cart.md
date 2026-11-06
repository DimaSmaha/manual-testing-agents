---
url: /cart.html
state_key: /cart.html|-|
updated: 2026-11-01
---

## FLOW: Go through checkout with an empty cart and cancel on the overview

* Open the cart page from the product list with an empty cart
* Click 'Checkout'
* Fill 'First Name', 'Last Name' and 'Zip/Postal Code' with plain values
* Click 'Continue' and read the overview
* Click 'Cancel' on the overview (never 'Finish')

```js
await page.locator('[data-test="shopping-cart-link"]').click();
await page.locator('[data-test="checkout"]').click();
await page.locator('[data-test="firstName"]').fill('<name>');
await page.locator('[data-test="lastName"]').fill('Empty Cart');
await page.locator('[data-test="postalCode"]').fill('00000');
await page.locator('[data-test="continue"]').click();
await page.locator('[data-test="cancel"]').click();
```

> 'Checkout' with an empty cart goes to /checkout-step-one.html with no message
> /checkout-step-two.html (Checkout: Overview) then shows no items, Item total $0, Tax $0.00, Total $0.00, SauceCard #31337, Free Pony Express Delivery and an enabled 'Finish' (never clicked)
> 'Cancel' on the overview goes to /inventory.html, not /cart.html
> Touches /checkout-step-one.html and /checkout-step-two.html

---
