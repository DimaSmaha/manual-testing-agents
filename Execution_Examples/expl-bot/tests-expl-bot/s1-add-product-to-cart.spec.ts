// Draft from run eb-261106-1157, scenario S1. Not run against the app yet.
import { test, expect } from '@playwright/test';
import { addButton, cartBadge, cartLink, login, removeButton } from './helpers';

const PRODUCTS = [
  'sauce-labs-backpack',
  'sauce-labs-bike-light',
  'sauce-labs-bolt-t-shirt',
  'sauce-labs-fleece-jacket',
  'sauce-labs-onesie',
  'test.allthethings()-t-shirt-(red)',
];

test('A shopper adds a product to the cart and sees the cart reflect it', async ({ page }) => {
  await login(page);
  await expect(cartLink(page)).toHaveAccessibleName('Cart, empty');
  await expect(cartBadge(page)).toHaveCount(0);

  await addButton(page, 'sauce-labs-backpack').click();

  // The button on "Sauce Labs Backpack" changes from "Add to cart" to "Remove"
  await expect(removeButton(page, 'sauce-labs-backpack')).toBeVisible();
  await expect(addButton(page, 'sauce-labs-backpack')).toHaveCount(0);
  // The cart shows a badge with 1 and the cart link is no longer named "Cart, empty"
  await expect(cartBadge(page)).toHaveText('1');
  await expect(cartLink(page)).not.toHaveAccessibleName('Cart, empty');
  // The other 5 products still show "Add to cart"
  for (const slug of PRODUCTS.filter((s) => s !== 'sauce-labs-backpack')) {
    await expect(addButton(page, slug)).toBeVisible();
  }

  await removeButton(page, 'sauce-labs-backpack').click();

  // After Remove the button is "Add to cart" again and the cart is empty (no badge)
  await expect(addButton(page, 'sauce-labs-backpack')).toBeVisible();
  await expect(cartBadge(page)).toHaveCount(0);
  await expect(cartLink(page)).toHaveAccessibleName('Cart, empty');
});
