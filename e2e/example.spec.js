import { test, expect } from '@playwright/test';

test('homepage loads successfully', async ({ page }) => {
  // Use domcontentloaded so third-party tracking scripts/ads don't hold the test timeout
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  // Verify the page loads without errors
  await expect(page).toHaveTitle(/.+/);
});
