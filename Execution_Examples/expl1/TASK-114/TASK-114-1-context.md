# TASK-114 - Enable product details navigation from inventory with consistent cart behavior

Source: http://localhost:3000/tasks/114
Type: story
Generated: 2026-11-05

## Goal
Implement the product details experience accessible from the inventory page. When a user clicks on a product name, they are navigated to a dedicated product details page displaying full product information and maintaining consistent cart functionality.

## Scope
- In scope: product details page reached from the inventory page; cart functionality on that page; return to the inventory page; cart icon/button navigation; routing, UI consistency, and state synchronization between inventory and product pages.
- Out of scope: Not specified in the tracker

## Requirements
- When a user clicks on a product name (on the inventory page), they are navigated to a dedicated product details page.
- The product details page displays full product information.
- The product details page must include the product name.
- The product details page must include a detailed description.
- The product details page must include the price.
- The product details page must include a larger product image.
- The product details page must include an 'Add to cart' button.
- The 'Add to cart' button on the product details page behaves identically to the one on the inventory page, including the state change to 'Remove' when clicked and a proper cart count update.
- The product details page maintains consistent cart functionality.
- A 'Back to products' button returns the user to the inventory page without losing state (e.g., cart contents).
- The cart icon/button must remain visible and functional, allowing navigation to the cart page at any time.
- Ensure routing between the inventory page and the product details page.
- Ensure UI consistency between the inventory and product pages.
- Ensure state synchronization between the inventory and product pages.
