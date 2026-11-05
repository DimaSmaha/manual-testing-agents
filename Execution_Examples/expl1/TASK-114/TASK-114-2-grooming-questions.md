# TASK-114 - Grooming questions (pending answers)

Generated: 2026-11-05

REQ numbers follow the order of the "Requirements" section in `TASK-114-1-context.md`.

## Questions
- [ ] REQ-1: Only the product name is named as clickable. Is the product image also clickable, or only the name? → Confirm the click targets.
- [ ] REQ-1, REQ-12: No route or URL format is given for the product details page. Can it be opened directly by URL? Does it need a logged-in user? → Confirm the expected URL/route and the access rules.
- [ ] REQ-8: "Identical" is stated only for the 'Add to cart' → 'Remove' change and the cart count. What does 'Remove' do on the details page? → Confirm it reverts to 'Add to cart' and lowers the cart count by 1, as on the inventory page.
- [ ] REQ-10: "Without losing state (e.g., cart contents)" gives one example. Does the inventory page also need to keep its other state, such as sort order or scroll position? → List which states must be kept.
- [ ] REQ-10: Is the browser Back button expected to behave the same as the 'Back to products' button? → Confirm.
- [ ] REQ-6: "Larger" has no reference size or ratio. → Confirm whether "larger than the inventory thumbnail" is enough to accept.
- [ ] REQ-11: Does the cart icon on the details page also show the cart count badge? → Confirm.

## Uncovered requirements
- [ ] REQ-12: No behavior is defined for a non-existent or invalid product id (for example `/product/9999`). → Define the expected result: error message, redirect, or 404 page.
- [ ] REQ-14: No direction is defined for state sync. → Confirm that both of these hold:
  - A product added on the inventory page shows 'Remove' when opened on its details page.
  - A product added on the details page shows 'Remove' on the inventory page after going back.

## Risks
- [ ] REQ-13: "UI consistency" has no verifiable criterion, so it can't be tested or accepted as written. → Say what must match (fonts, header, button styling, layout), or accept it as a visual check only.
- [ ] REQ-9: Overlaps with REQ-8, REQ-11 and REQ-14 and adds no separate testable behavior. → Decide whether to keep it as a separate requirement or merge it.
- [ ] REQ-2: Only restates REQ-3 to REQ-6 ("full product information"). → Confirm there are no extra fields beyond name, description, price and image.
