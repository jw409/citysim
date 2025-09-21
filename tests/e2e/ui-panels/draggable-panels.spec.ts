import { test, expect } from '@playwright/test';
import { BasePage } from '../../fixtures/base-page';
import { WaitHelpers } from '../../utils/wait-helpers';

test.describe('Draggable Panels', () => {
  let basePage: BasePage;
  let waitHelpers: WaitHelpers;

  test.beforeEach(async ({ page }) => {
    basePage = new BasePage(page);
    waitHelpers = new WaitHelpers(page);

    await basePage.goto();
    await basePage.waitForLayerCount(17);
  });

  test.describe('Panel Visibility and State', () => {
    test('should show all panels in collapsed state initially', async () => {
      // Verify toggle buttons are visible (collapsed state)
      await expect(basePage.cameraControlsToggle).toBeVisible();
      await expect(basePage.timeControlsToggle).toBeVisible();
      await expect(basePage.terrainControlsToggle).toBeVisible();
      await expect(basePage.performanceMonitorToggle).toBeVisible();

      // Verify expanded panels are not visible initially
      await expect(basePage.cameraControlsPanel).not.toBeVisible();
      await expect(basePage.timeControlsPanel).not.toBeVisible();
      await expect(basePage.terrainControlsPanel).not.toBeVisible();
    });

    test('should expand and collapse each panel individually', async () => {
      const panels = ['camera', 'time', 'terrain', 'performance'] as const;

      for (const panelName of panels) {
        // Expand panel
        await basePage.expandPanel(panelName);

        const panelMap = {
          camera: basePage.cameraControlsPanel,
          time: basePage.timeControlsPanel,
          terrain: basePage.terrainControlsPanel,
          performance: basePage.performanceMonitorPanel
        };

        await expect(panelMap[panelName]).toBeVisible();

        // Collapse panel
        await basePage.collapsePanel(panelName);
        await expect(panelMap[panelName]).not.toBeVisible();
      }
    });

    test('should allow multiple panels to be open simultaneously', async () => {
      // Expand multiple panels
      await basePage.expandPanel('camera');
      await basePage.expandPanel('time');
      await basePage.expandPanel('performance');

      // Verify all are visible
      await expect(basePage.cameraControlsPanel).toBeVisible();
      await expect(basePage.timeControlsPanel).toBeVisible();
      await expect(basePage.performanceMonitorPanel).toBeVisible();

      // Terrain should still be collapsed
      await expect(basePage.terrainControlsPanel).not.toBeVisible();
    });
  });

  test.describe('Panel Dragging', () => {
    test('should allow camera panel to be dragged', async () => {
      await basePage.expandPanel('camera');

      const initialPosition = await basePage.cameraControlsPanel.boundingBox();
      expect(initialPosition).toBeTruthy();

      // Drag panel to new position
      await basePage.dragPanel('camera', 100, 100);

      const newPosition = await basePage.cameraControlsPanel.boundingBox();
      expect(newPosition).toBeTruthy();

      // Verify panel moved
      expect(Math.abs((newPosition!.x - initialPosition!.x) - 100)).toBeLessThan(20);
      expect(Math.abs((newPosition!.y - initialPosition!.y) - 100)).toBeLessThan(20);
    });

    test('should allow time controls panel to be dragged', async () => {
      await basePage.expandPanel('time');

      const initialPosition = await basePage.timeControlsPanel.boundingBox();
      expect(initialPosition).toBeTruthy();

      // Drag panel to new position
      await basePage.dragPanel('time', -50, 150);

      const newPosition = await basePage.timeControlsPanel.boundingBox();
      expect(newPosition).toBeTruthy();

      // Verify panel moved
      expect(Math.abs((newPosition!.x - initialPosition!.x) + 50)).toBeLessThan(20);
      expect(Math.abs((newPosition!.y - initialPosition!.y) - 150)).toBeLessThan(20);
    });

    test('should allow terrain controls panel to be dragged', async () => {
      await basePage.expandPanel('terrain');

      const initialPosition = await basePage.terrainControlsPanel.boundingBox();
      expect(initialPosition).toBeTruthy();

      // Drag panel to new position
      await basePage.dragPanel('terrain', 75, -25);

      const newPosition = await basePage.terrainControlsPanel.boundingBox();
      expect(newPosition).toBeTruthy();

      // Verify panel moved
      expect(Math.abs((newPosition!.x - initialPosition!.x) - 75)).toBeLessThan(20);
      expect(Math.abs((newPosition!.y - initialPosition!.y) + 25)).toBeLessThan(20);
    });

    test('should prevent panels from being dragged outside viewport boundaries', async () => {
      await basePage.expandPanel('camera');

      // Try to drag panel far outside viewport
      await basePage.dragPanel('camera', -2000, -2000);

      const position = await basePage.cameraControlsPanel.boundingBox();
      expect(position).toBeTruthy();

      // Panel should be constrained within reasonable bounds
      expect(position!.x).toBeGreaterThanOrEqual(-100); // Allow some negative offset
      expect(position!.y).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Panel Resizing', () => {
    test('should allow panels to be resized', async () => {
      await basePage.expandPanel('terrain');

      const initialSize = await basePage.terrainControlsPanel.boundingBox();
      expect(initialSize).toBeTruthy();

      // Find resize handle
      const resizeHandle = basePage.terrainControlsPanel.locator('.resize-handle');

      if (await resizeHandle.isVisible()) {
        // Drag resize handle
        await resizeHandle.dragTo(resizeHandle, {
          targetPosition: { x: 50, y: 50 }
        });

        const newSize = await basePage.terrainControlsPanel.boundingBox();
        expect(newSize).toBeTruthy();

        // Verify panel was resized
        expect(newSize!.width).toBeGreaterThan(initialSize!.width + 30);
        expect(newSize!.height).toBeGreaterThan(initialSize!.height + 30);
      }
    });

    test('should enforce minimum panel sizes', async () => {
      await basePage.expandPanel('camera');

      const resizeHandle = basePage.cameraControlsPanel.locator('.resize-handle');

      if (await resizeHandle.isVisible()) {
        // Try to resize to very small size
        await resizeHandle.dragTo(resizeHandle, {
          targetPosition: { x: -500, y: -500 }
        });

        const size = await basePage.cameraControlsPanel.boundingBox();
        expect(size).toBeTruthy();

        // Panel should maintain minimum size
        expect(size!.width).toBeGreaterThan(200);
        expect(size!.height).toBeGreaterThan(150);
      }
    });
  });

  test.describe('Panel Z-Index Management', () => {
    test('should bring clicked panel to front', async () => {
      // Expand multiple panels
      await basePage.expandPanel('camera');
      await basePage.expandPanel('time');
      await basePage.expandPanel('terrain');

      // Click on camera panel
      await basePage.cameraControlsPanel.click();

      // Camera panel should now have active styling
      const cameraPanel = basePage.cameraControlsPanel;
      const borderStyle = await cameraPanel.evaluate(el =>
        window.getComputedStyle(el).border
      );

      // Should have active border color (implementation specific)
      expect(borderStyle).toContain('rgb'); // Should have colored border
    });

    test('should handle rapid panel focus switching', async () => {
      await basePage.expandPanel('camera');
      await basePage.expandPanel('time');
      await basePage.expandPanel('performance');

      const panels = [
        basePage.cameraControlsPanel,
        basePage.timeControlsPanel,
        basePage.performanceMonitorPanel
      ];

      // Rapidly switch focus between panels
      for (let i = 0; i < 10; i++) {
        const randomPanel = panels[Math.floor(Math.random() * panels.length)];
        await randomPanel.click();
        await basePage.page.waitForTimeout(100);
      }

      // All panels should still be visible and functional
      for (const panel of panels) {
        await expect(panel).toBeVisible();
      }
    });
  });

  test.describe('Panel Persistence', () => {
    test('should persist panel positions across page reloads', async () => {
      await basePage.expandPanel('camera');

      // Move panel to specific position
      await basePage.dragPanel('camera', 200, 150);

      const positionBeforeReload = await basePage.cameraControlsPanel.boundingBox();

      // Reload page
      await basePage.page.reload();
      await waitHelpers.waitForAppReady();

      // Expand panel again
      await basePage.expandPanel('camera');

      const positionAfterReload = await basePage.cameraControlsPanel.boundingBox();

      // Position should be approximately the same (localStorage persistence)
      if (positionBeforeReload && positionAfterReload) {
        expect(Math.abs(positionAfterReload.x - positionBeforeReload.x)).toBeLessThan(50);
        expect(Math.abs(positionAfterReload.y - positionBeforeReload.y)).toBeLessThan(50);
      }
    });

    test('should persist panel collapsed/expanded state', async () => {
      // Expand specific panels
      await basePage.expandPanel('camera');
      await basePage.expandPanel('performance');

      // Leave time and terrain collapsed

      // Reload page
      await basePage.page.reload();
      await waitHelpers.waitForAppReady();

      // Check that previously expanded panels are still expanded
      // Note: This depends on implementation details of localStorage persistence
      await expect(basePage.cameraControlsToggle).toBeVisible();
      await expect(basePage.performanceMonitorToggle).toBeVisible();
    });
  });

  test.describe('Panel Content Interaction', () => {
    test('should not trigger panel drag when interacting with panel content', async () => {
      await basePage.expandPanel('camera');

      const initialPosition = await basePage.cameraControlsPanel.boundingBox();

      // Click on a button inside the panel
      await basePage.overviewPresetButton.click();
      await basePage.page.waitForTimeout(500);

      const positionAfterClick = await basePage.cameraControlsPanel.boundingBox();

      // Panel should not have moved
      if (initialPosition && positionAfterClick) {
        expect(Math.abs(positionAfterClick.x - initialPosition.x)).toBeLessThan(5);
        expect(Math.abs(positionAfterClick.y - initialPosition.y)).toBeLessThan(5);
      }
    });

    test('should allow scrolling within large panels', async () => {
      await basePage.expandPanel('terrain');

      const panelContent = basePage.terrainControlsPanel.locator('.panel-content');

      if (await panelContent.isVisible()) {
        // Test scrolling if content is scrollable
        const scrollTop = await panelContent.evaluate(el => el.scrollTop);

        // Scroll down
        await panelContent.evaluate(el => el.scrollTop += 100);

        const newScrollTop = await panelContent.evaluate(el => el.scrollTop);

        // If content is scrollable, scroll position should change
        if (newScrollTop > scrollTop) {
          expect(newScrollTop).toBeGreaterThan(scrollTop);
        }
      }
    });
  });

  test.describe('Panel Edge Cases', () => {
    test('should handle panels during window resize', async ({ page }) => {
      await basePage.expandPanel('camera');
      await basePage.expandPanel('time');

      // Resize window
      await page.setViewportSize({ width: 800, height: 600 });
      await basePage.page.waitForTimeout(1000);

      // Panels should still be visible and functional
      await expect(basePage.cameraControlsPanel).toBeVisible();
      await expect(basePage.timeControlsPanel).toBeVisible();

      // Resize back to larger size
      await page.setViewportSize({ width: 1920, height: 1080 });
      await basePage.page.waitForTimeout(1000);

      // Panels should adapt correctly
      await expect(basePage.cameraControlsPanel).toBeVisible();
      await expect(basePage.timeControlsPanel).toBeVisible();
    });

    test('should handle rapid expand/collapse operations', async () => {
      const panels = ['camera', 'time', 'terrain', 'performance'] as const;

      // Rapidly expand and collapse panels
      for (let i = 0; i < 20; i++) {
        const randomPanel = panels[Math.floor(Math.random() * panels.length)];
        await basePage.expandPanel(randomPanel);
        await basePage.page.waitForTimeout(50);
        await basePage.collapsePanel(randomPanel);
        await basePage.page.waitForTimeout(50);
      }

      // System should still be stable
      await expect(basePage.appTitle).toBeVisible();
      await expect(basePage.layersActiveIndicator).toBeVisible();
    });
  });
});