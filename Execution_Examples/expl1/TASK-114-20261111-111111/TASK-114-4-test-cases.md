# TASK-114 - Test cases

Checklist: .workflow-artifacts/TASK-114-20261111-111111/TASK-114-3-checklist.md
Generated: 2026-11-11

---

## REQ-1: The product details experience is accessible from the inventory page.

Applied techniques: Use Case, EP

### TC-REQ-1.1: User opens the product details page of the first listed product

**Precondition:** The inventory page is open, the product list is displayed

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Click the name of the first product in the list | First product in the list [test data] | A product details page is displayed<br>The product list of the inventory page is not displayed |

### TC-REQ-1.2: User opens the product details page of the last listed product

**Precondition:** The inventory page is open, the product list is displayed

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Click the name of the last product in the list | Last product in the list [test data] | A product details page is displayed<br>The product list of the inventory page is not displayed |

---

## REQ-2: When a user clicks on a product name, they are navigated to a dedicated product details page displaying full product information and maintaining consistent cart functionality.

Applied techniques: Use Case

### TC-REQ-2.1: User opens the product details page of the clicked product

**Precondition:** The inventory page is open, the product list contains at least 2 products

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Read the name of the second product in the list | Second product in the list [test data] | — |
| 2 | Click the name of the second product | Second product in the list [test data] | A product details page is displayed<br>The product name on the page is the name read in step 1<br>The name of the first product in the list is not displayed on the page |

---

## REQ-3: The product details page includes the product name.

> Structural requirement: the checklist checks only the presence of the product name and that it equals the inventory name. The presence check stays in the checklist (REQ-3.1); the name comparison (REQ-3.2) is executed in TC-REQ-2.1 (expected result of step 2). No separate test case.

---

## REQ-4: The product details page includes a detailed description.

> Structural requirement: the checklist checks only that a description text is displayed (REQ-4.1). No test case, the checklist is the sufficient level of verification.

---

## REQ-5: The product details page includes the price.

Applied techniques: Use Case

### TC-REQ-5.1: User sees on the details page the same price as on the inventory page

**Precondition:** The inventory page is open, the product list is displayed

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Read the price of the first product in the list | First product in the list [test data] | — |
| 2 | Click the name of the first product | First product in the list [test data] | A product details page is displayed<br>A price is displayed on the page<br>The price on the page equals the price read in step 1 |

---

## REQ-6: The product details page includes a larger product image.

Applied techniques: Use Case

### TC-REQ-6.1: User sees on the details page a larger image than on the inventory page

**Precondition:** The inventory page is open, the product list is displayed

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Read the rendered width and height of the image of the first product in the list | First product in the list [test data] | — |
| 2 | Click the name of the first product | First product in the list [test data] | A product details page is displayed<br>A product image is displayed on the page |
| 3 | Read the rendered width and height of the product image | — | The rendered width × height of the image on the details page is greater than the width × height read in step 1 |

---

## REQ-7: The product details page includes an 'Add to cart' button that behaves identically to the one on the inventory page, including the state change to 'Remove' when clicked and the proper cart count update.

Applied techniques: State Transition, Use Case

### TC-REQ-7.1: User adds a product to the cart from the product details page

**Precondition:** The cart is empty, the product details page of the first product is open

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Read the text of the cart button of the product | First product in the list [test data] | The button text is 'Add to cart' |
| 2 | Click the 'Add to cart' button | — | The button text is 'Remove'<br>The cart count is 1 |

**Postcondition:** The first product is in the cart, the cart count is 1

### TC-REQ-7.2: User removes a product from the cart on the details page with the same result as on the inventory page

**Precondition:** The inventory page is open, the first product is in the cart (cart count 1)

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Click the 'Remove' button of the first product on the inventory page | First product in the list [test data] | The button text is noted as reference value A<br>The cart count is noted as reference value B |
| 2 | Click the 'Add to cart' button of the first product on the inventory page | First product in the list [test data] | The button text is 'Remove'<br>The cart count is 1 |
| 3 | Click the name of the first product | First product in the list [test data] | A product details page is displayed |
| 4 | Click the 'Remove' button on the details page | — | The button text equals reference value A<br>The cart count equals reference value B |

**Postcondition:** The first product is not in the cart

---

## REQ-8: A 'Back to products' button returns the user to the inventory page without losing state (e.g., cart contents).

Applied techniques: Use Case, State Transition

### TC-REQ-8.1: User returns to the inventory page with the cart contents kept

**Precondition:** The cart is empty, the inventory page is open, the product list contains at least 2 products. The first product is added to the cart on the inventory page (cart count 1)

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Click the name of the second product | Second product in the list [test data] | A product details page is displayed<br>The cart count is 1 |
| 2 | Click the 'Add to cart' button | — | The button text is 'Remove'<br>The cart count is 2 |
| 3 | Read the text of the back button | — | The button text is 'Back to products' |
| 4 | Click the 'Back to products' button | — | The inventory page is displayed<br>The cart count is 2<br>The 'Remove' button is displayed for the first product<br>The 'Remove' button is displayed for the second product |

**Postcondition:** The first and the second products are in the cart, the cart count is 2

---

## REQ-9: The cart icon/button remains visible and functional, allowing navigation to the cart page at any time.

Applied techniques: Use Case, EP

### TC-REQ-9.1: User opens the cart page from the details page with an empty cart

**Precondition:** The cart is empty, the product details page of the first product is open

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Look at the page header | — | The cart icon/button is displayed on the page |
| 2 | Click the cart icon/button | — | The cart page is displayed |

### TC-REQ-9.2: User opens the cart page from the details page after adding a product

**Precondition:** The cart is empty, the product details page of the first product is open

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Click the 'Add to cart' button | First product in the list [test data] | The cart icon/button is displayed on the page<br>The cart count is 1 |
| 2 | Click the cart icon/button | — | The cart page is displayed<br>The cart page lists the first product |

**Postcondition:** The first product is in the cart, the cart count is 1

---

## REQ-10: Routing, UI consistency, and state synchronization between inventory and product pages are ensured.

Applied techniques: State Transition, Use Case

### TC-REQ-10.1: User sees the page URL change between the inventory page and the details page

**Precondition:** The inventory page is open

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Read the page URL | — | The URL is noted as inventory URL |
| 2 | Click the name of the first product | First product in the list [test data] | A product details page is displayed<br>The page URL differs from the inventory URL |
| 3 | Click the 'Back to products' button | — | The inventory page is displayed<br>The page URL equals the inventory URL |

### TC-REQ-10.2: User sees on the details page the cart state set on the inventory page

**Precondition:** The cart is empty, the inventory page is open. The first product is added to the cart on the inventory page (cart count 1)

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Click the name of the first product | First product in the list [test data] | A product details page is displayed<br>The cart count is 1<br>The button text is 'Remove' |

**Postcondition:** The first product is in the cart, the cart count is 1

### TC-REQ-10.3: User sees on the inventory page the cart state set on the details page

**Precondition:** The cart is empty, the inventory page is open

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Click the name of the second product | Second product in the list [test data] | A product details page is displayed |
| 2 | Click the 'Add to cart' button | — | The button text is 'Remove' |
| 3 | Click the 'Back to products' button | — | The inventory page is displayed<br>The 'Remove' button is displayed for the second product |
| 4 | Click the name of the second product | Second product in the list [test data] | A product details page is displayed<br>The button text is 'Remove' |
| 5 | Click the 'Remove' button | — | The button text is 'Add to cart' |
| 6 | Click the 'Back to products' button | — | The inventory page is displayed<br>The 'Add to cart' button is displayed for the second product |

**Postcondition:** The cart is empty

---

## Statistics

- Requirements covered: 8 (REQ-1, REQ-2, REQ-5, REQ-6, REQ-7, REQ-8, REQ-9, REQ-10)
- Structural requirements (checklist only, no test case): 2 (REQ-3, REQ-4)
- Requirements needing clarification: 0
- Total number of test cases: 13
