import { test, expect } from '@playwright/test';

test.describe('CitySim Application', () => {
  test('should load the main page', async ({ page }) => {
    await page.goto('/');

    // Check that the page loads
    await expect(page).toHaveTitle(/UrbanSynth/);

    // Look for main app container
    await expect(page.locator('#root')).toBeVisible();
  });

  test('should display the cityscape canvas', async ({ page }) => {
    await page.goto('/');

    // Wait for the app to load
    await page.waitForTimeout(2000);

    // Check for canvas element (deck.gl creates canvas)
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should have camera controls visible', async ({ page }) => {
    await page.goto('/');

    // Wait for the app to load
    await page.waitForTimeout(2000);

    // Check for camera controls panel
    await expect(page.getByText('Camera Controls')).toBeVisible();
    await expect(page.getByText('View Presets:')).toBeVisible();
  });
});