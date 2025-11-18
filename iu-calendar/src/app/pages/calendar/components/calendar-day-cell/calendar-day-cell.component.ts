import { Component, input, output } from '@angular/core';
import { IUEvent } from '../../../../core/models/event.model';

export interface CalendarDay {
  date: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: IUEvent[];
}

@Component({
  selector: 'app-calendar-day-cell',
  standalone: true,
  template: `
    <div class="calendar-day relative h-24 border border-gray-200 dark:border-gray-700 p-2
                hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
         [class.bg-gray-100]="!day().isCurrentMonth"
         [class.dark:bg-gray-900]="!day().isCurrentMonth"
         [class.ring-2]="isSelected()"
         [class.ring-purple-500]="isSelected()"
         (click)="dayClick.emit(day())">

      <!-- 日期數字 -->
      <div class="font-medium mb-1"
           [class.text-gray-400]="!day().isCurrentMonth"
           [class.text-purple-600]="day().isToday"
           [class.font-bold]="day().isToday">
        {{ day().date }}
        @if (day().isToday) {
          <span class="text-xs ml-1">(今天)</span>
        }
      </div>

      <!-- 事件指示器 -->
      @if (day().events.length > 0) {
        <div class="flex flex-wrap gap-1">
          @for (event of day().events.slice(0, 3); track event.id) {
            <div class="w-1.5 h-1.5 rounded-full"
                 [style.background-color]="getEventColor(event)"
                 [title]="event.title">
            </div>
          }
          @if (day().events.length > 3) {
            <span class="text-xs text-gray-500">+{{ day().events.length - 3 }}</span>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .calendar-day {
      min-height: 96px;
    }
  `]
})
export class CalendarDayCellComponent {
  // Inputs
  day = input.required<CalendarDay>();
  selectedDay = input<CalendarDay | null>(null);

  // Outputs
  dayClick = output<CalendarDay>();

  isSelected(): boolean {
    const selected = this.selectedDay();
    const current = this.day();
    return selected?.date === current.date && selected?.isCurrentMonth === current.isCurrentMonth;
  }

  getEventColor(event: IUEvent): string {
    // 簡化版，實際可從 EVENT_TYPE_INFO 取得
    const colors: Record<string, string> = {
      release: '#ec4899',
      concert: '#f97316',
      award: '#eab308',
      broadcast: '#3b82f6',
      social_media: '#8b5cf6',
      milestone: '#06b6d4'
    };
    return colors[event.type] || '#6b7280';
  }
}
