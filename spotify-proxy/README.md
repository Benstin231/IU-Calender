# Spotify Proxy Server

安全的 Spotify API 代理服務，用於保護 Client Secret 不暴露在前端。

## 設定步驟

### 1. 安裝依賴
```bash
cd spotify-proxy
npm install
```

### 2. 設定環境變數
```bash
cp .env.example .env
```

編輯 `.env` 檔案，填入你的 Spotify 憑證：
```
SPOTIFY_CLIENT_ID=你的_client_id
SPOTIFY_CLIENT_SECRET=你的_client_secret
PORT=3000
ALLOWED_ORIGINS=http://localhost:4200
```

**重要：** 請到 [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) 重新生成 Client Secret，因為舊的已經洩漏。

### 3. 啟動服務
```bash
npm start
```

服務將在 `http://localhost:3000` 啟動。

## API 端點

- `GET /health` - 健康檢查
- `GET /api/spotify/artists/:artistId/albums` - 取得藝人專輯列表

## 安全性

- Client Secret 只存在於後端伺服器
- 使用 CORS 限制允許的來源
- Token 在伺服器端快取和管理
- `.env` 檔案不會被提交到版本控制
