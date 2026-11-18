# TASK-114 - Test cases

Checklist: .eval-runs/expl1-4-qa-test-cases-TASK-114-1/TASK-114-3-checklist.md
Generated: 2026-11-11

---

## REQ-1: Implement the product details experience accessible from the inventory page.

> ℹ️ Umbrella requirement: its only check (REQ-1.1, the product details page can be reached from the inventory page) is exercised by TC-REQ-2.1. No separate test case, to avoid a duplicate scenario.

---

## REQ-2: When a user clicks on a product name, they should be navigated to a dedicated product details page displaying full product information and maintaining consistent cart functionality.

Applied techniques: Use Case

### TC-REQ-2.1: User opens the product details page of the clicked product from the inventory page

**Precondition:** The inventory page is open, the product list contains the product "Sauce Labs Bike Light" [test data]

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Read the name and the price of the product on its card in the product list | Sauce Labs Bike Light [test data] | The name and the price are displayed on the product card |
| 2 | Click the product name | Sauce Labs Bike Light [test data] | The inventory page is replaced by a product details page<br>The page address differs from the address of the inventory page |
| 3 | Read the name and the price on the product details page | — | The name is "Sauce Labs Bike Light"<br>The price equals the price read in step 1 |

---

## REQ-3a: The product details page must include product name.

> ℹ️ Structural requirement: the checklist checks only the presence of the product name (REQ-3a.1). No test case; the checklist is a sufficient level of verification.

---

## REQ-3b: The product details page must include detailed description.

> ℹ️ Structural requirement: the checklist checks only the presence of the detailed description (REQ-3b.1). No test case; the checklist is a sufficient level of verification.

---

## REQ-3c: The product details page must include price.

> ℹ️ Structural requirement: the checklist checks only the presence of the price (REQ-3c.1). No test case; the checklist is a sufficient level of verification.

---

## REQ-3d: The product details page must include a larger product image.

Applied techniques: Use Case

### TC-REQ-3d.1: User sees a larger product image on the product details page than on the inventory page

**Precondition:** The inventory page is open, the product list contains the product "Sauce Labs Backpack" [test data]

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Read the displayed width and height in pixels of the product image on the product card | Sauce Labs Backpack [test data] | The product image is displayed on the product card |
| 2 | Click the product name | Sauce Labs Backpack [test data] | The product details page opens |
| 3 | Read the displayed width and height in pixels of the product image on the product details page | — | The product image is displayed<br>The displayed width × height is greater than the width × height read in step 1 |

---

## REQ-3e: The product details page must include an 'Add to cart' button that behaves identically to the one on the inventory page (including state change to 'Remove' when clicked and proper cart count update).

Applied techniques: State Transition, Use Case

### TC-REQ-3e.1: User adds a product to the cart from the product details page

**Precondition:** The cart contains the product "Sauce Labs Bike Light" [test data], the cart count is 1, the product details page of "Sauce Labs Backpack" [test data] is open, "Sauce Labs Backpack" is not in the cart

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Read the label of the product action button | — | The button label is "Add to cart" |
| 2 | Click the 'Add to cart' button | — | The button label changes to "Remove"<br>The cart count changes from 1 to 2 |

**Postcondition:** "Sauce Labs Backpack" and "Sauce Labs Bike Light" are in the cart, the cart count is 2

---

## REQ-4: A 'Back to products' button should return the user to the inventory page without losing state (e.g., cart contents).

Applied techniques: Use Case, State Transition

### TC-REQ-4.1: User returns to the inventory page with the cart contents kept

**Precondition:** The cart contains the product "Sauce Labs Bike Light" [test data], the cart count is 1, the product details page of "Sauce Labs Backpack" [test data] is open

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Find the 'Back to products' button on the product details page | — | The 'Back to products' button is displayed |
| 2 | Click the 'Back to products' button | — | The inventory page opens<br>The cart count is 1<br>The button of "Sauce Labs Bike Light" shows "Remove"<br>The button of "Sauce Labs Backpack" shows "Add to cart" |

---

## REQ-5: The cart icon/button must remain visible and functional, allowing navigation to the cart page at any time.

Applied techniques: Use Case

### TC-REQ-5.1: User opens the cart page from the inventory page

**Precondition:** The inventory page is open

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Find the cart icon/button on the inventory page | — | The cart icon/button is displayed |
| 2 | Click the cart icon/button | — | The cart page opens<br>The inventory page is no longer displayed |

### TC-REQ-5.2: User opens the cart page from the product details page

**Precondition:** The product details page of "Sauce Labs Backpack" [test data] is open

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Find the cart icon/button on the product details page | — | The cart icon/button is displayed |
| 2 | Click the cart icon/button | — | The cart page opens<br>The product details page is no longer displayed |

---

## REQ-6: Ensure routing, UI consistency, and state synchronization between inventory and product pages.

Applied techniques: State Transition

### TC-REQ-6.1: User sees the same cart count on the product details page as on the inventory page

**Precondition:** The inventory page is open, "Sauce Labs Backpack" and "Sauce Labs Bike Light" [test data] are in the cart, "Sauce Labs Bolt T-Shirt" [test data] is not in the cart

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Read the cart count on the inventory page | — | The cart count is 2 |
| 2 | Click the product name | Sauce Labs Bolt T-Shirt [test data] | The product details page opens |
| 3 | Read the cart count on the product details page | — | The cart count is 2 |

### TC-REQ-6.2: User sees the Remove state on the product details page of a product added on the inventory page

**Precondition:** The inventory page is open, the cart is empty

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Click the 'Add to cart' button of the product | Sauce Labs Backpack [test data] | The button of the product shows "Remove" on the inventory page |
| 2 | Click the product name | Sauce Labs Backpack [test data] | The product details page opens |
| 3 | Read the label of the product action button | — | The button label is "Remove" |

### TC-REQ-6.3: User sees the Remove state on the inventory page of a product added on the product details page

**Precondition:** The product details page of "Sauce Labs Backpack" [test data] is open, the cart is empty

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Click the 'Add to cart' button | — | The button label changes to "Remove" |
| 2 | Click the 'Back to products' button | — | The inventory page opens |
| 3 | Read the label of the product action button on the card of the product | Sauce Labs Backpack [test data] | The button label is "Remove" |

---

## Statistics

- Requirements covered: 10 (REQ-1, REQ-2, REQ-3a, REQ-3b, REQ-3c, REQ-3d, REQ-3e, REQ-4, REQ-5, REQ-6): 6 with test cases, 4 by the checklist or by another requirement's test case (REQ-1, REQ-3a, REQ-3b, REQ-3c)
- Requirements needing clarification: 0
- Total number of test cases: 9
