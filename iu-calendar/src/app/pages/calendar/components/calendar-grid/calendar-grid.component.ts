import { Component, input, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { CalendarDay, CalendarDayCellComponent } from '../calendar-day-cell/calendar-day-cell.component';

@Component({
  selector: 'app-calendar-grid',
  standalone: true,
  imports: [MatCardModule, CalendarDayCellComponent],
  template: `
    <mat-card>
      <mat-card-content>
        <!-- 星期標題 -->
        <div class="grid grid-cols-7 mb-2">
          @for (day of weekDays; track day) {
            <div class="text-center font-semibold py-2 text-gray-600 dark:text-gray-400">
              {{ day }}
            </div>
          }
        </div>

        <!-- 日期格子 -->
        <div class="grid grid-cols-7 gap-0">
          @for (day of calendarDays(); track day.date + '-' + day.isCurrentMonth) {
            <app-calendar-day-cell
              [day]="day"
              [selectedDay]="selectedDay()"
              (dayClick)="dayClick.emit($event)">
            </app-calendar-day-cell>
          }
        </div>
      </mat-card-content>
    </mat-card>
  `
})
export class CalendarGridComponent {
  // Inputs
  calendarDays = input.required<CalendarDay[]>();
  selectedDay = input<CalendarDay | null>(null);

  // Outputs
  dayClick = output<CalendarDay>();

  weekDays = ['日', '一', '二', '三', '四', '五', '六'];
}
