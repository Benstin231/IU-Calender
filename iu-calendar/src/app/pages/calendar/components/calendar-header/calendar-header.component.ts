import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-calendar-header',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule
  ],
  template: `
    <div class="flex items-center justify-between mb-6">
      <!-- 月份導航 -->
      <div class="flex items-center gap-2">
        <button mat-icon-button (click)="previousMonth()">
          <mat-icon>chevron_left</mat-icon>
        </button>

        <h2 class="text-2xl font-bold min-w-[200px] text-center">
          {{ currentYear() }} 年 {{ currentMonth() }} 月
        </h2>

        <button mat-icon-button (click)="nextMonth()">
          <mat-icon>chevron_right</mat-icon>
        </button>
      </div>

      <!-- 快速選擇 -->
      <div class="flex items-center gap-2">
        <button mat-stroked-button (click)="goToToday()">
          <mat-icon>today</mat-icon>
          今天
        </button>

        <button mat-icon-button [matMenuTriggerFor]="menu">
          <mat-icon>calendar_month</mat-icon>
        </button>

        <mat-menu #menu="matMenu">
          <div class="px-4 py-2" (click)="$event.stopPropagation()">
            <mat-form-field appearance="outline" class="w-32">
              <mat-label>年份</mat-label>
              <mat-select
                [ngModel]="currentYear()"
                (ngModelChange)="yearChange.emit($event)">
                @for (year of availableYears(); track year) {
                  <mat-option [value]="year">{{ year }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-32 ml-2">
              <mat-label>月份</mat-label>
              <mat-select
                [ngModel]="currentMonth()"
                (ngModelChange)="monthChange.emit($event)">
                @for (month of months; track month.value) {
                  <mat-option [value]="month.value">{{ month.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>
        </mat-menu>
      </div>
    </div>
  `
})
export class CalendarHeaderComponent {
  // Inputs
  currentYear = input.required<number>();
  currentMonth = input.required<number>();
  availableYears = input.required<number[]>();

  // Outputs
  yearChange = output<number>();
  monthChange = output<number>();
  todayClick = output<void>();

  // 月份選項
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

  previousMonth() {
    const current = this.currentMonth();
    const year = this.currentYear();

    if (current === 1) {
      this.yearChange.emit(year - 1);
      this.monthChange.emit(12);
    } else {
      this.monthChange.emit(current - 1);
    }
  }

  nextMonth() {
    const current = this.currentMonth();
    const year = this.currentYear();

    if (current === 12) {
      this.yearChange.emit(year + 1);
      this.monthChange.emit(1);
    } else {
      this.monthChange.emit(current + 1);
    }
  }

  goToToday() {
    this.todayClick.emit();
  }
}
