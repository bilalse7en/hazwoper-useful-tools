import { test, expect } from '@playwright/test';

test('homepage loads successfully', async ({ page }) => {
  await page.goto('/');

  // Verify the page loads without errors
  await expect(page).toHaveTitle(/.+/);
});
