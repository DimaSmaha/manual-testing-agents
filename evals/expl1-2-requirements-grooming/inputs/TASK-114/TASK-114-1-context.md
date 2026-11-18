# TASK-114 - Enable product details navigation from inventory with consistent cart behavior

Source: http://localhost:3000/tasks/114
Type: story
Generated: 2026-11-17

## Goal
Implement the product details experience accessible from the inventory page, with consistent cart behavior and state synchronization between the inventory and product pages.

## Scope
- In scope: Product details page accessible from the inventory page; navigation from a product name to the product details page; product information on the product details page; 'Add to cart' button on the product details page; 'Back to products' button; cart icon/button; routing, UI consistency, and state synchronization between inventory and product pages
- Out of scope: Not specified in the tracker

## Requirements
- Implement the product details experience accessible from the inventory page.
- When a user clicks on a product name, they should be navigated to a dedicated product details page displaying full product information and maintaining consistent cart functionality.
- The product details page must include product name, detailed description, price, a larger product image, and an 'Add to cart' button that behaves identically to the one on the inventory page (including state change to 'Remove' when clicked and proper cart count update).
- A 'Back to products' button should return the user to the inventory page without losing state (e.g., cart contents).
- The cart icon/button must remain visible and functional, allowing navigation to the cart page at any time.
- Ensure routing, UI consistency, and state synchronization between inventory and product pages.

---
