// Draft from run eb-261101-1111, scenario S1 (PASSED). Not run against the app.
// NOT VERIFIED: the final step 'Select Name (A to Z)' was only checked, not performed, in the run (reload had reset the sort to the default).
import { test, expect } from '@playwright/test';
import { ALL_SLUGS, SLUGS, addButton, removeButton, cartBadge, expectCartEmpty, openEmptyInventory } from './helpers';

test('A shopper fills the cart with all six products under changing sort orders and the cart count and buttons stay correct', async ({ page }) => {
  await openEmptyInventory(page);

  await page.locator('[data-test="product-sort-container"]').selectOption('za');
  // Z to A order, starting with Test.allTheThings() T-Shirt (Red), as in the run
  const zaOrder = [SLUGS.redTShirt, SLUGS.onesie, SLUGS.fleeceJacket, SLUGS.boltTShirt, SLUGS.bikeLight, SLUGS.backpack];
  for (const slug of zaOrder) {
    await addButton(page, slug).click();
  }

  // Expected: The cart badge reads 6 after the sixth add
  await expect(cartBadge(page)).toHaveText('6');
  await expect(page.locator('[data-test="shopping-cart-link"]')).toHaveAccessibleName('Cart, 6 items');

  await page.locator('select.product_sort_container').selectOption('lohi');
  for (const slug of ALL_SLUGS) {
    await expect(removeButton(page, slug)).toBeVisible();
  }
  await expect(cartBadge(page)).toHaveText('6');

  await page.reload();

  // Expected: All six products show 'Remove' after the re-sort and after the reload
  for (const slug of ALL_SLUGS) {
    await expect(removeButton(page, slug)).toBeVisible();
  }
  await expect(cartBadge(page)).toHaveText('6');

  for (const slug of ALL_SLUGS) {
    await removeButton(page, slug).click();
  }

  // Expected: After removing all six products the badge is gone and the cart link reads "Cart, empty"
  await expectCartEmpty(page);
  for (const slug of ALL_SLUGS) {
    await expect(addButton(page, slug)).toBeVisible();
  }
});
