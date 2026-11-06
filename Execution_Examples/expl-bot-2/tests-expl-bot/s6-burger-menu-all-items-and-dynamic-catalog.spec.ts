// Draft from run eb-261101-1111, scenario S6 (PASSED; the Dynamic Catalog check passed vacuously, see the report). Not run against the app.
// Finding from the run: 'Dynamic Catalog' is an accordion that expands Lazy Load / Spinner / Slider; it does not navigate.
// NOT VERIFIED: the page heading ('Products') was recorded but its locator was not, so it is not asserted.
// NOT VERIFIED: the signed-in check relies on 'Open Menu' being visible and the login form being absent.
import { test, expect } from '@playwright/test';
import { openEmptyInventory } from './helpers';

test('The burger menu takes the shopper from a product page back to the catalog and to the Dynamic Catalog without losing the session', async ({ page }) => {
  await openEmptyInventory(page);

  // Sauce Labs Bolt T-Shirt: item-1, title link
  await page.locator('a[data-test="item-1-title-link"]').click();
  await expect(page).toHaveURL(/inventory-item\.html\?id=1/);

  await page.getByRole('button', { name: 'Open Menu' }).click();
  await page.locator('[data-test="inventory-sidebar-link"]').click();

  // Expected: 'All Items' on the detail page returns to the product list at /inventory.html
  await expect(page).toHaveURL(/\/inventory\.html$/);
  await expect(page.getByRole('button', { name: 'Add to cart' })).toHaveCount(6);

  await page.getByRole('button', { name: 'Open Menu' }).click();
  await page.locator('[data-test="dynamic-catalog-sidebar-link"]').click();

  // Expected: 'Dynamic Catalog' leads to a page whose URL and heading are recorded
  // Recorded in the run: the URL stays /inventory.html (no navigation), an inline submenu opens.
  await expect(page).toHaveURL(/\/inventory\.html$/);
  await expect(page.getByRole('button', { name: 'Lazy Load' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Spinner' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Slider' })).toBeVisible();

  await page.locator('#react-burger-cross-btn').click();

  // Expected: After returning to /inventory.html the six products are listed and the user is still signed in
  await expect(page).toHaveURL(/\/inventory\.html$/);
  await expect(page.getByRole('button', { name: 'Add to cart' })).toHaveCount(6);
  await expect(page.getByRole('button', { name: 'Open Menu' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Username' })).toHaveCount(0);
});
