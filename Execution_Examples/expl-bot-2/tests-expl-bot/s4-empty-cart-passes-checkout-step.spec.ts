// Draft from run eb-261101-1211, scenario S4 (PASSED as an exploration, it exposed a defect). Not run against the app.
// Defect: "An empty cart can go through checkout to an Overview with zero totals and an enabled Finish button"
//   — .workflow-artifacts/expl-bot/runs/eb-261101-1211/report.md, Defects
// This test asserts the CORRECT behaviour (an empty cart does not get to the Overview), so it fails today and is
// marked as a known failure. Remove the test.fail line to make it a plain red test, or when the bug is fixed.
// 'Finish' is never clicked (it would place an order). Nothing is created, so nothing needs cleanup.
// NOT VERIFIED: what the app should show instead (a message on /cart.html or a blocked step one); the run only saw that
// it let the shopper through, so the test asserts only that the Overview is not reached.
import { test, expect } from '@playwright/test';
import { BASE_URL, expectCartEmpty, login } from './helpers';

test('A shopper with an empty cart cannot pass the checkout information step', async ({ page }) => {
  test.fail(true, 'Known defect: An empty cart can go through checkout to an Overview with zero totals and an enabled Finish button (see report.md)');

  await login(page);
  await page.goto(`${BASE_URL}/inventory.html`);
  await expectCartEmpty(page);

  await page.locator('[data-test="shopping-cart-link"]').click();
  await expect(page).toHaveURL(/cart\.html/);
  await page.locator('[data-test="checkout"]').click();

  // Observed in the run: the page moved to /checkout-step-one.html with no message. Continue the same way the run did.
  if (/checkout-step-one\.html/.test(page.url())) {
    await page.locator('[data-test="firstName"]').fill('eb-261101-1211');
    await page.locator('[data-test="lastName"]').fill('Empty Cart');
    await page.locator('[data-test="postalCode"]').fill('00000');
    await page.locator('[data-test="continue"]').click();
  }

  // Expected (correct behaviour): the shopper does not reach the order Overview with an empty cart.
  await expect(page).not.toHaveURL(/checkout-step-two\.html/);
});
