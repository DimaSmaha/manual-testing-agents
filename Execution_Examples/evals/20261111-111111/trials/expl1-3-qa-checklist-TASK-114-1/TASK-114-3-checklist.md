# TASK-114 - QA checklist

Requirements: .eval-runs/expl1-3-qa-checklist-TASK-114-1/TASK-114-2-requirements.md
Generated: 2026-11-11

## Checklist

### REQ-1: Implement the product details experience accessible from the inventory page.
- [ ] REQ-1.1: A product details page can be opened from the inventory page.

### REQ-2: When a user clicks on a product name, they should be navigated to a dedicated product details page displaying full product information and maintaining consistent cart functionality.
- [ ] REQ-2.1: Clicking a product name on the inventory page navigates the user to a product details page, separate from the inventory page.
- [ ] REQ-2.2: The product details page shows the information of the product whose name was clicked.
- [ ] REQ-2.3: The cart is available on the product details page (cart icon/button and 'Add to cart' button).

### REQ-3a: The product details page must include product name.
- [ ] REQ-3a.1: The product details page displays the name of the product, equal to the name shown on the inventory page.

### REQ-3b: The product details page must include detailed description.
- [ ] REQ-3b.1: The product details page displays a detailed description of the product.

### REQ-3c: The product details page must include price.
- [ ] REQ-3c.1: The product details page displays the price of the product, equal to the price shown on the inventory page.

### REQ-3d: The product details page must include a larger product image.
- [ ] REQ-3d.1: The product details page displays an image of the product.
- [ ] REQ-3d.2: The image on the product details page is larger than the product image on the inventory page.

### REQ-3e: The product details page must include an 'Add to cart' button that behaves identically to the one on the inventory page (including state change to 'Remove' when clicked and proper cart count update).
- [ ] REQ-3e.1: The product details page displays an 'Add to cart' button for a product that is not in the cart.
- [ ] REQ-3e.2: Clicking 'Add to cart' on the product details page changes the button text to 'Remove'.
- [ ] REQ-3e.3: Clicking 'Add to cart' on the product details page increases the cart count by 1.
- [ ] REQ-3e.4: Clicking 'Remove' on the product details page changes the button text back to 'Add to cart'.
- [ ] REQ-3e.5: Clicking 'Remove' on the product details page decreases the cart count by 1.

### REQ-4: A 'Back to products' button should return the user to the inventory page without losing state (e.g., cart contents).
- [ ] REQ-4.1: The product details page displays a 'Back to products' button.
- [ ] REQ-4.2: Clicking 'Back to products' navigates the user to the inventory page.
- [ ] REQ-4.3: After returning with 'Back to products', the cart count equals the count before opening the product details page.
- [ ] REQ-4.4: After returning with 'Back to products', the products added to the cart are still in the cart.

### REQ-5: The cart icon/button must remain visible and functional, allowing navigation to the cart page at any time.
- [ ] REQ-5.1: The cart icon/button is visible on the product details page.
- [ ] REQ-5.2: Clicking the cart icon/button on the product details page navigates the user to the cart page.
- [ ] REQ-5.3: The cart icon/button is visible on the inventory page.
- [ ] REQ-5.4: Clicking the cart icon/button on the inventory page navigates the user to the cart page.

### REQ-6: Ensure routing, UI consistency, and state synchronization between inventory and product pages.
- [ ] REQ-6.1: Each product details page has its own URL that differs from the inventory page URL.
- [ ] REQ-6.2: After a product is added to the cart on the inventory page, the product details page of that product shows the button 'Remove'.
- [ ] REQ-6.3: After a product is added to the cart on the product details page, the inventory page shows the button 'Remove' for that product.
- [ ] REQ-6.4: The cart count is the same on the inventory page and on the product details page.

---
