// Draft from run eb-261101-1111, scenario S5 (PASSED). Not run against the app.
// Observation from the run (not asserted here): the chosen sort resets to Name (A to Z) after every detail visit.
// NOT VERIFIED: [data-test="inventory-item-name"] / [data-test="inventory-item-price"] come from the experience file, not from a result block.
import { test, expect, Page } from '@playwright/test';
import { openEmptyInventory } from './helpers';

async function expectDropdownMatchesCardOrder(page: Page) {
  const value = await page.locator('[data-test="product-sort-container"]').inputValue();
  const names = await page.locator('[data-test="inventory-item-name"]').allTextContents();
  const prices = (await page.locator('[data-test="inventory-item-price"]').allTextContents()).map((p) => Number(p.replace('$', '')));
  const sortedNames = [...names].sort((a, b) => a.localeCompare(b));
  const ascending = [...prices].sort((a, b) => a - b);
  if (value === 'az') expect(names).toEqual(sortedNames);
  else if (value === 'za') expect(names).toEqual([...sortedNames].reverse());
  else if (value === 'lohi') expect(prices).toEqual(ascending);
  else if (value === 'hilo') expect(prices).toEqual([...ascending].reverse());
  else throw new Error(`Unknown sort value: ${value}`);
}

test('The sort the shopper chose stays consistent with the list after visiting product detail pages', async ({ page }) => {
  await openEmptyInventory(page);

  await page.locator('[data-test="product-sort-container"]').selectOption('lohi');

  // Sauce Labs Bike Light: item-0, image link
  await page.locator('a[data-test="item-0-img-link"]').click();
  // Expected: Each detail page shows the name and price of the product that was clicked
  await expect(page).toHaveURL(/inventory-item\.html\?id=0/);
  await expect(page.getByText('Sauce Labs Bike Light')).toBeVisible();
  await expect(page.getByText('$9.99')).toBeVisible();

  await page.locator('[data-test="back-to-products"]').click();
  // Expected: After each return the sort dropdown label matches the order of the cards on the list
  await expectDropdownMatchesCardOrder(page);

  // Sauce Labs Backpack: item-4, title link
  await page.locator('a[data-test="item-4-title-link"]').click();
  await expect(page).toHaveURL(/inventory-item\.html\?id=4/);
  await expect(page.getByText('Sauce Labs Backpack')).toBeVisible();
  await expect(page.getByText('$29.99')).toBeVisible();

  await page.goBack();
  await expectDropdownMatchesCardOrder(page);

  await page.locator('[data-test="product-sort-container"]').selectOption('az');
  await expectDropdownMatchesCardOrder(page);
});
