import { test, expect } from '@playwright/test';

/**
 * 視覺回歸測試
 * 這些測試會截取頁面截圖並與基準圖片比對
 * 第一次執行會建立基準圖片
 */
test.describe('視覺回歸測試', () => {

  test('首頁 - 桌面版', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('home-desktop.png', {
      fullPage: true,
      animations: 'disabled',
      mask: [
        // 遮蔽動態內容（如日期、統計數字）
        page.locator('[data-testid="dynamic-content"]')
      ]
    });
  });

  test('首頁 - 平板版', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('home-tablet.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('首頁 - 手機版', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('home-mobile.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('月曆頁面 - 桌面版', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('calendar-desktop.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('專輯頁面 - 桌面版', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/albums');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('albums-desktop.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('深色模式 - 首頁', async ({ page }) => {
    // 模擬深色模式偏好
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('home-dark-mode.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

});
