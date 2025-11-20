# IU Calendar Backend Service

IU 行事曆後端服務 - 提供事件資料庫、自動同步和 RESTful API。

## 功能特色

- **多資料來源同步** - 支援 Spotify、Instagram 等多個資料來源
- **AI 智能分類** - 使用 Google Gemini AI 自動分類 Instagram 貼文
- **SQLite 資料庫** - 輕量化、易於備份的本地資料庫
- **自動同步** - 每天定時自動同步資料（Spotify 凌晨 3 點、Instagram 凌晨 4 點）
- **啟動同步** - 服務啟動時自動檢查並更新資料
- **RESTful API** - 提供前端查詢事件資料的端點
- **同步追蹤** - 記錄所有同步操作的歷史

## 快速開始

### 1. 安裝依賴

```bash
cd backend
npm install
```

### 2. 設定環境變數

確保 `.env` 檔案包含以下設定：

```env
# Spotify API Credentials
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret

# Google Gemini API (for Instagram classification)
GEMINI_API_KEY=your_gemini_api_key

# Instagram Scraper
INSTAGRAM_TARGET_USERNAME=iu_taiwau
INSTAGRAM_MAX_POSTS=50

# Server Configuration
PORT=3000
ALLOWED_ORIGINS=http://localhost:4200

# Database
DATABASE_URL="file:./dev.db"
```

### 3. 初始化資料庫

```bash
npx prisma db push
```

### 4. 啟動服務

```bash
npm start
```

服務將在 `http://localhost:3000` 啟動，並自動進行首次 Spotify 資料同步。

## API 端點

### 事件查詢

**GET `/api/events`**

查詢所有事件，支援過濾和分頁。

Query Parameters:
- `type` - 事件類型 (album, single, concert, birthday, etc.)
- `source` - 資料來源 (spotify, youtube, manual)
- `year` - 年份
- `month` - 月份 (1-12)
- `limit` - 回傳數量 (預設 100)
- `offset` - 跳過數量 (分頁用)

**GET `/api/events/calendar?year=2024&month=3`**

取得月曆格式的事件資料（按日期分組）。

**GET `/api/events/:id`**

取得單一事件詳情。

**GET `/api/events/stats/summary`**

取得事件統計摘要。

### 同步管理

**POST `/api/sync/spotify`**

手動觸發 Spotify 資料同步。

**GET `/api/sync/status`**

查看同步狀態和歷史記錄。

**POST `/api/instagram/sync`**

手動觸發 Instagram 資料同步。

**GET `/api/instagram/status`**

查看 Instagram 同步狀態。

**GET `/api/instagram/posts`**

查詢 Instagram 貼文事件。

### 健康檢查

**GET `/health`**

檢查服務狀態。

## 專案結構

```
backend/
├── server.js              # 主服務入口
├── prisma/
│   └── schema.prisma      # 資料庫 Schema 定義
├── services/
│   ├── spotify.js         # Spotify API 同步服務
│   ├── instagram.js       # Instagram 同步服務
│   └── gemini-classifier.js  # AI 分類器
├── routes/
│   ├── events.js          # 事件查詢 API
│   ├── sync.js            # Spotify 同步管理 API
│   └── instagram.js       # Instagram 同步管理 API
├── .env                   # 環境變數
└── dev.db                 # SQLite 資料庫檔案
```

## 資料庫 Schema

### Event (事件)

統一管理所有類型事件：
- `id` - 唯一識別碼
- `title` - 事件標題
- `description` - 事件描述
- `date` - 事件日期
- `type` - 類型 (album, single, concert, birthday, anniversary, custom)
- `source` - 來源 (spotify, youtube, manual)
- `externalUrl` - 外部連結
- `imageUrl` - 圖片連結
- `metadata` - 額外資訊 (JSON)
- `sourceId` - 來源識別碼（防止重複）

### SyncLog (同步記錄)

追蹤同步歷史：
- `source` - 資料來源
- `status` - 狀態 (success, failed, partial)
- `syncedAt` - 同步時間
- `itemCount` - 同步項目數量

## 自動同步

服務會在以下情況自動同步資料：

### Spotify 同步
1. **啟動時** - 如果從未同步或超過 24 小時
2. **排程** - 每天凌晨 3:00 自動執行

可以透過 `POST /api/sync/spotify` 手動觸發同步。

### Instagram 同步
1. **排程** - 每天凌晨 4:00 自動執行
2. **AI 分類** - 使用 Google Gemini 自動分類貼文類型

可以透過 `POST /api/instagram/sync` 手動觸發同步。

## 未來擴展

此架構設計便於擴展：

1. **新增資料來源** - 在 `services/` 新增同步服務
2. **新增事件類型** - 資料庫 Schema 已支援
3. **切換資料庫** - Prisma 支援 PostgreSQL、MySQL 等

## 注意事項

- `.env` 和 `*.db` 檔案已加入 `.gitignore`，不會被版本控制
- 請妥善保管 Spotify API 憑證
- 建議定期備份 `dev.db` 資料庫檔案
