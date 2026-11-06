// Draft from run eb-261101-1211, scenario S6 (PASSED as an exploration, it exposed two defects). Not run against the app.
// Defects (.workflow-artifacts/expl-bot/runs/eb-261101-1211/report.md, Defects):
//   - "The checkout form accepts invalid values without any validation"
//   - "An empty cart can go through checkout to an Overview with zero totals and an enabled Finish button"
// The first part (empty submit) passed in the run and is asserted as observed. The second part asserts the CORRECT
// behaviour (whitespace, an emoji and a negative zip are rejected on step one), so it fails today and the test is
// marked as a known failure. Remove the test.fail line to make it a plain red test, or when the bug is fixed.
// Caveat: while test.fail is on, ANY failing assertion counts as the expected failure, including the first part.
// 'Finish' is never clicked (it would place an order). Nothing is created, so nothing needs cleanup.
// The scenario's last step (O'Brien-Smith / forty 9s) was skipped in the run because the page left step one, so it is not drafted.
// NOT VERIFIED: the exact error text for the second attempt (the run never saw one); only that an error element is
// shown and the URL stays on step one. [data-test="error"] was not recorded in the result block (only the alert text).
import { test, expect } from '@playwright/test';
import { BASE_URL, expectCartEmpty, login } from './helpers';

test('The checkout form rejects a whitespace-only name, an emoji last name and a negative zip', async ({ page }) => {
  test.fail(true, 'Known defect: The checkout form accepts invalid values without any validation (see report.md)');

  await login(page);
  await page.goto(`${BASE_URL}/checkout-step-one.html`);

  await expect(page.locator('[data-test="firstName"]')).toHaveValue('');
  await expect(page.locator('[data-test="lastName"]')).toHaveValue('');
  await expect(page.locator('[data-test="postalCode"]')).toHaveValue('');
  await expectCartEmpty(page);

  await page.locator('[data-test="continue"]').click();

  // Expected (passed in the run): Continue with all three fields empty keeps the URL /checkout-step-one.html and shows a non-empty message in the error container
  await expect(page).toHaveURL(/checkout-step-one\.html/);
  await expect(page.locator('[data-test="error"]')).toHaveText('Error: First Name is required');

  await page.locator('[data-test="firstName"]').fill('   ');
  await page.locator('[data-test="lastName"]').fill('😀');
  await page.locator('[data-test="postalCode"]').fill('-1');
  await page.locator('[data-test="continue"]').click();

  // Expected (correct behaviour): an error message is shown and the URL stays /checkout-step-one.html
  await expect(page).toHaveURL(/checkout-step-one\.html/);
  await expect(page.locator('[data-test="error"]')).toBeVisible();
});
