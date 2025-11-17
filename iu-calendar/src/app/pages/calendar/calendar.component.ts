import { Component, inject, signal, computed } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { EventService } from '../../core/services/event.service';
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
    MatDialogModule
  ],
  template: `
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-6 text-center text-purple-600">月曆視圖</h1>

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
        <h2 class="text-2xl font-semibold">
          {{ currentYear() }}年 {{ currentMonth() }}月
        </h2>
        <button mat-icon-button (click)="nextMonth()">
          <mat-icon>chevron_right</mat-icon>
        </button>
      </div>

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
export class CalendarComponent {
  private eventService = inject(EventService);
  private dialog = inject(MatDialog);

  eventTypes = Object.values(EVENT_TYPE_INFO);
  weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  currentYear = signal(new Date().getFullYear());
  currentMonth = signal(new Date().getMonth() + 1);
  selectedDay = signal<CalendarDay | null>(null);

  calendarDays = computed(() => {
    const year = this.currentYear();
    const month = this.currentMonth();
    const events = this.eventService.filteredEvents();

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
}

interface CalendarDay {
  date: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: IUEvent[];
}
