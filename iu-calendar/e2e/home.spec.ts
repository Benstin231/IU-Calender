import { test, expect } from '@playwright/test';

test.describe('首頁功能測試', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('應該顯示首頁標題', async ({ page }) => {
    // 檢查主標題
    await expect(page.locator('h1')).toContainText('IU Calendar');

    // 檢查副標題
    await expect(page.getByText('探索 IU（李知恩）的歷史足跡')).toBeVisible();
  });

  test('應該顯示導航按鈕', async ({ page }) => {
    // 查看月曆按鈕
    const calendarBtn = page.getByRole('link', { name: /查看月曆/i });
    await expect(calendarBtn).toBeVisible();

    // 專輯資料庫按鈕
    const albumsBtn = page.getByRole('link', { name: /專輯資料庫/i });
    await expect(albumsBtn).toBeVisible();
  });

  test('應該顯示 YouTube 區塊', async ({ page }) => {
    // 檢查 YouTube 區塊標題
    await expect(page.getByText('IU 官方 YouTube 頻道')).toBeVisible();

    // 檢查是否有載入按鈕或內容
    const youtubeSection = page.locator('mat-card').filter({ hasText: 'YouTube' });
    await expect(youtubeSection).toBeVisible();
  });

  test('應該顯示「歷史上的今天」區塊', async ({ page }) => {
    await expect(page.getByText('歷史上的今天')).toBeVisible();
  });

  test('應該顯示「關於 IU」區塊', async ({ page }) => {
    await expect(page.getByText('關於 IU')).toBeVisible();

    // 檢查基本資料
    await expect(page.getByText('李知恩')).toBeVisible();
    await expect(page.getByText('1993年5月16日')).toBeVisible();
  });

  test('應該顯示事件類型列表', async ({ page }) => {
    await expect(page.getByText('事件類型')).toBeVisible();

    // 檢查各種事件類型
    await expect(page.getByText('發行')).toBeVisible();
    await expect(page.getByText('演唱會')).toBeVisible();
    await expect(page.getByText('獲獎')).toBeVisible();
  });

  test('應該顯示資料統計', async ({ page }) => {
    await expect(page.getByText('資料統計')).toBeVisible();
    await expect(page.getByText('總事件數')).toBeVisible();
    await expect(page.getByText('活躍年數')).toBeVisible();
    await expect(page.getByText('出道日期')).toBeVisible();
  });

  test('點擊「查看月曆」應該導航到月曆頁面', async ({ page }) => {
    await page.getByRole('link', { name: /查看月曆/i }).click();
    await expect(page).toHaveURL('/calendar');
  });

  test('點擊「專輯資料庫」應該導航到專輯頁面', async ({ page }) => {
    await page.getByRole('link', { name: /專輯資料庫/i }).click();
    await expect(page).toHaveURL('/albums');
  });

  test('首頁截圖比對', async ({ page }) => {
    // 等待頁面完全載入
    await page.waitForLoadState('networkidle');

    // 截取首頁截圖
    await expect(page).toHaveScreenshot('home-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

});
