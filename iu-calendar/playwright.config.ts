import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 配置
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // 測試檔案目錄
  testDir: './e2e',

  // 測試執行設定
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,

  // 報告格式
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],

  // 共用設定
  use: {
    // 基礎 URL
    baseURL: 'http://localhost:4200',

    // 追蹤設定（失敗時收集）
    trace: 'on-first-retry',

    // 螢幕截圖設定
    screenshot: 'only-on-failure',

    // 視頻錄製
    video: 'on-first-retry',
  },

  // 測試專案（不同瀏覽器）
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // 手機裝置測試
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // 開發伺服器設定
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env['CI'],
    timeout: 120 * 1000,
  },

  // 輸出目錄
  outputDir: 'test-results',

  // 期望設定
  expect: {
    // 截圖比對容差
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.05,
    },
  },
});
