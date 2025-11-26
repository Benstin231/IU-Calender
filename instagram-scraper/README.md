# Instagram Scraper for IU Calendar

這是 IU Calendar 專案的 Instagram 爬蟲服務，使用 Instaloader 爬取 Instagram 貼文，並透過 Google Gemini AI 進行智能分類。

## 功能特色

- ✅ 爬取指定 Instagram 帳號的貼文
- ✅ 使用 Google Gemini AI 智能分類貼文類型
- ✅ 支援以下分類：
  - `concert` - 演唱會/見面會
  - `release` - 專輯/音樂發行
  - `award` - 獲獎消息
  - `broadcast` - 綜藝/戲劇播出
  - `endorsement` - 廣告代言 ⭐ NEW
  - `social_media` - 一般社群貼文
- ✅ 關鍵字分類備援（當 AI 失敗時）
- ✅ 自動儲存到資料庫

## 系統需求

- Python 3.11+
- Node.js 18+
- Google Gemini API Key

## 安裝步驟

### 1. 安裝 Python 依賴

```bash
cd instagram-scraper
pip3 install -r requirements.txt
```

### 2. 設定環境變數

複製 `.env.example` 到 `.env`：

```bash
cp .env.example .env
```

編輯 `.env` 設定：

```env
INSTAGRAM_TARGET_USERNAME=iu_taiwau
INSTAGRAM_MAX_POSTS=50

# 可選：避免 rate limit
# INSTAGRAM_LOGIN_USERNAME=your_account
# INSTAGRAM_LOGIN_PASSWORD=your_password
```

### 3. 測試爬蟲

手動執行爬蟲測試：

```bash
python3 scraper.py
```

應該會輸出 JSON 格式的貼文資料。

## 使用方式

### 透過 Node.js API 使用（推薦）

Instagram 爬蟲已整合到後端服務，透過 API 調用：

```bash
# 手動觸發同步
curl -X POST http://localhost:3000/api/instagram/sync \
  -H "Content-Type: application/json" \
  -d '{"useAI": true, "maxPosts": 50}'

# 查看同步狀態
curl http://localhost:3000/api/instagram/status

# 查詢貼文
curl http://localhost:3000/api/instagram/posts?type=concert&limit=20
```

### 自動定時同步

後端服務已設定每天凌晨 4:00 自動執行 Instagram 同步。

## API 端點

### POST `/api/instagram/sync`

手動觸發 Instagram 同步

**Request Body:**
```json
{
  "useAI": true,      // 是否使用 AI 分類
  "maxPosts": 50      // 最多爬取幾篇
}
```

**Response:**
```json
{
  "success": true,
  "count": 45,
  "total": 50,
  "message": "Successfully synced 45 Instagram posts"
}
```

### GET `/api/instagram/status`

查看 Instagram 同步狀態和統計

**Response:**
```json
{
  "lastSync": {
    "status": "success",
    "syncedAt": "2025-11-20T04:00:00Z",
    "itemsProcessed": 45,
    "error": null
  },
  "stats": {
    "total": 450,
    "byType": [
      { "type": "social_media", "count": 250 },
      { "type": "endorsement", "count": 80 },
      { "type": "concert", "count": 60 },
      { "type": "release", "count": 40 },
      { "type": "broadcast", "count": 20 }
    ]
  }
}
```

### GET `/api/instagram/posts`

查詢 Instagram 貼文事件

**Query Parameters:**
- `type` - 過濾類型（可選）
- `limit` - 每頁筆數（預設 50）
- `offset` - 分頁偏移量（預設 0）

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 450,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

### DELETE `/api/instagram/events`

清除所有 Instagram 事件（用於測試）

## 分類邏輯

### AI 分類（優先）

使用 Google Gemini 1.5 Flash 模型分析貼文內容，判斷最適合的類別。

**優點：**
- 理解多語言（中文、韓文、英文）
- 考慮上下文和語意
- 準確度高

### 關鍵字分類（備援）

當 AI 失敗時，使用關鍵字匹配：

| 類型 | 關鍵字 |
|------|--------|
| concert | 演唱會, 콘서트, concert, tour, 見面會, 팬미팅 |
| release | 新專輯, comeback, 發行, 발매, MV, 音源 |
| award | 獲獎, 수상, award, 대상, 一位 |
| broadcast | 播出, 방송, drama, 드라마, 綜藝 |
| endorsement | 代言, 광고, ad, brand, 品牌, ambassador |
| social_media | (預設分類) |

## 常見問題

### Q: 遇到 rate limit 怎麼辦？

A: 可以在 `.env` 中設定 Instagram 帳號登入，或減少 `INSTAGRAM_MAX_POSTS` 的數量。

### Q: Gemini API 額度用完了？

A: 系統會自動切換到關鍵字分類備援方案。Gemini 免費版每月有 1500 次請求。

### Q: 如何只爬取最近的貼文？

A: 修改 `scraper.py` 使用 `scrape_recent_posts(profile_name, days=30)` 方法。

### Q: 貼文重複了怎麼辦？

A: 系統使用 `sourceUrl` 作為唯一鍵，重複的貼文會被自動跳過。

## 資料結構

爬蟲輸出的 JSON 格式：

```json
{
  "shortcode": "ABC123",
  "url": "https://www.instagram.com/p/ABC123/",
  "date": "2025-11-20T10:00:00+00:00",
  "timestamp": 1732096800,
  "caption": "貼文內容...",
  "hashtags": ["IU", "concert"],
  "likes": 50000,
  "comments": 1000,
  "is_video": false,
  "media_url": "https://...",
  "type": "concert"  // AI 分類結果
}
```

## 技術架構

```
Instagram
    ↓
[Python Instaloader] 爬取貼文
    ↓
[Gemini Classifier] AI 分類
    ↓ (fallback)
[Keyword Matcher] 關鍵字分類
    ↓
[Node.js Service] 處理並儲存
    ↓
[Prisma/SQLite] 資料庫
    ↓
[REST API] 提供給前端
```

## 維護建議

1. **每週檢查** - 確認定時任務正常運作
2. **監控日誌** - 留意錯誤訊息
3. **更新關鍵字** - 根據實際情況調整分類關鍵字
4. **API 額度** - 定期檢查 Gemini API 使用量

## 授權與注意事項

- 僅用於教育和個人用途
- 尊重 Instagram 服務條款
- 不要過度頻繁爬取
- 標註資料來源
- 不重新發布版權內容
