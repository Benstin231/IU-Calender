# Spotify API 設定指南

本文件說明如何設定 Spotify API 以自動抓取 IU 的專輯發行資訊。

## 前置需求

1. Spotify 帳號（免費或付費皆可）
2. Spotify Developer 帳號

## 設定步驟

### 1. 建立 Spotify Developer 應用程式

1. 前往 [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. 使用你的 Spotify 帳號登入
3. 點擊 **Create App** 按鈕
4. 填寫應用程式資訊：
   - **App name**: IU Calendar（或任意名稱）
   - **App description**: 自動抓取 IU 專輯發行資訊
   - **Redirect URIs**: `http://localhost:4200/callback`（本地開發用）
   - 勾選同意條款
5. 點擊 **Save**

### 2. 取得 API 憑證

1. 在應用程式頁面，點擊 **Settings**
2. 在 **Basic Information** 區塊：
   - 複製 **Client ID**
   - 點擊 **View client secret** 並複製 **Client Secret**

### 3. 設定環境變數

編輯 `src/environments/environment.ts`：

```typescript
export const environment = {
  production: false,
  spotify: {
    clientId: 'YOUR_CLIENT_ID_HERE',      // 貼上你的 Client ID
    clientSecret: 'YOUR_CLIENT_SECRET_HERE', // 貼上你的 Client Secret
    tokenEndpoint: 'https://accounts.spotify.com/api/token',
    apiBaseUrl: 'https://api.spotify.com/v1',
    artistId: '3HqSLMAZ3g3d5poNaI7GOU'    // IU 的 Spotify Artist ID
  }
};
```

### 4. 生產環境設定

編輯 `src/environments/environment.prod.ts` 並填入相同的憑證。

**⚠️ 安全警告**：
- 不要將 Client Secret 提交到版本控制系統
- 建議在 `.gitignore` 中加入 `**/environment.ts` 和 `**/environment.prod.ts`
- 生產環境建議使用環境變數或後端代理

## 使用方式

1. 啟動應用程式：
   ```bash
   ng serve
   ```

2. 在瀏覽器中開啟 `http://localhost:4200`

3. 點擊導航列的「專輯」

4. 點擊「抓取專輯資料」按鈕

5. 系統會自動：
   - 使用 Client Credentials Flow 取得 Access Token
   - 呼叫 Spotify API 抓取所有 IU 的專輯
   - 處理分頁以取得完整資料
   - 顯示專輯列表

## API 限制

- **Access Token 有效期**: 1 小時（3600 秒）
- **Rate Limits**: 依據 Spotify 官方政策
- **市場**: 預設為台灣市場（TW）

## 功能特色

- ✅ 自動 Token 管理（過期自動更新）
- ✅ 分頁處理（抓取所有專輯）
- ✅ 專輯類型篩選（專輯/單曲/合輯）
- ✅ 搜尋功能
- ✅ 統計資訊
- ✅ 轉換為 IUEvent 格式（可整合至行事曆）

## 資料轉換

SpotifyService 提供 `convertToEvents()` 方法，可將專輯資料轉換為 IUEvent 格式：

```typescript
const spotifyService = inject(SpotifyService);
const events = spotifyService.convertToEvents()();
```

## 疑難排解

### 401 Unauthorized
- 檢查 Client ID 和 Client Secret 是否正確
- 確認憑證沒有多餘的空格

### 403 Forbidden
- 檢查你的 Spotify Developer 帳號狀態
- 確認應用程式在 Dashboard 中處於啟用狀態

### 429 Too Many Requests
- 已超過 API 請求限制
- 等待一段時間後再試

### CORS 錯誤
- Spotify API 支援 CORS，通常不會有問題
- 如果遇到問題，考慮使用後端代理

## 未來擴展

- [ ] 後端代理以保護 Client Secret
- [ ] 自動定期更新專輯資料
- [ ] 新專輯發行通知
- [ ] 與行事曆事件自動同步
- [ ] 專輯詳細資訊（曲目列表）

## 相關連結

- [Spotify Web API 文檔](https://developer.spotify.com/documentation/web-api)
- [Client Credentials Flow](https://developer.spotify.com/documentation/web-api/tutorials/client-credentials-flow)
- [Get Artist's Albums API](https://developer.spotify.com/documentation/web-api/reference/get-an-artists-albums)
- [IU Spotify 頁面](https://open.spotify.com/artist/3HqSLMAZ3g3d5poNaI7GOU)
