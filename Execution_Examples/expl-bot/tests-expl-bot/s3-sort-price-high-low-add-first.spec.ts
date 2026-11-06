// Draft from run eb-261106-1157, scenario S3. Not run against the app yet.
import { test, expect } from '@playwright/test';
import { addButton, cartBadge, itemNames, itemPrices, login, removeButton, sortSelect } from './helpers';

test('After sorting by price high to low the shopper adds the first listed product and the right item is added', async ({ page }) => {
  await login(page);

  await sortSelect(page).selectOption('Price (high to low)');

  // The first product in the list is "Sauce Labs Fleece Jacket" at $49.99
  await expect(itemNames(page).first()).toHaveText('Sauce Labs Fleece Jacket');
  await expect(itemPrices(page).first()).toHaveText('$49.99');

  await addButton(page, 'sauce-labs-fleece-jacket').click();

  // After adding, exactly that product shows "Remove" and the badge reads 1
  await expect(removeButton(page, 'sauce-labs-fleece-jacket')).toBeVisible();
  await expect(page.locator('button[data-test^="remove-"]')).toHaveCount(1);
  await expect(cartBadge(page)).toHaveText('1');

  await removeButton(page, 'sauce-labs-fleece-jacket').click();

  // After Remove the cart is empty
  await expect(cartBadge(page)).toHaveCount(0);
  await expect(page.locator('button[data-test^="remove-"]')).toHaveCount(0);

  await sortSelect(page).selectOption('Name (A to Z)');
});
