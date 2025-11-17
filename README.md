## IU 資料收集網站開發需求文檔

### 一、專案概述
建立一個專門收集和展示IU（李知恩）相關資料的Angular網站，以月曆形式呈現歷史資料，讓粉絲可以查看「歷史上的今天」IU的活動和社交媒體動態。

### 二、專案架構建議

```
iu-archive/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── services/
│   │   │   │   ├── data.service.ts (資料服務)
│   │   │   │   ├── scraper.service.ts (爬蟲服務)
│   │   │   │   └── date.service.ts (日期處理)
│   │   │   ├── models/
│   │   │   │   ├── event.model.ts (活動資料模型)
│   │   │   │   └── post.model.ts (貼文資料模型)
│   │   │   └── guards/
│   │   ├── shared/
│   │   │   ├── components/
│   │   │   │   ├── header/
│   │   │   │   ├── footer/
│   │   │   │   └── loading/
│   │   │   └── pipes/
│   │   ├── pages/
│   │   │   ├── home/
│   │   │   ├── calendar/
│   │   │   │   ├── calendar-view/
│   │   │   │   ├── calendar-day-modal/
│   │   │   │   └── today-in-history/
│   │   │   └── event-detail/
│   │   └── app-routing.module.ts
│   ├── assets/
│   │   ├── data/ (JSON資料檔)
│   │   └── images/
│   └── environments/
├── backend/ (Node.js爬蟲後端)
│   ├── scrapers/
│   ├── schedulers/
│   └── database/
└── database/ (MongoDB或PostgreSQL)
```

### 三、資料來源建議

#### 官方社交媒體平台
1. **Instagram** (@dlwlrma)
   - 從2011年開始的貼文
   - 使用Instagram Basic Display API或第三方工具

2. **YouTube** 
   - IU Official Channel (이지금 [IU Official])
   - 官方MV、演唱會片段、幕後花絮

3. **Twitter/X**
   - 官方帳號貼文（若有）
   - 粉絲俱樂部官方帳號

4. **韓國平台**
   - Melon (音源發布資訊)
   - Naver Post
   - V LIVE / Weverse (粉絲互動內容)

#### 演唱會與活動資料
1. **Setlist.fm** - 演唱會場次和歌單
2. **Wikipedia** - IU discography和concert tours頁面
3. **Kpopmap** - 活動行程資訊
4. **Soompi** - 新聞和活動報導

#### 音樂發行資料
1. **Spotify API** - 專輯和單曲發行日期
2. **Apple Music API** - 音樂發行資訊
3. **韓國音源網站** - Melon, Genie, Bugs

### 四、資料收集策略

#### 階段一：歷史資料建檔
1. 手動收集重要里程碑（出道日、專輯發行、重要獲獎）
2. 使用Wikipedia和官方資料建立基礎資料庫
3. 整理2008-09-18至今的重要事件時間軸

#### 階段二：自動化爬蟲
1. 建立Node.js爬蟲服務器
2. 使用Puppeteer或Playwright處理動態網頁
3. 設定排程每日更新
4. 實作API限制和錯誤處理

#### 階段三：資料處理
1. 資料清洗和標準化
2. 建立統一的資料格式
3. 圖片和影片連結管理
4. 多語言支援（韓文、英文、中文）

### 五、功能規格

#### 5.1 主頁
- 網站介紹和目的說明
- IU簡介
- 快速導航到今日歷史事件
- 最新動態預覽

#### 5.2 月曆頁面
- 月曆視圖（參考Google Calendar設計）
- 每日事件標記（不同類型用不同顏色）
- 「歷史上的今天」側邊欄
- 事件類型篩選器：
  - 社交媒體貼文
  - 演唱會/見面會
  - 專輯/單曲發行
  - 獲獎記錄
  - 綜藝/戲劇播出

#### 5.3 活動詳情頁
- 完整事件描述
- 相關圖片/影片嵌入
- 原始連結（如適用）
- 相關事件推薦
- 分享功能

### 六、技術建議

#### 前端
- Angular 17+ with standalone components
- Angular Material for UI components
- FullCalendar for calendar view
- RxJS for reactive programming
- Tailwind CSS for styling

#### 後端
- Node.js + Express
- MongoDB for flexible data structure
- Redis for caching
- Bull for job queuing

#### 爬蟲工具
- Puppeteer/Playwright for dynamic content
- Cheerio for static HTML parsing
- node-cron for scheduling

### 七、資料模型範例

```typescript
interface IUEvent {
  id: string;
  date: Date;
  type: 'social_media' | 'concert' | 'release' | 'award' | 'broadcast';
  title: string;
  description: string;
  source: string;
  sourceUrl?: string;
  mediaUrls?: string[];
  location?: string;
  tags: string[];
  language: 'ko' | 'en' | 'zh';
}
```

### 八、注意事項

1. **版權考量**
   - 僅連結原始資源，避免直接存儲版權內容
   - 標註所有資料來源
   - 遵守各平台的使用條款

2. **API限制**
   - 實作rate limiting
   - 使用代理池避免IP封鎖
   - 建立錯誤重試機制

3. **資料準確性**
   - 建立資料驗證機制
   - 允許用戶回報錯誤
   - 定期人工審核

4. **性能優化**
   - 實作lazy loading
   - 圖片CDN和壓縮
   - 資料分頁載入

這份文檔可以直接提供給Claude Code來開始開發專案。建議先從建立基本架構和手動資料收集開始，逐步加入自動化爬蟲功能。