// Draft from run eb-261101-1211, scenario S5 (PASSED as an exploration, it exposed a defect). Not run against the app.
// Defect: "The checkout form accepts invalid values without any validation"
//   — .workflow-artifacts/expl-bot/runs/eb-261101-1211/report.md, Defects
// This test asserts the CORRECT behaviour (hostile values are rejected on step one), so it fails today and is marked
// as a known failure. Remove the test.fail line to make it a plain red test, or when the bug is fixed.
// Caveat: while test.fail is on, ANY failing assertion counts as the expected failure, including the dialog check
// below. Keep that check in mind when you remove the test.fail line.
// 'Finish' is never clicked (it would place an order). Playwright gives each test a fresh browser context, so the
// product added here does not outlive the test.
// NOT VERIFIED: the exact error text for invalid values (the run never saw one); only that an error element is
// shown and the URL stays on step one. The [data-test="error"] locator is from the research, not from a result block.
import { test, expect } from '@playwright/test';
import { SLUGS, addButton, cartBadge, openEmptyInventory } from './helpers';

test('The checkout form rejects a script tag, a ten-thousand-character name and SQL in the zip field', async ({ page }) => {
  test.fail(true, 'Known defect: The checkout form accepts invalid values without any validation (see report.md)');

  const dialogs: string[] = [];
  page.on('dialog', async (dialog) => {
    dialogs.push(dialog.message());
    await dialog.dismiss();
  });

  await openEmptyInventory(page);

  await addButton(page, SLUGS.onesie).click();
  await expect(cartBadge(page)).toHaveText('1');
  await page.locator('[data-test="shopping-cart-link"]').click();
  await page.locator('[data-test="checkout"]').click();
  await expect(page).toHaveURL(/checkout-step-one\.html/);

  const longName = 'Ö'.repeat(10000);
  await page.locator('[data-test="firstName"]').fill('<script>alert(1)</script>');
  await page.locator('[data-test="lastName"]').fill(longName);
  await page.locator('[data-test="postalCode"]').fill("' OR '1'='1' --");
  await expect(page.locator('[data-test="lastName"]')).toHaveValue(longName);
  await page.locator('[data-test="continue"]').click();

  // Expected (passed in the run): No JavaScript dialog appears at any point
  expect(dialogs).toEqual([]);

  // Expected (correct behaviour): an error message is shown and the URL stays /checkout-step-one.html
  await expect(page).toHaveURL(/checkout-step-one\.html/);
  await expect(page.locator('[data-test="error"]')).toBeVisible();
});
