// Draft from run eb-261106-1157, scenario S5 (passed on the re-run). Not run against the app yet.
// The first attempt landed on the login page after a reload; it did not reproduce, so no workaround is coded.
import { test, expect } from '@playwright/test';
import { addButton, cartBadge, cartLink, login, removeButton } from './helpers';

test('The cart contents survive a page reload and a detour to a product detail page', async ({ page }) => {
  await login(page);

  await addButton(page, 'sauce-labs-bolt-t-shirt').click();
  await page.reload();

  // After the reload the badge still reads 1 and "Sauce Labs Bolt T-Shirt" still shows "Remove"
  await expect(page).toHaveURL(/\/inventory\.html$/);
  await expect(cartBadge(page)).toHaveText('1');
  await expect(removeButton(page, 'sauce-labs-bolt-t-shirt')).toBeVisible();

  await page.locator('[data-test="item-3-title-link"]').click();
  await expect(page).toHaveURL(/\/inventory-item\.html\?id=3$/);
  await page.locator('[data-test="back-to-products"]').click();

  // After the detour the badge still reads 1 and the Bolt T-Shirt still shows "Remove"
  await expect(page).toHaveURL(/\/inventory\.html$/);
  await expect(cartBadge(page)).toHaveText('1');
  await expect(removeButton(page, 'sauce-labs-bolt-t-shirt')).toBeVisible();

  await removeButton(page, 'sauce-labs-bolt-t-shirt').click();

  // After Remove the cart is empty
  await expect(cartBadge(page)).toHaveCount(0);
  await expect(cartLink(page)).toHaveAccessibleName('Cart, empty');
  await expect(addButton(page, 'sauce-labs-bolt-t-shirt')).toBeVisible();
});
