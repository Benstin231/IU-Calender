# Albums Component - 待修繕項目

## ⚠️ 狀態：待修繕

## 🐛 已知問題

### 1. 專輯列表無法正常顯示
**症狀：**
- 頁面顯示「尚無專輯資料」
- 資料庫中確實有 50 筆 Spotify 事件
- API 端點正常回傳資料

**可能原因：**
- Angular Signals 響應式更新時機問題
- EventsApiService 資料載入時序問題
- Computed signals 依賴追蹤問題

**待驗證：**
- [ ] 檢查瀏覽器控制台是否有錯誤
- [ ] 確認 `eventsApiService.events()` 是否有資料
- [ ] 確認 `albums()` computed 是否正確轉換
- [ ] 確認 `filteredAlbums()` computed 是否正確過濾

### 2. 資料載入時機
**問題：**
目前在 `ngOnInit` 中呼叫 `loadEvents()`，但可能在 component 初始化時資料尚未載入完成。

**可能解決方案：**
- 改用 `effect()` 監聽 `events()` signal 變化
- 在 `EventsApiService` 中加入資料是否已載入的 flag
- 使用 `toSignal()` 將 Observable 轉為 signal

## 🔧 建議修復步驟

### 步驟 1：加入除錯日誌
```typescript
// 在 computed 中加入 console.log
albums = computed(() => {
  const events = this.eventsApiService.events();
  console.log('[Albums Debug] events count:', events.length);
  const spotifyEvents = events.filter(event => event.source === 'spotify');
  console.log('[Albums Debug] spotify events:', spotifyEvents.length);
  // ...
});
```

### 步驟 2：檢查 EventsApiService
確認 `eventsCache` signal 是否正確更新：
```typescript
// 在 events-api.service.ts 中
events = computed(() => {
  console.log('[EventsAPI Debug] cache size:', this.eventsCache().length);
  return this.eventsCache();
});
```

### 步驟 3：使用 effect 監聽變化
```typescript
constructor() {
  effect(() => {
    console.log('[Albums Effect] albums changed:', this.albums().length);
  });
}
```

### 步驟 4：簡化 Computed 邏輯
將 `albums` computed 拆分為多個小的 computed，方便除錯。

## 📝 重構建議

### 選項 A：使用 toSignal
```typescript
private albums$ = this.eventsApiService.loadEvents().pipe(
  map(events => events.filter(e => e.source === 'spotify')),
  map(events => events.map(this.eventToAlbum)),
  shareReplay(1)
);

albums = toSignal(this.albums$, { initialValue: [] });
```

### 選項 B：完全使用 Service 層管理狀態
在 `EventsApiService` 中加入專門的 `spotifyAlbums` signal，讓 Component 直接使用。

### 選項 C：回退到簡單的 Observable + async pipe
如果 Signals 時機問題難以解決，考慮暫時使用傳統的 `albums$ | async` 方式。

## 🎯 優先級
- **高**：修復顯示問題（使用者無法看到專輯）
- **中**：優化響應式更新邏輯
- **低**：程式碼重構優化

## 📅 狀態記錄
- **2025-11-26**: 初次建立 - 發現顯示問題
- **待更新**: 修復完成後更新此檔案

---
💡 修復完成後請刪除此檔案
