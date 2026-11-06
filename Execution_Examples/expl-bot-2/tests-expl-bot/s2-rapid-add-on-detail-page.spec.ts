// Draft from run eb-261101-1211, scenario S2 (PASSED). Not run against the app.
// NOT VERIFIED: none beyond the shared helpers (login form).
import { test, expect } from '@playwright/test';
import { BASE_URL, SLUGS, addButton, cartBadge, cartLink, expectCartEmpty, login, removeButton, ALL_SLUGS } from './helpers';

test("A shopper hammers 'Add to cart' on a product page and the cart still holds the product exactly once across reload and history moves", async ({ page }) => {
  await login(page);
  await page.goto(`${BASE_URL}/inventory-item.html?id=4`);
  await expectCartEmpty(page);

  const toggle = page.locator('.inventory_details_container button.btn_inventory');
  await expect(toggle).toHaveText('Add to cart');

  // Five quick clicks, button re-located each time (it toggles Add to cart / Remove)
  for (let i = 0; i < 5; i++) {
    await toggle.click({ noWaitAfter: true, timeout: 5000 });
  }

  // Expected: After five quick clicks the badge reads 1 and the button reads 'Remove'
  await expect(cartBadge(page)).toHaveText('1');
  await expect(toggle).toHaveText('Remove');

  await page.reload();

  // Expected: After the reload the badge still reads 1 and the button still reads 'Remove'
  await expect(cartBadge(page)).toHaveText('1');
  await expect(toggle).toHaveText('Remove');

  await page.getByRole('button', { name: 'Back to products' }).click();

  // Expected: On the product list only Sauce Labs Backpack shows 'Remove'
  await expect(page).toHaveURL(/inventory\.html/);
  await expect(removeButton(page, SLUGS.backpack)).toBeVisible();
  for (const slug of ALL_SLUGS.filter((s) => s !== SLUGS.backpack)) {
    await expect(addButton(page, slug)).toBeVisible();
  }

  await page.goBack();

  // Expected: After the browser Back action the detail page button reads 'Remove'
  await expect(page).toHaveURL(/inventory-item\.html\?id=4/);
  await expect(toggle).toHaveText('Remove');

  await toggle.click();

  // Expected: After the final 'Remove' the badge is gone and the cart link reads "Cart, empty"
  await expect(cartBadge(page)).toHaveCount(0);
  await expect(cartLink(page)).toHaveAccessibleName('Cart, empty');
});
