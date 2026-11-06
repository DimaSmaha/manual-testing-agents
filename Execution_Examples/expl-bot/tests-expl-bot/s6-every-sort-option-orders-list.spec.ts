// Draft from run eb-261106-1157, scenario S6. Not run against the app yet.
import { test, expect } from '@playwright/test';
import { itemNames, itemPrices, login, sortSelect } from './helpers';

const NAMES_A_TO_Z = [
  'Sauce Labs Backpack',
  'Sauce Labs Bike Light',
  'Sauce Labs Bolt T-Shirt',
  'Sauce Labs Fleece Jacket',
  'Sauce Labs Onesie',
  'Test.allTheThings() T-Shirt (Red)',
];
const PRICES_LOW_TO_HIGH = ['$7.99', '$9.99', '$15.99', '$15.99', '$29.99', '$49.99'];

test('Every sort option orders the product list correctly', async ({ page }) => {
  await login(page);

  // Name (A to Z) is the default
  await expect(itemNames(page)).toHaveText(NAMES_A_TO_Z);

  await sortSelect(page).selectOption('Name (Z to A)');
  // Name (Z to A): the exact reverse of the above
  await expect(itemNames(page)).toHaveText([...NAMES_A_TO_Z].reverse());
  await expect(itemNames(page)).toHaveCount(6);

  await sortSelect(page).selectOption('Price (low to high)');
  // Price (low to high): $7.99, $9.99, $15.99, $15.99, $29.99, $49.99 (the two $15.99 items in either order)
  await expect(itemPrices(page)).toHaveText(PRICES_LOW_TO_HIGH);
  await expect(itemNames(page)).toHaveCount(6);

  await sortSelect(page).selectOption('Price (high to low)');
  // Price (high to low): the reverse price order
  await expect(itemPrices(page)).toHaveText([...PRICES_LOW_TO_HIGH].reverse());
  await expect(itemNames(page)).toHaveCount(6);

  await sortSelect(page).selectOption('Name (A to Z)');
  // The dropdown shows the selected option each time and always 6 products are listed
  await expect(page.locator('[data-test="active-option"]')).toHaveText('Name (A to Z)');
  await expect(itemNames(page)).toHaveText(NAMES_A_TO_Z);
  await expect(itemNames(page)).toHaveCount(6);
});
