// Draft from run eb-261106-1157, scenario S4. Not run against the app yet.
// NOT VERIFIED locators: the result block did not record the selectors used to read the detail page. The
// detail page reads below reuse the list page's data-test names (inventory-item-name, -desc, -price); check
// them on the first run.
import { test, expect } from '@playwright/test';
import { cartBadge, cartLink, login } from './helpers';

test("A shopper opens a product's detail page and it matches the list entry", async ({ page }) => {
  await login(page);

  const boltCard = page.locator('[data-test="inventory-item"]', { hasText: 'Sauce Labs Bolt T-Shirt' });
  const boltName = (await boltCard.locator('[data-test="inventory-item-name"]').innerText()).trim();
  const boltDesc = (await boltCard.locator('[data-test="inventory-item-desc"]').innerText()).trim();
  const boltPrice = (await boltCard.locator('[data-test="inventory-item-price"]').innerText()).trim();
  const boltImgSrc = await boltCard.locator('img').getAttribute('src');
  expect(boltPrice).toBe('$15.99');

  await page.locator('[data-test="item-1-title-link"]').click();

  // The URL changes to a product detail URL for each opened product
  await expect(page).toHaveURL(/\/inventory-item\.html\?id=1$/);
  // Name, description and price on each detail page equal the list values
  await expect(page.locator('[data-test="inventory-item-name"]')).toHaveText(boltName);
  await expect(page.locator('[data-test="inventory-item-desc"]')).toHaveText(boltDesc);
  await expect(page.locator('[data-test="inventory-item-price"]')).toHaveText(boltPrice);
  await expect(page.locator('img').first()).toHaveAttribute('src', boltImgSrc ?? '');

  await page.goBack();
  await expect(page).toHaveURL(/\/inventory\.html$/);

  const backpackCard = page.locator('[data-test="inventory-item"]', { hasText: 'Sauce Labs Backpack' });
  const backpackName = (await backpackCard.locator('[data-test="inventory-item-name"]').innerText()).trim();
  const backpackPrice = (await backpackCard.locator('[data-test="inventory-item-price"]').innerText()).trim();
  expect(backpackPrice).toBe('$29.99');

  await page.locator('a[data-test="item-4-img-link"]').click();

  await expect(page).toHaveURL(/\/inventory-item\.html\?id=4$/);
  await expect(page.locator('[data-test="inventory-item-name"]')).toHaveText(backpackName);
  await expect(page.locator('[data-test="inventory-item-price"]')).toHaveText(backpackPrice);

  await page.locator('[data-test="back-to-products"]').click();

  // After going back the inventory page shows all 6 products and the cart is still empty
  await expect(page).toHaveURL(/\/inventory\.html$/);
  await expect(page.locator('[data-test="inventory-item"]')).toHaveCount(6);
  await expect(cartBadge(page)).toHaveCount(0);
  await expect(cartLink(page)).toHaveAccessibleName('Cart, empty');
});
