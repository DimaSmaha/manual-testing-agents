// Draft from run eb-261106-1157, scenario S2. Not run against the app yet.
import { test, expect } from '@playwright/test';
import { addButton, cartBadge, cartLink, login, removeButton } from './helpers';

test('A shopper builds a multi-item cart and removes one item from the list', async ({ page }) => {
  await login(page);

  await addButton(page, 'sauce-labs-bike-light').click();
  await addButton(page, 'sauce-labs-onesie').click();
  await addButton(page, 'sauce-labs-fleece-jacket').click();

  // The badge reads 3 after the three adds, then 2 after removing the Onesie
  await expect(cartBadge(page)).toHaveText('3');

  await removeButton(page, 'sauce-labs-onesie').click();
  await expect(cartBadge(page)).toHaveText('2');

  // "Sauce Labs Onesie" shows "Add to cart" again; "Bike Light" and "Fleece Jacket" still show "Remove"
  await expect(addButton(page, 'sauce-labs-onesie')).toBeVisible();
  await expect(removeButton(page, 'sauce-labs-bike-light')).toBeVisible();
  await expect(removeButton(page, 'sauce-labs-fleece-jacket')).toBeVisible();
  // The three products that were never touched still show "Add to cart"
  await expect(addButton(page, 'sauce-labs-backpack')).toBeVisible();
  await expect(addButton(page, 'sauce-labs-bolt-t-shirt')).toBeVisible();
  await expect(addButton(page, 'test.allthethings()-t-shirt-(red)')).toBeVisible();

  await removeButton(page, 'sauce-labs-bike-light').click();
  await removeButton(page, 'sauce-labs-fleece-jacket').click();

  // At the end the cart is empty (no badge)
  await expect(cartBadge(page)).toHaveCount(0);
  await expect(cartLink(page)).toHaveAccessibleName('Cart, empty');
});
