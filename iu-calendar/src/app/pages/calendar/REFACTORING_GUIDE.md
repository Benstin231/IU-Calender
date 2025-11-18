# CalendarComponent 重構指南

## 📊 重構前後對比

### 重構前（calendar.component.ts）
- **468 行** 單一元件
- 職責混雜（6 種職責）
- 難以測試
- 難以重用

### 重構後（分拆為 6 個元件）
- **CalendarRefactoredComponent**: ~160 行（主協調器）
- **CalendarHeaderComponent**: ~140 行（標題與導航）
- **CalendarFilterComponent**: ~45 行（篩選器）
- **CalendarGridComponent**: ~40 行（月曆格子）
- **CalendarDayCellComponent**: ~70 行（單一日期格子）
- **EventDetailsPanelComponent**: ~100 行（事件詳情）

**總計**：~555 行（但職責清晰，可重用）

---

## 🎯 重構優點

### 1. 單一職責原則（SRP）
每個元件只負責一件事：
- ✅ CalendarHeaderComponent → 日期導航
- ✅ CalendarFilterComponent → 事件篩選
- ✅ CalendarGridComponent → 顯示格子
- ✅ CalendarDayCellComponent → 單一日期
- ✅ EventDetailsPanelComponent → 事件詳情

### 2. 可重用性
- `CalendarHeaderComponent` 可用於其他日期選擇場景
- `CalendarFilterComponent` 可用於其他篩選場景
- `CalendarDayCellComponent` 可客製化樣式

### 3. 易於測試
```typescript
// 測試變得簡單
describe('CalendarDayCellComponent', () => {
  it('should highlight today', () => {
    const day: CalendarDay = { date: 1, isCurrentMonth: true, isToday: true, events: [] };
    component.day.set(day);
    expect(component.day().isToday).toBe(true);
  });
});
```

### 4. 易於維護
- 修改日期選擇器 → 只改 `CalendarHeaderComponent`
- 修改篩選邏輯 → 只改 `CalendarFilterComponent`
- 修改格子樣式 → 只改 `CalendarDayCellComponent`

### 5. 效能優化（未來）
- 可對個別元件使用 `ChangeDetectionStrategy.OnPush`
- 減少不必要的重新渲染

---

## 🔄 如何切換到重構版本

### 步驟 1：更新路由
```typescript
// app.routes.ts
{
  path: 'calendar',
  loadComponent: () => import('./pages/calendar/calendar-refactored.component')
    .then(m => m.CalendarRefactoredComponent),
  title: 'IU Calendar - 月曆'
}
```

### 步驟 2：測試新版本
1. 啟動開發伺服器：`npm start`
2. 導航到 `/calendar`
3. 測試所有功能：
   - ✅ 切換月份
   - ✅ 快速選擇日期
   - ✅ 篩選事件類型
   - ✅ 點擊日期查看詳情
   - ✅ 關閉詳情面板

### 步驟 3：確認無誤後刪除舊檔案
```bash
# 備份舊檔案
mv src/app/pages/calendar/calendar.component.ts src/app/pages/calendar/calendar.component.ts.backup

# 將新檔案重新命名
mv src/app/pages/calendar/calendar-refactored.component.ts src/app/pages/calendar/calendar.component.ts
```

---

## 📁 新的檔案結構

```
src/app/pages/calendar/
├── calendar.component.ts              # 原始（468 行）
├── calendar-refactored.component.ts   # 重構版（160 行）✨
├── components/
│   ├── calendar-header/
│   │   └── calendar-header.component.ts
│   ├── calendar-filter/
│   │   └── calendar-filter.component.ts
│   ├── calendar-grid/
│   │   └── calendar-grid.component.ts
│   ├── calendar-day-cell/
│   │   └── calendar-day-cell.component.ts
│   └── event-details-panel/
│       └── event-details-panel.component.ts
└── REFACTORING_GUIDE.md              # 本檔案
```

---

## 🚀 未來擴展建議

### 1. 新增功能更容易
**新增「週視圖」功能**：
```typescript
// 只需建立新元件
@Component({
  selector: 'app-calendar-week-view',
  template: `
    <app-calendar-header ...></app-calendar-header>
    <app-calendar-filter ...></app-calendar-filter>
    <!-- 新的週視圖格子 -->
    <div class="week-grid">...</div>
  `
})
```

### 2. 效能優化
```typescript
// CalendarDayCellComponent
@Component({
  selector: 'app-calendar-day-cell',
  changeDetection: ChangeDetectionStrategy.OnPush, // ← 加這行
  // ...
})
```

### 3. 增強互動性
- 拖放事件到其他日期
- 雙擊日期新增事件
- 滑鼠懸停預覽事件

### 4. 客製化樣式
```typescript
// 支援深色模式、緊湊模式、大字體模式等
<app-calendar-grid [viewMode]="'compact'" [theme]="'dark'">
```

---

## ⚠️ 注意事項

### 記憶體洩漏已修復
兩個元件已加入 `takeUntilDestroyed()`：
- ✅ `calendar.component.ts`
- ✅ `albums.component.ts`

### 事件去重優化
使用 `Map` 取代 `some()` 檢查：
```typescript
// ❌ 舊方法 O(n²)
const isDuplicate = originalEvents.some(e => e.title === apiEvent.title);

// ✅ 新方法 O(n)
const eventMap = new Map<string, IUEvent>();
eventMap.set(`${event.date}:${event.title}`, event);
```

### 型別安全
所有介面統一在 `CalendarDay` 介面定義：
```typescript
export interface CalendarDay {
  date: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: IUEvent[];
}
```

---

## 📝 總結

這次重構遵循了 Angular 最佳實踐：
1. ✅ **單一職責原則** - 每個元件只做一件事
2. ✅ **Signal-based 架構** - 使用 computed 和 signal
3. ✅ **Input/Output 通訊** - 清晰的資料流
4. ✅ **記憶體管理** - 自動取消訂閱
5. ✅ **型別安全** - 完整的 TypeScript 支援
6. ✅ **可測試性** - 易於單元測試

**建議**：先在開發環境測試重構版本，確認無誤後再部署到生產環境。
