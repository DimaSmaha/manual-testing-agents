# TASK-114 - Enable product details navigation from inventory with consistent cart behavior

Source: http://localhost:3000/tasks/114
Type: story
Generated: 2026-11-11

## Goal
Implement the product details experience accessible from the inventory page, with consistent cart behavior between the inventory page and the product details page.

## Scope
- In scope: product details page reached from the inventory page; cart functionality on the product details page; "Back to products" navigation; cart icon/button visibility and navigation to the cart page; routing, UI consistency and state synchronization between inventory and product pages
- Out of scope: Not specified

## Requirements
- The product details experience is accessible from the inventory page.
- When a user clicks on a product name, they are navigated to a dedicated product details page displaying full product information and maintaining consistent cart functionality.
- The product details page includes the product name.
- The product details page includes a detailed description.
- The product details page includes the price.
- The product details page includes a larger product image.
- The product details page includes an 'Add to cart' button that behaves identically to the one on the inventory page, including the state change to 'Remove' when clicked and the proper cart count update.
- A 'Back to products' button returns the user to the inventory page without losing state (e.g., cart contents).
- The cart icon/button remains visible and functional, allowing navigation to the cart page at any time.
- Routing, UI consistency, and state synchronization between inventory and product pages are ensured.
