import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EventService } from '../../core/services/event.service';
import { EventsApiService } from '../../core/services/events-api.service';
import { IUEvent, EVENT_TYPE_INFO, EventType } from '../../core/models/event.model';
import { CalendarHeaderComponent } from './components/calendar-header/calendar-header.component';
import { CalendarFilterComponent } from './components/calendar-filter/calendar-filter.component';
import { CalendarGridComponent } from './components/calendar-grid/calendar-grid.component';
import { EventDetailsPanelComponent } from './components/event-details-panel/event-details-panel.component';
import { CalendarDay } from './components/calendar-day-cell/calendar-day-cell.component';

/**
 * 重構後的月曆元件
 *
 * 職責：
 * 1. 協調子元件
 * 2. 管理狀態（年月、選中日期）
 * 3. 處理事件資料
 *
 * 子元件：
 * - CalendarHeaderComponent: 標題與日期導航
 * - CalendarFilterComponent: 事件類型篩選
 * - CalendarGridComponent: 月曆格子顯示
 * - EventDetailsPanelComponent: 事件詳情面板
 */
@Component({
  selector: 'app-calendar-refactored',
  standalone: true,
  imports: [
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
    CalendarHeaderComponent,
    CalendarFilterComponent,
    CalendarGridComponent,
    EventDetailsPanelComponent
  ],
  template: `
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-6 text-center text-purple-600">月曆視圖</h1>

      <!-- 資料庫狀態提示 -->
      @if (eventsApiService.syncStatus(); as status) {
        @if (status.lastSync) {
          <mat-card class="mb-6 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500">
            <div class="p-4 flex items-center gap-3">
              <mat-icon class="text-blue-600">storage</mat-icon>
              <div>
                <h3 class="font-semibold text-blue-800 dark:text-blue-200">事件資料庫</h3>
                <p class="text-blue-700 dark:text-blue-300 text-sm">
                  共 {{ eventsApiService.events().length }} 個事件，最後同步：{{ formatSyncTime(status.lastSync.syncedAt) }}
                </p>
              </div>
            </div>
          </mat-card>
        }
      }

      <!-- 標題與日期導航 -->
      <app-calendar-header
        [currentYear]="currentYear()"
        [currentMonth]="currentMonth()"
        [availableYears]="availableYears"
        (yearChange)="onYearChange($event)"
        (monthChange)="onMonthChange($event)"
        (todayClick)="goToToday()">
      </app-calendar-header>

      <!-- 事件類型篩選 -->
      <app-calendar-filter
        [eventTypes]="eventTypes"
        [selectedTypes]="eventService.selectedTypes()"
        (typeToggle)="onTypeToggle($event)">
      </app-calendar-filter>

      <!-- 載入中 -->
      @if (eventsApiService.isLoading()) {
        <div class="flex justify-center py-12">
          <mat-progress-spinner mode="indeterminate" diameter="50"></mat-progress-spinner>
        </div>
      }

      <!-- 月曆格子 -->
      @if (!eventsApiService.isLoading()) {
        <app-calendar-grid
          [calendarDays]="calendarDays()"
          [selectedDay]="selectedDay()"
          (dayClick)="onDayClick($event)">
        </app-calendar-grid>
      }

      <!-- 事件詳情面板 -->
      <app-event-details-panel
        [selectedDay]="selectedDay()"
        (close)="onCloseDetails()">
      </app-event-details-panel>
    </div>
  `
})
export class CalendarRefactoredComponent implements OnInit {
  eventService = inject(EventService);
  eventsApiService = inject(EventsApiService);
  private destroyRef = inject(DestroyRef);

  // 狀態
  currentYear = signal(new Date().getFullYear());
  currentMonth = signal(new Date().getMonth() + 1);
  selectedDay = signal<CalendarDay | null>(null);

  // 靜態資料
  eventTypes = Object.values(EVENT_TYPE_INFO);
  availableYears = Array.from({ length: 30 }, (_, i) => 2008 + i);

  // 合併所有事件
  private allEvents = computed(() => {
    const originalEvents = this.eventService.filteredEvents();
    const apiEvents = this.eventsApiService.events();

    // 使用 Map 去重（更高效）
    const eventMap = new Map<string, IUEvent>();

    for (const event of originalEvents) {
      eventMap.set(`${event.date}:${event.title}`, event);
    }

    for (const event of apiEvents) {
      eventMap.set(`${event.date}:${event.title}`, event);
    }

    return Array.from(eventMap.values());
  });

  // 計算月曆格子
  calendarDays = computed(() => {
    const year = this.currentYear();
    const month = this.currentMonth();
    const events = this.allEvents();

    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    const startWeekDay = firstDay.getDay();

    const days: CalendarDay[] = [];
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // 上個月的日期
    const prevMonthLastDay = new Date(year, month - 1, 0).getDate();
    for (let i = startWeekDay - 1; i >= 0; i--) {
      const date = prevMonthLastDay - i;
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        events: []
      });
    }

    // 當月日期
    for (let date = 1; date <= daysInMonth; date++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
      const dayEvents = events.filter(e => e.date === dateStr);

      days.push({
        date,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        events: dayEvents
      });
    }

    // 下個月的日期
    const remainingDays = 42 - days.length;
    for (let date = 1; date <= remainingDays; date++) {
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        events: []
      });
    }

    return days;
  });

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.eventsApiService.loadEvents()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (events) => console.log(`已載入 ${events.length} 個事件`),
        error: (err) => console.error('載入失敗:', err)
      });

    this.eventsApiService.loadSyncStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  // 事件處理
  onYearChange(year: number): void {
    this.currentYear.set(year);
  }

  onMonthChange(month: number): void {
    this.currentMonth.set(month);
  }

  goToToday(): void {
    const today = new Date();
    this.currentYear.set(today.getFullYear());
    this.currentMonth.set(today.getMonth() + 1);
  }

  onTypeToggle(type: EventType): void {
    this.eventService.toggleType(type);
  }

  onDayClick(day: CalendarDay): void {
    this.selectedDay.set(day);
  }

  onCloseDetails(): void {
    this.selectedDay.set(null);
  }

  formatSyncTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
