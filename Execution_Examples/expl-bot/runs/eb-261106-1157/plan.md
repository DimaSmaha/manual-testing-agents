<!-- suite -->
# Exploration plan — www-saucedemo-com / inventory — normal — eb-261106-1157

<!-- Focus (restated): Inventory page (/inventory.html) only. Goal: a shopper browses the 6-product list, sorts it, adds and removes products, and the cart state stays correct. Behaviours that matter: Add to cart / Remove toggle, cart badge and cart link name, sort order of names and prices, product detail match, cart persistence across reload. Left out: burger menu (Logout, Reset App State, About, Dynamic Catalog), footer social links, cart page, checkout, login. Data policy: the cart is empty at start ("Cart, empty"); each scenario removes the items it added, so the cart ends as found. Products have no free-text name, so the run id cannot be put in them; the added items are recorded in the result block. -->

### Prerequisite

* URL: /inventory.html

<!-- test
priority: critical
-->
# A shopper adds a product to the cart and sees the cart reflect it

<!-- area: add to cart · outcome: data · covers: - -->

## Requirements
/inventory.html

## Steps
* Note that the cart link reads "Cart, empty" and no badge is shown
* Click 'Add to cart' on the product "Sauce Labs Backpack"
* Check the button on that product and the cart link/badge
* Click 'Remove' on "Sauce Labs Backpack" to restore the empty cart

## Expected
* The button on "Sauce Labs Backpack" changes from "Add to cart" to "Remove"
* The cart shows a badge with 1 and the cart link is no longer named "Cart, empty"
* The other 5 products still show "Add to cart"
* After Remove the button is "Add to cart" again and the cart is empty (no badge)

<!-- test
priority: important
-->
# A shopper builds a multi-item cart and removes one item from the list

<!-- area: remove from cart · outcome: data · covers: - -->

## Requirements
/inventory.html

## Steps
* Click 'Add to cart' on "Sauce Labs Bike Light", "Sauce Labs Onesie" and "Sauce Labs Fleece Jacket"
* Check the cart badge
* Click 'Remove' on "Sauce Labs Onesie"
* Check the cart badge and the buttons of all 6 products
* Click 'Remove' on the two remaining added products to restore the empty cart

## Expected
* The badge reads 3 after the three adds, then 2 after removing the Onesie
* "Sauce Labs Onesie" shows "Add to cart" again; "Bike Light" and "Fleece Jacket" still show "Remove"
* The three products that were never touched still show "Add to cart"
* At the end the cart is empty (no badge)

<!-- test
priority: high
-->
# After sorting by price high to low the shopper adds the first listed product and the right item is added

<!-- area: sort · outcome: data · covers: - -->

## Requirements
/inventory.html

## Steps
* Select "Price (high to low)" in the 'Sort products' dropdown
* Note the name and price of the first product in the list
* Click 'Add to cart' on that first product
* Check which product shows "Remove" and the cart badge
* Click 'Remove' on it to restore the empty cart

## Expected
* The first product in the list is "Sauce Labs Fleece Jacket" at $49.99
* After adding, exactly that product shows "Remove" and the badge reads 1
* After Remove the cart is empty

<!-- test
priority: important
-->
# A shopper opens a product's detail page and it matches the list entry

<!-- area: product details · outcome: state · covers: - -->

## Requirements
/inventory.html

## Steps
* Note the name, description and price of "Sauce Labs Bolt T-Shirt" in the list
* Click the product title "Sauce Labs Bolt T-Shirt"
* Compare the detail page name, description, price and image
* Return to the inventory page with the browser Back action
* Click the product image of "Sauce Labs Backpack" and compare name and price on its detail page
* Return to the inventory page

## Expected
* The URL changes to a product detail URL for each opened product
* Name, description and price on each detail page equal the list values ($15.99 for the Bolt T-Shirt, $29.99 for the Backpack)
* After going back the inventory page shows all 6 products and the cart is still empty

<!-- test
priority: high
-->
# The cart contents survive a page reload and a detour to a product detail page

<!-- area: cart persistence · outcome: state · covers: - -->

## Requirements
/inventory.html

## Steps
* Click 'Add to cart' on "Sauce Labs Bolt T-Shirt"
* Reload the page
* Check the badge and the button of that product
* Open the detail page of "Test.allTheThings() T-Shirt (Red)" and return to the inventory page
* Check the badge and the Bolt T-Shirt button again
* Click 'Remove' on "Sauce Labs Bolt T-Shirt" to restore the empty cart

## Expected
* After the reload the badge still reads 1 and "Sauce Labs Bolt T-Shirt" still shows "Remove"
* After the detour the badge still reads 1 and the Bolt T-Shirt still shows "Remove"
* After Remove the cart is empty

<!-- test
priority: normal
-->
# Every sort option orders the product list correctly

<!-- area: sort · outcome: state · covers: - -->

## Requirements
/inventory.html

## Steps
* Select each option in turn in the 'Sort products' dropdown: "Name (Z to A)", "Price (low to high)", "Price (high to low)", "Name (A to Z)"
* After each selection read the list of product names and prices
* Finish on "Name (A to Z)" (the default)

## Expected
* Name (A to Z): Backpack, Bike Light, Bolt T-Shirt, Fleece Jacket, Onesie, Test.allTheThings() T-Shirt (Red)
* Name (Z to A): the exact reverse of the above
* Price (low to high): $7.99, $9.99, $15.99, $15.99, $29.99, $49.99 (the two $15.99 items in either order)
* Price (high to low): the reverse price order
* The dropdown shows the selected option each time and always 6 products are listed
