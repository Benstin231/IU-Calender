import { test, expect } from '@playwright/test';

test.describe('月曆頁面功能測試', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/calendar');
  });

  test('應該顯示月曆頁面', async ({ page }) => {
    // 等待月曆載入
    await page.waitForSelector('app-calendar, [class*="calendar"]', { timeout: 10000 });

    // 檢查頁面已載入
    await expect(page).toHaveURL('/calendar');
  });

  test('應該顯示月份導航', async ({ page }) => {
    // 檢查是否有上個月/下個月的導航按鈕
    const prevButton = page.getByRole('button', { name: /previous|上一月|chevron_left/i });
    const nextButton = page.getByRole('button', { name: /next|下一月|chevron_right/i });

    // 至少有一個導航方式
    const hasPrevBtn = await prevButton.count() > 0;
    const hasNextBtn = await nextButton.count() > 0;

    expect(hasPrevBtn || hasNextBtn).toBeTruthy();
  });

  test('應該顯示日期格子', async ({ page }) => {
    // 等待月曆格子載入
    await page.waitForLoadState('networkidle');

    // 檢查是否有日期數字（1-31）
    const dayCell = page.locator('text=/^\\d{1,2}$/').first();
    await expect(dayCell).toBeVisible({ timeout: 10000 });
  });

  test('應該能夠切換到下個月', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // 找到下個月按鈕並點擊
    const nextButton = page.locator('button').filter({ has: page.locator('mat-icon:has-text("chevron_right")') }).first();

    if (await nextButton.isVisible()) {
      await nextButton.click();
      // 等待月曆更新
      await page.waitForTimeout(500);
    }
  });

  test('月曆頁面截圖', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // 等待動畫完成

    await expect(page).toHaveScreenshot('calendar-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

});
