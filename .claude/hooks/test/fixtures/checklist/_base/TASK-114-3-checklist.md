# TASK-114 - QA checklist

Requirements: .workflow-artifacts/TASK-114/TASK-114-2-requirements.md
Generated: 2026-11-06

## Checklist

### REQ-1: When a user clicks on a product name (on the inventory page), they are navigated to a dedicated product details page.
- [ ] REQ-1.1: Clicking a product name on the inventory page opens a product details page
- [ ] REQ-1.2: The opened product details page shows the name of the product whose name was clicked
- [ ] REQ-1.3: The product list of the inventory page is not displayed on the opened product details page

### REQ-2: The product details page displays full product information.
- [ ] REQ-2.1: The product details page displays the name, description, price and image of the selected product at the same time

### REQ-3: The product details page must include the product name.
- [ ] REQ-3.1: The product name is displayed on the product details page
- [ ] REQ-3.2: The product name on the product details page is identical to the name of the same product on the inventory page

### REQ-4: The product details page must include a detailed description.
- [ ] REQ-4.1: A non-empty description text is displayed on the product details page

### REQ-5: The product details page must include the price.
- [ ] REQ-5.1: The price is displayed on the product details page
- [ ] REQ-5.2: The price on the product details page is identical to the price of the same product on the inventory page

### REQ-6: The product details page must include a product image that is larger than the product image on the inventory page.
- [ ] REQ-6.1: A product image is displayed on the product details page
- [ ] REQ-6.2: The product image on the product details page is the image of the selected product
- [ ] REQ-6.3: The product image on the product details page has a greater rendered width and height than the image of the same product on the inventory page

### REQ-7: The product details page must include an 'Add to cart' button.
- [ ] REQ-7.1: A button is displayed on the product details page for a product that is not in the cart
- [ ] REQ-7.2: The button text is 'Add to cart' for a product that is not in the cart

### REQ-8: The 'Add to cart' button on the product details page behaves identically to the one on the inventory page, including the state change to 'Remove' when clicked and a proper cart count update. Clicking 'Remove' on the product details page returns the button to 'Add to cart' and decreases the cart count by 1, as on the inventory page.
- [ ] REQ-8.1: Clicking 'Add to cart' on the product details page changes the button text to 'Remove'
- [ ] REQ-8.2: Clicking 'Add to cart' on the product details page increases the cart count by 1
- [ ] REQ-8.3: Clicking 'Remove' on the product details page changes the button text back to 'Add to cart'
- [ ] REQ-8.4: Clicking 'Remove' on the product details page decreases the cart count by 1

### REQ-9: The product details page maintains consistent cart functionality.
- [ ] REQ-9.1: Opening the product details page does not change the cart count that was shown on the inventory page
- [ ] REQ-9.2: A product added to the cart on the product details page is listed on the cart page
- [ ] REQ-9.3: A product removed from the cart on the product details page is not listed on the cart page

### REQ-10: A 'Back to products' button returns the user to the inventory page without losing state (e.g., cart contents). The browser Back button returns to the inventory page with the same result.
- [ ] REQ-10.1: A 'Back to products' button is displayed on the product details page
- [ ] REQ-10.2: The button text is 'Back to products'
- [ ] REQ-10.3: Clicking 'Back to products' opens the inventory page
- [ ] REQ-10.4: After clicking 'Back to products', the cart count and the cart contents are the same as before opening the product details page
- [ ] REQ-10.5: Clicking the browser Back button on the product details page opens the inventory page
- [ ] REQ-10.6: After clicking the browser Back button, the cart count and the cart contents are the same as before opening the product details page

### REQ-11: The cart icon/button must remain visible and functional, allowing navigation to the cart page at any time. On the product details page it shows the cart count in the same way as on the inventory page.
- [ ] REQ-11.1: The cart icon is displayed on the product details page
- [ ] REQ-11.2: Clicking the cart icon on the product details page opens the cart page
- [ ] REQ-11.3: The cart icon remains displayed on the product details page after clicking 'Add to cart'
- [ ] REQ-11.4: The cart count on the product details page equals the cart count shown on the inventory page for the same cart contents
- [ ] REQ-11.5: With an empty cart, the cart icon on the product details page shows the same empty-cart state as the cart icon on the inventory page

### REQ-12: Ensure routing between the inventory page and the product details page.
- [ ] REQ-12.1: Clicking the name of each product on the inventory page opens the product details page of that product
- [ ] REQ-12.2: After opening a product details page and returning to the inventory page, clicking the name of another product opens the product details page of that other product

### REQ-12a: Opening the product details page for a non-existent product id must not break the application; the user can return to the inventory page. (The exact error/redirect behavior is not specified in the tracker.)
- [ ] REQ-12a.1: Opening the product details page for a non-existent product id does not result in a blank page or an application crash
- [ ] REQ-12a.2: From the page opened for a non-existent product id, the user can navigate to the inventory page

### REQ-13: Ensure UI consistency between the inventory and product pages (the product details page uses the same header, typography, and button styling as the inventory page).
- [ ] REQ-13.1: The header on the product details page has the same elements, text and position as the header on the inventory page
- [ ] REQ-13.2: The font family of the text on the product details page is the same as on the inventory page
- [ ] REQ-13.3: The 'Add to cart' button on the product details page has the same color, size and font as the 'Add to cart' button on the inventory page
- [ ] REQ-13.4: The 'Remove' button on the product details page has the same color, size and font as the 'Remove' button on the inventory page

### REQ-14a: State synchronization: a product added to the cart on the inventory page shows 'Remove' on its product details page.
- [ ] REQ-14a.1: The product details page of a product added to the cart on the inventory page shows the button text 'Remove'
- [ ] REQ-14a.2: The product details page of a product not added to the cart shows the button text 'Add to cart' while another product is in the cart

### REQ-14b: State synchronization: a product added to the cart on the product details page shows 'Remove' on the inventory page after returning to it.
- [ ] REQ-14b.1: After adding a product on its product details page and clicking 'Back to products', the inventory page shows the button text 'Remove' for that product
- [ ] REQ-14b.2: After adding a product on its product details page and clicking the browser Back button, the inventory page shows the button text 'Remove' for that product
