<!-- suite -->
# Exploration plan — www.saucedemo.com / cart, checkout-step-one, inventory-item — psycho — eb-261101-1211

<!-- Style: psycho. Focus: none. Pages planned (user's pick): cart, checkout-step-one, inventory-item. -->
<!-- Not planned: inventory (left out by the user, covered in eb-261101-1111); dynamic-catalog-lazy-load / -spinner / -slider (unselected); checkout-step-two / checkout-complete (needs-data); About and social links (external). -->
<!-- Own data: the only data a scenario creates is cart content (client-side, no free-text name); every item a scenario adds is removed again in the same scenario. Nobody clicks 'Finish', 'Logout' or 'Reset App State'. -->
<!-- Research of cart and checkout-step-one was done with an empty cart; behaviour of 'Checkout' / 'Continue' with an empty or filled cart is unknown, so scenarios S4-S6 accept both outcomes and record which one happened. -->

### Prerequisite

* URL: /inventory.html

<!-- test
priority: important
-->
<!-- area: cart page (inventory → cart) · outcome: data · covers: — -->
# A shopper removes cart items with repeated clicks and browser history jumps and the cart page, badge and product list stay in agreement

## Requirements
/inventory.html

## Steps
* Check the cart link reads "Cart, empty"
* On the product list click 'Add to cart' on Sauce Labs Bike Light, Sauce Labs Onesie and Sauce Labs Backpack
* Click the cart link in the header
* Double-click 'Remove' on Sauce Labs Bike Light on the cart page
* Click 'Remove' on Sauce Labs Onesie on the cart page
* Use the browser Back action and check the badge and the buttons of all six products on the product list
* Use the browser Forward action and check the items on the cart page
* Click 'Remove' on Sauce Labs Backpack on the cart page
* Click 'Continue Shopping', reload the product list and check the badge, the cart link and the buttons of all six products

## Expected
* After the double-click the cart page lists Sauce Labs Onesie and Sauce Labs Backpack, each exactly once
* After the browser Back action the product list badge reads 1 and only Sauce Labs Backpack shows 'Remove'
* After the browser Forward action the cart page lists only Sauce Labs Backpack
* After the last removal and the reload the badge is gone, the cart link reads "Cart, empty" and all six products show 'Add to cart'

<!-- test
priority: high
-->
<!-- area: add to cart (detail page, rapid input) · outcome: data · covers: — -->
# A shopper hammers 'Add to cart' on a product page and the cart still holds the product exactly once across reload and history moves

## Requirements
/inventory-item.html?id=4

## Steps
* Check the cart link reads "Cart, empty" and the button reads 'Add to cart'
* Click the add/remove button five times in quick succession (it toggles between 'Add to cart' and 'Remove')
* Check the badge, the cart link and the button
* Reload the page and check the badge and the button again
* Click 'Back to products' and check the badge and the buttons of all six products
* Use the browser Back action to return to the detail page and check the button
* Click 'Remove' on the detail page and check the badge

## Expected
* After five quick clicks the badge reads 1 and the button reads 'Remove'
* After the reload the badge still reads 1 and the button still reads 'Remove'
* On the product list only Sauce Labs Backpack shows 'Remove'
* After the browser Back action the detail page button reads 'Remove'
* After the final 'Remove' the badge is gone and the cart link reads "Cart, empty"

<!-- test
priority: high
-->
<!-- area: product id in the address (discovery) · outcome: data · covers: — -->
# Find out what a shopper sees and can add to the cart when the product id in the address is broken

## Requirements
/inventory-item.html?id=4

## Steps
* Check the cart link reads "Cart, empty"
* Open /inventory-item.html?id=6 and read what the page shows
* If an 'Add to cart' button is shown, click it and check the badge and the cart link
* Open /inventory-item.html?id=-1 and repeat the two steps above
* Open /inventory-item.html?id=abc and repeat the two steps above
* Open /inventory-item.html?id=4.5 and repeat the two steps above
* Open /inventory-item.html?id= (empty value) and repeat the two steps above
* Open /inventory-item.html?id=%3Cscript%3Ealert(1)%3C%2Fscript%3E and repeat the two steps above
* Open the cart page and read every item listed
* Click 'Remove' on every item this scenario added, then open the product list and check the badge and buttons

## Expected
* Each broken id gives a defined result: a not-found style message, an empty product card or a redirect to the product list, with no browser error page and no JavaScript dialog
* Every item listed on the cart page has a product name and a price
* After the removals the cart link reads "Cart, empty" and all six products show 'Add to cart'

<!-- test
priority: high
-->
<!-- area: checkout entry (cart → checkout-step-one) · outcome: state · covers: — -->
# Find out whether a shopper with an empty cart can pass the checkout information step

## Requirements
/cart.html

## Steps
* Check the cart link reads "Cart, empty" and the cart page lists no products
* Click 'Checkout' and read where the page goes and whether a message is shown
* If the page is /checkout-step-one.html, fill 'First Name' with "eb-261101-1211", 'Last Name' with "Empty Cart" and 'Zip/Postal Code' with "00000"
* Click 'Continue' and read the result
* If the page is /checkout-step-two.html, read the item list and the totals, do not click 'Finish', and click 'Cancel'
* Check the cart link

## Expected
* Clicking 'Checkout' with an empty cart gives a definite result: the page stays on /cart.html with a message, or it moves to /checkout-step-one.html
* If /checkout-step-two.html is reached it lists no products
* After the scenario the cart link reads "Cart, empty"

<!-- test
priority: important
-->
<!-- area: checkout form, hostile input (inventory → cart → checkout-step-one) · outcome: state · covers: — -->
# A shopper submits the checkout form with a script tag, a ten-thousand-character name and SQL in the zip field and the app answers in a defined way

## Requirements
/inventory.html

## Steps
* Check the cart link reads "Cart, empty"
* On the product list click 'Add to cart' on Sauce Labs Onesie
* Click the cart link and then 'Checkout'
* Fill 'First Name' with `<script>alert(1)</script>`
* Fill 'Last Name' with a string of 10000 times "Ö"
* Fill 'Zip/Postal Code' with `' OR '1'='1' --`
* Click 'Continue' and read the result
* If the page is /checkout-step-two.html, do not click 'Finish', and click 'Cancel'
* Click 'Remove' on Sauce Labs Onesie wherever it is shown and check the cart link

## Expected
* No JavaScript dialog appears at any point
* Clicking 'Continue' gives a definite result: an error message is shown and the URL stays /checkout-step-one.html, or the page moves to /checkout-step-two.html
* After the cleanup the cart link reads "Cart, empty" and all six products show 'Add to cart'

<!-- test
priority: high
-->
<!-- area: checkout form, empty and boundary values (checkout-step-one) · outcome: state · covers: — -->
# A shopper submits the checkout form empty, then with spaces, an emoji and a negative zip, and each attempt gets a clear answer

## Requirements
/checkout-step-one.html

## Steps
* Check the three fields are empty and the cart link reads "Cart, empty"
* Click 'Continue' with all three fields empty and read the message
* Fill 'First Name' with three spaces, 'Last Name' with "😀" and 'Zip/Postal Code' with "-1"
* Click 'Continue' and read the result
* If the page is still /checkout-step-one.html, clear 'First Name', fill 'Last Name' with "O'Brien-Smith" and 'Zip/Postal Code' with forty times "9", and click 'Continue'
* If the page is /checkout-step-two.html, do not click 'Finish', and click 'Cancel'
* Check the cart link

## Expected
* Continue with all three fields empty keeps the URL /checkout-step-one.html and shows a non-empty message in the error container
* Each later 'Continue' gives a definite result: an error message with the URL unchanged, or a move to /checkout-step-two.html
* After the scenario the cart link reads "Cart, empty"
