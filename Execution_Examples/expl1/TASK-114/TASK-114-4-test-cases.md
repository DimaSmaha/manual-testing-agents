# TASK-114 - Test cases

Checklist: .workflow-artifacts/TASK-114/TASK-114-3-checklist.md
Generated: 2026-11-05

Notation: "Product A" and "Product B" are two different products from the inventory list `[test data]`. "Product C" is a third product `[test data]`.

---

## REQ-1: When a user clicks on a product name (on the inventory page), they are navigated to a dedicated product details page.

Applied techniques: Use Case

### TC-REQ-1.1: Clicking a product name opens the product details page

**Precondition:** The inventory page is open, the cart is empty

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Click the name of a product in the product list | Product A [test data] | The product details page is opened; the inventory page is no longer displayed |
| 2 | Return to the inventory page and click the name of another product | Product B [test data] | The product details page is opened for that product; the inventory page is no longer displayed |

---

## REQ-2: The product details page displays full product information.

Applied techniques: Use Case

### TC-REQ-2.1: The details page shows the information of the clicked product only

**Precondition:** The inventory page is open

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Click the name of Product A | Product A [test data] | The details page shows the name and price of Product A |
| 2 | Click the 'Back to products' button | — | The inventory page is displayed |
| 3 | Click the name of Product B | Product B [test data] | The details page shows the name and price of Product B; the name and price of Product A are not displayed |

---

## REQ-3: The product details page must include the product name.

Applied techniques: Use Case

### TC-REQ-3.1: The product name matches the inventory page

**Precondition:** The inventory page is open; the name of Product A is noted from the inventory list

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Click the name of Product A | Product A [test data] | The details page displays a product name |
| 2 | Compare the name on the details page with the name noted on the inventory page | — | The names are identical |

---

## REQ-4: The product details page must include a detailed description.

> ℹ️ Structural requirement (presence of a non-empty description). Covered by the checklist (REQ-4.1); no test case generated.

---

## REQ-5: The product details page must include the price.

Applied techniques: Use Case

### TC-REQ-5.1: The price matches the inventory page

**Precondition:** The inventory page is open; the price of Product A is noted from the inventory list

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Click the name of Product A | Product A [test data] | The details page displays a price |
| 2 | Compare the price on the details page with the price noted on the inventory page | — | The prices are identical |

---

## REQ-6: The product details page must include a product image that is larger than the product image on the inventory page.

Applied techniques: Use Case

### TC-REQ-6.1: The details page image is larger than the inventory image

**Precondition:** The inventory page is open; the displayed width and height of the Product A image are noted from the inventory list (for example via the browser developer tools)

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Click the name of Product A | Product A [test data] | The details page displays a product image |
| 2 | Compare the image with the Product A image on the inventory page | — | The image shows the same product |
| 3 | Compare the displayed width and height of the image with the values noted on the inventory page | — | The displayed width and the displayed height on the details page are greater than those on the inventory page |

---

## REQ-7: The product details page must include an 'Add to cart' button.

Applied techniques: Use Case

### TC-REQ-7.1: 'Add to cart' adds the product to the cart

**Precondition:** The cart is empty; the details page of Product A is open

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Check the button text | — | The button text is 'Add to cart' |
| 2 | Click 'Add to cart' | — | The product is added to the cart |
| 3 | Click the cart icon/button | — | The cart page is opened and lists Product A |

**Postcondition:** Product A is in the cart

---

## REQ-8: The 'Add to cart' button on the product details page behaves identically to the one on the inventory page, including the state change to 'Remove' when clicked and a proper cart count update. Clicking 'Remove' on the product details page returns the button to 'Add to cart' and decreases the cart count by 1, as on the inventory page.

Applied techniques: State Transition

### TC-REQ-8.1: 'Add to cart' → 'Remove' with cart count update

**Precondition:** Product B is in the cart (cart count = 1); the details page of Product A (not in the cart) is open

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Click 'Add to cart' | — | The button text changes to 'Remove' |
| 2 | Check the cart count | — | The cart count is 2 |

**Postcondition:** Products A and B are in the cart, the button on the Product A details page shows 'Remove'

### TC-REQ-8.2: 'Remove' → 'Add to cart' with cart count update

**Precondition:** Products A and B are in the cart (cart count = 2); the details page of Product A is open and shows 'Remove'

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Click 'Remove' | — | The button text changes to 'Add to cart' |
| 2 | Check the cart count | — | The cart count is 1 |
| 3 | Click the cart icon/button | — | The cart page lists Product B and does not list Product A |

**Postcondition:** Only Product B is in the cart

---

## REQ-9: The product details page maintains consistent cart functionality.

Applied techniques: Use Case

### TC-REQ-9.1: Adding two products from their details pages

**Precondition:** The cart is empty; the inventory page is open

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Click the name of Product A, then click 'Add to cart' | Product A [test data] | The button text is 'Remove'; the cart count is 1 |
| 2 | Click 'Back to products', click the name of Product B, then click 'Add to cart' | Product B [test data] | The button text is 'Remove'; the cart count is 2 |
| 3 | Click the cart icon/button | — | The cart page lists Product A and Product B |

**Postcondition:** Products A and B are in the cart

---

## REQ-10: A 'Back to products' button returns the user to the inventory page without losing state (e.g., cart contents). The browser Back button returns to the inventory page with the same result.

Applied techniques: Use Case

### TC-REQ-10.1: 'Back to products' keeps the cart contents

**Precondition:** Product B is in the cart (cart count = 1); the inventory page is open

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Click the name of Product A | Product A [test data] | The details page of Product A is opened |
| 2 | Check the button | — | A button with the text 'Back to products' is present |
| 3 | Click 'Back to products' | — | The inventory page is opened |
| 4 | Check the cart count | — | The cart count is 1 |
| 5 | Check the button of Product B | — | The button of Product B shows 'Remove' |

### TC-REQ-10.2: Browser Back button keeps the cart contents

**Precondition:** Product B is in the cart (cart count = 1); the inventory page is open

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Click the name of Product A | Product A [test data] | The details page of Product A is opened |
| 2 | Click the browser Back button | — | The inventory page is opened |
| 3 | Check the cart count | — | The cart count is 1 |
| 4 | Check the button of Product B | — | The button of Product B shows 'Remove' |

---

## REQ-11: The cart icon/button must remain visible and functional, allowing navigation to the cart page at any time. On the product details page it shows the cart count in the same way as on the inventory page.

Applied techniques: Use Case

### TC-REQ-11.1: Navigating to the cart page from the details page

**Precondition:** Product B is in the cart; the details page of Product A is open

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Check the cart icon/button | — | The cart icon/button is visible |
| 2 | Click the cart icon/button | — | The cart page is opened and lists Product B |

### TC-REQ-11.2: Cart icon/button and count after adding a product on the details page

**Precondition:** Product B is in the cart; the inventory page is open and shows cart count 1; the details page of Product A is open

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Check the cart count on the cart icon/button | — | The cart count is 1, the same as on the inventory page |
| 2 | Click 'Add to cart' | — | The cart icon/button remains visible |
| 3 | Check the cart count on the cart icon/button | — | The cart count is 2 |
| 4 | Click 'Back to products' and check the cart count on the inventory page | — | The cart count is 2, the same as on the details page |

**Postcondition:** Products A and B are in the cart

---

## REQ-12: Ensure routing between the inventory page and the product details page.

Applied techniques: Use Case

### TC-REQ-12.1: Different products open different details pages

**Precondition:** The inventory page is open

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Click the name of Product A and note the page address and the product name | Product A [test data] | The details page of Product A is opened |
| 2 | Click 'Back to products', click the name of Product B and note the page address and the product name | Product B [test data] | The details page of Product B is opened; its address differs from the address noted in step 1 |

### TC-REQ-12.2: Reloading the details page

**Precondition:** The details page of Product A is open

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Reload the page | — | The details page of Product A is displayed with the name of Product A |

### TC-REQ-12.3: Opening the details page by its address

**Precondition:** The details page of Product A is open; its address is copied from the browser address bar

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Open the copied address in a new tab | Address of the Product A details page [test data] | The details page of Product A is displayed with the name of Product A |

---

## REQ-12a: Opening the product details page for a non-existent product id must not break the application; the user can return to the inventory page. (The exact error/redirect behavior is not specified in the tracker.)

Applied techniques: EP (invalid partition)

### TC-REQ-12a.1: Non-existent product id

**Precondition:** The details page of Product A is open; its address is copied from the browser address bar

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Replace the product id in the address with an id of a product that does not exist and open the address | Product id 99999 [test data] | The data (name, price, image) of an existing product is not displayed |
| 2 | Use the control on the page that leads to the inventory page | — | The inventory page is opened |

---

## REQ-13: Ensure UI consistency between the inventory and product pages (the product details page uses the same header, typography, and button styling as the inventory page).

Applied techniques: Use Case

### TC-REQ-13.1: Header and typography match the inventory page

**Precondition:** The inventory page is open

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Note the header content and the font family of the page text on the inventory page | — | Values are noted |
| 2 | Click the name of Product A | Product A [test data] | The details page is opened |
| 3 | Compare the header content with the noted one | — | The header is the same as on the inventory page |
| 4 | Compare the font family of the page text with the noted one | — | The font family is the same as on the inventory page |

### TC-REQ-13.2: Button styling matches the inventory page

**Precondition:** The inventory page is open; Product A is not in the cart

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Note the styling (color, size, font) of the 'Add to cart' button of Product A on the inventory page | — | Values are noted |
| 2 | Click the 'Add to cart' button of Product A on the inventory page and note the styling of the 'Remove' button | — | The button shows 'Remove'; values are noted |
| 3 | Click the name of Product A | Product A [test data] | The details page is opened and shows the 'Remove' button |
| 4 | Compare the styling of the 'Remove' button with the noted one | — | The styling is the same as on the inventory page |
| 5 | Click 'Remove' and compare the styling of the 'Add to cart' button with the noted one | — | The button shows 'Add to cart'; its styling is the same as on the inventory page |

**Postcondition:** Product A is not in the cart

---

## REQ-14a: State synchronization: a product added to the cart on the inventory page shows 'Remove' on its product details page.

Applied techniques: State Transition

### TC-REQ-14a.1: Added on the inventory page → 'Remove' on the details page

**Precondition:** The cart is empty; the inventory page is open

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Click 'Add to cart' of Product A on the inventory page | Product A [test data] | The button of Product A shows 'Remove' |
| 2 | Click the name of Product A | Product A [test data] | The details page of Product A shows the 'Remove' button |
| 3 | Click 'Back to products' and click the name of Product C (not added to the cart) | Product C [test data] | The details page of Product C shows the 'Add to cart' button |

**Postcondition:** Product A is in the cart

### TC-REQ-14a.2: Removed on the inventory page → 'Add to cart' on the details page

**Precondition:** Product A is in the cart; the inventory page is open and the button of Product A shows 'Remove'

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Click 'Remove' of Product A on the inventory page | Product A [test data] | The button of Product A shows 'Add to cart' |
| 2 | Click the name of Product A | Product A [test data] | The details page of Product A shows the 'Add to cart' button |

**Postcondition:** The cart is empty

---

## REQ-14b: State synchronization: a product added to the cart on the product details page shows 'Remove' on the inventory page after returning to it.

Applied techniques: State Transition

### TC-REQ-14b.1: Added on the details page → 'Remove' on the inventory page

**Precondition:** The cart is empty; the details page of Product A is open

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Click 'Add to cart' | — | The button shows 'Remove' |
| 2 | Click 'Back to products' | — | The inventory page is opened; the button of Product A shows 'Remove' |

**Postcondition:** Product A is in the cart

### TC-REQ-14b.2: Removed on the details page → 'Add to cart' on the inventory page

**Precondition:** Product A is in the cart; the details page of Product A is open and shows 'Remove'

| # | Step | Test data | Expected result |
|---|------|-----------|-----------------|
| 1 | Click 'Remove' | — | The button shows 'Add to cart' |
| 2 | Click 'Back to products' | — | The inventory page is opened; the button of Product A shows 'Add to cart' |

**Postcondition:** The cart is empty

---

## Statistics

- Requirements covered: 15 (REQ-1, REQ-2, REQ-3, REQ-5, REQ-6, REQ-7, REQ-8, REQ-9, REQ-10, REQ-11, REQ-12, REQ-12a, REQ-13, REQ-14a, REQ-14b)
- Structural requirements covered by the checklist only: 1 (REQ-4)
- Requirements needing clarification: 0
- Total number of test cases: 23
