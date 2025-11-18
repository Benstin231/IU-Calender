import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EventService } from '../../core/services/event.service';
import { EventsApiService } from '../../core/services/events-api.service';
import { IUEvent, EVENT_TYPE_INFO, EventType } from '../../core/models/event.model';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCheckboxModule,
    MatDialogModule,
    MatMenuModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    FormsModule
  ],
  template: `
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-6 text-center text-purple-600">月曆視圖</h1>

      <!-- 資料庫狀態區塊 -->
      <mat-card class="mb-6 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500">
        <mat-card-content class="py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <mat-icon class="text-blue-600">storage</mat-icon>
              <div>
                <h3 class="font-semibold text-blue-800 dark:text-blue-200">
                  事件資料庫
                </h3>
                @if (eventsApiService.isLoading()) {
                  <p class="text-blue-700 dark:text-blue-300 text-sm mt-1">
                    正在載入事件資料...
                  </p>
                } @else if (eventsApiService.error()) {
                  <p class="text-red-600 dark:text-red-400 text-sm mt-1">
                    錯誤: {{ eventsApiService.error() }}
                  </p>
                } @else if (eventsApiService.events().length > 0) {
                  <p class="text-blue-700 dark:text-blue-300 text-sm mt-1">
                    已載入 {{ eventsApiService.events().length }} 個事件
                    @if (eventsApiService.syncStatus()?.lastSync) {
                      <span class="ml-2 text-xs">
                        (上次同步: {{ formatSyncTime(eventsApiService.syncStatus()!.lastSync!.syncedAt) }})
                      </span>
                    }
                  </p>
                } @else {
                  <p class="text-blue-700 dark:text-blue-300 text-sm mt-1">
                    尚未載入事件資料
                  </p>
                }
              </div>
            </div>
            <button mat-stroked-button
                    (click)="refreshEvents()"
                    [disabled]="eventsApiService.isLoading()">
              @if (eventsApiService.isLoading()) {
                <mat-spinner diameter="20" class="inline-block mr-2"></mat-spinner>
                載入中...
              } @else {
                <mat-icon>refresh</mat-icon>
                重新載入
              }
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Filter Section -->
      <mat-card class="mb-6">
        <mat-card-content class="p-4">
          <h3 class="font-semibold mb-3">事件類型篩選</h3>
          <div class="flex flex-wrap gap-2">
            @for (typeInfo of eventTypes; track typeInfo.type) {
              <mat-checkbox
                [checked]="isTypeSelected(typeInfo.type)"
                (change)="toggleType(typeInfo.type)"
                [color]="'primary'">
                <span class="flex items-center gap-1">
                  <span class="w-3 h-3 rounded-full" [class]="'event-type-' + typeInfo.type"></span>
                  {{ typeInfo.label }}
                </span>
              </mat-checkbox>
            }
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Calendar Navigation -->
      <div class="flex justify-between items-center mb-6">
        <button mat-icon-button (click)="previousMonth()">
          <mat-icon>chevron_left</mat-icon>
        </button>

        <div class="flex items-center gap-2">
          <!-- Date Picker Button -->
          <button mat-button
                  [matMenuTriggerFor]="datePickerMenu"
                  class="text-2xl font-semibold hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg px-4 py-2">
            {{ currentYear() }}年 {{ currentMonth() }}月
            <mat-icon class="ml-1">arrow_drop_down</mat-icon>
          </button>

          <!-- Today Button -->
          <button mat-stroked-button
                  color="primary"
                  (click)="goToToday()"
                  class="ml-2">
            <mat-icon>today</mat-icon>
            今天
          </button>
        </div>

        <button mat-icon-button (click)="nextMonth()">
          <mat-icon>chevron_right</mat-icon>
        </button>
      </div>

      <!-- Date Picker Menu -->
      <mat-menu #datePickerMenu="matMenu" class="date-picker-menu">
        <div class="p-4 min-w-[280px]" (click)="$event.stopPropagation()">
          <h3 class="font-semibold mb-4 text-center">選擇日期</h3>

          <!-- Year Selection -->
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">年份</label>
            <mat-form-field appearance="outline" class="w-full">
              <mat-select [value]="currentYear()" (selectionChange)="onYearChange($event.value)">
                @for (year of availableYears; track year) {
                  <mat-option [value]="year">{{ year }}年</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          <!-- Month Selection -->
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">月份</label>
            <div class="grid grid-cols-4 gap-2">
              @for (month of months; track month.value) {
                <button mat-button
                        [color]="currentMonth() === month.value ? 'primary' : undefined"
                        [class.bg-purple-100]="currentMonth() === month.value"
                        [class.dark:bg-purple-900]="currentMonth() === month.value"
                        (click)="onMonthChange(month.value)"
                        class="rounded">
                  {{ month.label }}
                </button>
              }
            </div>
          </div>
        </div>
      </mat-menu>

      <!-- Calendar Grid -->
      <mat-card>
        <mat-card-content class="p-4">
          <!-- Week Headers -->
          <div class="grid grid-cols-7 gap-1 mb-2">
            @for (day of weekDays; track day) {
              <div class="text-center font-semibold py-2 text-gray-600 dark:text-gray-300">
                {{ day }}
              </div>
            }
          </div>

          <!-- Calendar Days -->
          <div class="grid grid-cols-7 gap-1">
            @for (day of calendarDays(); track $index) {
              <div
                class="min-h-24 p-2 border rounded-lg transition-colors"
                [class.bg-gray-50]="!day.isCurrentMonth"
                [class.dark:bg-gray-800]="!day.isCurrentMonth"
                [class.bg-white]="day.isCurrentMonth"
                [class.dark:bg-gray-700]="day.isCurrentMonth"
                [class.ring-2]="day.isToday"
                [class.ring-purple-500]="day.isToday"
                (click)="day.events.length > 0 && showDayEvents(day)">
                <div class="font-medium" [class.text-gray-400]="!day.isCurrentMonth">
                  {{ day.date }}
                </div>
                @if (day.events.length > 0) {
                  <div class="mt-1 space-y-1">
                    @for (event of day.events.slice(0, 3); track event.id) {
                      <div class="text-xs p-1 rounded truncate text-white"
                           [class]="'event-type-' + event.type">
                        {{ event.title }}
                      </div>
                    }
                    @if (day.events.length > 3) {
                      <div class="text-xs text-gray-500">
                        +{{ day.events.length - 3 }} 更多
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Selected Day Events -->
      @if (selectedDay()) {
        <mat-card class="mt-6">
          <mat-card-header>
            <mat-card-title>
              {{ currentYear() }}年{{ currentMonth() }}月{{ selectedDay()!.date }}日的事件
            </mat-card-title>
          </mat-card-header>
          <mat-card-content class="mt-4">
            <div class="space-y-4">
              @for (event of selectedDay()!.events; track event.id) {
                <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div class="flex items-start gap-3">
                    <span class="px-2 py-1 rounded text-white text-xs font-medium"
                          [class]="'event-type-' + event.type">
                      {{ getEventTypeLabel(event.type) }}
                    </span>
                    <div class="flex-1">
                      <h4 class="font-semibold">{{ event.title }}</h4>
                      @if (event.titleKo) {
                        <p class="text-sm text-gray-500">{{ event.titleKo }}</p>
                      }
                      <p class="text-gray-600 dark:text-gray-300 mt-2">
                        {{ event.description }}
                      </p>
                      <div class="flex items-center gap-2 mt-2 text-sm text-gray-500">
                        <mat-icon class="text-base">source</mat-icon>
                        <span>{{ event.source }}</span>
                        @if (event.sourceUrl) {
                          <a [href]="event.sourceUrl" target="_blank" rel="noopener"
                             class="text-purple-600 hover:underline">
                            查看來源
                          </a>
                        }
                      </div>
                      @if (event.tags.length > 0) {
                        <div class="flex gap-1 mt-2">
                          @for (tag of event.tags; track tag) {
                            <mat-chip class="text-xs">{{ tag }}</mat-chip>
                          }
                        </div>
                      }
                    </div>
                  </div>
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `
})
export class CalendarComponent implements OnInit {
  private eventService = inject(EventService);
  eventsApiService = inject(EventsApiService);

  eventTypes = Object.values(EVENT_TYPE_INFO);
  weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  currentYear = signal(new Date().getFullYear());
  currentMonth = signal(new Date().getMonth() + 1);
  selectedDay = signal<CalendarDay | null>(null);

  // Date picker options
  availableYears = Array.from({ length: 30 }, (_, i) => 2008 + i); // 從 IU 出道年 2008 開始
  months = [
    { value: 1, label: '1月' },
    { value: 2, label: '2月' },
    { value: 3, label: '3月' },
    { value: 4, label: '4月' },
    { value: 5, label: '5月' },
    { value: 6, label: '6月' },
    { value: 7, label: '7月' },
    { value: 8, label: '8月' },
    { value: 9, label: '9月' },
    { value: 10, label: '10月' },
    { value: 11, label: '11月' },
    { value: 12, label: '12月' }
  ];

  // 合併原有事件與 API 事件
  private allEvents = computed(() => {
    const originalEvents = this.eventService.filteredEvents();
    const apiEvents = this.eventsApiService.events();

    // 合併事件，避免重複（以標題和日期判斷）
    const mergedEvents = [...originalEvents];

    for (const apiEvent of apiEvents) {
      const isDuplicate = originalEvents.some(
        e => e.title === apiEvent.title && e.date === apiEvent.date
      );
      if (!isDuplicate) {
        mergedEvents.push(apiEvent);
      }
    }

    return mergedEvents;
  });

  calendarDays = computed(() => {
    const year = this.currentYear();
    const month = this.currentMonth();
    const events = this.allEvents();

    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    const startWeekDay = firstDay.getDay();

    const days: CalendarDay[] = [];

    // Previous month days
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

    // Current month days
    const today = new Date();
    for (let date = 1; date <= daysInMonth; date++) {
      const isToday =
        today.getFullYear() === year &&
        today.getMonth() + 1 === month &&
        today.getDate() === date;

      const dayEvents = events.filter(
        e => e.year === year && e.month === month && e.day === date
      );

      days.push({
        date,
        isCurrentMonth: true,
        isToday,
        events: dayEvents
      });
    }

    // Next month days
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

  previousMonth(): void {
    if (this.currentMonth() === 1) {
      this.currentYear.update(y => y - 1);
      this.currentMonth.set(12);
    } else {
      this.currentMonth.update(m => m - 1);
    }
    this.selectedDay.set(null);
  }

  nextMonth(): void {
    if (this.currentMonth() === 12) {
      this.currentYear.update(y => y + 1);
      this.currentMonth.set(1);
    } else {
      this.currentMonth.update(m => m + 1);
    }
    this.selectedDay.set(null);
  }

  goToToday(): void {
    const today = new Date();
    this.currentYear.set(today.getFullYear());
    this.currentMonth.set(today.getMonth() + 1);
    this.selectedDay.set(null);
  }

  onYearChange(year: number): void {
    this.currentYear.set(year);
    this.selectedDay.set(null);
  }

  onMonthChange(month: number): void {
    this.currentMonth.set(month);
    this.selectedDay.set(null);
  }

  showDayEvents(day: CalendarDay): void {
    this.selectedDay.set(day);
  }

  isTypeSelected(type: EventType): boolean {
    const selected = this.eventService.selectedTypes();
    return selected.length === 0 || selected.includes(type);
  }

  toggleType(type: EventType): void {
    this.eventService.toggleType(type);
  }

  getEventTypeLabel(type: string): string {
    return EVENT_TYPE_INFO[type as keyof typeof EVENT_TYPE_INFO]?.label || type;
  }

  formatSyncTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleString('zh-TW', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  ngOnInit(): void {
    // 自動載入事件資料
    this.refreshEvents();
    // 載入同步狀態
    this.eventsApiService.loadSyncStatus()
      .pipe(takeUntilDestroyed())
      .subscribe();
  }

  refreshEvents(): void {
    this.eventsApiService.loadEvents()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (events) => {
          console.log(`已載入 ${events.length} 個事件到行事曆`);
        },
        error: (err) => {
          console.error('載入事件失敗:', err);
        }
      });
  }
}

interface CalendarDay {
  date: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: IUEvent[];
}
