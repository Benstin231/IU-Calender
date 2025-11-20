# Instagram 爬蟲功能設定指南

本指南將幫助你設定並啟用 IU Calendar 的 Instagram 爬蟲功能。

## 📋 前置需求

- ✅ Python 3.11+ 已安裝
- ✅ Node.js 18+ 已安裝
- ✅ Google Gemini API Key（免費申請）

## 🚀 快速開始

### 步驟 1: 取得 Google Gemini API Key

1. 前往 https://ai.google.dev/
2. 點擊「Get API Key」
3. 使用 Google 帳號登入
4. 創建新的 API Key
5. 複製 API Key（格式：AIza...）

**免費額度：每月 1500 次請求**（足夠每日同步使用）

### 步驟 2: 安裝 Python 依賴

```bash
cd instagram-scraper
pip3 install -r requirements.txt
```

或使用 pip 直接安裝：

```bash
pip3 install --user instaloader python-dotenv
```

### 步驟 3: 設定環境變數

編輯 `spotify-proxy/.env` 文件，加入以下設定：

```env
# Google Gemini API
GEMINI_API_KEY=你的_Gemini_API_Key

# Instagram 設定
INSTAGRAM_TARGET_USERNAME=iu_taiwau
INSTAGRAM_MAX_POSTS=50
```

### 步驟 4: 更新資料庫 Schema

由於新增了 `endorsement` 類型和其他欄位，需要更新資料庫：

```bash
cd spotify-proxy

# 創建 migration
npx prisma migrate dev --name add-instagram-support

# 或直接推送 schema 變更（開發環境）
npx prisma db push
```

### 步驟 5: 測試爬蟲

手動測試 Python 爬蟲：

```bash
cd instagram-scraper
export INSTAGRAM_TARGET_USERNAME=iu_taiwau
export INSTAGRAM_MAX_POSTS=10
python3 scraper.py
```

應該會輸出 JSON 格式的貼文資料。

### 步驟 6: 啟動後端服務

```bash
cd spotify-proxy
npm start
```

你應該會看到：

```
╔════════════════════════════════════════════╗
║   IU Calendar Backend Service              ║
║   Port: 3000                               ║
║   Database: SQLite                         ║
╚════════════════════════════════════════════╝

API Endpoints:
  ...
  POST   /api/instagram/sync      - 手動觸發 Instagram 同步
  GET    /api/instagram/status    - 查看 Instagram 同步狀態
  GET    /api/instagram/posts     - 查詢 Instagram 貼文
  ...
```

### 步驟 7: 手動觸發同步

測試 API 是否正常：

```bash
# 使用 curl
curl -X POST http://localhost:3000/api/instagram/sync \
  -H "Content-Type: application/json" \
  -d '{"useAI": true, "maxPosts": 10}'

# 查看結果
curl http://localhost:3000/api/instagram/status
```

如果成功，你應該會看到：

```json
{
  "success": true,
  "count": 10,
  "total": 10,
  "message": "Successfully synced 10 Instagram posts"
}
```

## 📊 使用方式

### API 調用範例

#### 1. 同步 Instagram 貼文

```javascript
// 使用 AI 分類（推薦）
fetch('http://localhost:3000/api/instagram/sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    useAI: true,
    maxPosts: 50
  })
})

// 使用關鍵字分類（不消耗 API 額度）
fetch('http://localhost:3000/api/instagram/sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    useAI: false,
    maxPosts: 50
  })
})
```

#### 2. 查詢貼文

```javascript
// 查詢所有 Instagram 貼文
fetch('http://localhost:3000/api/instagram/posts')

// 過濾特定類型
fetch('http://localhost:3000/api/instagram/posts?type=endorsement&limit=20')

// 分頁查詢
fetch('http://localhost:3000/api/instagram/posts?limit=20&offset=40')
```

#### 3. 查看同步狀態

```javascript
fetch('http://localhost:3000/api/instagram/status')
  .then(res => res.json())
  .then(data => {
    console.log('最後同步時間:', data.lastSync.syncedAt)
    console.log('同步筆數:', data.lastSync.itemsProcessed)
    console.log('各類型統計:', data.stats.byType)
  })
```

### 自動定時同步

後端服務已設定 **每天凌晨 4:00** 自動執行 Instagram 同步。

查看定時任務日誌：

```bash
# 後端服務啟動後，會顯示 cron 日誌
[CRON] Starting daily Instagram sync...
[Instagram] Fetched 50 posts
[Gemini] Classified 1/50: concert
[Gemini] Classified 2/50: endorsement
...
[CRON] Instagram sync completed: 45 posts synced
```

## 🎨 前端整合

### 在 Angular 中使用

```typescript
// src/app/services/instagram.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class InstagramService {
  private apiUrl = 'http://localhost:3000/api/instagram';

  constructor(private http: HttpClient) {}

  syncPosts(options = { useAI: true, maxPosts: 50 }) {
    return this.http.post(`${this.apiUrl}/sync`, options);
  }

  getStatus() {
    return this.http.get(`${this.apiUrl}/status`);
  }

  getPosts(type?: string, limit = 50, offset = 0) {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    return this.http.get(`${this.apiUrl}/posts?${params}`);
  }
}
```

### 顯示 Instagram 貼文

在行事曆中，Instagram 貼文會自動顯示為事件，並帶有特殊圖示和樣式。

## ⚙️ 進階設定

### 避免 Rate Limit

如果遇到 Instagram 限制，可以設定登入帳號：

```env
# instagram-scraper/.env
INSTAGRAM_LOGIN_USERNAME=你的帳號
INSTAGRAM_LOGIN_PASSWORD=你的密碼
```

### 自訂分類關鍵字

編輯 `spotify-proxy/services/gemini-classifier.js` 的 `fallbackClassify` 方法：

```javascript
const keywords = {
  concert: ['演唱會', '콘서트', 'concert', '你的關鍵字'],
  endorsement: ['代言', '광고', 'ad', '你的關鍵字'],
  // ...
};
```

### 調整爬取頻率

編輯 `spotify-proxy/server.js` 的 cron 設定：

```javascript
// 每 6 小時執行一次
cron.schedule('0 */6 * * *', async () => { ... });

// 每週一早上 8 點
cron.schedule('0 8 * * 1', async () => { ... });
```

## 🐛 故障排除

### 問題 1: Python 爬蟲失敗

**錯誤：**
```
ModuleNotFoundError: No module named 'instaloader'
```

**解決：**
```bash
pip3 install --user instaloader python-dotenv
```

### 問題 2: Gemini API 錯誤

**錯誤：**
```
[Gemini] Classification error: API key not valid
```

**解決：**
1. 檢查 `.env` 中的 `GEMINI_API_KEY` 是否正確
2. 確認 API Key 有效且未過期
3. 檢查 API 額度是否用完

### 問題 3: 資料庫 Schema 不匹配

**錯誤：**
```
Invalid `prisma.event.create()` invocation
```

**解決：**
```bash
cd spotify-proxy
npx prisma db push
```

### 問題 4: Instagram Rate Limit

**錯誤：**
```
Too many requests
```

**解決：**
1. 減少 `INSTAGRAM_MAX_POSTS` 數量
2. 設定 Instagram 登入帳號
3. 增加爬取間隔時間

## 📈 監控與維護

### 查看日誌

```bash
# 查看同步歷史
curl http://localhost:3000/api/instagram/status | jq

# 查看各類型統計
curl http://localhost:3000/api/instagram/status | jq '.stats.byType'
```

### 定期檢查

- ✅ 每週檢查 Gemini API 使用量
- ✅ 確認定時任務正常執行
- ✅ 檢視錯誤日誌
- ✅ 驗證分類準確度

## 🎯 最佳實踐

1. **首次使用** - 先手動同步少量貼文測試（10-20 篇）
2. **正式運行** - 確認無誤後再啟用完整同步
3. **監控額度** - 定期查看 Gemini API 使用情況
4. **備份資料** - 定期備份 SQLite 資料庫
5. **更新關鍵字** - 根據實際情況調整分類邏輯

## 📚 相關文件

- [Instagram Scraper README](./instagram-scraper/README.md)
- [Gemini API 文檔](https://ai.google.dev/docs)
- [Instaloader 文檔](https://instaloader.github.io/)

## 🤝 貢獻

如果發現分類不準確，歡迎提供反饋：

1. 記錄錯誤分類的貼文 URL
2. 說明應該是哪個類別
3. 提交 Issue 或 PR

## ⚖️ 法律聲明

- 僅用於個人學習和研究
- 遵守 Instagram 服務條款
- 不用於商業用途
- 尊重隱私和版權
