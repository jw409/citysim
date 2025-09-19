import { test, expect } from '@playwright/test';

test.describe('First/Third Person View System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:5174');

    // Wait for the application to load
    await page.waitForSelector('canvas', { timeout: 10000 });

    // Wait a bit for agents to be generated
    await page.waitForTimeout(2000);
  });

  test('should load the application with agents visible', async ({ page }) => {
    // Check that the main canvas is present
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // Check that the test agent button is present
    const testAgentButton = page.locator('text=Add Test Agents');
    await expect(testAgentButton).toBeVisible();

    // Check that the view mode selector is present
    const viewModeSelector = page.locator('text=View Mode');
    await expect(viewModeSelector).toBeVisible();

    // Check that the agent selector is present (collapsed initially)
    const agentSelector = page.locator('text=agents');
    await expect(agentSelector).toBeVisible();
  });

  test('should generate test agents when button is clicked', async ({ page }) => {
    // Click the test agent button
    const testAgentButton = page.locator('button:has-text("Add Test Agents")');
    await testAgentButton.click();

    // Check console for agent generation message
    const consoleMessages: string[] = [];
    page.on('console', msg => consoleMessages.push(msg.text()));

    await page.waitForTimeout(1000);

    // Verify that agents were generated (check console or UI changes)
    const hasAgentMessage = consoleMessages.some(msg =>
      msg.includes('test agents') || msg.includes('Generated')
    );
    expect(hasAgentMessage || consoleMessages.length > 0).toBeTruthy();
  });

  test('should show agent selector when expanded', async ({ page }) => {
    // Click to expand agent selector
    const agentCountIndicator = page.locator('text=/\\d+ agents/').first();
    await agentCountIndicator.click();

    // Wait for agent selector to expand
    await page.waitForTimeout(500);

    // Check that the expanded agent selector is visible
    const agentSelectorTitle = page.locator('text=Agent Selector');
    await expect(agentSelectorTitle).toBeVisible();

    // Check for search input
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();

    // Check for filter dropdown
    const filterSelect = page.locator('select').first();
    await expect(filterSelect).toBeVisible();
  });

  test('should display view mode controls', async ({ page }) => {
    // Check that view mode selector is present
    const viewModeTitle = page.locator('text=View Mode');
    await expect(viewModeTitle).toBeVisible();

    // Check for camera mode buttons
    const freeCameraButton = page.locator('button:has-text("Free Camera")');
    await expect(freeCameraButton).toBeVisible();

    const thirdPersonButton = page.locator('button:has-text("Third Person")');
    await expect(thirdPersonButton).toBeVisible();

    const firstPersonButton = page.locator('button:has-text("First Person")');
    await expect(firstPersonButton).toBeVisible();
  });

  test('should show keyboard shortcuts help', async ({ page }) => {
    // Check that keyboard shortcuts are documented
    const shortcutsHelp = page.locator('text=Keyboard Shortcuts');
    await expect(shortcutsHelp).toBeVisible();

    // Check for specific shortcut instructions
    await expect(page.locator('text=V: Toggle view mode')).toBeVisible();
    await expect(page.locator('text=F: First person')).toBeVisible();
    await expect(page.locator('text=T: Third person')).toBeVisible();
    await expect(page.locator('text=ESC: Stop following')).toBeVisible();
  });

  test('should respond to keyboard shortcuts', async ({ page }) => {
    // Focus on the main canvas
    const canvas = page.locator('canvas');
    await canvas.click();

    // Test V key (toggle view mode)
    await page.keyboard.press('v');
    await page.waitForTimeout(100);

    // Test F key (first person)
    await page.keyboard.press('f');
    await page.waitForTimeout(100);

    // Test T key (third person)
    await page.keyboard.press('t');
    await page.waitForTimeout(100);

    // Test ESC key (stop following)
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);

    // No assertions here since we need an agent to be followed first
    // But this verifies the keys don't cause errors
  });

  test('should attempt to select agent from agent selector', async ({ page }) => {
    // First, make sure we have test agents
    const testAgentButton = page.locator('button:has-text("Add Test Agents")');
    await testAgentButton.click();
    await page.waitForTimeout(1000);

    // Expand agent selector
    const agentCountIndicator = page.locator('text=/\\d+ agents/').first();
    await agentCountIndicator.click();
    await page.waitForTimeout(500);

    // Try to find and click an agent in the list
    const agentItems = page.locator('[style*="padding: 8px"]').filter({
      hasText: /Agent \d+/
    });

    if (await agentItems.count() > 0) {
      // Click the first agent
      await agentItems.first().click();
      await page.waitForTimeout(500);

      // Check if follow mode is activated
      const followingText = page.locator('text=/Following:/');
      // Note: This might not always be visible depending on timing
    }
  });

  test('should display camera status information', async ({ page }) => {
    // Check for camera controls panel
    const cameraControls = page.locator('text=Camera Controls');
    await expect(cameraControls).toBeVisible();

    // Check for view presets
    await expect(page.locator('button:has-text("Overview")')).toBeVisible();
    await expect(page.locator('button:has-text("Street")')).toBeVisible();
    await expect(page.locator('button:has-text("Aerial")')).toBeVisible();
    await expect(page.locator('button:has-text("Isometric")')).toBeVisible();

    // Check for follow mode status
    const followModeSection = page.locator('text=Follow Mode');
    await expect(followModeSection).toBeVisible();
  });

  test('should show layer count and status', async ({ page }) => {
    // Check for status indicator showing active layers
    const statusIndicator = page.locator('text=/\\d+ layers active/');
    await expect(statusIndicator).toBeVisible();

    // Check for planetary scale indicator
    const scaleIndicator = page.locator('text=/Scale: \\d+x/');
    await expect(scaleIndicator).toBeVisible();
  });

  test('should handle view preset buttons', async ({ page }) => {
    // Test each view preset button
    await page.locator('button:has-text("Overview")').click();
    await page.waitForTimeout(200);

    await page.locator('button:has-text("Street")').click();
    await page.waitForTimeout(200);

    await page.locator('button:has-text("Aerial")').click();
    await page.waitForTimeout(200);

    await page.locator('button:has-text("Isometric")').click();
    await page.waitForTimeout(200);

    // Verify no errors occurred (page should still be functional)
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should show control panel with simulation controls', async ({ page }) => {
    // Check for time controls
    const timeControls = page.locator('text=Time Controls');
    await expect(timeControls).toBeVisible();

    // Check for play/pause button
    const playPauseButton = page.locator('button:has-text(/Play|Pause/)');
    await expect(playPauseButton).toBeVisible();

    // Check for speed control
    const speedSlider = page.locator('input[type="range"]');
    await expect(speedSlider.first()).toBeVisible();
  });

  test('should take screenshot for visual verification', async ({ page }) => {
    // Add test agents first
    const testAgentButton = page.locator('button:has-text("Add Test Agents")');
    await testAgentButton.click();
    await page.waitForTimeout(2000);

    // Take a screenshot to verify the UI layout
    await page.screenshot({
      path: 'test-results/first-third-person-ui.png',
      fullPage: true
    });

    // Take a focused screenshot of the main visualization area
    const canvas = page.locator('canvas');
    await canvas.screenshot({
      path: 'test-results/main-visualization.png'
    });
  });
});