// Draft from run eb-261101-1111, scenario S2 (PASSED on the second attempt, after the session expired once). Not run against the app.
// NOT VERIFIED: the 'Remove' button on the detail page is located by role only (no data-test was recorded for it).
import { test, expect } from '@playwright/test';
import { ALL_SLUGS, SLUGS, addButton, removeButton, cartBadge, expectCartEmpty, openEmptyInventory } from './helpers';

test('A shopper adds products from their detail pages and the product list shows the same cart state afterwards', async ({ page }) => {
  await openEmptyInventory(page);

  // Test.allTheThings() T-Shirt (Red): item-3, opened by its title link
  await page.locator('[data-test="item-3-title-link"]').click();
  await page.locator('[data-test="add-to-cart"]').click();

  // Expected: On the detail page the button changes to 'Remove' after the add and the cart badge reads 1
  await expect(page.getByRole('button', { name: 'Remove' })).toBeVisible();
  await expect(cartBadge(page)).toHaveText('1');

  await page.locator('[data-test="back-to-products"]').click();

  // Expected: Back on the list only the added product shows 'Remove' and the badge reads 1
  await expect(cartBadge(page)).toHaveText('1');
  for (const slug of ALL_SLUGS) {
    if (slug === SLUGS.redTShirt) {
      await expect(removeButton(page, slug)).toBeVisible();
    } else {
      await expect(addButton(page, slug)).toBeVisible();
    }
  }

  // Sauce Labs Onesie: item-2, opened by its image link
  await page.locator('[data-test="item-2-img-link"]').click();
  await page.locator('[data-test="add-to-cart"]').click();
  await page.locator('[data-test="back-to-products"]').click();

  // Expected: After the second add from a detail page the badge reads 2 and both products show 'Remove' in the list
  await expect(cartBadge(page)).toHaveText('2');
  await expect(removeButton(page, SLUGS.onesie)).toBeVisible();
  await expect(removeButton(page, SLUGS.redTShirt)).toBeVisible();
  for (const slug of [SLUGS.backpack, SLUGS.bikeLight, SLUGS.boltTShirt, SLUGS.fleeceJacket]) {
    await expect(addButton(page, slug)).toBeVisible();
  }

  await removeButton(page, SLUGS.onesie).click();
  await removeButton(page, SLUGS.redTShirt).click();

  // Expected: After both removals the badge is gone
  await expectCartEmpty(page);
  for (const slug of ALL_SLUGS) {
    await expect(addButton(page, slug)).toBeVisible();
  }
});
