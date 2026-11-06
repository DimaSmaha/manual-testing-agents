<!-- suite -->
# Exploration plan — www.saucedemo.com / Products (inventory) — curious — eb-261101-1111

<!-- focus: none. Style curious: coverage gaps vs. testedScenarios of run eb-261101-1011 and the deep research (burger sidebar, detail-page add, cart link). Own data only: the cart is the run's own state, it starts empty and every scenario empties it again. No Logout, no About, no footer links. -->

### Prerequisite

* URL: /inventory.html

<!-- test
priority: critical
-->
# A shopper fills the cart with all six products under changing sort orders and the cart count and buttons stay correct
<!-- area: add to cart · outcome: data · covers: — -->

## Requirements
/inventory.html

## Steps
* Check the cart is empty (no badge, cart link reads "Cart, empty")
* Select "Name (Z to A)" in the sort dropdown
* Click 'Add to cart' on each of the six products, starting with Test.allTheThings() T-Shirt (Red)
* Check the cart badge and the cart link
* Select "Price (low to high)" in the sort dropdown
* Check every product still shows 'Remove' and the badge is unchanged
* Reload the page
* Check the badge and all six buttons again
* Click 'Remove' on every product
* Select "Name (A to Z)" in the sort dropdown

## Expected
* The cart badge reads 6 after the sixth add
* All six products show 'Remove' after the re-sort and after the reload
* After removing all six products the badge is gone and the cart link reads "Cart, empty"

<!-- test
priority: important
-->
# A shopper adds products from their detail pages and the product list shows the same cart state afterwards
<!-- area: add to cart (detail page) · outcome: data · covers: — -->

## Requirements
/inventory.html

## Steps
* Click the title link of Test.allTheThings() T-Shirt (Red) to open its detail page
* Click 'Add to cart' on the detail page
* Click 'Back to products'
* Check the badge and the buttons of all six products on the list
* Click the image link of Sauce Labs Onesie to open its detail page
* Click 'Add to cart' on the detail page
* Click 'Back to products'
* Check the badge and the buttons of all six products on the list
* Click 'Remove' on both added products

## Expected
* On the detail page the button changes to 'Remove' after the add and the cart badge reads 1
* Back on the list only the added product shows 'Remove' and the badge reads 1
* After the second add from a detail page the badge reads 2 and both products show 'Remove' in the list
* After both removals the badge is gone

<!-- test
priority: important
-->
# The cart page lists exactly the products the shopper added and the product list matches it after returning
<!-- area: cart page · outcome: data · covers: — -->

## Requirements
/inventory.html

## Steps
* Click 'Add to cart' on Sauce Labs Bike Light and Sauce Labs Fleece Jacket
* Click the cart link in the header
* Compare the products, names and prices on the cart page with the list
* If the cart page offers 'Remove', click it on Sauce Labs Fleece Jacket (otherwise record "capability missing: Remove on the cart page")
* Return to the product list with the cart page's continue-shopping control or the browser Back action
* Check the badge and the buttons of all six products
* Click 'Remove' on every product that still shows 'Remove'

## Expected
* The cart page lists exactly the two added products with the same names and prices as on the product list
* If the cart page offers 'Remove', removing the Fleece Jacket there leaves only Sauce Labs Bike Light in the cart and the badge reads 1
* Back on the product list the buttons and the badge match the cart contents
* After the final removals the badge is gone

<!-- test
priority: normal
-->
# Reset App State empties the shopper's own cart and the product list shows no item as added
<!-- area: reset app state · outcome: data · covers: — -->

## Requirements
/inventory.html

## Steps
* Check the cart is empty (no badge); if it is not empty stop and report BLOCKED, because the cart would not be this run's own data
* Select "Name (Z to A)" in the sort dropdown
* Click 'Add to cart' on Sauce Labs Bolt T-Shirt and Sauce Labs Onesie
* Click 'Open Menu'
* Click 'Reset App State'
* Click 'Close Menu'
* Check the badge, the cart link and the buttons of all six products
* Reload the page
* Check the badge and the buttons again
* Select "Name (A to Z)" in the sort dropdown

## Expected
* The cart badge is gone and the cart link reads "Cart, empty" after Reset App State
* All six products show 'Add to cart' after the reset, and still after a reload (a stale 'Remove' before the reload is a defect to record)

<!-- test
priority: high
-->
# The sort the shopper chose stays consistent with the list after visiting product detail pages
<!-- area: sort · outcome: state · covers: — -->

## Requirements
/inventory.html

## Steps
* Select "Price (low to high)" in the sort dropdown
* Click the image link of Sauce Labs Bike Light to open its detail page
* Check the detail page name and price
* Click 'Back to products'
* Check the dropdown label and the order of the cards
* Click the title link of Sauce Labs Backpack to open its detail page
* Check the detail page name and price
* Go back with the browser Back action
* Check the dropdown label and the order of the cards again
* Select "Name (A to Z)" in the sort dropdown

## Expected
* Each detail page shows the name and price of the product that was clicked
* After each return the sort dropdown label matches the order of the cards on the list

<!-- test
priority: normal
-->
# The burger menu takes the shopper from a product page back to the catalog and to the Dynamic Catalog without losing the session
<!-- area: burger menu · outcome: state · covers: — -->

## Requirements
/inventory.html

## Steps
* Click the title link of Sauce Labs Bolt T-Shirt to open its detail page
* Click 'Open Menu'
* Click 'All Items'
* Check the URL and the product list
* Click 'Open Menu'
* Click 'Dynamic Catalog'
* Record where it leads (URL and page heading); if it leaves www.saucedemo.com go back at once and do not interact further
* Return to /inventory.html with the browser Back action or the menu's 'All Items'
* Check the product list and that the user is still signed in

## Expected
* 'All Items' on the detail page returns to the product list at /inventory.html
* 'Dynamic Catalog' leads to a page whose URL and heading are recorded
* After returning to /inventory.html the six products are listed and the user is still signed in
