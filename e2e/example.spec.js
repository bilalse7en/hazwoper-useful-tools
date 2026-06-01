import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/HAZWOPER/);
});

test('onboarding works', async ({ page }) => {
  await page.goto('/');

  // Wait for the environmental setup modal to appear
  const modalHeader = page.getByText(/Engine Calibration/i);
  await expect(modalHeader).toBeVisible({ timeout: 10000 });

  // Step 1: Click High Performance
  await page.getByText(/High Performance/i).click();
  await page.getByText(/Confirm Capabilities/i).click();

  // Step 2: Click Next Sequence
  await page.getByRole('button', { name: /Next Sequence/i }).click();

  // Step 3: Enter Command Hub
  await page.getByRole('button', { name: /Enter Command Hub/i }).click();

  // Verify modal is gone
  await expect(modalHeader).not.toBeVisible();
});
