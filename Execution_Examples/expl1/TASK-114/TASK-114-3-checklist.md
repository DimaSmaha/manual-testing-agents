# TASK-114 - QA checklist

Requirements: .workflow-artifacts/TASK-114/TASK-114-2-requirements.md
Generated: 2026-11-05

## Checklist

### REQ-1: When a user clicks on a product name (on the inventory page), they are navigated to a dedicated product details page.
- [ ] REQ-1.1: The product name in each product card on the inventory page is clickable
- [ ] REQ-1.2: Clicking a product name on the inventory page opens a product details page, and the inventory page is no longer displayed

### REQ-2: The product details page displays full product information.
- [ ] REQ-2.1: The product details page shows the information of the product whose name was clicked, not of another product

### REQ-3: The product details page must include the product name.
- [ ] REQ-3.1: The product name is present on the product details page
- [ ] REQ-3.2: The product name on the details page is identical to the product name on the inventory page

### REQ-4: The product details page must include a detailed description.
- [ ] REQ-4.1: A description with non-empty text is present on the product details page

### REQ-5: The product details page must include the price.
- [ ] REQ-5.1: The price is present on the product details page
- [ ] REQ-5.2: The price on the details page is identical to the price on the inventory page

### REQ-6: The product details page must include a product image that is larger than the product image on the inventory page.
- [ ] REQ-6.1: A product image is present on the product details page
- [ ] REQ-6.2: The image on the details page shows the same product as the image on the inventory page
- [ ] REQ-6.3: The image on the details page is displayed at a larger size than the image of the same product on the inventory page

### REQ-7: The product details page must include an 'Add to cart' button.
- [ ] REQ-7.1: An 'Add to cart' button is present on the product details page
- [ ] REQ-7.2: The button text is 'Add to cart' when the product is not in the cart
- [ ] REQ-7.3: Clicking 'Add to cart' adds the product to the cart, and the product is listed on the cart page

### REQ-8: The 'Add to cart' button on the product details page behaves identically to the one on the inventory page, including the state change to 'Remove' when clicked and a proper cart count update. Clicking 'Remove' on the product details page returns the button to 'Add to cart' and decreases the cart count by 1, as on the inventory page.
- [ ] REQ-8.1: Clicking 'Add to cart' changes the button text to 'Remove'
- [ ] REQ-8.2: Clicking 'Add to cart' increases the cart count by 1
- [ ] REQ-8.3: Clicking 'Remove' changes the button text back to 'Add to cart'
- [ ] REQ-8.4: Clicking 'Remove' decreases the cart count by 1
- [ ] REQ-8.5: The product is no longer listed on the cart page after clicking 'Remove' on the details page

### REQ-9: The product details page maintains consistent cart functionality.
- [ ] REQ-9.1: After adding product A on its details page and product B on its details page, the cart count is 2 and both products are listed on the cart page

### REQ-10: A 'Back to products' button returns the user to the inventory page without losing state (e.g., cart contents). The browser Back button returns to the inventory page with the same result.
- [ ] REQ-10.1: A 'Back to products' button is present on the product details page
- [ ] REQ-10.2: The button text is 'Back to products'
- [ ] REQ-10.3: Clicking 'Back to products' opens the inventory page
- [ ] REQ-10.4: After clicking 'Back to products', the cart count equals the count before leaving the inventory page
- [ ] REQ-10.5: After clicking 'Back to products', the products that were in the cart show 'Remove' on the inventory page
- [ ] REQ-10.6: Clicking the browser Back button on the details page opens the inventory page
- [ ] REQ-10.7: After clicking the browser Back button, the cart count equals the count before leaving the inventory page

### REQ-11: The cart icon/button must remain visible and functional, allowing navigation to the cart page at any time. On the product details page it shows the cart count in the same way as on the inventory page.
- [ ] REQ-11.1: The cart icon/button is visible on the product details page
- [ ] REQ-11.2: Clicking the cart icon/button on the details page opens the cart page
- [ ] REQ-11.3: The cart icon/button remains visible on the details page after clicking 'Add to cart'
- [ ] REQ-11.4: The cart icon/button on the details page shows the current cart count
- [ ] REQ-11.5: The cart icon/button on the details page shows the same count as the cart icon/button on the inventory page

### REQ-12: Ensure routing between the inventory page and the product details page.
- [ ] REQ-12.1: Clicking the names of two different products opens two different product details pages
- [ ] REQ-12.2: Reloading the product details page keeps displaying the same product
- [ ] REQ-12.3: Opening the URL of a product details page directly displays that product

### REQ-12a: Opening the product details page for a non-existent product id must not break the application; the user can return to the inventory page. (The exact error/redirect behavior is not specified in the tracker.)
- [ ] REQ-12a.1: Opening the details page URL with a non-existent product id does not display the data of an existing product
- [ ] REQ-12a.2: From the page opened for a non-existent product id, the user can reach the inventory page

### REQ-13: Ensure UI consistency between the inventory and product pages (the product details page uses the same header, typography, and button styling as the inventory page).
- [ ] REQ-13.1: The header on the details page is the same as the header on the inventory page
- [ ] REQ-13.2: The font family of the text on the details page is the same as on the inventory page
- [ ] REQ-13.3: The 'Add to cart' button on the details page has the same styling as the 'Add to cart' button on the inventory page
- [ ] REQ-13.4: The 'Remove' button on the details page has the same styling as the 'Remove' button on the inventory page

### REQ-14a: State synchronization: a product added to the cart on the inventory page shows 'Remove' on its product details page.
- [ ] REQ-14a.1: A product added to the cart on the inventory page shows 'Remove' on its details page
- [ ] REQ-14a.2: A product not added to the cart shows 'Add to cart' on its details page while another product is in the cart
- [ ] REQ-14a.3: A product removed from the cart on the inventory page shows 'Add to cart' on its details page

### REQ-14b: State synchronization: a product added to the cart on the product details page shows 'Remove' on the inventory page after returning to it.
- [ ] REQ-14b.1: A product added to the cart on its details page shows 'Remove' on the inventory page after returning to it
- [ ] REQ-14b.2: A product removed from the cart on its details page shows 'Add to cart' on the inventory page after returning to it

---
