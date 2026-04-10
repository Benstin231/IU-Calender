import { test, expect } from '@playwright/test';

test.describe('專輯頁面功能測試', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/albums');
  });

  test('應該顯示專輯頁面', async ({ page }) => {
    await expect(page).toHaveURL('/albums');
  });

  test('應該顯示專輯列表或載入狀態', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // 檢查是否有專輯卡片或載入中訊息
    const albumCard = page.locator('mat-card').first();
    const loadingSpinner = page.locator('mat-spinner');

    const hasAlbums = await albumCard.count() > 0;
    const isLoading = await loadingSpinner.count() > 0;

    // 應該顯示專輯或正在載入
    expect(hasAlbums || isLoading).toBeTruthy();
  });

  test('專輯頁面截圖', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('albums-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

});
