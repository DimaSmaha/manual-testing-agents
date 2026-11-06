---
url: /checkout-step-one.html
state_key: /checkout-step-one.html|-|
updated: 2026-11-01
---

## FLOW: Submit the checkout form empty and then with boundary values

* Open the checkout information page
* Click 'Continue' with all three fields empty and read the error
* Fill 'First Name' with spaces, 'Last Name' with an emoji and 'Zip/Postal Code' with a negative number
* Click 'Continue' and read the result
* Click 'Cancel' on the overview (never 'Finish')

```js
await page.goto('https://www.saucedemo.com/checkout-step-one.html');
await page.locator('[data-test="continue"]').click();
await page.locator('[data-test="firstName"]').fill('   ');
await page.locator('[data-test="lastName"]').fill('😀');
await page.locator('[data-test="postalCode"]').fill('-1');
await page.locator('[data-test="continue"]').click();
await page.locator('[data-test="cancel"]').click();
```

> An empty submit shows only the first missing field: "Error: First Name is required"; the alert has a 'Dismiss error' button
> Whitespace-only first name, an emoji and zip "-1" are accepted and the page moves to /checkout-step-two.html
> The page opens by a plain URL load with an empty cart, with no redirect
> 'Cancel' on the overview goes to /inventory.html
> Touches /checkout-step-two.html

---
