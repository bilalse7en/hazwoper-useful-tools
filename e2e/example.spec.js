import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/HAZWOPER/);
});

test('onboarding works', async ({ page }) => {
  await page.goto('/');

  // Check if welcome message exists
  const welcome = page.getByText(/Welcome/i);
  if (await welcome.isVisible()) {
    // Perform onboarding actions
  }
});
