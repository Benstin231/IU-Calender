import { Component, input, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { IUEvent, EVENT_TYPE_INFO } from '../../../../core/models/event.model';
import { CalendarDay } from '../calendar-day-cell/calendar-day-cell.component';

@Component({
  selector: 'app-event-details-panel',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule
  ],
  template: `
    @if (selectedDay(); as day) {
      <mat-card class="mt-6">
        <mat-card-header class="flex items-center justify-between">
          <h3 class="text-xl font-bold">
            {{ day.date }} 日的事件
          </h3>
          <button mat-icon-button (click)="close.emit()">
            <mat-icon>close</mat-icon>
          </button>
        </mat-card-header>

        <mat-card-content class="mt-4">
          @if (day.events.length === 0) {
            <p class="text-gray-500 text-center py-4">這天沒有事件</p>
          } @else {
            <div class="space-y-4">
              @for (event of day.events; track event.id) {
                <div class="border-l-4 pl-4 py-2"
                     [style.border-color]="getEventTypeColor(event.type)">
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <div class="flex items-center gap-2">
                        <h4 class="font-semibold text-lg">{{ event.title }}</h4>
                        <span class="px-2 py-1 text-xs rounded"
                              [style.background-color]="getEventTypeColor(event.type) + '20'"
                              [style.color]="getEventTypeColor(event.type)">
                          {{ getEventTypeLabel(event.type) }}
                        </span>
                      </div>

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
                          <a [href]="event.sourceUrl"
                             target="_blank"
                             rel="noopener"
                             class="text-purple-600 hover:underline">
                            查看來源
                          </a>
                        }
                      </div>

                      @if (event.tags && event.tags.length > 0) {
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
          }
        </mat-card-content>
      </mat-card>
    }
  `
})
export class EventDetailsPanelComponent {
  // Inputs
  selectedDay = input<CalendarDay | null>(null);

  // Outputs
  close = output<void>();

  getEventTypeColor(type: string): string {
    return EVENT_TYPE_INFO[type as keyof typeof EVENT_TYPE_INFO]?.color || '#6b7280';
  }

  getEventTypeLabel(type: string): string {
    return EVENT_TYPE_INFO[type as keyof typeof EVENT_TYPE_INFO]?.label || type;
  }
}
