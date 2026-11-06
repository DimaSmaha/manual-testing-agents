// Shared helpers for the expl-bot drafts (run eb-261101-1211, www.saucedemo.com).
// DRAFTS: written from the tester result blocks, not run against the app.
//
// Credentials are never stored here. Set them in the environment before running:
//   SAUCEDEMO_USERNAME, SAUCEDEMO_PASSWORD
//
// NOT VERIFIED locators (not recorded in any result block; taken from the research files or from experience notes):
//   - login form: role textbox 'Username' / 'Password' and role button 'Login'
//   - [data-test="error"] on the checkout form (result block 6 only records the alert text)
//   - 'Remove' on the detail page: found by role button 'Remove' only
import { expect, Page, Locator } from '@playwright/test';

export const BASE_URL = 'https://www.saucedemo.com';

export const SLUGS = {
  backpack: 'sauce-labs-backpack',
  bikeLight: 'sauce-labs-bike-light',
  boltTShirt: 'sauce-labs-bolt-t-shirt',
  fleeceJacket: 'sauce-labs-fleece-jacket',
  onesie: 'sauce-labs-onesie',
  redTShirt: 'test.allthethings()-t-shirt-(red)',
} as const;

export const ALL_SLUGS = Object.values(SLUGS);

export async function login(page: Page): Promise<void> {
  const user = process.env.SAUCEDEMO_USERNAME;
  const pass = process.env.SAUCEDEMO_PASSWORD;
  if (!user || !pass) {
    throw new Error('Set SAUCEDEMO_USERNAME and SAUCEDEMO_PASSWORD in the environment');
  }
  await page.goto(`${BASE_URL}/`);
  await page.getByRole('textbox', { name: 'Username' }).fill(user);
  await page.getByRole('textbox', { name: 'Password' }).fill(pass);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(/inventory\.html/);
}

export const addButton = (page: Page, slug: string): Locator =>
  page.locator(`button[data-test="add-to-cart-${slug}"]`);

export const removeButton = (page: Page, slug: string): Locator =>
  page.locator(`button[data-test="remove-${slug}"]`);

export const cartBadge = (page: Page): Locator => page.locator('.shopping_cart_badge');

export const cartLink = (page: Page): Locator => page.locator('[data-test="shopping-cart-link"]');

export async function expectCartEmpty(page: Page): Promise<void> {
  await expect(cartBadge(page)).toHaveCount(0);
  await expect(cartLink(page)).toHaveAccessibleName('Cart, empty');
}

/** Start every scenario from a logged-in, empty cart on the product list. */
export async function openEmptyInventory(page: Page): Promise<void> {
  await login(page);
  await page.goto(`${BASE_URL}/inventory.html`);
  await expectCartEmpty(page);
}
