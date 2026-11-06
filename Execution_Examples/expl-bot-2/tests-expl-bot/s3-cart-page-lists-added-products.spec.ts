// Draft from run eb-261101-1111, scenario S3 (PASSED). Not run against the app.
// NOT VERIFIED: the cart page item container was not recorded; names and prices are matched by text on /cart.html.
import { test, expect } from '@playwright/test';
import { ALL_SLUGS, SLUGS, addButton, removeButton, cartBadge, cartLink, expectCartEmpty, openEmptyInventory } from './helpers';

test('The cart page lists exactly the products the shopper added and the product list matches it after returning', async ({ page }) => {
  await openEmptyInventory(page);

  await addButton(page, SLUGS.bikeLight).click();
  await addButton(page, SLUGS.fleeceJacket).click();
  await cartLink(page).click();

  // Expected: The cart page lists exactly the two added products with the same names and prices as on the product list
  await expect(page).toHaveURL(/cart\.html/);
  await expect(cartBadge(page)).toHaveText('2');
  await expect(page.getByText('Sauce Labs Bike Light')).toBeVisible();
  await expect(page.getByText('$9.99')).toBeVisible();
  await expect(page.getByText('Sauce Labs Fleece Jacket')).toBeVisible();
  await expect(page.getByText('$49.99')).toBeVisible();
  await expect(page.getByText('Sauce Labs Backpack')).toHaveCount(0);

  await removeButton(page, SLUGS.fleeceJacket).click();

  // Expected: If the cart page offers 'Remove', removing the Fleece Jacket there leaves only Sauce Labs Bike Light in the cart and the badge reads 1
  await expect(page.getByText('Sauce Labs Fleece Jacket')).toHaveCount(0);
  await expect(page.getByText('Sauce Labs Bike Light')).toBeVisible();
  await expect(cartBadge(page)).toHaveText('1');

  await page.locator('[data-test="continue-shopping"]').click();

  // Expected: Back on the product list the buttons and the badge match the cart contents
  await expect(page).toHaveURL(/inventory\.html/);
  await expect(cartBadge(page)).toHaveText('1');
  await expect(removeButton(page, SLUGS.bikeLight)).toBeVisible();
  for (const slug of ALL_SLUGS.filter((s) => s !== SLUGS.bikeLight)) {
    await expect(addButton(page, slug)).toBeVisible();
  }

  await removeButton(page, SLUGS.bikeLight).click();

  // Expected: After the final removals the badge is gone
  await expectCartEmpty(page);
  for (const slug of ALL_SLUGS) {
    await expect(addButton(page, slug)).toBeVisible();
  }
});
